'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const { slugify } = require('../tools/site-auditor/lead-intelligence');

const CHECKS = [
  {
    key: 'https',
    label: 'HTTPS / security',
    score: 10,
    test: ({ finalUrl }) => /^https:\/\//i.test(finalUrl || ''),
    failMessage: 'The site is not resolving over HTTPS.'
  },
  {
    key: 'title',
    label: 'Page title',
    score: 10,
    test: ({ title }) => title.length >= 10,
    failMessage: 'The homepage title is missing or too thin.'
  },
  {
    key: 'metaDescription',
    label: 'Meta description',
    score: 10,
    test: ({ metaDescription }) => metaDescription.length >= 50,
    failMessage: 'The homepage is missing a useful meta description.'
  },
  {
    key: 'h1',
    label: 'Primary heading',
    score: 10,
    test: ({ h1 }) => h1.length >= 4,
    failMessage: 'The homepage is missing a clear H1 heading.'
  },
  {
    key: 'contactInfo',
    label: 'Contact path',
    score: 15,
    test: ({ text }) => /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text),
    failMessage: 'Phone or email contact info is hard to find on the homepage.'
  },
  {
    key: 'cta',
    label: 'Call to action',
    score: 15,
    test: ({ text }) => /(call|contact|book|quote|schedule|reserve|get started|directions|order)/i.test(text),
    failMessage: 'The page does not make the next step obvious enough.'
  },
  {
    key: 'social',
    label: 'Social links',
    score: 5,
    test: ({ html }) => /(facebook\.com|instagram\.com|linkedin\.com|tiktok\.com)/i.test(html),
    failMessage: 'No obvious social proof links were found.'
  },
  {
    key: 'altText',
    label: 'Image alt text',
    score: 10,
    test: ({ html }) => {
      const imgs = html.match(/<img\b/gi) || [];
      if (!imgs.length) return true;
      const alts = html.match(/<img[^>]+alt=["'][^"']+["']/gi) || [];
      return alts.length / imgs.length >= 0.5;
    },
    failMessage: 'Most images are missing useful alt text.'
  },
  {
    key: 'businessContext',
    label: 'Local trust signals',
    score: 15,
    test: ({ text }) => /(hours|open|address|about|family|visit|located|since)/i.test(text),
    failMessage: 'The homepage could do more to prove the business is real, current, and local.'
  }
];

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

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function extractTag(html, tag) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'));
  return match ? match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return match ? match[1].trim() : '';
}

async function fetchWebsite(url) {
  const normalizedUrl = normalizeUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(normalizedUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'DDS-Free-Audit/1.0 (+https://desertdigitalstudio.com)'
      }
    });
    const html = await response.text();
    return {
      requestedUrl: normalizedUrl,
      finalUrl: response.url || normalizedUrl,
      statusCode: response.status,
      html
    };
  } finally {
    clearTimeout(timeout);
  }
}

function analyzeHtml({ html, finalUrl, requestedUrl, businessName }) {
  const cleanHtml = String(html || '');
  const text = cleanHtml.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const title = extractTag(cleanHtml, 'title');
  const metaDescription = extractMetaDescription(cleanHtml);
  const h1 = extractTag(cleanHtml, 'h1');
  const results = CHECKS.map(check => ({
    key: check.key,
    label: check.label,
    score: check.score,
    pass: !!check.test({ html: cleanHtml, text, title, metaDescription, h1, finalUrl, requestedUrl, businessName }),
    failMessage: check.failMessage
  }));

  const earned = results.filter(item => item.pass).reduce((sum, item) => sum + item.score, 0);
  const total = results.reduce((sum, item) => sum + item.score, 0);
  const failed = results.filter(item => !item.pass);

  return {
    requestedUrl,
    finalUrl,
    title,
    metaDescription,
    h1,
    score: Math.round((earned / total) * 100),
    checks: results,
    topIssues: failed.slice(0, 4).map(item => item.label),
    summary: failed.length
      ? `The homepage for ${businessName || finalUrl} is missing a few trust and conversion basics: ${failed.slice(0, 3).map(item => item.label.toLowerCase()).join(', ')}.`
      : `The homepage for ${businessName || finalUrl} is fairly solid, but there are still a few polish opportunities worth reviewing manually.`
  };
}

