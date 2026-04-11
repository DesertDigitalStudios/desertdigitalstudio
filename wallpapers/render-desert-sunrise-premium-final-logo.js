const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const logo = 'file:///Users/gabrielmaciel/.openclaw/media/inbound/76e9c925-c871-4be7-8690-56fb61dc3edb.png';
(async()=>{
  const html = `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;position:relative;background:linear-gradient(180deg,#f8d9a7 0%, #efbe73 18%, #dc8c50 40%, #7a4a2c 70%, #241813 100%);">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 70% 16%, rgba(255,245,214,.55), transparent 24%), radial-gradient(circle at 28% 12%, rgba(255,255,255,.10), transparent 18%);"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:50%;background:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1920 540\"><path fill=\"%23291b16\" d=\"M0 370 L120 332 L230 352 L360 302 L500 340 L620 274 L790 332 L920 252 L1040 318 L1160 248 L1280 304 L1420 232 L1570 304 L1700 246 L1810 278 L1920 240 L1920 540 L0 540 Z\"/><path fill=\"%2339251d\" opacity=\".88\" d=\"M0 410 L180 372 L320 404 L470 348 L640 392 L812 338 L980 382 L1140 328 L1300 370 L1470 322 L1640 360 L1800 332 L1920 308 L1920 540 L0 540 Z\"/></svg>') center bottom / cover no-repeat;"></div>
    <div style="position:absolute;left:118px;top:118px;display:flex;align-items:center;gap:28px;">
      <img src="${logo}" style="width:116px;height:116px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.18);">
      <div>
        <div style="font-size:22px;letter-spacing:.20em;text-transform:uppercase;color:rgba(56,34,17,.76);font-weight:700;">Southern Arizona Web Design</div>
        <div style="margin-top:10px;font-size:94px;line-height:.92;font-weight:860;letter-spacing:-.055em;color:#19110d;">Desert Digital Studio</div>
      </div>
    </div>
    <div style="position:absolute;left:118px;bottom:174px;max-width:820px;">
      <div style="font-size:28px;color:rgba(24,14,10,.68);line-height:1.35;">Premium web design rooted in Southern Arizona.</div>
    </div>
    <div style="position:absolute;right:140px;top:120px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, rgba(255,244,210,.34), rgba(255,244,210,0) 72%);"></div>
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
