'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const { slugify } = require('../tools/site-auditor/lead-intelligence');
const { PACKAGES } = require('../proposals/builder');

const CHECKLIST_LABELS = {
  brandAssets: 'Logo / brand assets',
  photos: 'Photos or visuals',
  copy: 'Approved business copy',
  domainAccess: 'Domain access',
  hostingAccess: 'Hosting access',
  analytics: 'Analytics / tracking access',
  googleBusiness: 'Google Business details',
  launchApproval: 'Final launch approval'
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

function formatDate(value) {
  if (!value) return 'To be scheduled';
  try {
    return friendlyDate(new Date(value));
  } catch (error) {
    return value;
  }
}

function checklistItems(checklist = {}) {
  return Object.entries(CHECKLIST_LABELS).map(([key, label]) => ({
    key,
    label,
    done: !!checklist[key]
  }));
}

function buildMissingItems(client) {
  const items = checklistItems(client.checklist).filter(item => !item.done);
  if (items.length) return items;

  return [
    { label: 'Kickoff details confirmed', done: true },
    { label: 'Ready to move into build', done: true }
  ];
}

function buildHtml({ client, pkg }) {
  const today = friendlyDate();
  const logo = 'file://' + path.resolve('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png');
  const checklist = checklistItems(client.checklist);
  const missing = buildMissingItems(client);
  const contactName = client.contactName || client.businessName || 'your team';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(client.businessName)} — Onboarding Packet</title>
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
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:18px; }
    .brand img { width:220px; height:auto; }
    .meta { text-align:right; font-size:12px; color:#4b5563; line-height:1.55; }
    .eyebrow { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:#b45309; font-weight:800; margin-top:10px; }
    h1 { font-size:34px; line-height:1.04; margin:10px 0 12px; letter-spacing:-0.03em; }
    .lede { font-size:15px; line-height:1.6; color:#374151; max-width:760px; }
    .band { margin:20px 0; padding:16px 18px; border:1px solid #e5e7eb; border-radius:16px; background:#f9fafb; }
    .summary-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .summary-card { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
    .label { font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#6b7280; font-weight:800; margin-bottom:6px; }
    .value { font-size:18px; font-weight:800; color:#111827; line-height:1.3; }
    .sub { font-size:12px; color:#6b7280; margin-top:6px; line-height:1.45; }
    h2 { font-size:15px; text-transform:uppercase; letter-spacing:0.22em; margin:24px 0 12px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .card { border:1px solid #e5e7eb; border-radius:16px; padding:16px; }
    .card strong { display:block; margin-bottom:8px; font-size:15px; }
    .card p { margin:0; color:#374151; font-size:13px; line-height:1.55; }
    ul { margin:0; padding-left:18px; }
    li { margin:0 0 8px; font-size:13px; line-height:1.5; }
    .checklist { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .check { border:1px solid #e5e7eb; border-radius:14px; padding:12px 14px; font-size:13px; }
    .done { background:#ecfdf5; border-color:#bbf7d0; }
    .todo { background:#fff7ed; border-color:#fed7aa; }
    .footer { margin-top:26px; text-align:center; font-size:12px; color:#6b7280; }
  </style>
</head>
<body>
  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">
        Desert Digital Studio<br>
        Client Onboarding Packet<br>
        ${today}
      </div>
    </div>

    <div class="eyebrow">Welcome aboard</div>
    <h1>${escHtml(client.businessName)}</h1>
    <p class="lede">
      This packet lays out the project shape, what I need from ${escHtml(contactName)}, and how we’ll move from kickoff to launch without a bunch of confusion.
    </p>

    <div class="band">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="label">Package</div>
          <div class="value">${escHtml(pkg.name)}</div>
          <div class="sub">${escHtml(pkg.timeline)}</div>
        </div>
        <div class="summary-card">
          <div class="label">Investment</div>
          <div class="value">${formatCurrency(client.price || pkg.price)}</div>
          <div class="sub">Saved from the proposal / onboarding record.</div>
        </div>
        <div class="summary-card">
          <div class="label">Kickoff</div>
          <div class="value">${escHtml(formatDate(client.kickoffDate))}</div>
          <div class="sub">Target launch: ${escHtml(formatDate(client.launchTargetDate))}</div>
        </div>
        <div class="summary-card">
          <div class="label">Primary contact</div>
          <div class="value">${escHtml(client.contactEmail || client.contactPhone || 'To be confirmed')}</div>
          <div class="sub">${escHtml(client.contactName || 'No contact name saved yet')}</div>
        </div>
      </div>
    </div>

    <h2>What’s included</h2>
    <div class="card">
      <strong>${escHtml(pkg.headline)}</strong>
      <ul style="margin-top:12px;">
        ${(client.deliverables?.length ? client.deliverables : pkg.deliverables).map(item => `<li>${escHtml(item)}</li>`).join('')}
      </ul>
    </div>

    <h2>Project goals</h2>
    <div class="grid2">
      <div class="card">
        <strong>Main goals</strong>
        <p>${escHtml(client.goals || 'Goals have not been written down yet. Use the dashboard onboarding form to capture the client’s priorities.')}</p>
      </div>
      <div class="card">
        <strong>Priority pages / sections</strong>
        <ul>
          ${(client.priorityPages?.length ? client.priorityPages : ['Homepage', 'Contact / conversion path', 'About / trust section']).map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="topbar">
      <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
      <div class="meta">Clear process. Fast communication. Clean launch.</div>
    </div>

    <h2>What I need from you</h2>
    <div class="grid2">
      <div class="card">
        <strong>Still needed</strong>
        <ul>
          ${missing.map(item => `<li>${escHtml(item.label)}</li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <strong>Requested features / notes</strong>
        <ul>
          ${(client.requestedFeatures?.length ? client.requestedFeatures : ['Mobile-friendly design', 'Clear contact flow', 'Simple, trustworthy messaging']).map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
        ${client.notes ? `<p style="margin-top:12px;">${escHtml(client.notes)}</p>` : ''}
      </div>
    </div>

    <h2>Checklist status</h2>
    <div class="checklist">
      ${checklist.map(item => `
        <div class="check ${item.done ? 'done' : 'todo'}">
          <strong>${item.done ? 'Done' : 'Pending'}</strong><br>
          ${escHtml(item.label)}
        </div>
      `).join('')}
    </div>

    <h2>How the project runs</h2>
    <div class="grid2">
      <div class="card"><strong>1. Prep</strong><p>I gather content, assets, logins, and the main goals so the build starts with clarity.</p></div>
      <div class="card"><strong>2. First build</strong><p>I put together the first version with the right structure, messaging, and contact flow.</p></div>
      <div class="card"><strong>3. Review</strong><p>You review the draft, send consolidated feedback, and I tighten the final details.</p></div>
      <div class="card"><strong>4. Launch</strong><p>Once approved, I launch the site and make sure the customer path feels clean and ready to use.</p></div>
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

async function generateOnboardingPacket({ client, outputDir, desktopDir }) {
  if (!client || !client.businessName) {
    throw new Error('Client onboarding record is required');
  }

  const pkg = PACKAGES[client.packageId] || PACKAGES.refresh;
  const datedSlug = `${slugify(client.businessName || 'client')}-onboarding-${new Date().toISOString().slice(0, 10)}`;
  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/onboarding/generated');
  const pdfOutDir = desktopDir || path.join(os.homedir(), 'Desktop', 'Audit reports');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  fs.mkdirSync(pdfOutDir, { recursive: true });

  const htmlPath = path.join(htmlOutDir, `${datedSlug}.html`);
  const pdfPath = path.join(pdfOutDir, `${datedSlug}.pdf`);
  const jsonPath = path.join(htmlOutDir, `${datedSlug}.json`);
  const html = buildHtml({ client, pkg });

  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    client,
    package: pkg,
    htmlPath,
    pdfPath
  }, null, 2), 'utf8');

  await renderPdf(html, pdfPath);

  return {
    package: pkg,
    price: Number(client.price || pkg.price || 0),
    htmlPath,
    pdfPath,
    jsonPath
  };
}

module.exports = {
  generateOnboardingPacket
};
