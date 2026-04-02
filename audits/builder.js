'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const { slugify, normalizeCityLabel } = require('../tools/site-auditor/lead-intelligence');
const { PACKAGES } = require('../proposals/builder');

const CHECK_META = {
  ssl: { label: 'HTTPS / security' },
  mobileResponsive: { label: 'Mobile-friendly layout' },
  pageTitle: { label: 'Page title quality' },
  metaDescription: { label: 'Meta description' },
  h1Present: { label: 'Primary heading (H1)' },
  imageAltTags: { label: 'Image alt text' },
  contactInfo: { label: 'Contact information' },
  socialMedia: { label: 'Social links' },
  copyrightYear: { label: 'Current footer copyright' },
  pageSpeed: { label: 'Page speed' },
  clearCTA: { label: 'Calls to action' }
};

const ISSUE_LIBRARY = {
  'No Website': {
    impact: 'Customers have to rely on Google listings, Facebook, or word of mouth instead of landing on a real website that explains the business clearly.',
    recommendation: 'Launch a simple, fast website with clear contact info, hours, location details, and a direct next step for new customers.'
  },
  'Meta Description': {
    impact: 'Google is missing a cleaner summary to show in search, which can lower click-through rate and make the listing feel less polished.',
    recommendation: 'Write a tighter meta description that explains what the business offers, where it serves, and why someone should click.'
  },
  'H1 Heading': {
    impact: 'The page is missing a strong main headline, so visitors and search engines get less clarity about what the page is actually about.',
    recommendation: 'Add a clear H1 that states the service, business name, or main customer promise right away.'
  },
  'Contact Info': {
    impact: 'If phone, email, address, or hours are hard to find, more people bounce instead of calling, visiting, or asking a question.',
    recommendation: 'Make the contact path obvious above the fold and repeat key contact details in the footer and contact section.'
  },
  'Clear CTA (Button/Form)': {
    impact: 'Visitors are not being guided toward the next step, which quietly hurts calls, walk-ins, bookings, and general conversions.',
    recommendation: 'Add visible buttons or forms for the most important actions like call now, get directions, request a quote, or book.'
  },
  'Social Media Links': {
    impact: 'The site misses an easy trust signal and a useful way for visitors to verify that the business is active.',
    recommendation: 'Link the main social profiles in the header, footer, or contact area so visitors can cross-check the brand quickly.'
  },
  'Copyright Up-to-Date': {
    impact: 'An outdated or missing footer date makes the site feel neglected, even if the business itself is doing well.',
    recommendation: 'Refresh the footer copyright and do a quick polish pass so the website feels current.'
  }
};

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

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

function scoreLabel(score) {
  const numeric = Number(score || 0);
  if (numeric >= 85) return 'Strong base';
  if (numeric >= 70) return 'Solid, with room to tighten';
  if (numeric >= 55) return 'Needs improvement';
  if (numeric > 0) return 'High-priority cleanup';
  return 'Needs a fresh starting point';
}

function resolveAuditEntry(lead) {
  if (!lead?.sourceReport) return null;
  const report = readJson(lead.sourceReport, null);
  if (!report || !Array.isArray(report.businesses)) return null;

  const leadSlug = lead.id || slugify(`${lead.businessName}-${normalizeCityLabel(lead.city || '')}`);
  return report.businesses.find(entry => {
    const entrySlug = slugify(`${entry.name}-${normalizeCityLabel(entry.city || '')}`);
    return entrySlug === leadSlug
      || String(entry.name || '').toLowerCase() === String(lead.businessName || '').toLowerCase()
      || (entry.website && lead.website && entry.website === lead.website);
  }) || null;
}

function getIssueCards(lead, auditEntry) {
  const issues = (lead.topIssues?.length ? lead.topIssues : (auditEntry?.failedChecks || ['No Website']))
    .slice(0, 4);

  return issues.map(issue => ({
    title: issue,
    impact: ISSUE_LIBRARY[issue]?.impact
      || lead.quickPitch
      || 'This creates friction for visitors and makes the site feel less polished than it should.',
    recommendation: ISSUE_LIBRARY[issue]?.recommendation
      || 'Tighten this area so visitors can understand the offer faster and act with less friction.'
  }));
}

