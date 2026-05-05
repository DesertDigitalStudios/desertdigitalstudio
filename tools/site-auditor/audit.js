#!/usr/bin/env node
/**
 * audit.js - Local Business Website Auditor
 * Usage: node audit.js --city "Benson, AZ" --category "restaurants" --limit 5
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { URL } = require('url');

// Use the shared Playwright install from workspace/browser/
// __dirname = .../workspace/tools/site-auditor — go up two levels to workspace
const playwrightPath = path.resolve(__dirname, '../../browser/node_modules/playwright');
const { chromium } = require(playwrightPath);

const { scoreWebsite } = require('./scorer');
const { generateMarkdownReport, generateJSONReport } = require('./reporter');
const { buildLeadProfile } = require('./lead-intelligence');

// --- CLI Args ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    city: null,
    category: null,
    limit: 5,
    output: '.',
    timeout: 15000,
    verbose: false,
    input: null   // optional JSON file with pre-known businesses
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--city': opts.city = args[++i]; break;
      case '--category': opts.category = args[++i]; break;
      case '--limit': opts.limit = parseInt(args[++i]) || 5; break;
      case '--output': opts.output = args[++i]; break;
      case '--timeout': opts.timeout = parseInt(args[++i]) || 15000; break;
      case '--verbose': opts.verbose = true; break;
      case '--input': opts.input = args[++i]; break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  if (!opts.city || !opts.category) {
    console.error('❌ Error: --city and --category are required\n');
    printHelp();
    process.exit(1);
  }

  return opts;
}

function printHelp() {
  console.log(`
🔍 Local Business Website Auditor

Usage:
  node audit.js --city "Benson, AZ" --category "restaurants" --limit 5

Options:
  --city        City to search (e.g. "Benson, AZ")          [required]
  --category    Business type (e.g. "restaurants")           [required]
  --limit       Max businesses to audit (default: 5)
  --output      Output directory for reports (default: .)
  --timeout     Page load timeout in ms (default: 15000)
  --verbose     Show detailed progress

Output:
  report.md     Ranked markdown report (worst websites first = hottest leads)
  report.json   Machine-readable JSON data
`);
}

function log(msg, verbose, opts) {
  if (!verbose || opts?.verbose) {
    console.log(msg);
  }
}

// --- Business Discovery ---
async function findBusinesses(browser, city, category, limit, verbose) {
  const query = `${category} in ${city}`;
  console.log(`\n🔍 Searching for: "${query}"`);
  
  const businesses = [];
  
  // Try multiple search sources
  const sources = [
    {
      name: 'DuckDuckGo',
      url: `https://duckduckgo.com/?q=${encodeURIComponent(query + ' restaurant phone')}&ia=web`,
      extract: async (page) => {
        const results = [];
        await page.waitForTimeout(2000);
        
        // DuckDuckGo organic results
        const links = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('article[data-testid="result"], .result').forEach(el => {
            const titleEl = el.querySelector('h2 a, .result__title a, a[data-testid="result-title-a"]');
            const href = titleEl?.href;
            const name = titleEl?.textContent?.trim();
            if (name && href && !href.includes('duckduckgo') && !href.includes('yelp.com/search')) {
              items.push({ name, website: href, source: 'ddg' });
            }
          });
          return items;
        });
        results.push(...links);
        return results;
      }
    },
    {
      name: 'Yelp',
      url: `https://www.yelp.com/search?find_desc=${encodeURIComponent(category)}&find_loc=${encodeURIComponent(city)}`,
      extract: async (page) => {
        const results = [];
        await page.waitForTimeout(3000);
        
        const businesses = await page.evaluate(() => {
          const items = [];
          // Try multiple Yelp selectors for their ever-changing UI
          const selectors = [
            '[class*="businessName"] a',
            'h3 a[href*="/biz/"]',
            'a[href*="/biz/"] .css-1m051bw',
            '[class*="container"] h3 a',
            '.lemon--a__373c0__IEZFH',
            'a[name]'
          ];
          
          const seen = new Set();
          for (const sel of selectors) {
            document.querySelectorAll(sel).forEach(el => {
              const name = el.textContent?.trim();
              const href = el.href;
              if (name && name.length > 2 && name.length < 80 && href?.includes('/biz/') && !seen.has(name)) {
                seen.add(name);
                items.push({ name, yelpUrl: href, source: 'yelp' });
              }
            });
          }
          return items;
        });
        results.push(...businesses);
        return results;
      }
    },
    {
      name: 'Google',
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`,
      extract: async (page) => {
        const results = [];
        await page.waitForTimeout(2000);
        
        const title = await page.title();
        if (title.toLowerCase().includes('captcha')) {
          console.log('  ⚠️  Google captcha detected, skipping');
          return results;
        }
        
        const extracted = await page.evaluate(() => {
          const items = [];
          const seen = new Set();
          
          // Local pack business names
          document.querySelectorAll('[data-cid], .dbg0pd, .OSrXXb, .qrShPb').forEach(el => {
            const name = el.textContent?.trim();
            if (name && name.length > 2 && name.length < 80 && !seen.has(name)) {
              seen.add(name);
              items.push({ name, source: 'google-local' });
            }
          });
          
          // Organic result titles that look like business names
          document.querySelectorAll('h3').forEach(h3 => {
            const text = h3.textContent?.trim();
            const a = h3.closest('a') || h3.querySelector('a');
            const href = a?.href;
            if (text && text.length > 3 && text.length < 60 && href &&
                !href.includes('google.com') && !href.includes('yelp.com/search') &&
                !href.includes('tripadvisor') && !href.includes('yellowpages') &&
                !seen.has(text)) {
              seen.add(text);
              items.push({ name: text, website: href, source: 'google-organic' });
            }
          });
          
          return items;
        });
        results.push(...extracted);
        return results;
      }
    }
  ];
  
  for (const source of sources) {
    if (businesses.length >= limit * 2) break;
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US'
    });
    const page = await context.newPage();
    
    try {
      if (verbose) console.log(`  → Trying ${source.name}: ${source.url}`);
      else console.log(`  → Trying ${source.name}...`);
      
      await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const results = await source.extract(page);
      
      if (results.length > 0) {
        console.log(`     Found ${results.length} results`);
        businesses.push(...results);
      } else {
        console.log(`     No results`);
      }
    } catch (err) {
      console.log(`     Error: ${err.message.substring(0, 80)}`);
    } finally {
      await context.close();
    }
  }
  
  // Deduplicate by name
  const seen = new Set();
  const unique = businesses.filter(b => {
    const key = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || key.length < 2) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  console.log(`  ✓ Found ${unique.length} unique businesses`);
  return unique.slice(0, limit * 2);
}

// --- Website Discovery for a Business ---
function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function candidateScore(url, businessName, city) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const businessTokens = normalizeSearchText(businessName).split(' ').filter(token => token.length >= 3);
    const cityTokens = normalizeSearchText(city).split(' ').filter(token => token.length >= 3 && token !== 'arizona');
    const haystack = `${hostname} ${pathname}`;

    let score = 0;
    for (const token of businessTokens) {
      if (haystack.includes(token)) score += 4;
    }
    for (const token of cityTokens) {
      if (haystack.includes(token)) score += 1;
    }

    if (pathname === '/' || pathname === '') score += 2;
    if (/contact|about|menu|home/.test(pathname)) score += 1;
    if (/directory|listing|search|maps|reviews|forum|guide|top-10/.test(pathname)) score -= 4;
    if (/instagram|facebook|yelp|tripadvisor|yellowpages|mapquest|bbb|foursquare|angi|houzz/.test(hostname)) score -= 8;

    return score;
  } catch {
    return -999;
  }
}

async function findBusinessWebsite(browser, businessName, city, timeout, verbose) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const searchStrategies = [
    {
      name: 'Bing',
      url: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
      extract: () => page.evaluate(() => {
        const skipDomains = ['bing.com', 'yelp.com', 'facebook.com/pages', 'yellowpages.com', 'whitepages.com', 'mapquest.com', 'tripadvisor.com', 'bbb.org', 'foursquare.com', 'angieslist.com', 'houzz.com'];
        return Array.from(document.querySelectorAll('li.b_algo h2 a, h2 a'))
          .map(link => link.href)
          .filter(href => href && (href.startsWith('http://') || href.startsWith('https://')))
          .filter(href => !skipDomains.some(domain => href.includes(domain)));
      })
    },
    {
      name: 'DuckDuckGo',
      url: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      extract: async () => {
        const bodyText = await page.evaluate(() => document.body?.innerText || '');
        if (/bots use duckduckgo too|select all squares containing a duck/i.test(bodyText)) {
          return [];
        }
        return page.evaluate(() => {
          const skipDomains = ['duckduckgo.com', 'yelp.com', 'facebook.com/pages', 'yellowpages.com', 'whitepages.com', 'mapquest.com', 'tripadvisor.com', 'bbb.org', 'foursquare.com', 'angieslist.com', 'houzz.com'];
          return Array.from(document.querySelectorAll('.result__a, a[data-testid="result-title-a"], article[data-testid="result"] h2 a'))
            .map(link => link.href)
            .filter(href => href && (href.startsWith('http://') || href.startsWith('https://')))
            .filter(href => !skipDomains.some(domain => href.includes(domain)));
        });
      }
    }
  ];

  try {
    const queries = [
      `${businessName} ${city} official website`,
      `${businessName} ${city}`,
      `${businessName} official site`,
      `${businessName}`
    ];

    for (const query of queries) {
      for (const strategy of searchStrategies) {
        try {
          await page.goto(strategy.url(query), {
            waitUntil: 'domcontentloaded',
            timeout: Math.min(timeout, 15000)
          });
          await page.waitForTimeout(1500);
          const results = await strategy.extract();
          if (results?.length) {
            const ranked = [...new Set(results)]
              .map(url => ({ url, score: candidateScore(url, businessName, city) }))
              .sort((a, b) => b.score - a.score);
            if (verbose && ranked[0]) console.log(`    ${strategy.name} best candidate for ${businessName}: ${ranked[0].url} (score ${ranked[0].score})`);
            if (ranked[0]?.score > 0) return ranked[0].url;
          }
          if (verbose) console.log(`    ${strategy.name} search returned no usable website for ${businessName} on query: ${query}`);
        } catch (err) {
          if (verbose) console.log(`    ${strategy.name} search failed: ${err.message}`);
        }
      }
    }

    return null;
  } catch (err) {
    if (verbose) console.log(`    Website search failed: ${err.message}`);
    return null;
  } finally {
    await context.close();
  }
}

function absolutizeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function uniqueUrls(urls = []) {
  const normalized = urls
    .filter(Boolean)
    .map(url => {
      try {
        const parsed = new URL(url);
        parsed.hash = '';
        return parsed.toString();
      } catch {
        return url;
      }
    });
  return [...new Set(normalized)];
}

async function discoverContactPaths(page, baseUrl) {
  return page.evaluate((base) => {
    const CONTACT_KEYWORDS = [
      'contact', 'about', 'location', 'locations', 'hours', 'menu',
      'book', 'booking', 'appointment', 'appointments', 'connect',
      'team', 'staff', 'visit', 'find-us', 'get-in-touch'
    ];
    const SOCIAL_PATTERNS = {
      instagram: ['instagram.com'],
      facebook: ['facebook.com', 'fb.com'],
      tiktok: ['tiktok.com'],
      linkedin: ['linkedin.com']
    };

    const toAbsolute = (href) => {
      try {
        return new URL(href, base).toString();
      } catch {
        return null;
      }
    };

    const baseOrigin = (() => {
      try {
        return new URL(base).origin;
      } catch {
        return null;
      }
    })();

    const mailtoEmails = new Set();
    const contactLinks = [];
    const socialLinks = {};
    const seen = new Set();

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      const text = (anchor.textContent || '').trim().toLowerCase();
      const rel = `${text} ${href.toLowerCase()}`;

      if (href.startsWith('mailto:')) {
        const email = href.replace(/^mailto:/i, '').split('?')[0].trim().toLowerCase();
        if (email) mailtoEmails.add(email);
        return;
      }

      const abs = toAbsolute(href);
      if (!abs) return;

      for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
        if (!socialLinks[platform] && patterns.some(pattern => abs.includes(pattern))) {
          socialLinks[platform] = abs;
        }
      }

      let sameOrigin = false;
      try {
        sameOrigin = !!baseOrigin && new URL(abs).origin === baseOrigin;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) return;

      if (!CONTACT_KEYWORDS.some(keyword => rel.includes(keyword))) return;
      if (seen.has(abs)) return;
      seen.add(abs);
      contactLinks.push(abs);
    });

    return {
      mailtoEmails: Array.from(mailtoEmails),
      contactLinks: contactLinks.slice(0, 5),
      socialLinks
    };
  }, baseUrl);
}

async function fetchExtraContactPages(context, urls, timeout, verbose) {
  const pages = [];
  const pageTimeout = Math.min(Math.max(timeout, 8000), 12000);

  for (const url of uniqueUrls(urls).slice(0, 3)) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: pageTimeout });
      await page.waitForTimeout(800);
      const html = await page.content();
      const textContent = await page.evaluate(() => document.body?.innerText || '');
      const discovery = await discoverContactPaths(page, page.url());
      pages.push({
        url,
        html,
        textContent,
        mailtoEmails: discovery.mailtoEmails || [],
        socialLinks: discovery.socialLinks || {}
      });
      if (verbose) console.log(`    Contact page scanned: ${url}`);
    } catch (err) {
      if (verbose) console.log(`    Contact page failed: ${url} (${err.message.substring(0, 80)})`);
    } finally {
      await page.close();
    }
  }

  return pages;
}

// --- Site Audit ---
async function auditWebsite(browser, url, timeout, verbose) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  const startTime = Date.now();
  let html = null;
  let textContent = null;
  let finalUrl = url;
  let loadTimeMs = null;
  let error = null;
  let contactPages = [];
  let socialLinks = {};
  let mailtoEmails = [];
  
  try {
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout
    });
    
    loadTimeMs = Date.now() - startTime;
    finalUrl = page.url();
    
    if (response && response.status() >= 400) {
      error = `HTTP ${response.status()}`;
    } else {
      // Wait a bit for dynamic content
      await page.waitForTimeout(1000);
      html = await page.content();
      textContent = await page.evaluate(() => document.body?.innerText || '');

      const discovery = await discoverContactPaths(page, finalUrl);
      socialLinks = discovery.socialLinks || {};
      mailtoEmails = discovery.mailtoEmails || [];
      const extraPages = await fetchExtraContactPages(context, discovery.contactLinks || [], timeout, verbose);
      contactPages = extraPages.map(p => p.url);

      if (extraPages.length > 0) {
        html = [html, ...extraPages.map(p => p.html)].join('\n\n<!-- extra contact page -->\n\n');
        textContent = [textContent, ...extraPages.map(p => p.textContent)].join('\n\n');
        mailtoEmails = [...mailtoEmails, ...extraPages.flatMap(p => p.mailtoEmails || [])];
        socialLinks = Object.assign({}, ...extraPages.map(p => p.socialLinks || {}), socialLinks);
      }
    }
    
  } catch (err) {
    loadTimeMs = Date.now() - startTime;
    if (err.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      error = 'Domain not found';
    } else if (err.message.includes('net::ERR_CONNECTION_REFUSED')) {
      error = 'Connection refused';
    } else if (err.message.includes('net::ERR_SSL')) {
      error = 'SSL/TLS error';
    } else if (err.message.includes('timeout')) {
      error = 'Page timed out';
    } else {
      error = err.message.substring(0, 100);
    }
  } finally {
    await context.close();
  }
  
  return { url: finalUrl, html, textContent, loadTimeMs, error, contactPages, socialLinks, mailtoEmails };
}

// --- Main ---
async function main() {
  const opts = parseArgs();
  
  console.log(`
╔═══════════════════════════════════════════╗
║   🔍 Local Business Website Auditor       ║
║   Built by Koa for Gabriel's web biz      ║
╚═══════════════════════════════════════════╝`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  try {
    // Step 1: Find businesses (or load from file)
    let rawBusinesses;
    
    if (opts.input) {
      console.log(`\n📂 Loading businesses from: ${opts.input}`);
      const inputData = JSON.parse(fs.readFileSync(opts.input, 'utf8'));
      rawBusinesses = Array.isArray(inputData) ? inputData : inputData.businesses || [];
      console.log(`  ✓ Loaded ${rawBusinesses.length} businesses`);
    } else {
      rawBusinesses = await findBusinesses(browser, opts.city, opts.category, opts.limit, opts.verbose);
    }
    
    if (rawBusinesses.length === 0) {
      console.error('\n❌ No businesses found. Try a different city or category, or use --input to provide a list.');
      await browser.close();
      process.exit(1);
    }
    
    // Step 2: Audit each business website
    const auditedBusinesses = [];
    let count = 0;
    
    for (const biz of rawBusinesses) {
      if (count >= opts.limit) break;
      count++;
      
      console.log(`\n[${count}/${opts.limit}] Auditing: ${biz.name}`);
      
      let website = biz.website;
      let loadTimeMs = null;
      
      // If no website from search, try to find it
      if (!website && biz.source !== 'organic') {
        process.stdout.write('  → Looking up website... ');
        website = await findBusinessWebsite(browser, biz.name, opts.city, opts.timeout, opts.verbose);
        if (website) {
          console.log(`found: ${website}`);
        } else {
          console.log('none found');
        }
      }
      
      let result;
      let pageData = null;
      const websiteLookupFailed = !website;
      if (website) {
        // Normalize URL
        if (!website.startsWith('http')) {
          website = 'https://' + website;
        }
        
        process.stdout.write(`  → Auditing ${website}... `);
        pageData = await auditWebsite(browser, website, opts.timeout, opts.verbose);
        loadTimeMs = pageData.loadTimeMs;
        
        if (pageData.error) {
          console.log(`⚠️  ${pageData.error}`);
        } else {
          console.log(`✓ (${(pageData.loadTimeMs/1000).toFixed(1)}s)`);
        }
        
        result = scoreWebsite(pageData);
        website = pageData.url; // use final URL after redirects
      } else {
        const unresolvedMessage = biz.yelpUrl || biz.phone ? 'Website not resolved automatically' : 'No website found';
        result = scoreWebsite({ url: null, html: null, error: unresolvedMessage });
      }
      
      const leadProfile = buildLeadProfile({
        business: {
          name: biz.name,
          city: opts.city,
          website,
          phone: biz.phone || null,
          score: result.percentage,
          error: result.error || null,
          yelpUrl: biz.yelpUrl || null,
          websiteLookupFailed
        },
        result,
        pageData
      });

      auditedBusinesses.push({
        rank: count,
        name: biz.name,
        website: website || null,
        phone: leadProfile.primaryPhone || biz.phone || null,
        city: opts.city,
        loadTimeMs,
        result,
        leadProfile
      });
    }
    
    // Step 3: Sort worst-first (hottest leads first)
    auditedBusinesses.sort((a, b) => {
      // No website = hottest lead (score 0)
      return a.result.percentage - b.result.percentage;
    });
    
    // Re-rank after sort
    auditedBusinesses.forEach((b, i) => b.rank = i + 1);
    
    // Step 4: Generate reports
    const meta = {
      city: opts.city,
      category: opts.category,
      auditDate: new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }),
      totalFound: rawBusinesses.length
    };
    
    const markdown = generateMarkdownReport(auditedBusinesses, meta);
    const jsonData = generateJSONReport(auditedBusinesses, meta);
    
    // Step 5: Save reports
    const outputDir = path.resolve(opts.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const mdPath = path.join(outputDir, 'report.md');
    const jsonPath = path.join(outputDir, 'report.json');
    
    fs.writeFileSync(mdPath, markdown, 'utf8');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
    
    // Step 6: Print summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 AUDIT COMPLETE — Ranked by Worst Website First');
    console.log('═'.repeat(50));
    
    auditedBusinesses.forEach((b, i) => {
      const needsVerification = /website not resolved automatically/i.test(b.result?.error || '') || (!!b.website && !!b.result?.error);
      const score = b.website && !b.result.error ? `${b.result.percentage}%` : (needsVerification ? 'VERIFY' : 'NO SITE');
      const grade = b.result.grade || '?';
      const heat = needsVerification ? '🤔' : (b.result.percentage < 30 || !b.website ? '🔥' : 
                   b.result.percentage < 50 ? '⚠️ ' : '  ');
      console.log(`${heat} #${i+1} ${b.name.padEnd(35)} ${score.padStart(6)}  Grade: ${grade}`);
    });
    
    console.log('\n' + '═'.repeat(50));
    console.log(`✅ Reports saved:`);
    console.log(`   📄 ${mdPath}`);
    console.log(`   📋 ${jsonPath}`);
    console.log('═'.repeat(50) + '\n');
    
    // Also print the markdown to stdout
    console.log(markdown);
    
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
