const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const path = require('path');
const outDir = '/Users/gabrielmaciel/.openclaw/workspace/wallpapers';
const logo = 'file:///Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png';
(async()=>{
  const html = `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#050505,#0b0b0b 58%,#140f08);color:white;position:relative;">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 72% 28%, rgba(245,158,11,.08), transparent 18%), radial-gradient(circle at 28% 76%, rgba(245,158,11,.05), transparent 20%);"></div>
    <div style="position:absolute;inset:64px;border:1px solid rgba(255,255,255,.06);border-radius:28px;"></div>
    <div style="position:absolute;left:140px;top:140px;display:flex;align-items:center;gap:22px;">
      <img src="${logo}" style="width:72px;opacity:.96;filter:brightness(1.05);">
      <div>
        <div style="font-size:18px;letter-spacing:.22em;text-transform:uppercase;color:#f59e0b;font-weight:700;">Desert Digital Studio</div>
        <div style="margin-top:8px;font-size:18px;color:rgba(255,255,255,.46);">Southern Arizona web design</div>
      </div>
    </div>
    <div style="position:absolute;left:140px;bottom:140px;max-width:760px;">
      <div style="font-size:78px;line-height:.96;font-weight:800;letter-spacing:-.05em;">Quietly premium.</div>
      <div style="margin-top:22px;font-size:26px;color:rgba(255,255,255,.60);">Built for small businesses that want to look sharper online.</div>
    </div>
    <div style="position:absolute;right:140px;bottom:140px;font-size:16px;color:rgba(255,255,255,.28);letter-spacing:.18em;text-transform:uppercase;">desertdigitalstudio.com</div>
    <div style="position:absolute;right:140px;top:140px;width:260px;height:260px;border-radius:50%;border:1px solid rgba(245,158,11,.12);"></div>
  </body></html>`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.setContent(html, { waitUntil: 'load' });
  const out = path.join(outDir, 'dds-wallpaper-minimal-premium.png');
  await page.screenshot({ path: out, type: 'png' });
  await browser.close();
  console.log(out);
})();
