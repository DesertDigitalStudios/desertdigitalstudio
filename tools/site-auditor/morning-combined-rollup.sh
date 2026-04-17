#!/bin/zsh
set -euo pipefail

export HOME="${HOME:-/Users/gabrielmaciel}"
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/node/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
NODE_BIN="/opt/homebrew/opt/node/bin/node"
LOGDIR="$WORKSPACE/tools/site-auditor/logs"
OUT="$WORKSPACE/reports/morning-rollup-$(date +%F).md"
TMP_OUT="$(mktemp "${TMPDIR:-/tmp}/dds-morning-rollup.XXXXXX")"
mkdir -p "$(dirname "$OUT")" "$LOGDIR"

echo "Running auto-import..." | tee -a "$LOGDIR/nightly.log"

IMPORT_RESULT=$("$NODE_BIN" "$WORKSPACE/tools/site-auditor/auto-import-leads.js" 2>>"$LOGDIR/nightly.log")
echo "$IMPORT_RESULT" >> "$LOGDIR/nightly.log"

IMPORTED=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('imported',0))" 2>/dev/null || echo 0)
WITH_EMAIL=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('withEmail',0))" 2>/dev/null || echo 0)
BEST_JSON=$(echo "$IMPORT_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('bestLeads',[])))" 2>/dev/null || echo "[]")
BEST=$(echo "$IMPORT_RESULT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
leads=d.get('bestLeads',[])
for l in leads:
    contact = l.get('email')
    socials = l.get('socialHandles') or {}
    if not contact:
        if socials.get('instagram', {}).get('handle'):
            contact = '@' + socials['instagram']['handle'] + ' on Instagram'
        elif socials.get('facebook', {}).get('handle'):
            contact = socials['facebook']['handle'] + ' on Facebook'
        elif socials.get('tiktok', {}).get('handle'):
            contact = '@' + socials['tiktok']['handle'] + ' on TikTok'
        elif socials.get('linkedin', {}).get('handle'):
            contact = socials['linkedin']['handle'] + ' on LinkedIn'
    print(f\"  - {l.get('tier','?').upper()} {l.get('score',0)} | {l['name']} ({l['city']}) | {contact or 'no direct contact'}\")
" 2>/dev/null || echo "  (none)")

# --- Qwen3 plain-English brief ---
echo "Generating Qwen brief..." | tee -a "$LOGDIR/nightly.log"
QWEN_BRIEF=$(python3 - <<PYQWEN
import json, urllib.request

leads_json = '''${BEST_JSON}'''
try:
    leads = json.loads(leads_json)
except:
    leads = []

if not leads:
    print("No new leads with clean emails today.")
else:
    def contact_label(lead):
        if lead.get('email'):
            return lead.get('email')
        socials = lead.get('socialHandles') or {}
        if socials.get('instagram', {}).get('handle'):
            return '@' + socials['instagram']['handle'] + ' on Instagram'
        if socials.get('facebook', {}).get('handle'):
            return socials['facebook']['handle'] + ' on Facebook'
        if socials.get('tiktok', {}).get('handle'):
            return '@' + socials['tiktok']['handle'] + ' on TikTok'
        if socials.get('linkedin', {}).get('handle'):
            return socials['linkedin']['handle'] + ' on LinkedIn'
        return 'none'

    leads_text = "\n".join(
        f"- {l.get('name','?')} in {l.get('city','?')} | score {l.get('score',0)} | contact: {contact_label(l)} | issues: {l.get('pitch','')}"
        for l in leads[:6]
    )
    prompt = f"""You are a brief writer for a small web design studio in Southern Arizona. Write a plain-English morning brief (4-6 sentences max) covering these new leads from last night's scan. Tell the owner which leads to contact first, why, and any quick notes. Be direct, casual, and practical. No bullet points — just flowing sentences.

Leads:
{leads_text}"""

    payload = json.dumps({"model": "qwen3:14b", "prompt": prompt, "stream": False, "options": {"temperature": 0.4}}).encode()
    try:
        req = urllib.request.Request("http://localhost:11434/api/generate", data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=90)
        result = json.loads(resp.read())
        text = result.get("response", "").strip()
        # Strip <think>...</think> if qwen3 adds it
        import re
        text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL).strip()
        print(text)
    except Exception as e:
        print(f"(Qwen brief unavailable: {e})")
PYQWEN
)
echo "Qwen brief generated." | tee -a "$LOGDIR/nightly.log"

python3 - <<PY > "$TMP_OUT"
from datetime import datetime
now = datetime.now().strftime('%Y-%m-%d %H:%M')
print(f"# DDS Morning Roll-up — {now}")
print()
print("## Today's brief")
print("""${QWEN_BRIEF}""")
print()
print(f"## New leads imported: ${IMPORTED} (${WITH_EMAIL} with clean email)")
print()
print("## Best new leads to act on:")
print("""${BEST}""")
print()
PY

node - <<'NODE' >> "$TMP_OUT"
const fs = require('fs');
const path = require('path');

const crmPath = path.join('/Users/gabrielmaciel/.openclaw/workspace', 'dashboard', 'data', 'crm-data.json');
const data = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
const leads = Array.isArray(data) ? data : (data.leads || []);
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' });
const tierOrder = { prime: 0, pursue: 1, watch: 2 };

const importedToday = leads.filter((lead) => {
  const imported = (lead.importedAt || '').slice(0, 10);
  return imported === today;
});

importedToday.sort((a, b) => (tierOrder[a.outreachTier] ?? 9) - (tierOrder[b.outreachTier] ?? 9) || (b.outreachScore || 0) - (a.outreachScore || 0));

const lines = [];
lines.push(`## Full scan summary — ${today}`);
lines.push(`Found ${importedToday.length} leads imported into the CRM today`);
lines.push('');

const byCity = new Map();
for (const lead of importedToday) {
  if (!byCity.has(lead.city)) byCity.set(lead.city, []);
  byCity.get(lead.city).push(lead);
}

for (const city of Array.from(byCity.keys()).sort()) {
  const cityLeads = byCity.get(city);
  const withEmail = cityLeads.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length).length;
  lines.push(`### ${city} (${cityLeads.length} leads, ${withEmail} with email)`);
  for (const lead of cityLeads.slice(0, 5)) {
    lines.push(`  - ${(lead.outreachTier || '?').toUpperCase()} ${lead.outreachScore || 0} | ${lead.businessName} | ${lead.publicEmail || (lead.publicEmails || [])[0] || 'no clean email'}`);
  }
  lines.push('');
}

