#!/usr/bin/env node
/**
 * audit-tombstone.js — Website auditor for Tombstone, AZ businesses
 */

const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BUSINESSES = [
  { name: "Big Nose Kate's Saloon", url: 'https://bignosekatestombstone.com', phone: '(520) 457-3107' },
  { name: "Crazy Annie's Bordello & Saloon", url: 'https://www.crazyannies.com', phone: '(520) 457-3847' },
  { name: "Dick's Diner", url: 'https://dicksdogs.square.site', phone: '(520) 763-4054' },
  { name: "Hotel Tombstone", url: 'https://www.hoteltombstone.com', phone: '(520) 457-2405' },
  { name: "Doc Holliday's Saloon", url: null, phone: '(N/A)' },
  { name: "Johnny Ringo's Bar", url: null, phone: '(N/A)' },
  { name: "Cowboy Coffee Bar", url: null, phone: '(N/A)' },
  { name: "Mom & Pops Sandwiches", url: null, phone: '(N/A)' },
];

const CURRENT_YEAR = new Date().getFullYear();

function scoreSSL(url) {
  return url && url.startsWith('https://') ? 10 : 0;
}

function scoreMobileResponsive(html) {
  return /viewport/i.test(html) ? 10 : 0;
}

function scorePageTitle(title) {
  return title && title.trim().length > 0 ? 8 : 0;
}

function scoreMetaDescription(html) {
  return /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html) ||
         /<meta[^>]+content=["'][^"']+["'][^>]+name=["']description["']/i.test(html) ? 8 : 0;
}

function scoreH1(html) {
  return /<h1[^>]*>[^<]+<\/h1>/i.test(html) ? 7 : 0;
}

