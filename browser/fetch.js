#!/usr/bin/env node
/**
 * browser/fetch.js — Playwright headless browser tool for Koa
 *
 * Usage:
 *   node fetch.js <url> [--screenshot] [--selector <css>] [--text]
 *
 * Options:
 *   --screenshot         Save a screenshot to /tmp/browser-shot.png
 *   --selector <css>     Extract text from a specific CSS selector
 *   --text               Return plain text only (strips HTML tags)
 *   --timeout <ms>       Navigation timeout (default: 15000)
 *
 * Output: JSON to stdout
 */

const { chromium } = require('playwright');
const path = require('path');

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const screenshot = args.includes('--screenshot');
const textOnly = args.includes('--text');
const selectorIdx = args.indexOf('--selector');
const selector = selectorIdx !== -1 ? args[selectorIdx + 1] : null;
const timeoutIdx = args.indexOf('--timeout');
const timeout = timeoutIdx !== -1 ? parseInt(args[timeoutIdx + 1]) : 15000;

if (!url) {
  console.error(JSON.stringify({ error: 'No URL provided. Usage: node fetch.js <url>' }));
  process.exit(1);
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    const title = await page.title();
    let content;

    if (selector) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        content = await page.locator(selector).innerText();
      } catch {
        content = `Selector "${selector}" not found`;
      }
    } else if (textOnly) {
      content = await page.evaluate(() => document.body.innerText);
    } else {
      content = await page.content();
    }

    let screenshotPath = null;
    if (screenshot) {
      screenshotPath = '/tmp/browser-shot.png';
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }

    console.log(JSON.stringify({
      url,
      title,
      content: content.slice(0, 50000), // cap at 50k chars
      screenshotPath,
      contentLength: content.length
    }, null, 2));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message, url }));
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
