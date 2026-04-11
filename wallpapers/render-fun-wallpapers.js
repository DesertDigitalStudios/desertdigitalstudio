const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');
const path = require('path');
const outDir = '/Users/gabrielmaciel/.openclaw/workspace/wallpapers';
const logo = 'file:///Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.png';
const options = [
  {
    name: 'dds-wallpaper-fun-1.png',
    html: `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(135deg,#120816,#111827 40%,#2a1803);color:white;position:relative;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 18% 18%, rgba(245,158,11,.35), transparent 22%),radial-gradient(circle at 82% 20%, rgba(251,191,36,.18), transparent 20%),radial-gradient(circle at 80% 80%, rgba(234,88,12,.20), transparent 26%),radial-gradient(circle at 25% 75%, rgba(245,158,11,.14), transparent 20%);"></div>
      <div style="position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);background-size:60px 60px;opacity:.35"></div>
      <div style="position:absolute;left:100px;top:100px;max-width:900px;">
        <div style="font-size:22px;letter-spacing:.28em;color:#f59e0b;text-transform:uppercase;font-weight:800;margin-bottom:20px;">Desert Digital Studio</div>
        <div style="font-size:112px;line-height:.9;font-weight:900;letter-spacing:-.06em;text-shadow:0 10px 60px rgba(0,0,0,.35);">Bolder sites.<br>Louder presence.</div>
        <div style="margin-top:26px;font-size:30px;color:rgba(255,255,255,.76);max-width:760px;">Southern Arizona web design with a little more heat.</div>
      </div>
      <img src="${logo}" style="position:absolute;right:120px;top:120px;width:420px;filter:drop-shadow(0 30px 80px rgba(0,0,0,.45));mix-blend-mode:screen;">
      <div style="position:absolute;left:-60px;bottom:120px;width:760px;height:10px;background:linear-gradient(90deg, rgba(245,158,11,0), rgba(245,158,11,.95), rgba(245,158,11,0));transform:rotate(-12deg);box-shadow:0 0 45px rgba(245,158,11,.55);"></div>
      <div style="position:absolute;right:-80px;bottom:180px;width:700px;height:10px;background:linear-gradient(90deg, rgba(251,191,36,0), rgba(251,191,36,.9), rgba(251,191,36,0));transform:rotate(8deg);box-shadow:0 0 45px rgba(251,191,36,.45);"></div>
      <div style="position:absolute;right:100px;bottom:70px;font-size:20px;color:rgba(255,255,255,.46);letter-spacing:.2em;text-transform:uppercase;">Benson · Sierra Vista · Tucson · Tombstone</div>
    </body></html>`
  },
  {
    name: 'dds-wallpaper-fun-2.png',
    html: `<!doctype html><html><body style="margin:0;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:linear-gradient(180deg,#090909,#161616 35%,#2b1603 100%);color:white;position:relative;">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 15%, rgba(245,158,11,.18), transparent 25%),radial-gradient(circle at 50% 100%, rgba(234,88,12,.28), transparent 30%);"></div>
      <div style="position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);text-align:center;max-width:1200px;">
        <img src="${logo}" style="width:220px;filter:drop-shadow(0 25px 70px rgba(0,0,0,.55));margin-bottom:30px;">
        <div style="font-size:96px;line-height:.92;font-weight:900;letter-spacing:-.06em;">Desert Digital Studio</div>
        <div style="margin-top:22px;font-size:34px;color:#fbbf24;font-weight:700;letter-spacing:.08em;">Web design that doesn’t whisper.</div>
        <div style="margin-top:18px;font-size:24px;color:rgba(255,255,255,.66);">Built for small businesses that want to stand out online.</div>
      </div>
      <div style="position:absolute;left:120px;top:140px;width:160px;height:160px;border:2px solid rgba(245,158,11,.35);border-radius:32px;transform:rotate(12deg);"></div>
      <div style="position:absolute;right:130px;bottom:120px;width:220px;height:220px;border:2px solid rgba(251,191,36,.28);border-radius:50%;"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:180px;background:linear-gradient(180deg, transparent, rgba(0,0,0,.38));"></div>
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