function scoreImageAlt(html) {
  const imgs = [...html.matchAll(/<img[^>]+>/gi)];
  if (imgs.length === 0) return 7;
  const missing = imgs.filter(m => !/alt=["'][^"']*["']/i.test(m[0]) || /alt=["']\s*["']/i.test(m[0])).length;
  const ratio = 1 - (missing / imgs.length);
  if (ratio >= 0.95) return 7;
  if (ratio >= 0.75) return 5;
  if (ratio >= 0.50) return 3;
  return 0;
}

function scoreContactInfo(html, text) {
  const combined = (html + ' ' + text).toLowerCase();
  let found = [];
  if (/(\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4})/.test(combined)) found.push('phone');
  if (/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/.test(combined)) found.push('email');
  if (/(street|st\.|avenue|ave\.|road|rd\.|blvd|drive|dr\.|lane|ln\.|tombstone|benson|arizona|az\b)/i.test(combined)) found.push('address');
  if (found.length === 0) return 0;
  if (found.length === 1) return 7;
  if (found.length === 2) return 11;
  return 15;
}

function scoreSocialMedia(html) {
  const socials = [];
  if (/facebook\.com/i.test(html)) socials.push('facebook');
  if (/instagram\.com/i.test(html)) socials.push('instagram');
  if (/twitter\.com|x\.com/i.test(html)) socials.push('twitter');
  if (/yelp\.com/i.test(html)) socials.push('yelp');
  if (/tiktok\.com/i.test(html)) socials.push('tiktok');
  if (/tripadvisor\.com/i.test(html)) socials.push('tripadvisor');
  return { score: socials.length > 0 ? 8 : 0, platforms: socials };
}

function scoreCopyright(html) {
  const match = html.match(/©\s*(\d{4})|copyright\s*(?:©)?\s*(\d{4})/i);
  if (!match) return { score: 2, detail: 'No copyright year found in footer' };
  const year = parseInt(match[1] || match[2]);
  if (year === CURRENT_YEAR) return { score: 5, detail: `Copyright © ${year} — current` };
  const diff = CURRENT_YEAR - year;
  if (diff === 1) return { score: 3, detail: `Copyright © ${year} — slightly outdated (1 year old)` };
  return { score: 0, detail: `Copyright © ${year} — ${diff} years outdated! Looks abandoned` };
}

function scoreLoadTime(ms) {
  if (ms < 1500) return { score: 12, detail: `Fast load: ${(ms/1000).toFixed(1)}s` };
  if (ms < 3000) return { score: 9, detail: `Moderate load: ${(ms/1000).toFixed(1)}s` };
  if (ms < 5000) return { score: 6, detail: `Slow load: ${(ms/1000).toFixed(1)}s` };
  return { score: 2, detail: `Very slow load: ${(ms/1000).toFixed(1)}s` };
}

function scoreCTA(html) {
  const ctas = [];
  if (/<form[^>]*>/i.test(html)) ctas.push('contact form');
  if (/<button[^>]*>/i.test(html) || /type=["']button["']/i.test(html) || /type=["']submit["']/i.test(html)) ctas.push('CTA button');
  if (/(book now|reserve|order|contact us|get started|call us|learn more|sign up)/i.test(html)) ctas.push('CTA text');
  if (ctas.length === 0) return { score: 0, ctaItems: [] };
  if (ctas.length === 1) return { score: 3, ctaItems: ctas };
  if (ctas.length === 2) return { score: 6, ctaItems: ctas };
  return { score: 10, ctaItems: ctas };
}

function extractMetaDesc(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return m ? m[1] : null;
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  return m[1].replace(/<[^>]+>/g, '').trim().slice(0, 80);
}

function extractImgStats(html) {
  const imgs = [...html.matchAll(/<img[^>]+>/gi)];
  const missing = imgs.filter(m => !/alt=["'][^"']*["']/i.test(m[0]) || /alt=["']\s*["']/i.test(m[0])).length;
  return { total: imgs.length, missing };
}

function grade(score) {
  if (score >= 85) return { label: '✅ Well Built', grade: '🏆 A' };
  if (score >= 70) return { label: '🌤️ Decent', grade: '👍 B' };
  if (score >= 50) return { label: '⚠️ Needs Work', grade: '😬 C' };
  return { label: '🚨 Poor', grade: '💀 D' };
}

async function auditSite(business) {
  if (!business.url) {
    return { ...business, noSite: true };
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const start = Date.now();
    let timedOut = false;

    try {
      await page.goto(business.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch (e) {
      if (e.message.includes('timeout')) timedOut = true;
      else throw e;
    }

    const loadTime = Date.now() - start;
    const finalUrl = page.url();
    const title = await page.title();
    const html = await page.content();
    const text = await page.evaluate(() => document.body ? document.body.innerText : '');

    const sslScore = scoreSSL(finalUrl);
    const mobileScore = scoreMobileResponsive(html);
    const titleScore = scorePageTitle(title);
    const metaScore = scoreMetaDescription(html);
    const h1Score = scoreH1(html);
    const altScore = scoreImageAlt(html);
    const contactResult = scoreContactInfo(html, text);
    const socialResult = scoreSocialMedia(html);
    const copyResult = scoreCopyright(html);
    const loadResult = scoreLoadTime(timedOut ? 20000 : loadTime);
    const ctaResult = scoreCTA(html);

    const metaDesc = extractMetaDesc(html);
    const h1Text = extractH1(html);
    const imgStats = extractImgStats(html);

    const total = sslScore + mobileScore + titleScore + metaScore + h1Score +
      altScore + contactResult + socialResult.score + copyResult.score +
      loadResult.score + ctaResult.score;

    return {
      ...business,
      finalUrl,
      title,
      loadTime: timedOut ? 20000 : loadTime,
      score: total,
      checks: {
        ssl: { score: sslScore, max: 10, pass: sslScore === 10, detail: sslScore === 10 ? 'Site uses HTTPS' : 'No SSL — insecure!' },
        mobile: { score: mobileScore, max: 10, pass: mobileScore === 10, detail: mobileScore === 10 ? 'Viewport meta tag found' : 'No viewport meta — not mobile friendly' },
        title: { score: titleScore, max: 8, pass: titleScore === 8, detail: titleScore === 8 ? `Good title: "${title}"` : 'No page title found' },
        metaDesc: { score: metaScore, max: 8, pass: metaScore === 8, detail: metaScore === 8 ? `Meta description present (${metaDesc ? metaDesc.length : 0} chars)` : 'No meta description — hurts Google ranking' },
        h1: { score: h1Score, max: 7, pass: h1Score === 7, detail: h1Score === 7 ? `H1 found: "${h1Text}"` : 'No H1 heading found' },
        alt: { score: altScore, max: 7, pass: altScore >= 5, detail: imgStats.total === 0 ? 'No images found' : `${imgStats.missing}/${imgStats.total} images missing alt tags` },
        contact: { score: contactResult, max: 15, pass: contactResult >= 7, detail: `Contact info found: ${contactResult === 0 ? 'none' : contactResult === 15 ? 'phone, email, address' : contactResult === 11 ? 'phone, address' : 'partial'}` },
        social: { score: socialResult.score, max: 8, pass: socialResult.score === 8, detail: socialResult.platforms.length ? `Social links: ${socialResult.platforms.join(', ')}` : 'No social media links found' },
        copyright: { score: copyResult.score, max: 5, pass: copyResult.score >= 3, detail: copyResult.detail },
        load: { score: loadResult.score, max: 12, pass: loadResult.score >= 9, detail: loadResult.detail },
        cta: { score: ctaResult.score, max: 10, pass: ctaResult.score >= 6, detail: ctaResult.ctaItems.length ? `CTA elements: ${ctaResult.ctaItems.join(', ')}` : 'No clear CTA found' },
      }
    };
  } finally {
    await browser.close();
  }
}

function formatCheck(emoji, label, check) {
  const pass = check.pass ? '✅' : '❌';
  return `| ${emoji} ${label} | ${pass} | ${check.score}/${check.max} | ${check.detail} |`;
}

function buildMarkdown(results) {
  const auditDate = new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' });
  const withSites = results.filter(r => !r.noSite);
  const noSites = results.filter(r => r.noSite);
  const avgScore = withSites.length
    ? Math.round(withSites.reduce((a, b) => a + b.score, 0) / withSites.length)
    : 0;

  // Sort: no-site businesses get score 0 for ranking, then sort worst first
  const ranked = [...results].sort((a, b) => {
    const sa = a.noSite ? -1 : a.score;
    const sb = b.noSite ? -1 : b.score;
    return sa - sb;
  });

  let md = `# 📊 Local Business Website Audit Report
## Saloons, Restaurants & Hotels in Tombstone, AZ

**Audit Date:** ${auditDate}  
**Businesses Audited:** ${results.length} of ${results.length} found  
**Businesses With Websites:** ${withSites.length}  
**Businesses Without Websites:** ${noSites.length} ← instant leads!  
**Average Website Score:** ${avgScore}/100  

> **How to read this:** Businesses are ranked **worst first** — these are your hottest leads.
> A score under 50 means their website is hurting them. You can help.

---
`;

  ranked.forEach((r, i) => {
    const rank = i + 1;
    if (r.noSite) {
      md += `
## #${rank} — ${r.name}
**🔥 HOT LEAD — No Website** (No website found)
- 📍 Tombstone, AZ
- 📞 ${r.phone}
> **This is a PERFECT lead** — they have zero web presence at all! Facebook doesn't count as a website.

---
`;
    } else {
      const { label, grade: g } = grade(r.score);
      const issues = Object.entries(r.checks)
        .filter(([, c]) => !c.pass)
        .map(([key]) => {
          const labels = {
            ssl: 'SSL (HTTPS)', mobile: 'Mobile Responsive', title: 'Page Title',
            metaDesc: 'Meta Description', h1: 'H1 Heading', alt: 'Image Alt Tags',
            contact: 'Contact Info', social: 'Social Media Links',
            copyright: 'Copyright Up-to-Date', load: 'Page Load Speed', cta: 'Clear CTA (Button/Form)'
          };
          return labels[key];
        });

      md += `
## #${rank} — ${r.name}
**${label}** | Grade: ${g} | Score: **${r.score}/100**

- 🌐 ${r.url}
- 📍 Tombstone, AZ
- 📞 ${r.phone}

### Audit Results
| Check | Pass? | Score | Detail |
|-------|-------|-------|--------|
${formatCheck('🔒', 'SSL (HTTPS)', r.checks.ssl)}
${formatCheck('📱', 'Mobile Responsive', r.checks.mobile)}
${formatCheck('📋', 'Page Title', r.checks.title)}
${formatCheck('📝', 'Meta Description', r.checks.metaDesc)}
${formatCheck('🔤', 'H1 Heading', r.checks.h1)}
${formatCheck('🖼️', 'Image Alt Tags', r.checks.alt)}
${formatCheck('📞', 'Contact Info', r.checks.contact)}
${formatCheck('📣', 'Social Media Links', r.checks.social)}
${formatCheck('©️', 'Copyright Up-to-Date', r.checks.copyright)}
${formatCheck('⚡', 'Page Load Speed', r.checks.load)}
${formatCheck('🎯', 'Clear CTA (Button/Form)', r.checks.cta)}

### Issues to Fix (Your Sales Pitch)
${issues.length === 0 ? '- ✅ No major issues found!' : issues.map(i => `- ❌ ${i}`).join('\n')}

---
`;
    }
  });

  // Summary section
  const issueCount = {};
  withSites.forEach(r => {
    Object.entries(r.checks).forEach(([key, c]) => {
      if (!c.pass) {
        const labels = {
          ssl: 'SSL (HTTPS)', mobile: 'Mobile Responsive', title: 'Page Title',
          metaDesc: 'Meta Description', h1: 'H1 Heading', alt: 'Image Alt Tags',
          contact: 'Contact Info', social: 'Social Media Links',
          copyright: 'Copyright Up-to-Date', load: 'Page Load Speed', cta: 'Clear CTA (Button/Form)'
        };
        const label = labels[key];
        issueCount[label] = (issueCount[label] || 0) + 1;
      }
    });
  });

  const sortedIssues = Object.entries(issueCount).sort((a, b) => b[1] - a[1]);

  md += `## 💡 Summary & Pitch Tips

### Businesses With No Website (${noSites.length})
These are your easiest pitches. They have zero web presence.
${noSites.map(r => `- **${r.name}** (${r.phone})`).join('\n')}


### Common Issues Found
${sortedIssues.map(([label, count]) => `- **${label}** — ${count}/${withSites.length} businesses (${Math.round(count/withSites.length*100)}%)`).join('\n')}

### Script Suggestion
> "Hi, I'm Gabriel — I help local businesses in Tombstone, AZ get found online. I ran a quick audit on your website and found a few things that might be costing you customers. Mind if I share what I found?"

---
*Generated by Koa's Site Auditor — built for Gabriel's web dev business*`;

  return md;
}

async function main() {
  console.log('🔍 Starting Tombstone AZ website audits...\n');

  const results = [];

  for (const biz of BUSINESSES) {
    if (!biz.url) {
      console.log(`⏭️  ${biz.name} — No website, marking as HOT LEAD`);
      results.push({ ...biz, noSite: true });
      continue;
    }

    console.log(`🌐 Auditing: ${biz.name} (${biz.url})`);
    try {
      const result = await auditSite(biz);
      results.push(result);
      console.log(`   ✅ Score: ${result.score}/100`);
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      results.push({ ...biz, error: err.message, score: 0, noSite: false, checks: {} });
    }
  }

  const outputDir = '/Users/gabrielmaciel/.openclaw/workspace/tools/site-auditor/sample-output';
  fs.mkdirSync(outputDir, { recursive: true });

  const mdPath = path.join(outputDir, 'tombstone-report.md');
  const jsonPath = path.join(outputDir, 'tombstone-report.json');

  const markdown = buildMarkdown(results);
  fs.writeFileSync(mdPath, markdown);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ Reports saved:`);
  console.log(`   📄 ${mdPath}`);
  console.log(`   📋 ${jsonPath}`);
}

main().catch(console.error);
