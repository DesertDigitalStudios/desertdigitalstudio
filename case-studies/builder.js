'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const { slugify } = require('../tools/site-auditor/lead-intelligence');

function escHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function friendlyDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Phoenix'
  }).format(date);
}

function metricCards(study) {
  return (study.metrics || []).slice(0, 4).map(metric => `
    <div class="metric-card">
      <div class="metric-label">${escHtml(metric.label)}</div>
      <div class="metric-values">
        <div><span class="muted">Before</span><strong>${escHtml(metric.before)}</strong></div>
        <div><span class="muted">After</span><strong>${escHtml(metric.after)}</strong></div>
      </div>
      <div class="metric-change">${escHtml(metric.change || '')}</div>
    </div>
  `).join('');
}

function buildHtml({ study }) {
  const today = friendlyDate();
  const logo = 'file://' + path.resolve('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png');
  const isDraft = String(study.status || '').toLowerCase() !== 'published';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(study.businessName)} — Case Study</title>
  <style>
    @page { size: Letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #111827;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { min-height: 10in; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:18px; }
    .brand img { width:220px; height:auto; }
    .meta { text-align:right; font-size:12px; color:#4b5563; line-height:1.55; }
    .eyebrow { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:#b45309; font-weight:800; margin-top:10px; }
    h1 { font-size:34px; line-height:1.03; margin:10px 0 12px; letter-spacing:-0.03em; }
    .lede { font-size:15px; line-height:1.58; color:#374151; max-width:760px; }
    .draft { margin:18px 0; padding:12px 14px; border-radius:14px; background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; font-size:13px; line-height:1.55; }
    .band { margin:20px 0; padding:16px 18px; border:1px solid #e5e7eb; border-radius:16px; background:#f9fafb; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .summary-card, .card, .metric-card { background:#fff; border:1px solid #e5e7eb; border-radius:16px; padding:16px; }
    .label, .metric-label { font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#6b7280; font-weight:800; margin-bottom:6px; }
    .value { font-size:18px; line-height:1.3; font-weight:800; }
    .sub { font-size:12px; color:#6b7280; margin-top:6px; line-height:1.45; }
    h2 { font-size:15px; text-transform:uppercase; letter-spacing:0.22em; margin:24px 0 12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card strong { display:block; margin-bottom:8px; font-size:15px; }
    .card p { margin:0; color:#374151; font-size:13px; line-height:1.55; }
    .metrics { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
    .metric-values { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:10px 0; }
    .metric-values span { display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; margin-bottom:6px; }
    .metric-values strong { font-size:18px; }
    .metric-change { font-size:12px; color:#b45309; font-weight:700; }
    ul { margin:0; padding-left:18px; }
    li { margin:0 0 8px; font-size:13px; line-height:1.5; }
    blockquote { margin:0; font-size:18px; line-height:1.5; color:#111827; }
    .quote-byline { margin-top:10px; font-size:12px; color:#6b7280; }
    .footer { margin-top:26px; text-align:center; font-size:12px; color:#6b7280; }
  </style>
</head>
<body>
  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">
        Desert Digital Studio<br>
        Before / After Case Study<br>
        ${today}
      </div>
    </div>

    <div class="eyebrow">Case Study</div>
    <h1>${escHtml(study.businessName)}</h1>
    <p class="lede">${escHtml(study.headline || study.summary || 'A simple before/after story showing how DDS tightened the online experience for a local business.')}</p>
    ${isDraft ? `<div class="draft"><strong>Draft notice:</strong> this case study was generated from internal CRM/project notes. Replace any placeholder or projected results with final client-approved numbers before publishing it publicly.</div>` : ''}

    <div class="band">
      <div class="summary-grid">
        <div class="summary-card"><div class="label">Project type</div><div class="value">${escHtml(study.projectType || 'Website refresh')}</div><div class="sub">${escHtml(study.industry || 'Local business')}</div></div>
        <div class="summary-card"><div class="label">Location</div><div class="value">${escHtml(study.city || 'Arizona')}</div><div class="sub">${escHtml(study.website || 'Website not captured')}</div></div>
        <div class="summary-card"><div class="label">Before score</div><div class="value">${escHtml(study.before?.score || '—')}</div><div class="sub">Saved from CRM / draft notes</div></div>
        <div class="summary-card"><div class="label">After score</div><div class="value">${escHtml(study.after?.score || '—')}</div><div class="sub">Replace with final result if needed</div></div>
      </div>
    </div>

    <h2>The challenge</h2>
    <div class="grid2">
      <div class="card">
        <strong>Starting point</strong>
        <p>${escHtml(study.challenge || 'The old setup made it harder than it should be for customers to trust the business and take the next step.')}</p>
      </div>
      <div class="card">
        <strong>Main friction points</strong>
        <ul>
          ${(study.challengePoints?.length ? study.challengePoints : ['Weak first impression', 'Unclear calls to action']).map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
      </div>
    </div>

    <h2>What DDS changed</h2>
    <div class="grid2">
      <div class="card">
        <strong>Approach</strong>
        <p>${escHtml(study.solution || 'DDS cleaned up the structure, messaging, CTA path, and visual polish so the site feels more credible and easier to use.')}</p>
      </div>
      <div class="card">
        <strong>Deliverables</strong>
        <ul>
          ${(study.deliverables?.length ? study.deliverables : ['Homepage refresh', 'Mobile cleanup', 'Contact flow cleanup']).map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">Clear story. Real improvements. Easy outreach proof.</div>
    </div>

    <h2>Before / after snapshot</h2>
    <div class="grid2">
      <div class="card">
        <strong>${escHtml(study.before?.label || 'Before')}</strong>
        <p>${escHtml(study.before?.notes || 'Document the old state here.')}</p>
      </div>
      <div class="card">
        <strong>${escHtml(study.after?.label || 'After')}</strong>
        <p>${escHtml(study.after?.notes || 'Document the new state here.')}</p>
      </div>
    </div>

    <h2>Key improvement metrics</h2>
    <div class="metrics">
      ${metricCards(study)}
    </div>

    <h2>Wins worth talking about</h2>
    <div class="card">
      <ul>
        ${(study.wins?.length ? study.wins : ['Cleaner first impression', 'Simpler mobile path', 'Stronger contact flow']).map(item => `<li>${escHtml(item)}</li>`).join('')}
      </ul>
      <p style="margin-top:12px;">${escHtml(study.outcome || 'Add the concrete result, outcome, or client reaction here to make the story stronger.')}</p>
    </div>

    <h2>Client quote</h2>
    <div class="card">
      <blockquote>“${escHtml(study.testimonial || 'Add the client quote here once it is approved.') }”</blockquote>
      <div class="quote-byline">${escHtml(study.quoteAttribution || '')}</div>
    </div>

    <div class="footer">Desert Digital Studio · desertdigitalstudio.com</div>
  </section>
</body>
</html>`;
}

async function renderPdf(html, outputPath) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outputPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
    });
  } finally {
    await browser.close();
  }
}

async function generateCaseStudyFiles({ study, outputDir, desktopDir }) {
  if (!study || !study.businessName) {
    throw new Error('Study data is required to generate a case study');
  }

  const safeSlug = slugify(study.businessName || 'case-study');
  const datedSlug = `${safeSlug}-case-study-${new Date().toISOString().slice(0, 10)}`;
  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/case-studies/generated');
  const pdfOutDir = desktopDir || path.join(os.homedir(), 'Desktop', 'Audit reports');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  fs.mkdirSync(pdfOutDir, { recursive: true });

  const htmlPath = path.join(htmlOutDir, `${datedSlug}.html`);
  const pdfPath = path.join(pdfOutDir, `${datedSlug}.pdf`);
  const jsonPath = path.join(htmlOutDir, `${datedSlug}.json`);

  const html = buildHtml({ study });
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), study, htmlPath, pdfPath }, null, 2), 'utf8');
  await renderPdf(html, pdfPath);

  return { htmlPath, pdfPath, jsonPath };
}

module.exports = {
  buildHtml,
  generateCaseStudyFiles
};
