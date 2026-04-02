'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('../tools/site-auditor/lead-intelligence');

const SEQUENCE_TYPES = {
  'audit-nudge': {
    label: 'Audit follow-up',
    offsets: ['Day 0', 'Day 3', 'Day 7', 'Day 12']
  },
  'proposal-chase': {
    label: 'Proposal follow-up',
    offsets: ['Day 0', 'Day 2', 'Day 6', 'Day 10']
  },
  'no-response': {
    label: 'Cold no-response bump',
    offsets: ['Day 0', 'Day 4', 'Day 9']
  }
};

function escHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function introForType(sequenceType, lead) {
  switch (sequenceType) {
    case 'proposal-chase':
      return `Following up on the proposal for ${lead.businessName}.`;
    case 'no-response':
      return `Simple low-pressure bumps for ${lead.businessName}.`;
    default:
      return `Short follow-up sequence built from the audit context for ${lead.businessName}.`;
  }
}

function buildSteps(lead, sequenceType = 'audit-nudge') {
  const config = SEQUENCE_TYPES[sequenceType] || SEQUENCE_TYPES['audit-nudge'];
  const issueLine = (lead.topIssues || []).slice(0, 2).join(', ').toLowerCase() || 'a few trust and conversion gaps';
  const bestAsset = lead.auditReport?.pdfPath ? 'the audit PDF' : lead.proposal?.pdfPath ? 'the proposal' : 'the quick notes';
  const templates = {
    'audit-nudge': [
      {
        subject: `${lead.businessName}: quick note on the website issues I spotted`,
        body: `Wanted to send over a quick follow-up. I took a look at ${lead.businessName} and noticed ${issueLine}. Nothing dramatic — just a few things that can make the business feel harder to trust or contact online. If helpful, I can walk you through the biggest 2–3 fixes in plain English.`
      },
      {
        subject: `Did you get a chance to look at ${bestAsset}?`,
        body: `Just bumping this in case it got buried. The main reason I reached out is that these are very fixable issues, and they usually do not require a giant rebuild to improve. Happy to send the short version if that is easier.`
      },
      {
        subject: `${lead.businessName}: the fast version`,
        body: `Boiled down: tighten the trust signals, make the next step more obvious, and clean up the weak spots around ${issueLine}. That usually gets the site feeling a lot more current fast.`
      },
      {
        subject: `Close the loop?`,
        body: `Last nudge from me on this. If website cleanup is not a priority right now, no worries. If it is, reply and I can turn the audit into a simple action plan instead of a long project.`
      }
    ],
    'proposal-chase': [
      {
        subject: `${lead.businessName} proposal — any questions?`,
        body: `Wanted to circle back on the proposal I sent over. The recommendation is still the same: keep it practical, fix the highest-impact issues first, and get the site feeling more trustworthy without overbuilding it.`
      },
      {
        subject: `Happy to tighten the scope if needed`,
        body: `If the package feels close but not quite right, I can trim the scope or focus it around the most important fixes first. The goal is to get the meaningful improvements done, not force a bigger project than you need.`
      },
      {
        subject: `Still interested in improving the site?`,
        body: `Just checking whether this is still on your radar. If yes, I can get the project slotted in and keep the process simple. If no, totally fine — I just wanted to close the loop.`
      },
      {
        subject: `Last follow-up on the proposal`,
        body: `Final bump from me. If you want to revisit it later, I can always reopen the proposal with the same practical angle and updated timing.`
      }
    ],
    'no-response': [
      {
        subject: `Quick bump on ${lead.businessName}`,
        body: `Following up once in case my first note missed you. I had a few specific website observations for ${lead.businessName}, especially around ${issueLine}.` 
      },
      {
        subject: `Worth sending the short version?`,
        body: `If a full audit feels like overkill, I can just send the top 3 fixes I would make first. That usually tells you pretty quickly whether it is worth doing.`
      },
      {
        subject: `No pressure — closing the loop`,
        body: `No worries if now is not the right time. I wanted to send one last follow-up so you have my note if website cleanup becomes a priority later.`
      }
    ]
  };

  return templates[sequenceType || 'audit-nudge'].map((step, index) => ({
    dayOffset: config.offsets[index] || `Day ${index * 3}`,
    channel: 'Email',
    subject: step.subject,
    body: step.body
  }));
}

function buildHtml({ sequence }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(sequence.businessName)} — Follow-up Sequence</title>
  <style>
    body { margin:0; padding:32px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; background:#0b1020; color:#f5f7fb; }
    .wrap { max-width:1000px; margin:0 auto; }
    .card { background:#111827; border:1px solid #263246; border-radius:18px; padding:18px; margin-bottom:16px; }
    h1 { margin:0 0 12px; font-size:34px; }
    h2 { font-size:14px; text-transform:uppercase; letter-spacing:0.18em; color:#f59e0b; }
    p, li, pre { line-height:1.6; color:#d8e0ec; white-space:pre-wrap; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h2>Follow-up sequence builder</h2>
      <h1>${escHtml(sequence.businessName)}</h1>
      <p>${escHtml(sequence.summary || '')}</p>
    </div>
    ${sequence.steps.map((step, index) => `<div class="card"><h2>Step ${index + 1} · ${escHtml(step.dayOffset)}</h2><p><strong>Channel:</strong> ${escHtml(step.channel)}</p><p><strong>Subject:</strong> ${escHtml(step.subject)}</p><pre>${escHtml(step.body)}</pre></div>`).join('')}
  </div>
</body>
</html>`;
}

function generateFollowupSequence({ lead, sequenceType = 'audit-nudge' }) {
  if (!lead || !lead.businessName) {
    throw new Error('Lead data is required to generate a follow-up sequence');
  }

  return {
    id: `followup-${Date.now()}`,
    leadId: lead.id,
    businessName: lead.businessName,
    sequenceType,
    summary: introForType(sequenceType, lead),
    generatedAt: new Date().toISOString(),
    steps: buildSteps(lead, sequenceType)
  };
}

function saveFollowupSequence({ sequence, outputDir }) {
  if (!sequence) throw new Error('Sequence data is required');
  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/followups/generated');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  const slug = slugify(`${sequence.businessName}-${sequence.sequenceType}-sequence`);
  const htmlPath = path.join(htmlOutDir, `${slug}.html`);
  const jsonPath = path.join(htmlOutDir, `${slug}.json`);
  fs.writeFileSync(htmlPath, buildHtml({ sequence }), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(sequence, null, 2), 'utf8');
  return { htmlPath, jsonPath };
}

module.exports = {
  SEQUENCE_TYPES,
  generateFollowupSequence,
  saveFollowupSequence
};
