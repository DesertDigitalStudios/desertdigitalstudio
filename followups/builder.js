'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('../tools/site-auditor/lead-intelligence');

const SEQUENCE_TYPES = {
  'audit-nudge': {
    label: 'Audit follow-up',
    offsets: ['Day 0', 'Day 2', 'Day 5', 'Day 9']
  },
  'proposal-chase': {
    label: 'Proposal follow-up',
    offsets: ['Day 0', 'Day 3', 'Day 7', 'Day 12']
  },
  'no-response': {
    label: 'Cold no-response bump',
    offsets: ['Day 0', 'Day 4', 'Day 10']
  },
  'post-meeting': {
    label: 'Post-meeting follow-up',
    offsets: ['Day 0', 'Day 3', 'Day 8']
  },
  'instagram-dm': {
    label: 'Instagram DM follow-up',
    offsets: ['Day 0', 'Day 4', 'Day 9']
  },
  'soft-close': {
    label: 'Soft close / final touch',
    offsets: ['Day 0', 'Day 5']
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
  const channel = recommendedChannel(sequenceType, lead);
  switch (sequenceType) {
    case 'post-meeting':
      return `A warmer follow-up sequence for ${lead.businessName} after a real conversation or meeting. Best sent via ${channel.toLowerCase()}.`;
    case 'instagram-dm':
      return `Shorter, low-pressure Instagram follow-ups for ${lead.businessName} when email is weak or missing.`;
    case 'proposal-chase':
      return `Follow-up sequence for ${lead.businessName} after a proposal has already been shared. Best sent via ${channel.toLowerCase()}.`;
    case 'soft-close':
      return `A low-pressure close-the-loop sequence for ${lead.businessName} when you want to leave the door open without chasing too hard.`;
    case 'no-response':
      return `Simple low-pressure bumps for ${lead.businessName} when the first outreach got no reply.`;
    default:
      return `Short practical follow-up sequence built from the audit context for ${lead.businessName}.`;
  }
}

function issueLineForLead(lead) {
  const issues = (lead.topIssues || []).filter(Boolean).slice(0, 2);
  if (!issues.length) return 'a few trust and conversion gaps';
  if (issues.length === 1) return issues[0].toLowerCase();
  return `${issues[0].toLowerCase()} and ${issues[1].toLowerCase()}`;
}

function hasEmailTrail(lead) {
  return Boolean(lead.publicEmail || /\bemail(ed)?\b/i.test(String(lead.notes || '')));
}

function recommendedChannel(sequenceType, lead) {
  if (sequenceType === 'instagram-dm') return 'Instagram DM';
  if (hasEmailTrail(lead)) return 'Email';
  if (lead.phone) return 'Call / text';
  return 'Direct message';
}

function bestAssetForLead(lead) {
  if (lead.proposal?.pdfPath) return 'the proposal';
  if (lead.auditReport?.pdfPath) return 'the audit PDF';
  return 'the quick notes';
}

function buildSteps(lead, sequenceType = 'audit-nudge') {
  const config = SEQUENCE_TYPES[sequenceType] || SEQUENCE_TYPES['audit-nudge'];
  const issueLine = issueLineForLead(lead);
  const bestAsset = bestAssetForLead(lead);
  const channel = recommendedChannel(sequenceType, lead);
  const templates = {
    'audit-nudge': [
      {
        subject: `${lead.businessName}: quick website note`,
        body: `Wanted to send over a quick follow-up. I took a look at ${lead.businessName} and noticed ${issueLine}. Nothing catastrophic — just a few things that can make the business feel harder to trust or contact online. If helpful, I can send the short version with the first 2–3 fixes I’d make.`
      },
      {
        subject: `Following up in case this got buried`,
        body: `Just bumping this once in case it got buried. The main reason I reached out is that these are very fixable issues, and they usually do not require a giant rebuild to improve. If you want, I can keep it simple and just send the biggest quick wins.`
      },
      {
        subject: `${lead.businessName}: the fast version`,
        body: `Boiled down: tighten the trust signals, make the next step more obvious, and clean up the weak spots around ${issueLine}. That usually gets the site feeling a lot more current without turning it into a giant project.`
      },
      {
        subject: `Close the loop?`,
        body: `Last nudge from me on this. If website cleanup is not a priority right now, no worries. If it is, reply and I can turn what I found into a simple action plan instead of a long complicated project.`
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
        body: `Just checking whether this is still on your radar. If yes, I can get the project slotted in and keep the process simple. If the main question is budget or timing, I can also phase it so the highest-impact fixes happen first.`
      },
      {
        subject: `Last follow-up on the proposal`,
        body: `Final bump from me. If you want to revisit it later, I can always reopen the proposal with the same practical angle and updated timing. No pressure either way.`
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
    ],
    'post-meeting': [
      {
        subject: `Good talking with you about ${lead.businessName}`,
        body: `Good talking with you about ${lead.businessName}. I kept thinking about the biggest quick wins we discussed around ${issueLine}. If helpful, I can resend ${bestAsset} or boil it down into the simplest next step.`
      },
      {
        subject: `Quick follow-up on our conversation`,
        body: `Just checking back in after our conversation. If the full project feels like too much right now, I can narrow it to the highest-impact fixes first and keep the first step lightweight.`
      },
      {
        subject: `No rush — just leaving the door open`,
        body: `No rush on my end. I just wanted to leave the door open in case you want to move forward later. If you do, I can keep it practical and make the process easy.`
      }
    ],
    'instagram-dm': [
      {
        subject: `DM 1`,
        body: `Hey — just wanted to follow up on my earlier note about ${lead.businessName}. I spotted a couple easy website wins around ${issueLine}. If you want, I can send the short version here.`
      },
      {
        subject: `DM 2`,
        body: `Quick bump in case that got buried. This is not a giant rebuild pitch — more like a few practical fixes that could make the business look stronger online.`
      },
      {
        subject: `DM 3`,
        body: `Last message from me on it. If you ever want the quick audit or a simple quote, I’m happy to send it over.`
      }
    ],
    'soft-close': [
      {
        subject: `Should I close the loop on this?`,
        body: `Wanted to send one low-pressure follow-up on ${lead.businessName}. If improving the site is still on your radar, I’m happy to help. If not, totally okay — I just didn’t want to leave things hanging.`
      },
      {
        subject: `Leaving the door open`,
        body: `I’ll leave it here for now, but if you want to revisit it later, feel free to reply. I can always pick it back up and keep it straightforward.`
      }
    ]
  };

  return templates[sequenceType || 'audit-nudge'].map((step, index) => ({
    dayOffset: config.offsets[index] || `Day ${index * 3}`,
    channel,
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
      <p><strong>Sequence:</strong> ${escHtml(sequence.sequenceTypeLabel || sequence.sequenceType || '')}</p>
      <p><strong>Recommended channel:</strong> ${escHtml(sequence.recommendedChannel || 'Email')}</p>
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
    sequenceTypeLabel: (SEQUENCE_TYPES[sequenceType] || SEQUENCE_TYPES['audit-nudge']).label,
    recommendedChannel: recommendedChannel(sequenceType, lead),
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
