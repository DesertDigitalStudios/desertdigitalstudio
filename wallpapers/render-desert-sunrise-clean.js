const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const fs = require('fs');
const logo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/wallpapers/logo-data-uri.txt', 'utf8');
(async()=>{
  const html = `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;position:relative;background:linear-gradient(180deg,#f9e1b8 0%, #f3c67b 22%, #df9256 46%, #8f5536 72%, #2d1c17 100%);">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 72% 18%, rgba(255,248,220,.55), transparent 22%), radial-gradient(circle at 24% 16%, rgba(255,255,255,.10), transparent 18%);"></div>

    <div style="position:absolute;left:-5%;right:-5%;bottom:0;height:44%;background:#251915;clip-path: polygon(0% 72%, 10% 64%, 20% 70%, 30% 58%, 40% 66%, 50% 52%, 60% 64%, 70% 50%, 80% 60%, 90% 48%, 100% 56%, 100% 100%, 0% 100%);"></div>
    <div style="position:absolute;left:-5%;right:-5%;bottom:0;height:34%;background:#3a261d;opacity:.92;clip-path: polygon(0% 78%, 14% 68%, 28% 74%, 42% 62%, 56% 70%, 70% 58%, 84% 66%, 100% 56%, 100% 100%, 0% 100%);"></div>
    <div style="position:absolute;left:-5%;right:-5%;bottom:0;height:24%;background:#5a3929;opacity:.72;clip-path: polygon(0% 82%, 18% 74%, 36% 80%, 54% 72%, 72% 78%, 88% 70%, 100% 74%, 100% 100%, 0% 100%);"></div>

    <div style="position:absolute;inset:58px;border:1px solid rgba(70,40,24,.12);border-radius:28px;"></div>

    <div style="position:absolute;left:130px;top:120px;display:flex;align-items:center;gap:28px;">
      <img src="${logo}" style="width:118px;height:118px;object-fit:cover;border-radius:999px;box-shadow:0 12px 32px rgba(0,0,0,.16);background:rgba(255,255,255,.15);">
      <div style="font-size:98px;line-height:.92;font-weight:860;letter-spacing:-.06em;color:#1d130e;">Desert Digital Studio</div>
    </div>
  </body></html>`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: 'load' });
  const out = '/Users/gabrielmaciel/Desktop/Desert Digital Studio Wallpapers/Desert-Digital-Studio-Wallpaper.png';
  await page.screenshot({ path: out, type: 'png' });
  await page.screenshot({ path: '/Users/gabrielmaciel/.openclaw/workspace/wallpapers/Desert-Digital-Studio-Wallpaper-preview.png', type: 'png' });
  await browser.close();
  console.log(out);
})();
