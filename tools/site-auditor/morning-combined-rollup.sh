#!/bin/zsh
set -euo pipefail

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
OUT="$HOME/Desktop/Audit reports/morning-rollup-$(date +%F).md"
mkdir -p "$(dirname "$OUT")" "$LOGDIR"

echo "Running auto-import..." | tee -a "$LOGDIR/nightly.log"

IMPORT_RESULT=$("$NODE_BIN" "$WORKSPACE/tools/site-auditor/auto-import-leads.js" 2>>"$LOGDIR/nightly.log")
echo "$IMPORT_RESULT" >> "$LOGDIR/nightly.log"

IMPORTED=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('imported',0))" 2>/dev/null || echo 0)
WITH_EMAIL=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('withEmail',0))" 2>/dev/null || echo 0)
BEST=$(echo "$IMPORT_RESULT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
leads=d.get('bestLeads',[])
for l in leads:
    print(f\"  - {l.get('tier','?').upper()} {l.get('score',0)} | {l['name']} ({l['city']}) | {l.get('email','no email')}\")
" 2>/dev/null || echo "  (none)")

python3 - <<PY > "$OUT"
from datetime import datetime
now = datetime.now().strftime('%Y-%m-%d %H:%M')
print(f"# DDS Morning Roll-up — {now}")
print()
print(f"## New leads imported: ${IMPORTED} (${WITH_EMAIL} with clean email)")
print()
print("## Best new leads to act on:")
print("""${BEST}""")
print()
PY

python3 - >> "$OUT" <<'PY2'
import json
from pathlib import Path
from datetime import datetime

today = datetime.now().strftime('%Y-%m-%d')
cities = [
    ('nightly-tucson', 'Tucson'),
    ('nightly-sierra-vista', 'Sierra Vista'),
    ('nightly-benson', 'Benson'),
    ('nightly-tombstone', 'Tombstone'),
    ('nightly-willcox', 'Willcox'),
    ('nightly-vail', 'Vail'),
]
cats = ['restaurants','cafes','salons','barbers','home-services','auto-repair','dental','gyms','retail','tattoo-shops']
base_root = Path.home() / 'Desktop' / 'Audit reports'

all_leads = []
for dirn, city in cities:
    for cat in cats:
        rp = base_root / dirn / today / cat / 'report.json'
        if not rp.exists(): continue
        try:
            data = json.loads(rp.read_text())
        except: continue
        for b in data.get('businesses', []):
            if b.get('outreachTier') in ['prime', 'pursue']:
                emails = [e for e in (b.get('publicEmails') or []) if e and 'user@domain' not in e]
                all_leads.append({
                    'name': b['name'], 'city': city, 'cat': cat,
                    'tier': b.get('outreachTier'), 'score': b.get('outreachScore', 0),
                    'email': emails[0] if emails else None,
                    'issues': (b.get('topIssues') or [])[:3],
                    'pitch': b.get('quickPitch', '')
                })

tier_order = {'prime': 0, 'pursue': 1}
all_leads.sort(key=lambda l: (tier_order.get(l['tier'], 2), -l['score']))

print(f"## Full scan summary — {today}")
print(f"Found {len(all_leads)} prime/pursue leads across all cities")
print()

by_city = {}
for l in all_leads:
    by_city.setdefault(l['city'], []).append(l)

for city, leads in sorted(by_city.items()):
    print(f"### {city} ({len(leads)} leads)")
    for l in leads[:5]:
        email_str = l['email'] or 'no clean email'
        print(f"  - {l.get('tier','?').upper()} {l.get('score',0)} | {l['name']} | {email_str}")
    print()
PY2

# Send a heartbeat alert with the summary
openclaw system event --mode next-heartbeat --text "Morning rollup complete: ${IMPORTED} new leads imported (${WITH_EMAIL} with email). Top leads: ${BEST}" >/dev/null 2>&1 || true

echo "Morning combined rollup written: $OUT" | tee -a "$LOGDIR/nightly.log"