function getCheckRows(lead, auditEntry) {
  if (auditEntry?.checks && Object.keys(auditEntry.checks).length > 0) {
    return Object.entries(auditEntry.checks).map(([key, check]) => ({
      label: CHECK_META[key]?.label || key,
      status: check.pass ? 'Pass' : 'Needs work',
      score: `${check.score}/${check.max}`,
      detail: check.detail || 'No detail captured'
    }));
  }

  const failed = new Set(lead.topIssues || []);
  return [
    'Meta Description',
    'H1 Heading',
    'Contact Info',
    'Clear CTA (Button/Form)',
    'Social Media Links',
    'Copyright Up-to-Date'
  ].map(label => ({
    label,
    status: failed.has(label) ? 'Needs work' : 'Looks okay',
    score: failed.has(label) ? '—' : '—',
    detail: failed.has(label)
      ? (ISSUE_LIBRARY[label]?.impact || 'This area likely needs improvement based on the CRM notes.')
      : 'No issue flagged in the saved audit notes.'
  }));
}

function buildRecommendedSteps(lead) {
  if (!lead.hasWebsite) {
    return [
      'Launch a simple website with contact details, business hours, maps, and a clean first impression.',
      'Set up clear call / email / directions buttons for mobile visitors.',
      'Make sure Google and social traffic have a single real destination that the business controls.'
    ];
  }

  return [
    'Fix the top trust and conversion issues first so the site feels easier to use right away.',
    'Clarify the page structure and calls to action so visitors know what to do next.',
    'Do a final polish pass across mobile, metadata, and contact flow so the site feels current.'
  ];
}