function buildHtml({ submission }) {
  const today = friendlyDate();
  const logo = 'file://' + path.resolve('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png');
  const audit = submission.audit || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(submission.businessName || submission.website)} — Free Website Audit</title>
  <style>
    @page { size: Letter; margin: 0.5in; }
    * { box-sizing: border-box; }
    body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif; color:#111827; background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .topbar { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; margin-bottom:18px; }
    .brand img { width:220px; height:auto; }
    .meta { text-align:right; font-size:12px; color:#4b5563; line-height:1.55; }
    .eyebrow { font-size:12px; text-transform:uppercase; letter-spacing:0.24em; color:#b45309; font-weight:800; margin-top:10px; }
    h1 { font-size:34px; line-height:1.03; margin:10px 0 12px; letter-spacing:-0.03em; }
    .lede { font-size:15px; line-height:1.58; color:#374151; }
    .band { margin:20px 0; padding:16px 18px; border:1px solid #e5e7eb; border-radius:16px; background:#f9fafb; }
    .summary-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .summary-card, .check { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:14px; }
    .label { font-size:11px; text-transform:uppercase; letter-spacing:0.18em; color:#6b7280; font-weight:800; margin-bottom:6px; }
    .value { font-size:24px; font-weight:800; }
    .sub { font-size:12px; color:#6b7280; margin-top:6px; line-height:1.45; }
    h2 { font-size:15px; text-transform:uppercase; letter-spacing:0.22em; margin:24px 0 12px; }
    .checks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .pass { border-color:#bbf7d0; background:#ecfdf5; }
    .fail { border-color:#fed7aa; background:#fff7ed; }
    .check strong { display:block; margin-bottom:8px; }
    .cta { margin-top:24px; border:2px solid #111827; border-radius:18px; padding:18px 20px; }
    ul { margin:0; padding-left:18px; }
    li { margin:0 0 8px; font-size:13px; line-height:1.5; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="brand"><img src="${logo}" alt="Desert Digital Studio logo"></div>
    <div class="meta">Desert Digital Studio<br>Free Website Audit Snapshot<br>${today}</div>
  </div>
  <div class="eyebrow">Lead magnet report</div>
  <h1>${escHtml(submission.businessName || submission.website)}</h1>
  <p class="lede">${escHtml(audit.summary || 'Quick automated homepage review generated from the public free audit page.')}</p>

  <div class="band">
    <div class="summary-grid">
      <div class="summary-card"><div class="label">Score</div><div class="value">${escHtml(audit.score || 0)}/100</div><div class="sub">Fast homepage snapshot, not a full manual audit.</div></div>
      <div class="summary-card"><div class="label">Website</div><div class="value" style="font-size:14px; line-height:1.4;">${escHtml(submission.website)}</div><div class="sub">Requested by ${escHtml(submission.name || submission.email)}</div></div>
      <div class="summary-card"><div class="label">Top issues</div><div class="value" style="font-size:14px; line-height:1.4;">${escHtml((audit.topIssues || []).join(' · ') || 'No major homepage misses flagged')}</div><div class="sub">Best next conversation starters.</div></div>
    </div>
  </div>

  <h2>Checks reviewed</h2>
  <div class="checks">
    ${(audit.checks || []).map(check => `<div class="check ${check.pass ? 'pass' : 'fail'}"><strong>${escHtml(check.label)}</strong>${check.pass ? 'Looks good in this quick pass.' : escHtml(check.failMessage)}</div>`).join('')}
  </div>

  <div class="cta">
    <div class="label">Recommended next step</div>
    <ul>
      <li>Book a manual DDS audit to review the deeper trust, SEO, mobile, and conversion issues.</li>
      <li>Prioritize the 2–3 issues that are most likely costing calls, bookings, or inquiries.</li>
      <li>Turn the audit into a quick-fix plan or full site refresh depending on urgency.</li>
    </ul>
  </div>
</body>
</html>`;
}

async function renderPdf(html, outputPath) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: outputPath, format: 'Letter', printBackground: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } });
  } finally {
    await browser.close();
  }
}

async function runFreeAudit({ name, email, businessName, website, goals = '', phone = '' }) {
  const fetched = await fetchWebsite(website);
  const audit = analyzeHtml({ html: fetched.html, finalUrl: fetched.finalUrl, requestedUrl: fetched.requestedUrl, businessName });
  return {
    id: slugify(email || `${businessName}-${website}`),
    name,
    email,
    phone,
    businessName,
    website: fetched.finalUrl || normalizeUrl(website),
    goals,
    audit,
    notes: ''
  };
}

async function generateLeadMagnetFiles({ submission, outputDir, desktopDir }) {
  if (!submission || !submission.website) {
    throw new Error('Submission data is required to generate a lead magnet report');
  }

  const safeSlug = slugify(submission.businessName || submission.website || 'free-audit');
  const datedSlug = `${safeSlug}-free-audit-${new Date().toISOString().slice(0, 10)}`;
  const htmlOutDir = outputDir || path.resolve('/Users/gabrielmaciel/.openclaw/workspace/lead-magnet/generated');
  const pdfOutDir = desktopDir || path.join(os.homedir(), 'Desktop', 'Audit reports');
  fs.mkdirSync(htmlOutDir, { recursive: true });
  fs.mkdirSync(pdfOutDir, { recursive: true });

  const htmlPath = path.join(htmlOutDir, `${datedSlug}.html`);
  const pdfPath = path.join(pdfOutDir, `${datedSlug}.pdf`);
  const jsonPath = path.join(htmlOutDir, `${datedSlug}.json`);
  const html = buildHtml({ submission });
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), submission, htmlPath, pdfPath }, null, 2), 'utf8');
  await renderPdf(html, pdfPath);
  return { htmlPath, pdfPath, jsonPath };
}

module.exports = {
  normalizeUrl,
  runFreeAudit,
  generateLeadMagnetFiles,
  analyzeHtml,
  fetchWebsite
};
