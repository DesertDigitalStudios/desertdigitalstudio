const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const filePath = path.resolve(__dirname, 'index.html');
  await page.goto(`file://${filePath}`);
  // Wait for fonts and weather fetch attempt
  await page.waitForTimeout(2500);
  await page.screenshot({
    path: '/tmp/dashboard-screenshot.png',
    fullPage: true,
  });
  console.log('Screenshot saved to /tmp/dashboard-screenshot.png');
  await browser.close();
})();
