const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const logo = 'file:///Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png';
(async()=>{
  const html = `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;position:relative;background:linear-gradient(180deg,#f6d59a 0%, #eeb96b 20%, #d9874a 42%, #7b4a2b 72%, #2b1d18 100%);">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 70% 18%, rgba(255,248,220,.45), transparent 22%), radial-gradient(circle at 30% 12%, rgba(255,255,255,.12), transparent 18%);"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:48%;background:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1920 520\"><path fill=\"%2330201a\" d=\"M0 360 L120 330 L230 348 L360 300 L500 338 L620 270 L790 330 L920 250 L1040 315 L1160 245 L1280 302 L1420 230 L1570 300 L1700 245 L1810 275 L1920 235 L1920 520 L0 520 Z\"/><path fill=\"%23412a20\" opacity=\".85\" d=\"M0 395 L170 360 L300 390 L470 340 L620 380 L780 330 L930 370 L1110 320 L1280 360 L1440 315 L1600 355 L1760 325 L1920 300 L1920 520 L0 520 Z\"/></svg>') center bottom / cover no-repeat;"></div>
    <div style="position:absolute;left:120px;top:120px;display:flex;align-items:center;gap:24px;">
      <img src="${logo}" style="width:92px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.18));opacity:.95;">
      <div>
        <div style="font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:rgba(57,34,18,.75);font-weight:700;">Southern Arizona Web Design</div>
        <div style="margin-top:10px;font-size:92px;line-height:.92;font-weight:850;letter-spacing:-.055em;color:#1b120d;text-shadow:0 3px 14px rgba(255,255,255,.08);">Desert Digital Studio</div>
      </div>
    </div>
    <div style="position:absolute;left:120px;bottom:170px;max-width:760px;">
      <div style="font-size:28px;color:rgba(24,14,10,.68);line-height:1.35;">Premium web design rooted in Southern Arizona.</div>
    </div>
    <div style="position:absolute;right:140px;top:120px;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle, rgba(255,244,210,.32), rgba(255,244,210,0) 72%);"></div>
    <div style="position:absolute;inset:58px;border:1px solid rgba(80,48,28,.14);border-radius:28px;"></div>
  </body></html>`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: 'load' });
  const out = '/Users/gabrielmaciel/Desktop/Desert Digital Studio Wallpapers/Desert-Digital-Studio-Wallpaper.png';
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(out);
})();
