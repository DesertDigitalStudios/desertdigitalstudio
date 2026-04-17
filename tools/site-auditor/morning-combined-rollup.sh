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
const todayMs = new Date(`${today}T12:00:00-07:00`).getTime();
const tierOrder = { prime: 0, pursue: 1, watch: 2 };
const trackedCities = ['Tucson', 'Sierra Vista', 'Benson', 'Tombstone', 'Willcox', 'Vail'];

const importedToday = leads.filter((lead) => (lead.importedAt || '').slice(0, 10) === today);
const actionable = leads
  .filter((lead) => trackedCities.includes(lead.city) && ['prime', 'pursue'].includes(lead.outreachTier))
  .sort((a, b) => (tierOrder[a.outreachTier] ?? 9) - (tierOrder[b.outreachTier] ?? 9) || (b.outreachScore || 0) - (a.outreachScore || 0));
const reachable = actionable.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length);
const noWebsite = leads.filter((lead) => trackedCities.includes(lead.city) && (lead.hasWebsite === false || !lead.website));
const followups = leads
  .filter((lead) => trackedCities.includes(lead.city) && lead.stage === 'Contacted' && lead.lastTouch)
  .map((lead) => ({
    ...lead,
    days: Math.floor((todayMs - new Date(`${lead.lastTouch}T12:00:00-07:00`).getTime()) / 86400000)
  }))
  .filter((lead) => lead.days >= 3)
  .sort((a, b) => b.days - a.days || (b.outreachScore || 0) - (a.outreachScore || 0));

const lines = [];
lines.push(`## Full pipeline summary — ${today}`);
lines.push(`Tracked leads in CRM: ${leads.filter((lead) => trackedCities.includes(lead.city)).length}`);
lines.push(`Imported today: ${importedToday.length}`);
lines.push(`Reachable prime/pursue leads: ${reachable.length}`);
lines.push(`No-website opportunities: ${noWebsite.length}`);
lines.push(`Overdue follow-ups: ${followups.length}`);
lines.push('');

for (const city of trackedCities) {
  const cityLeads = actionable.filter((lead) => lead.city === city);
  const cityReachable = cityLeads.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length).length;
  if (!cityLeads.length && !leads.some((lead) => lead.city === city)) continue;
  lines.push(`### ${city}`);
  lines.push(`- Actionable leads: ${cityLeads.length}`);
  lines.push(`- Reachable now: ${cityReachable}`);
  lines.push(`- No-website opportunities: ${noWebsite.filter((lead) => lead.city === city).length}`);
  const top = cityLeads.slice(0, 3);
  if (top.length) {
    for (const lead of top) {
      lines.push(`  - ${(lead.outreachTier || '?').toUpperCase()} ${lead.outreachScore || 0} | ${lead.businessName} | ${lead.publicEmail || (lead.publicEmails || [])[0] || 'no clean email'}`);
    }
  }
  lines.push('');
}

lines.push('## Best current reachable leads', '');
if (!reachable.length) {
  lines.push('- No prime/pursue leads with clean email right now.');
} else {
  for (const lead of reachable.slice(0, 8)) {
    lines.push(`- **${lead.businessName}** (${lead.city}) — ${lead.publicEmail || (lead.publicEmails || [])[0]}`);
  }
}

lines.push('', '## Overdue follow-ups', '');
if (!followups.length) {
  lines.push('- No overdue follow-ups right now.');
} else {
  for (const lead of followups.slice(0, 8)) {
    lines.push(`- **${lead.businessName}** (${lead.city}) — last touch ${lead.lastTouch} (${lead.days} days ago)`);
  }
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

if command -v openclaw >/dev/null 2>&1; then
  openclaw system event --mode next-heartbeat --text "Morning rollup complete: ${IMPORTED} new leads imported (${WITH_EMAIL} with email). Brief: ${QWEN_BRIEF}" >/dev/null 2>&1 || true
else
  echo "openclaw CLI not available in PATH, skipping heartbeat event." | tee -a "$LOGDIR/nightly.log"
fi

cat "$TMP_OUT" > "$OUT"
rm -f "$TMP_OUT"

echo "Morning combined rollup written: $OUT" | tee -a "$LOGDIR/nightly.log"
echo "Wrote $OUT"
