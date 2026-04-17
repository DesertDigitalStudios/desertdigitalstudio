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
const todayMs = new Date(`${today}T12:00:00-07:00`).getTime();
const tierOrder = { prime: 0, pursue: 1, watch: 2 };

const cityLeads = leads.filter((lead) => lead.city === 'Sierra Vista');
const importedToday = cityLeads.filter((lead) => {
  const imported = (lead.importedAt || '').slice(0, 10);
  const source = lead.sourceReport || '';
  return imported === today || source.includes(`nightly-sierra-vista-${today}`);
});
const reachable = cityLeads.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length);
const noWebsite = cityLeads.filter((lead) => lead.hasWebsite === false || !lead.website);
const actionable = cityLeads
  .filter((lead) => ['prime', 'pursue'].includes(lead.outreachTier))
  .sort((a, b) => (tierOrder[a.outreachTier] ?? 9) - (tierOrder[b.outreachTier] ?? 9) || (b.outreachScore || 0) - (a.outreachScore || 0));
const followups = cityLeads
  .filter((lead) => lead.stage === 'Contacted' && lead.lastTouch)
  .map((lead) => ({
    ...lead,
    days: Math.floor((todayMs - new Date(`${lead.lastTouch}T12:00:00-07:00`).getTime()) / 86400000)
  }))
  .filter((lead) => lead.days >= 3)
  .sort((a, b) => b.days - a.days || (b.outreachScore || 0) - (a.outreachScore || 0));

const lines = [];
lines.push('# Sierra Vista Morning Roll-up', '', `Date: ${now}`, '');
lines.push(`Pipeline leads in CRM: ${cityLeads.length}`);
lines.push(`Imported today: ${importedToday.length}`);
lines.push(`Reachable by email: ${reachable.length}`);
lines.push(`No-website opportunities: ${noWebsite.length}`);
lines.push(`Prime/pursue leads: ${actionable.length}`);
lines.push(`Follow-ups overdue: ${followups.length}`, '');

lines.push('## Best actionable Sierra Vista leads', '');
if (!actionable.length) {
  lines.push('- No prime or pursue Sierra Vista leads are in the CRM right now.');
} else {
  for (const lead of actionable.slice(0, 8)) {
    const contact = lead.publicEmail || (lead.publicEmails || [])[0] || 'no clean email';
    lines.push(`- **${lead.businessName}** — ${(lead.outreachTier || '?').toUpperCase()} ${lead.outreachScore || 0}`);
    lines.push(`  - Contact: ${contact}`);
    if (lead.topIssues?.length) lines.push(`  - Issues: ${lead.topIssues.slice(0, 3).join(', ')}`);
    if (lead.quickPitch) lines.push(`  - Pitch angle: ${lead.quickPitch}`);
    if (lead.stage) lines.push(`  - Stage: ${lead.stage}`);
  }
}

lines.push('', '## Strongest reachable leads', '');
if (!reachable.length) {
  lines.push('- No Sierra Vista leads with clean email yet.');
} else {
  for (const lead of actionable.filter((lead) => lead.publicEmail || (lead.publicEmails || []).length).slice(0, 5)) {
    lines.push(`- **${lead.businessName}** — ${lead.publicEmail || (lead.publicEmails || [])[0]}`);
  }
}

lines.push('', '## Overdue follow-ups', '');
if (!followups.length) {
  lines.push('- No Sierra Vista follow-ups are overdue right now.');
} else {
  for (const lead of followups.slice(0, 5)) {
    lines.push(`- **${lead.businessName}** — last touch ${lead.lastTouch} (${lead.days} days ago)`);
  }
}

lines.push('', '## Recommended next actions', '');
if (reachable.length) {
  lines.push('- Start with the strongest reachable Sierra Vista leads first.');
  lines.push('- Draft outreach for the top 3 with real emails before doing manual enrichment.');
} else if (actionable.length) {
  lines.push('- Prioritize manual enrichment for the best Sierra Vista prime/pursue leads.');
  lines.push('- Use Instagram, Facebook, phone, or walk-in follow-up where email is missing.');
} else {
  lines.push('- Re-run import checks after the next scan cycle and keep Sierra Vista in watch mode for now.');
}

console.log(lines.join('\n'));
NODE

echo "Wrote $OUT"
