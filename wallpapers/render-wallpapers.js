const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/wallpapers';
const logo = 'file:///Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png';

const options = [
  {
    name: 'dds-wallpaper-option-1.png',
    html: `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:radial-gradient(circle at 20% 20%, rgba(245,158,11,.18), transparent 28%),radial-gradient(circle at 80% 80%, rgba(245,158,11,.10), transparent 28%),linear-gradient(135deg,#070b11,#0f172a 45%,#111827);color:white;position:relative;">
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);background-size:80px 80px;mask-image:linear-gradient(to bottom, rgba(0,0,0,.7), rgba(0,0,0,.15));"></div>
      <div style="position:absolute;left:120px;top:140px;max-width:760px;">
        <div style="font-size:20px;letter-spacing:.35em;color:#f59e0b;text-transform:uppercase;font-weight:700;margin-bottom:28px;">Desert Digital Studio</div>
        <div style="font-size:96px;line-height:.95;font-weight:800;letter-spacing:-.05em;">Local presence.<br>Digital impact.</div>
        <div style="margin-top:28px;font-size:28px;color:rgba(255,255,255,.75);max-width:640px;line-height:1.35;">Modern web design for Southern Arizona businesses.</div>
      </div>
      <img src="${logo}" style="position:absolute;right:130px;top:170px;width:360px;opacity:.92;filter:drop-shadow(0 20px 60px rgba(0,0,0,.45));">
      <div style="position:absolute;right:-120px;bottom:-140px;width:700px;height:700px;border-radius:50%;border:1px solid rgba(245,158,11,.16);"></div>
      <div style="position:absolute;right:40px;bottom:40px;font-size:18px;color:rgba(255,255,255,.38);letter-spacing:.18em;text-transform:uppercase;">Benson · Sierra Vista · Tombstone · Tucson</div>
    </body></html>`
  },
  {
    name: 'dds-wallpaper-option-2.png',
    html: `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(180deg,#05070c,#0b1120 45%,#1b1308 100%);color:white;position:relative;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 85%, rgba(245,158,11,.35), transparent 35%);"></div>
      <div style="position:absolute;left:-5%;right:-5%;bottom:0;height:46%;background:linear-gradient(to top, #090d12 18%, transparent), url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 400\"><path fill=\"%23070b11\" d=\"M0 320 L120 260 L240 290 L360 210 L480 280 L620 200 L760 250 L920 180 L1060 240 L1200 170 L1200 400 L0 400 Z\"/></svg>') center bottom / cover no-repeat;"></div>
      <div style="position:absolute;left:110px;top:110px;">
        <img src="${logo}" style="width:120px;opacity:.95;">
      </div>
      <div style="position:absolute;left:110px;top:290px;max-width:760px;">
        <div style="font-size:74px;line-height:1;font-weight:800;letter-spacing:-.05em;">Built in the desert.<br>Made to stand out.</div>
        <div style="margin-top:22px;font-size:26px;color:rgba(255,255,255,.72);">Desert Digital Studio</div>
      </div>
      <div style="position:absolute;right:120px;top:150px;width:520px;height:300px;border-radius:24px;border:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));backdrop-filter: blur(8px);box-shadow:0 30px 80px rgba(0,0,0,.35);">
        <div style="height:54px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;padding:0 20px;gap:10px;"><span style="width:10px;height:10px;border-radius:50%;background:#f87171"></span><span style="width:10px;height:10px;border-radius:50%;background:#fbbf24"></span><span style="width:10px;height:10px;border-radius:50%;background:#34d399"></span></div>
        <div style="padding:26px;display:grid;gap:18px;">
          <div style="height:18px;width:68%;background:linear-gradient(90deg, rgba(245,158,11,.7), rgba(245,158,11,.15));border-radius:999px;"></div>
          <div style="height:12px;width:92%;background:rgba(255,255,255,.12);border-radius:999px;"></div>
          <div style="height:12px;width:84%;background:rgba(255,255,255,.09);border-radius:999px;"></div>
          <div style="display:flex;gap:14px;margin-top:8px;"><div style="height:120px;flex:1;background:rgba(255,255,255,.08);border-radius:18px;"></div><div style="height:120px;flex:1;background:rgba(255,255,255,.05);border-radius:18px;"></div></div>
        </div>
      </div>
    </body></html>`
  },
  {
    name: 'dds-wallpaper-option-3.png',
    html: `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#090909,#111111 55%,#1a1207);color:white;position:relative;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 75% 25%, rgba(245,158,11,.12), transparent 24%),radial-gradient(circle at 25% 70%, rgba(245,158,11,.08), transparent 22%);"></div>
      <div style="position:absolute;inset:70px;border:1px solid rgba(255,255,255,.08);border-radius:32px;"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;text-align:center;">
        <img src="${logo}" style="width:180px;opacity:.98;filter:drop-shadow(0 20px 60px rgba(0,0,0,.45));">
        <div style="margin-top:30px;font-size:54px;font-weight:800;letter-spacing:-.04em;">Desert Digital Studio</div>
        <div style="margin-top:14px;font-size:22px;color:rgba(255,255,255,.62);letter-spacing:.18em;text-transform:uppercase;">Southern Arizona Web Design</div>
      </div>
      <div style="position:absolute;left:100px;bottom:90px;font-size:18px;color:rgba(255,255,255,.35);">desertdigitalstudio.com</div>
      <div style="position:absolute;right:100px;bottom:90px;font-size:18px;color:rgba(255,255,255,.35);">Benson, Arizona</div>
    </body></html>`
  }
];

(async()=>{
  const browser = await chromium.launch({headless:true});
  for (const opt of options){
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.setContent(opt.html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, opt.name), type: 'png' });
    await page.close();
    console.log(opt.name);
  }
  await browser.close();
})();
