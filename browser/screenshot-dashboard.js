const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('file:///Users/gabrielmaciel/.openclaw/workspace/dashboard/index.html', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/dashboard-screenshot.png', fullPage: false });
  await browser.close();
  console.log('Screenshot saved to /tmp/dashboard-screenshot.png');
})();
