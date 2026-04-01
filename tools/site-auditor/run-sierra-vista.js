/**
 * run-sierra-vista.js
 * Audits 5 Sierra Vista AZ businesses using Playwright + scorer.js + reporter.js
 */

const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const { scoreWebsite } = require('./scorer');
const { generateMarkdownReport, generateJSONReport } = require('./reporter');

const BUSINESSES = [
  { name: "Gypsy Sips Café", website: "https://www.gypsysipscafe.com", city: "Sierra Vista, AZ", phone: "(520) 224-7303" },
  { name: "Baker's Dozen Donuts & Coffee", website: "https://www.bakersdozendonut.com", city: "Sierra Vista, AZ", phone: "(520) 459-7162" },
  { name: "Get Lit Books", website: "https://www.getlitbooks.com", city: "Sierra Vista, AZ", phone: null },
  { name: "Angelika's German Imports", website: "https://angelikasgermanimports.com", city: "Sierra Vista, AZ", phone: "(520) 458-5150" },
  { name: "Urbano Bar & Bistro", website: "https://www.urbanobarbistro.com", city: "Sierra Vista, AZ", phone: "(520) 732-8886" },
];

async function auditSite(browser, business) {
  const { name, website } = business;
  console.log(`\n🔍 Auditing: ${name} (${website})`);
  
  let context, page;
  let html = '';
  let textContent = '';
  let loadTimeMs = null;
  let finalUrl = website;
  let error = null;

  try {
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    page = await context.newPage();

    const t0 = Date.now();
    const response = await page.goto(website, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    // Wait a bit more for lazy-loaded content
    await page.waitForTimeout(1500);
    loadTimeMs = Date.now() - t0;

    finalUrl = page.url();
    html = await page.content();
    textContent = await page.evaluate(() => document.body ? document.body.innerText : '');

    console.log(`  ✅ Loaded in ${(loadTimeMs/1000).toFixed(1)}s — final URL: ${finalUrl}`);
  } catch (err) {
    error = err.message;
    console.log(`  ❌ Error: ${error}`);
  } finally {
    if (context) await context.close().catch(() => {});
  }

  const result = scoreWebsite({ url: finalUrl, html, textContent, loadTimeMs, error });

  return {
    ...business,
    loadTimeMs,
    result
  };
}

async function main() {
  const outputDir = path.join(__dirname, 'sample-output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('🚀 Starting Sierra Vista Business Website Audit\n');
  const browser = await chromium.launch({ headless: true });

  const auditedBusinesses = [];

  for (const business of BUSINESSES) {
    const result = await auditSite(browser, business);
    auditedBusinesses.push(result);
  }

  await browser.close();

  // Sort worst-first (hottest leads first)
  auditedBusinesses.sort((a, b) => {
    const aScore = a.result.error ? -1 : a.result.percentage;
    const bScore = b.result.error ? -1 : b.result.percentage;
    return aScore - bScore;
  });

  // Assign ranks
  auditedBusinesses.forEach((b, i) => b.rank = i + 1);

  const meta = {
    city: 'Sierra Vista, AZ',
    category: 'Local Businesses',
    auditDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    totalFound: BUSINESSES.length
  };

  const mdReport = generateMarkdownReport(auditedBusinesses, meta);
  const jsonReport = generateJSONReport(auditedBusinesses, meta);

  const mdPath = path.join(outputDir, 'sierra-vista-report.md');
  const jsonPath = path.join(outputDir, 'sierra-vista-report.json');

  fs.writeFileSync(mdPath, mdReport, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');

  console.log(`\n✅ Reports saved:`);
  console.log(`   📄 ${mdPath}`);
  console.log(`   📊 ${jsonPath}`);
  console.log('\n📋 Final Rankings (worst → best):');
  auditedBusinesses.forEach(b => {
    const score = b.result.error ? 'ERROR' : `${b.result.percentage}/100 (${b.result.grade})`;
    console.log(`  #${b.rank} ${b.name}: ${score}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
