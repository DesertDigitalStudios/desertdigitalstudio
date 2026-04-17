#!/bin/zsh
set -euo pipefail

export HOME="${HOME:-/Users/gabrielmaciel}"
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/node/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"

WORKSPACE="/Users/gabrielmaciel/.openclaw/workspace"
OUT="$WORKSPACE/reports/nightly-sierra-vista/$(date +%F)-morning-rollup.md"
mkdir -p "$(dirname "$OUT")"

node - <<'NODE' > "$OUT"
const fs = require('fs');
const path = require('path');

const crmPath = path.join('/Users/gabrielmaciel/.openclaw/workspace', 'dashboard', 'data', 'crm-data.json');
const data = JSON.parse(fs.readFileSync(crmPath, 'utf8'));
const leads = Array.isArray(data) ? data : (data.leads || []);
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' });
const now = new Date().toLocaleString('sv-SE', { timeZone: 'America/Phoenix', hour12: false }).slice(0, 16);

const todayLeads = leads.filter((lead) => {
  const source = lead.sourceReport || '';
  const imported = (lead.importedAt || '').slice(0, 10);
  return lead.city === 'Sierra Vista' && (source.includes(`nightly-sierra-vista-${today}`) || imported === today);
});

const tierOrder = { prime: 0, pursue: 1, watch: 2 };
todayLeads.sort((a, b) => (tierOrder[a.outreachTier] ?? 9) - (tierOrder[b.outreachTier] ?? 9) || (b.outreachScore || 0) - (a.outreachScore || 0));

const withEmail = todayLeads.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length);
const noWebsite = todayLeads.filter((lead) => lead.hasWebsite === false || !lead.website);
const lines = [];
lines.push('# Sierra Vista Morning Roll-up', '', `Date: ${now}`, '');
lines.push(`Imported leads today: ${todayLeads.length}`);
lines.push(`Leads with email: ${withEmail.length}`);
lines.push(`No-website opportunities: ${noWebsite.length}`, '');
lines.push('## Best Sierra Vista leads', '');

if (!todayLeads.length) {
  lines.push('- No Sierra Vista leads were imported into the CRM today yet.');
} else {
  for (const lead of todayLeads.slice(0, 10)) {
    const contact = lead.publicEmail || (lead.publicEmails || [])[0] || 'no clean email';
    lines.push(`- **${lead.businessName}** — ${(lead.outreachTier || '?').toUpperCase()} ${lead.outreachScore || 0}`);
    lines.push(`  - Contact: ${contact}`);
    if (lead.topIssues?.length) lines.push(`  - Issues: ${lead.topIssues.slice(0, 3).join(', ')}`);
    if (lead.quickPitch) lines.push(`  - Pitch angle: ${lead.quickPitch}`);
  }
}

lines.push('', '## Recommended next actions', '');
if (withEmail.length) {
  lines.push('- Start with the best Sierra Vista leads that already have clean emails.');
  lines.push('- Draft outreach for the top 3 before doing lower-tier manual research.');
} else if (todayLeads.length) {
  lines.push('- No clean emails surfaced, so prioritize Instagram, Facebook, phone, or walk-in follow-up.');
  lines.push('- Manually enrich the strongest Sierra Vista leads before drafting outreach.');
} else {
  lines.push('- No fresh Sierra Vista imports showed up yet. Recheck after the next scan/import cycle.');
}

console.log(lines.join('\n'));
NODE

echo "Wrote $OUT"
