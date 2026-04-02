#!/bin/zsh
set -euo pipefail

TODAY_DIR="$HOME/Desktop/Audit reports/nightly-tucson/$(date +%F)"
OUT="$HOME/Desktop/Audit reports/nightly-tucson/$(date +%F)-morning-rollup.md"
mkdir -p "$(dirname "$OUT")"

python3 - <<'PY' > "$OUT"
import json
from pathlib import Path
from datetime import datetime

base = Path.home() / 'Desktop' / 'Audit reports' / 'nightly-tucson' / datetime.now().strftime('%Y-%m-%d')
print('# Tucson Morning Roll-up')
print()
print('Date:', datetime.now().strftime('%Y-%m-%d %H:%M'))
print()

if not base.exists():
    print('No overnight reports found for today yet.')
    raise SystemExit

reports = sorted(base.glob('*/report.json'))
if not reports:
    print('No report.json files found in today\'s Tucson scan folder.')
    raise SystemExit

all_leads = []
print('## Category Snapshot')
print()
for rp in reports:
    data = json.loads(rp.read_text())
    cat = data['meta']['category']
    avg = data['summary'].get('averageScore')
    audited = data['summary'].get('audited')
    print(f'- **{cat.title()}** — {audited} audited, avg score {avg}/100')
    for b in data.get('businesses', []):
        issues = b.get('failedChecks', [])
        score = b.get('score', 999)
        temp = b.get('leadTemperature', '')
        worthwhile = isinstance(score, (int, float)) and score <= 82 and len(issues) >= 2 and 'Well Built' not in temp
        if worthwhile:
            all_leads.append({
                'category': cat,
                'name': b['name'],
                'website': b.get('website'),
                'score': score,
                'issues': issues[:3],
                'temp': temp,
            })
print()

all_leads.sort(key=lambda x: (x['score'], len(x['issues'])*-1))

print('## Best Outreach-Worthy Leads')
print()
if not all_leads:
    print('- No strong outreach-worthy leads surfaced from today\'s Tucson scan.')
else:
    for i, lead in enumerate(all_leads[:10], 1):
        issues = ', '.join(lead['issues'])
        print(f'{i}. **{lead["name"]}** ({lead["category"]}) — score {lead["score"]}/100')
        print(f'   - Issues: {issues}')
        if lead['website']:
            print(f'   - Website: {lead["website"]}')

print()
print('## Recommended Next Actions')
print()
if all_leads:
    print('- Pull public contact emails for the top 5 leads first.')
    print('- Draft outreach only for the strongest reachable businesses.')
    print('- Skip businesses that look polished enough that the pitch feels forced.')
else:
    print('- Review category reports manually and tighten the starter input lists.')
    print('- Consider swapping weak categories for better local-fit businesses.')

print()
print('## Report Files')
print()
for rp in reports:
    print(f'- {rp.parent / "report.md"}')
PY

echo "Wrote $OUT"
