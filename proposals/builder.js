'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const { slugify } = require('../tools/site-auditor/lead-intelligence');

const PACKAGES = {
  'launch-pad': {
    id: 'launch-pad',
    name: 'Launch Pad Website',
    price: 1200,
    timeline: '5–7 business days',
    headline: 'A clean first website that makes the business look real, reachable, and current.',
    deliverables: [
      'Custom multi-section business website',
      'Mobile-friendly responsive design',
      'Fast contact buttons for call, map, and email',
      'Core SEO setup for title tags, descriptions, and headings',
      'Launch support and domain / hosting handoff'
    ]
  },
  'refresh': {
    id: 'refresh',
    name: 'Website Refresh',
    price: 900,
    timeline: '4–6 business days',
    headline: 'A tighter, more trustworthy site that converts better without overcomplicating the build.',
    deliverables: [
      'Homepage redesign or full-site refresh',
      'Fix the most visible trust + conversion issues',
      'Mobile cleanup and stronger calls to action',
      'Updated content structure, contact flow, and SEO basics',
      'Launch support and cleanup pass'
    ]
  },
  'tune-up': {
    id: 'tune-up',
    name: 'Quick Wins Tune-Up',
    price: 500,
    timeline: '2–3 business days',
    headline: 'A short project focused on the highest-impact fixes instead of a full rebuild.',
    deliverables: [
      'Fix 2–4 specific issues from the audit',
      'Improve contact flow and page messaging',
      'Tighten on-page SEO basics',
      'Cleanup pass for trust signals and polish'
    ]
  }
};

function escHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function friendlyDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Phoenix'
  }).format(date);
}

function leadNeedsSummary(lead) {
  if (!lead.hasWebsite) {
    return 'Right now, the business does not have a real website working for it, which makes it harder to look established and easy to contact.';
  }

  const issues = (lead.topIssues || []).slice(0, 3);
  if (issues.length === 0) {
    return 'The site is decent overall, but there are still a few easy wins that would make it feel more current and easier to act on.';
  }

  return `The current site is leaving value on the table because of ${issues.join(', ').toLowerCase()}. These are fixable issues, and fixing them makes the business feel more trustworthy and easier to contact.`;
}

