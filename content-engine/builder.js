'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('../tools/site-auditor/lead-intelligence');
const { PACKAGES } = require('../proposals/builder');

function escHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sentence(value, fallback) {
  const text = String(value || fallback || '').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function resolveServiceSource(sourceId) {
  const pkg = PACKAGES[sourceId] || PACKAGES.refresh;
  return {
    title: pkg.name,
    audience: 'Local business owners who know their website needs work but do not want a giant agency project',
    promise: pkg.headline,
    facts: pkg.deliverables,
    cta: 'Book a free website audit'
  };
}

function resolveSource(sourceType, source = {}) {
  if (sourceType === 'case-study') {
    return {
      title: source.businessName,
      audience: 'Local business owners who want proof that simple website improvements can move the needle',
      promise: source.outcome || source.summary || 'A practical before/after story from a DDS build.',
      facts: [...(source.wins || []), ...(source.deliverables || [])].slice(0, 6),
      cta: 'Ask for a before/after review of your site'
    };
  }

  if (sourceType === 'lead-magnet') {
    return {
      title: source.businessName || source.website,
      audience: 'Small businesses curious whether their homepage is quietly costing trust or conversions',
      promise: source.audit?.summary || 'A quick homepage review can surface trust and conversion gaps fast.',
      facts: (source.audit?.topIssues || []).slice(0, 5),
      cta: 'Grab your free audit snapshot'
    };
  }

  if (sourceType === 'lead') {
    return {
      title: source.businessName,
      audience: 'Owners of older local-business websites that look fine at a glance but still leak conversions',
      promise: source.quickPitch || 'A few small website fixes can make a business feel far more current and trustworthy.',
      facts: [...(source.topIssues || []), ...(source.priorityReasons || [])].slice(0, 6),
      cta: 'Reply for a quick audit walk-through'
    };
  }

  return resolveServiceSource(source.id || source.packageId || source.sourceId || 'refresh');
}

function buildOutputs({ title, audience, promise, facts, angle, cta }) {
  const factLine = facts.length ? facts.join(', ') : 'trust, clarity, and conversion basics';
  const hookAngle = angle ? sentence(angle, '') : `Most local business websites do not need a full reinvention — they need cleaner trust and conversion basics.`;

  return {
    hooks: [
      `Most small-business websites are losing leads for boring reasons, not dramatic ones.`,
      `${title} is the kind of project that proves simple fixes still matter.`,
      `A homepage can look "fine" and still make customers hesitate.`
    ],
    shortPost: `${hookAngle} ${sentence(promise, '')} In plain English: tighten ${factLine}, make the next step obvious, and the site starts working harder. ${cta}.`,
    longPost: `${hookAngle} ${sentence(promise, '')} The interesting part is that this usually is not about flashy redesigns. It is about reducing friction: ${factLine}. When those pieces get clearer, the business feels easier to trust and easier to contact. ${cta}.`,
    emailSubject: `${title}: an easy content angle DDS can use this week`,
    emailBody: `Audience: ${audience}\n\nMain angle: ${hookAngle}\n\nCore promise: ${sentence(promise, '')}\n\nProof points: ${facts.map(item => `- ${item}`).join('\n') || '- Add proof points here'}\n\nCTA: ${cta}`,
    articleTitle: `${title}: what actually makes a small-business website feel trustworthy`,
    articleOutline: [
      'Open with the common friction local-business sites create',
      `Use ${title} as the concrete example`,
      `Break down the proof points: ${factLine}`,
      'Explain why simple structure + CTA fixes beat random redesign churn',
      `Close with a soft CTA: ${cta}`
    ],
    ctaOptions: [
      cta,
      'Reply if you want me to point out the top 3 weak spots on your site',
      'Send your homepage and I will tell you what I would fix first'
    ]
  };
}

function buildHtml({ draft }) {
  const outputs = draft.outputs || {};
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(draft.title)} — Content Pack</title>
  <style>
    body { margin:0; padding:32px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; background:#0b1020; color:#f5f7fb; }
    .wrap { max-width:1000px; margin:0 auto; }
    .card { background:#111827; border:1px solid #263246; border-radius:18px; padding:18px; margin-bottom:16px; }
    h1 { margin:0 0 12px; font-size:34px; }
    h2 { font-size:14px; text-transform:uppercase; letter-spacing:0.18em; color:#f59e0b; }
    p, li, pre { line-height:1.6; color:#d8e0ec; white-space:pre-wrap; }
    ul { padding-left:20px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h2>Content engine</h2>
      <h1>${escHtml(draft.title)}</h1>
      <p><strong>Source:</strong> ${escHtml(draft.sourceType)} · <strong>Audience:</strong> ${escHtml(draft.audience)}</p>
      <p><strong>CTA:</strong> ${escHtml(draft.callToAction)}</p>
    </div>
    <div class="card"><h2>Hooks</h2><ul>${(outputs.hooks || []).map(item => `<li>${escHtml(item)}</li>`).join('')}</ul></div>
    <div class="card"><h2>Short post</h2><p>${escHtml(outputs.shortPost || '')}</p></div>
    <div class="card"><h2>Long post</h2><p>${escHtml(outputs.longPost || '')}</p></div>
    <div class="card"><h2>Email</h2><p><strong>${escHtml(outputs.emailSubject || '')}</strong></p><pre>${escHtml(outputs.emailBody || '')}</pre></div>
    <div class="card"><h2>Article outline</h2><p><strong>${escHtml(outputs.articleTitle || '')}</strong></p><ul>${(outputs.articleOutline || []).map(item => `<li>${escHtml(item)}</li>`).join('')}</ul></div>
    <div class="card"><h2>CTA options</h2><ul>${(outputs.ctaOptions || []).map(item => `<li>${escHtml(item)}</li>`).join('')}</ul></div>
  </div>
</body>
</html>`;
}

function generateContentDraft({ sourceType = 'service', sourceId = 'refresh', source = {}, angle = '', audience = '', callToAction = '' }) {
  const resolved = resolveSource(sourceType, sourceType === 'service' ? { ...source, id: sourceId } : source);
  const finalAudience = audience || resolved.audience;
  const finalCTA = callToAction || resolved.cta || 'Book a free audit';
  const outputs = buildOutputs({
    title: resolved.title,
    audience: finalAudience,
    promise: resolved.promise,
    facts: resolved.facts || [],
    angle,
    cta: finalCTA
  });

  return {
    id: `content-${Date.now()}`,
    title: `${resolved.title} content pack`,
    sourceType,
    sourceId,
    audience: finalAudience,
    angle,
    callToAction: finalCTA,
    generatedAt: new Date().toISOString(),
    outputs
  };
}

function saveContentDraft({ draft, outputDir }) {
  if (!draft) throw new Error('Draft data is required');
  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/content-engine/generated');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  const slug = slugify(draft.title || 'content-pack');
  const htmlPath = path.join(htmlOutDir, `${slug}.html`);
  const jsonPath = path.join(htmlOutDir, `${slug}.json`);
  fs.writeFileSync(htmlPath, buildHtml({ draft }), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(draft, null, 2), 'utf8');
  return { htmlPath, jsonPath };
}

module.exports = {
  generateContentDraft,
  saveContentDraft
};