function buildHtml({ lead, auditEntry, pkg, price, introNote = '', focusNote = '' }) {
  const logo = 'file://' + path.resolve('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png');
  const today = friendlyDate();
  const score = Number(lead.auditScore || auditEntry?.score || 0);
  const grade = lead.siteHealth || auditEntry?.grade || '—';
  const issueCards = getIssueCards(lead, auditEntry);
  const checkRows = getCheckRows(lead, auditEntry);
  const steps = buildRecommendedSteps(lead);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(lead.businessName)} — Website Audit</title>
  <style>
    @page { size: Letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { min-height: 10in; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom: 18px; }
    .brand img { width: 220px; height: auto; }
    .meta { text-align:right; font-size:12px; color:#4b5563; line-height:1.55; }
    .eyebrow { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:#b45309; font-weight:800; margin-top:8px; }
    h1 { font-size:34px; line-height:1.02; margin:10px 0 14px; letter-spacing:-0.03em; }
    .lede { font-size:15px; line-height:1.6; color:#374151; max-width:760px; }
    .band { margin:20px 0; padding:16px 18px; border:1px solid #e5e7eb; border-radius:16px; background:#f9fafb; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .summary-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
    .label { font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#6b7280; font-weight:800; margin-bottom:6px; }
    .value { font-size:24px; font-weight:800; color:#111827; letter-spacing:-0.03em; }
    .sub { font-size:12px; color:#6b7280; margin-top:6px; line-height:1.45; }
    h2 { font-size:15px; text-transform:uppercase; letter-spacing:0.22em; margin:24px 0 12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card { border:1px solid #e5e7eb; border-radius:16px; padding:16px; background:#fff; }
    .card strong { display:block; margin-bottom:8px; font-size:15px; }
    .card p { margin:0 0 10px; color:#374151; font-size:13px; line-height:1.55; }
    .callout { border-left:4px solid #f59e0b; padding-left:14px; margin-top:16px; color:#374151; font-size:13px; line-height:1.6; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th, td { border-bottom:1px solid #e5e7eb; padding:10px 8px; text-align:left; vertical-align:top; }
    th { text-transform:uppercase; letter-spacing:0.14em; color:#6b7280; font-size:11px; }
    .status-pass { color:#15803d; font-weight:700; }
    .status-work { color:#b45309; font-weight:700; }
    .status-ok { color:#2563eb; font-weight:700; }
    .package-box { border:2px solid #111827; border-radius:18px; padding:18px 20px; margin-top:18px; }
    .price { font-size:32px; font-weight:800; margin-bottom:6px; }
    ul { margin:0; padding-left:18px; }
    li { margin:0 0 8px; font-size:13px; line-height:1.5; }
    .footer { margin-top:28px; text-align:center; font-size:12px; color:#6b7280; }
  </style>
</head>
<body>
  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">
        Desert Digital Studio<br>
        Website Improvement Audit<br>
        ${today}
      </div>
    </div>

    <div class="eyebrow">Client-Facing Audit</div>
    <h1>${escHtml(lead.businessName)}</h1>
    <p class="lede">
      This audit highlights the biggest website trust, clarity, and conversion issues that are making the online experience weaker than it should be.
      ${introNote ? ` ${escHtml(introNote)}` : ''}
      ${focusNote ? ` ${escHtml(focusNote)}` : ''}
    </p>

    <div class="band">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Audit score</div>
          <div class="value">${escHtml(score || '0')}/100</div>
          <div class="sub">${escHtml(scoreLabel(score))}</div>
        </div>
        <div class="summary-card">
          <div class="label">Grade</div>
          <div class="value">${escHtml(grade)}</div>
          <div class="sub">Based on the saved DDS audit checks.</div>
        </div>
        <div class="summary-card">
          <div class="label">Website</div>
          <div class="value" style="font-size:15px; line-height:1.35;">${escHtml(lead.website || 'No current website captured')}</div>
          <div class="sub">${lead.hasWebsite ? 'Existing site reviewed' : 'Fresh launch opportunity'}</div>
        </div>
        <div class="summary-card">
          <div class="label">Recommended path</div>
          <div class="value" style="font-size:18px; line-height:1.3;">${escHtml(pkg.name)}</div>
          <div class="sub">${escHtml(pkg.timeline)}</div>
        </div>
      </div>
    </div>

    <h2>Top findings</h2>
    <div class="grid2">
      ${issueCards.map(issue => `
        <div class="card">
          <strong>${escHtml(issue.title)}</strong>
          <p>${escHtml(issue.impact)}</p>
          <p><strong>Recommended fix:</strong> ${escHtml(issue.recommendation)}</p>
        </div>
      `).join('')}
    </div>

    <div class="callout">
      <strong>What this means:</strong> ${escHtml(lead.quickPitch || 'The current site has a few practical issues that are making it less trustworthy and less useful than it could be.')}
    </div>
  </section>

  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">Local presence. Digital impact.</div>
    </div>

    <h2>Audit breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Check</th>
          <th>Status</th>
          <th>Score</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        ${checkRows.map(row => `
          <tr>
            <td>${escHtml(row.label)}</td>
            <td class="${row.status === 'Pass' ? 'status-pass' : row.status === 'Needs work' ? 'status-work' : 'status-ok'}">${escHtml(row.status)}</td>
            <td>${escHtml(row.score)}</td>
            <td>${escHtml(row.detail)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>Priority next steps</h2>
    <div class="grid2">
      ${steps.map((step, index) => `
        <div class="card">
          <strong>Step ${index + 1}</strong>
          <p>${escHtml(step)}</p>
        </div>
      `).join('')}
    </div>

    <div class="package-box">
      <div class="label">Recommended project</div>
      <div class="price">${formatCurrency(price)}</div>
      <div><strong>${escHtml(pkg.name)}</strong></div>
      <div style="margin-top:8px; color:#4b5563; font-size:13px; line-height:1.55;">${escHtml(pkg.headline)}</div>
      <ul style="margin-top:14px;">
        ${pkg.deliverables.map(item => `<li>${escHtml(item)}</li>`).join('')}
      </ul>
    </div>

    <div class="footer">Prepared by Desert Digital Studio · desertdigitalstudio.com</div>
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

async function generateAuditFiles({ lead, packageId, price, introNote = '', focusNote = '', outputDir, desktopDir }) {
  if (!lead || !lead.businessName) {
    throw new Error('Lead data is required to generate an audit');
  }

  const auditEntry = resolveAuditEntry(lead);
  const pkg = PACKAGES[packageId] || PACKAGES[lead.proposal?.packageId] || PACKAGES[lead.recommendedPackage] || PACKAGES.refresh;
  const finalPrice = Number(price || lead.proposal?.price || lead.estimatedValue || pkg.price || 0);
  const safeSlug = slugify(lead.businessName || 'audit');
  const datedSlug = `${safeSlug}-website-audit-${new Date().toISOString().slice(0, 10)}`;

  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/audits/generated');
  const pdfOutDir = desktopDir || path.join(os.homedir(), 'Desktop', 'Audit reports');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  fs.mkdirSync(pdfOutDir, { recursive: true });

  const htmlPath = path.join(htmlOutDir, `${datedSlug}.html`);
  const pdfPath = path.join(pdfOutDir, `${datedSlug}.pdf`);
  const jsonPath = path.join(htmlOutDir, `${datedSlug}.json`);

  const html = buildHtml({ lead, auditEntry, pkg, price: finalPrice, introNote, focusNote });
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    lead,
    auditEntry,
    package: pkg,
    price: finalPrice,
    introNote,
    focusNote,
    htmlPath,
    pdfPath
  }, null, 2), 'utf8');

  await renderPdf(html, pdfPath);

  return {
    package: pkg,
    price: finalPrice,
    score: Number(lead.auditScore || auditEntry?.score || 0),
    htmlPath,
    pdfPath,
    jsonPath
  };
}

module.exports = {
  generateAuditFiles,
  resolveAuditEntry
};