function buildHtml({ lead, pkg, price, focusNote }) {
  const today = friendlyDate();
  const logo = 'file://' + path.resolve('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png');
  const deposit = Math.round(price * 0.5);
  const issues = (lead.topIssues || []).slice(0, 4);
  const reasons = (lead.priorityReasons || []).slice(0, 4);
  const proposalTitle = `${lead.businessName} — Website Proposal`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(proposalTitle)}</title>
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
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 18px; }
    .brand img { width: 220px; height:auto; }
    .meta { text-align:right; font-size:12px; color:#4b5563; line-height:1.5; }
    .eyebrow { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:#b45309; font-weight:800; margin-top:20px; }
    h1 { font-size:32px; line-height:1.05; margin:10px 0 16px; letter-spacing:-0.03em; }
    .lede { font-size:15px; line-height:1.55; color:#374151; max-width:700px; }
    .band { margin:20px 0; padding:16px 18px; border:1px solid #e5e7eb; border-radius:14px; background:#f9fafb; }
    .band-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .label { font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#6b7280; font-weight:800; margin-bottom:6px; }
    .value { font-size:14px; font-weight:700; color:#111827; }
    h2 { font-size:15px; text-transform:uppercase; letter-spacing:0.22em; margin:24px 0 12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card { border:1px solid #e5e7eb; border-radius:14px; padding:16px; }
    .card strong { display:block; margin-bottom:8px; font-size:15px; }
    .card p { margin:0; color:#374151; font-size:13px; line-height:1.5; }
    ul { margin:0; padding-left:18px; }
    li { margin:0 0 8px; font-size:13px; line-height:1.45; }
    .price-box { margin-top:20px; border:2px solid #111827; border-radius:16px; padding:18px 20px; }
    .price { font-size:30px; font-weight:800; margin-bottom:4px; }
    .muted { color:#6b7280; }
    .steps { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:14px; }
    .step { border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
    .step .n { width:30px; height:30px; border-radius:999px; background:#111827; color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; margin-bottom:10px; }
    .step p { margin:0; color:#374151; font-size:13px; line-height:1.45; }
    .footer { margin-top:28px; text-align:center; font-size:12px; color:#6b7280; }
  </style>
</head>
<body>
  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">
        Desert Digital Studio<br>
        Gabriel Maciel<br>
        gabriel@desertdigitalstudio.com<br>
        ${today}
      </div>
    </div>

    <div class="eyebrow">Website Proposal</div>
    <h1>Prepared for<br>${escHtml(lead.businessName)}</h1>
    <p class="lede">
      ${escHtml(leadNeedsSummary(lead))}
      ${focusNote ? ` ${escHtml(focusNote)}` : ''}
    </p>

    <div class="band">
      <div class="band-grid">
        <div><div class="label">Business</div><div class="value">${escHtml(lead.businessName)}</div></div>
        <div><div class="label">Location</div><div class="value">${escHtml(lead.city || 'Arizona')}</div></div>
        <div><div class="label">Current website</div><div class="value">${lead.hasWebsite ? escHtml(lead.website || 'Website exists — URL not captured in CRM yet') : 'No real website captured'}</div></div>
        <div><div class="label">Best contact</div><div class="value">${escHtml(lead.publicEmail || lead.phone || 'To be confirmed')}</div></div>
      </div>
    </div>

    <h2>What I Found</h2>
    <div class="grid2">
      ${(issues.length ? issues : ['No website or no usable customer path']).map(issue => `
      <div class="card">
        <strong>${escHtml(issue)}</strong>
        <p>${escHtml(reasons.find(reason => reason.toLowerCase().includes(issue.toLowerCase().split(' ')[0])) || lead.quickPitch || 'This is creating friction for customers and making the business feel less current than it should.')}</p>
      </div>`).join('')}
    </div>

    <h2>Recommended Package</h2>
    <div class="card">
      <strong>${escHtml(pkg.name)}</strong>
      <p>${escHtml(pkg.headline)}</p>
      <ul style="margin-top:12px;">
        ${pkg.deliverables.map(item => `<li>${escHtml(item)}</li>`).join('')}
      </ul>
    </div>
  </section>

  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">Local presence. Digital impact.</div>
    </div>

    <h2>Project Goal</h2>
    <p class="lede">The goal here is simple: make ${escHtml(lead.businessName)} feel easier to trust, easier to contact, and more current online without losing what already makes the business itself work.</p>

    <div class="price-box">
      <div class="price">${formatCurrency(price)}</div>
      <div><strong>${escHtml(pkg.name)}</strong></div>
      <div class="muted" style="margin-top:6px;">Estimated timeline: ${escHtml(pkg.timeline)}</div>
      <ul style="margin-top:14px;">
        <li>50% deposit to begin: <strong>${formatCurrency(deposit)}</strong></li>
        <li>Remaining balance due at launch: <strong>${formatCurrency(price - deposit)}</strong></li>
        <li>One revision pass included before launch</li>
      </ul>
    </div>

    <h2>Next Steps</h2>
    <div class="steps">
      <div class="step"><div class="n">1</div><p>Approve the package and send the deposit so I can block the project time.</p></div>
      <div class="step"><div class="n">2</div><p>Send any photos, logo files, hours, contact details, and wording you want included.</p></div>
      <div class="step"><div class="n">3</div><p>I build the first version, send it for review, and make the final tweaks.</p></div>
      <div class="step"><div class="n">4</div><p>We launch the site and make sure customers have a cleaner path to call, visit, or message.</p></div>
    </div>

    <div class="footer">Desert Digital Studio · desertdigitalstudio.com · gabriel@desertdigitalstudio.com</div>
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

async function generateProposalFiles({ lead, packageId, price, focusNote = '', outputDir, desktopDir }) {
  if (!lead || !lead.businessName) {
    throw new Error('Lead data is required to generate a proposal');
  }

  const pkg = PACKAGES[packageId] || PACKAGES.refresh;
  const finalPrice = Number(price || pkg.price || 0);
  const safeSlug = slugify(lead.businessName || 'proposal');
  const datedSlug = `${safeSlug}-${new Date().toISOString().slice(0, 10)}`;

  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/proposals/generated');
  const pdfOutDir = desktopDir || path.join(os.homedir(), 'Desktop', 'Audit reports');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  fs.mkdirSync(pdfOutDir, { recursive: true });

  const htmlPath = path.join(htmlOutDir, `${datedSlug}.html`);
  const pdfPath = path.join(pdfOutDir, `${datedSlug}.pdf`);
  const jsonPath = path.join(htmlOutDir, `${datedSlug}.json`);

  const html = buildHtml({ lead, pkg, price: finalPrice, focusNote });
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    lead,
    package: pkg,
    price: finalPrice,
    focusNote,
    htmlPath,
    pdfPath
  }, null, 2), 'utf8');

  await renderPdf(html, pdfPath);

  return {
    package: pkg,
    price: finalPrice,
    htmlPath,
    pdfPath,
    jsonPath
  };
}

module.exports = {
  PACKAGES,
  generateProposalFiles
};
