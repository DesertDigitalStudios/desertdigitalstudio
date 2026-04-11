const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const path = require('path');
const logo = 'file:///Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png';
(async()=>{
  const html = `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#040404,#090909 60%,#120c06);color:white;position:relative;">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 74% 26%, rgba(245,158,11,.06), transparent 16%), radial-gradient(circle at 22% 78%, rgba(245,158,11,.04), transparent 18%);"></div>
    <div style="position:absolute;inset:58px;border:1px solid rgba(255,255,255,.055);border-radius:30px;"></div>
    <div style="position:absolute;left:150px;top:150px;display:flex;align-items:center;gap:20px;">
      <img src="${logo}" style="width:78px;opacity:.98;filter:brightness(1.02) drop-shadow(0 12px 30px rgba(0,0,0,.28));">
      <div>
        <div style="font-size:18px;letter-spacing:.24em;text-transform:uppercase;color:#f59e0b;font-weight:750;">Desert Digital Studio</div>
        <div style="margin-top:8px;font-size:17px;color:rgba(255,255,255,.42);">Southern Arizona web design</div>
      </div>
    </div>
    <div style="position:absolute;left:150px;bottom:150px;max-width:820px;">
      <div style="font-size:84px;line-height:.94;font-weight:820;letter-spacing:-.055em;">Quietly premium.</div>
      <div style="margin-top:20px;font-size:24px;color:rgba(255,255,255,.58);">Built for small businesses that want to look sharper online.</div>
    </div>
    <div style="position:absolute;right:150px;top:150px;width:280px;height:280px;border-radius:50%;border:1px solid rgba(245,158,11,.10);"></div>
    <div style="position:absolute;right:150px;bottom:150px;font-size:15px;color:rgba(255,255,255,.24);letter-spacing:.20em;text-transform:uppercase;">desertdigitalstudio.com</div>
  </body></html>`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: 'load' });
  const out = '/Users/gabrielmaciel/Desktop/Desert Digital Studio Wallpapers/Desert-Digital-Studio-Wallpaper.png';
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(out);
})();