if (!importedToday.length) {
  lines.push('No new CRM imports were recorded today yet.');
  lines.push('');
}

console.log(lines.join('\n'));
NODE

# --- Qwen outreach draft generation for top 3 new leads ---
echo "Generating outreach drafts for top leads..." | tee -a "$LOGDIR/nightly.log"
python3 - <<PYDRAFT >> "$TMP_OUT"
import json, urllib.request, re

leads_json = '''${BEST_JSON}'''
try:
    leads = json.loads(leads_json)
except:
    leads = []

if not leads:
    print("## Auto-generated outreach drafts")
    print("No new leads with clean emails — no drafts generated today.")
else:
    print("## Auto-generated outreach drafts (Qwen3 — review before sending)")
    print()
    for lead in leads[:3]:
        if not lead.get('email'):
            continue
        no_site = not lead.get('website')
        issues = lead.get('pitch', 'a few trust and SEO issues')
        if no_site:
            prompt = f"""Write a short outreach email body from Gabriel Maciel at Desert Digital Studio (Benson, AZ) to the owner of {lead['name']} in {lead['city']}. They have no website. Pitch a simple first site that helps customers find and contact them. Under 120 words, casual, local, non-pushy. Sign off with name, studio (desertdigitalstudio.com), phone (210) 993-0509. Just the body, no subject."""
        else:
            prompt = f"""Write a short outreach email body from Gabriel Maciel at Desert Digital Studio (Benson, AZ) to the owner of {lead['name']} in {lead['city']}. Their website has: {issues}. Mention 2-3 issues naturally and offer a free audit summary. Under 130 words, casual, local, non-pushy. Sign off with name, studio (desertdigitalstudio.com), phone (210) 993-0509. Just the body, no subject."""
        try:
            payload = json.dumps({'model': 'qwen3:14b', 'prompt': prompt, 'stream': False, 'options': {'temperature': 0.5, 'num_predict': 350}}).encode()
            req = urllib.request.Request('http://localhost:11434/api/generate', data=payload, headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req, timeout=60)
            result = json.loads(resp.read())
            text = result.get('response', '').strip()
            text = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.DOTALL).strip()
            print(f"### {lead['name']} ({lead['city']}) → {lead['email']}")
            print()
            print(text)
            print()
        except Exception as e:
            print(f"### {lead['name']} — draft failed: {e}")
            print()
PYDRAFT

echo "Outreach drafts generated." | tee -a "$LOGDIR/nightly.log"

# Alert via heartbeat when available
if command -v openclaw >/dev/null 2>&1; then
  openclaw system event --mode next-heartbeat --text "Morning rollup complete: ${IMPORTED} new leads imported (${WITH_EMAIL} with email). Brief: ${QWEN_BRIEF}" >/dev/null 2>&1 || true
else
  echo "openclaw CLI not available in PATH, skipping heartbeat event." | tee -a "$LOGDIR/nightly.log"
fi

cat "$TMP_OUT" > "$OUT"

rm -f "$TMP_OUT"

echo "Morning combined rollup written: $OUT" | tee -a "$LOGDIR/nightly.log"
echo "Wrote $OUT"
