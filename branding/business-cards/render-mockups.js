const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/branding/business-cards';
const darkLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-dark.svg', 'utf8');
const lightLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-light.svg', 'utf8');

const cards = {
  dark: `<!doctype html>
<html><head><meta charset="utf-8"><style>
  :root{--bg:#0b1018;--card:#111827;--line:#2a3344;--text:#eef2f7;--muted:#9aa6b2;--amber:#f59e0b;}
  *{box-sizing:border-box} body{margin:0;background:linear-gradient(180deg,#0a0f16,#111927);font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:var(--text)}
  .canvas{width:1600px;height:1000px;padding:70px;position:relative;overflow:hidden}
  .title{font-size:42px;font-weight:800;letter-spacing:-0.04em}.sub{margin-top:12px;color:#b8c2cf;font-size:20px}
  .row{display:flex;gap:48px;margin-top:54px}
  .card{width:700px;height:400px;border-radius:28px;overflow:hidden;position:relative;background:linear-gradient(145deg,#0f1724 0%,#111827 50%,#0a1018 100%);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 60px rgba(0,0,0,.35)}
  .front::before,.back::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 82% 16%, rgba(245,158,11,.18), transparent 24%),radial-gradient(circle at 16% 82%, rgba(245,158,11,.08), transparent 26%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);background-size:36px 36px;mask-image:linear-gradient(180deg,rgba(0,0,0,.55),transparent 78%)}
  .front-inner{position:absolute;inset:0;padding:40px 48px 48px;display:flex;flex-direction:column;justify-content:flex-start;gap:28px}
  .logo{width:295px}.eyebrow{font-size:15px;letter-spacing:.22em;text-transform:uppercase;color:#cbd5e1}.tag{font-size:34px;line-height:1.08;font-weight:800;max-width:500px;letter-spacing:-.04em}
  .pill{display:inline-block;padding:11px 18px;border:1px solid rgba(245,158,11,.28);background:rgba(245,158,11,.08);border-radius:999px;color:#ffd891;font-weight:600;font-size:17px;margin-top:auto;align-self:flex-start}
  .back-inner{position:absolute;inset:0;padding:46px 48px;display:grid;grid-template-columns:1.1fr .9fr;gap:24px}
  .name{font-size:38px;font-weight:800;letter-spacing:-.04em}.role{margin-top:10px;font-size:18px;color:#ffcc7a;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.meta{margin-top:24px;display:grid;gap:16px}
  .meta-item{padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.08)} .label{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#7b8796;margin-bottom:6px}
  .value{font-size:20px;font-weight:600;color:#eef2f7}.small{font-size:18px;color:#d4dde7}.list{display:grid;gap:14px;align-content:start;padding-top:10px}
  .service{padding:16px 18px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(255,255,255,.025);font-size:19px;font-weight:600}
  .footer-note{position:absolute;left:48px;right:48px;bottom:28px;display:flex;justify-content:space-between;color:#95a3b8;font-size:14px}
</style></head><body>
<div class="canvas">
  <div class="title">Option A — Dark premium</div>
  <div class="sub">Clean, modern, and a little more “serious local SaaS.”</div>
  <div class="row">
    <div class="card front"><div class="grid"></div><div class="front-inner">
      <div>${darkLogo.replace('width="600" height="200"','')}</div>
      <div>
        <div class="eyebrow">Southern Arizona Web Design</div>
        <div class="tag">Websites that make small businesses look current, credible, and easy to contact.</div>
      </div>
      <div class="pill">desertdigitalstudio.com</div>
    </div></div>
    <div class="card back"><div class="grid"></div><div class="back-inner">
      <div>
        <div class="name">Gabriel Maciel</div>
        <div class="role">Founder · Web Designer</div>
        <div class="meta">
          <div class="meta-item"><div class="label">Email</div><div class="value">gabriel@desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Website</div><div class="value">desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Based in</div><div class="value small">Benson, Arizona · Serving Southern Arizona</div></div>
        </div>
      </div>
      <div class="list">
        <div class="service">Web Design</div>
        <div class="service">Local SEO</div>
        <div class="service">Website Maintenance</div>
      </div>
      <div class="footer-note"><span>Front / Back mockup</span><span>Desert Digital Studio</span></div>
    </div></div>
  </div>
</div>
</body></html>`,
  hybrid: `<!doctype html>
<html><head><meta charset="utf-8"><style>
  :root{--text:#111827;--muted:#667085;--amber:#f59e0b;--line:#e5e7eb;}
  *{box-sizing:border-box} body{margin:0;background:linear-gradient(180deg,#eef1f5,#dde4eb);font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:var(--text)}
  .canvas{width:1600px;height:1000px;padding:70px;position:relative;overflow:hidden}
  .title{font-size:42px;font-weight:800;letter-spacing:-0.04em}.sub{margin-top:12px;color:#4b5563;font-size:20px}
  .row{display:flex;gap:48px;margin-top:54px}
  .card{width:700px;height:400px;border-radius:28px;overflow:hidden;position:relative;background:linear-gradient(145deg,#ffffff 0%,#f9fafb 55%,#f3f4f6 100%);border:1px solid #d9e1ea;box-shadow:0 24px 60px rgba(15,23,42,.14)}
  .front::before,.back::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 82% 16%, rgba(245,158,11,.10), transparent 24%),radial-gradient(circle at 16% 82%, rgba(245,158,11,.05), transparent 26%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(15,23,42,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(15,23,42,.03) 1px, transparent 1px);background-size:36px 36px;mask-image:linear-gradient(180deg,rgba(0,0,0,.4),transparent 78%)}
  .front-inner{position:absolute;inset:0;padding:40px 48px 48px;display:flex;flex-direction:column;justify-content:flex-start;gap:28px}
  .logo{width:295px}.eyebrow{font-size:15px;letter-spacing:.22em;text-transform:uppercase;color:#8b98a8}.tag{font-size:34px;line-height:1.08;font-weight:800;max-width:500px;letter-spacing:-.04em;color:#0f172a}
  .pill{display:inline-block;padding:11px 18px;border:1px solid rgba(245,158,11,.25);background:#fff7e7;border-radius:999px;color:#9a6100;font-weight:700;font-size:17px;margin-top:auto;align-self:flex-start}
  .back-inner{position:absolute;inset:0;padding:46px 48px;display:grid;grid-template-columns:1.1fr .9fr;gap:24px}
  .name{font-size:38px;font-weight:800;letter-spacing:-.04em;color:#0f172a}.role{margin-top:10px;font-size:18px;color:#b76d00;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.meta{margin-top:24px;display:grid;gap:16px}
  .meta-item{padding-bottom:12px;border-bottom:1px solid rgba(15,23,42,.08)} .label{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8b98a8;margin-bottom:6px}
  .value{font-size:20px;font-weight:600;color:#111827}.small{font-size:18px;color:#475467}.list{display:grid;gap:14px;align-content:start;padding-top:10px}
  .service{padding:16px 18px;border:1px solid #ebe3d3;border-radius:18px;background:#fff8ec;font-size:19px;font-weight:700;color:#8a5600}
  .footer-note{position:absolute;left:48px;right:48px;bottom:28px;display:flex;justify-content:space-between;color:#98a2b3;font-size:14px}
</style></head><body>
<div class="canvas">
  <div class="title">Option C — White hybrid</div>
  <div class="sub">Dark version layout, but with a lighter print-friendly feel.</div>
  <div class="row">
    <div class="card front"><div class="grid"></div><div class="front-inner">
      <div>${lightLogo.replace('width="600" height="200"','')}</div>
      <div>
        <div class="eyebrow">Southern Arizona Web Design</div>
        <div class="tag">Websites that make small businesses look current, credible, and easy to contact.</div>
      </div>
      <div class="pill">desertdigitalstudio.com</div>
    </div></div>
    <div class="card back"><div class="grid"></div><div class="back-inner">
      <div>
        <div class="name">Gabriel Maciel</div>
        <div class="role">Founder · Web Designer</div>
        <div class="meta">
          <div class="meta-item"><div class="label">Email</div><div class="value">gabriel@desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Website</div><div class="value">desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Based in</div><div class="value small">Benson, Arizona · Serving Southern Arizona</div></div>
        </div>
      </div>
      <div class="list">
        <div class="service">Web Design</div>
        <div class="service">Local SEO</div>
        <div class="service">Website Maintenance</div>
      </div>
    </div></div>
  </div>
</div>
</body></html>`,
  light: `<!doctype html>
<html><head><meta charset="utf-8"><style>
  :root{--bg:#f3f4f6;--card:#ffffff;--text:#111827;--muted:#5b6472;--amber:#f59e0b;--line:#e5e7eb;}
  *{box-sizing:border-box} body{margin:0;background:linear-gradient(180deg,#eef1f5,#dde4eb);font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:var(--text)}
  .canvas{width:1600px;height:1000px;padding:70px;position:relative;overflow:hidden}
  .title{font-size:42px;font-weight:800;letter-spacing:-0.04em}.sub{margin-top:12px;color:#4b5563;font-size:20px}
  .row{display:flex;gap:48px;margin-top:54px}.card{width:700px;height:400px;border-radius:28px;overflow:hidden;position:relative;background:#fff;border:1px solid #dde3ea;box-shadow:0 20px 50px rgba(15,23,42,.12)}
  .front::before{content:'';position:absolute;left:0;right:0;top:0;height:7px;background:linear-gradient(90deg,#f59e0b,#f7b84b)}
  .back::before{content:'';position:absolute;right:-80px;top:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle, rgba(245,158,11,.14), rgba(245,158,11,0) 72%)}
  .front-inner{position:absolute;inset:0;padding:46px 48px;display:flex;flex-direction:column;justify-content:space-between}
  .brand{width:300px}.tag{font-size:40px;line-height:1.06;font-weight:800;max-width:420px;letter-spacing:-.04em;color:#0f172a}.muted{font-size:18px;color:#6b7280;max-width:420px;line-height:1.45}
  .url{display:inline-flex;align-items:center;gap:12px;color:#111827;font-size:20px;font-weight:700}.dot{width:12px;height:12px;border-radius:50%;background:#f59e0b}
  .back-inner{position:absolute;inset:0;padding:46px 48px;display:flex;flex-direction:column;justify-content:space-between}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}.name{font-size:38px;font-weight:800;letter-spacing:-.04em}.role{margin-top:8px;color:#b76d00;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
  .contact{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:28px}.box{padding:18px;border:1px solid #e7ebf0;border-radius:18px}.label{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#6b7280;margin-bottom:8px}.value{font-size:20px;font-weight:600;color:#111827}
  .services{display:flex;gap:12px;flex-wrap:wrap}.pill{padding:12px 16px;border-radius:999px;background:#fff6e5;border:1px solid #fde1aa;color:#8a5600;font-weight:700;font-size:16px}
  .footer{display:flex;justify-content:space-between;align-items:center;color:#6b7280;font-size:15px}.mini{width:160px;opacity:.95}
</style></head><body>
<div class="canvas">
  <div class="title">Option B — Light minimal</div>
  <div class="sub">Cleaner, friendlier, and more classic small-business card energy.</div>
  <div class="row">
    <div class="card front"><div class="front-inner">
      <div class="brand">${lightLogo.replace('width="600" height="200"','')}</div>
      <div>
        <div class="tag">Modern websites for Southern Arizona small businesses.</div>
        <div class="muted">A clean first impression, clearer trust signals, and a site that actually helps people take the next step.</div>
      </div>
      <div class="url"><span class="dot"></span> desertdigitalstudio.com</div>
    </div></div>
    <div class="card back"><div class="back-inner">
      <div>
        <div class="top">
          <div>
            <div class="name">Gabriel Maciel</div>
            <div class="role">Founder · Web Designer</div>
          </div>
          <div class="mini">${lightLogo.replace('width="600" height="200"','')}</div>
        </div>
        <div class="contact">
          <div class="box"><div class="label">Email</div><div class="value">gabriel@desertdigitalstudio.com</div></div>
          <div class="box"><div class="label">Website</div><div class="value">desertdigitalstudio.com</div></div>
          <div class="box"><div class="label">Based in</div><div class="value">Benson, AZ</div></div>
          <div class="box"><div class="label">Serving</div><div class="value">Southern Arizona</div></div>
        </div>
      </div>
      <div class="footer">
        <div class="services"><span class="pill">Web Design</span><span class="pill">Local SEO</span><span class="pill">Maintenance</span></div>
        <div>Front / Back mockup</div>
      </div>
    </div></div>
  </div>
</div>
</body></html>`
};

(async() => {
  const browser = await chromium.launch({ headless: true });
  for (const [name, html] of Object.entries(cards)) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, `business-card-mockup-${name}.png`), type: 'png' });
    await page.close();
  }
  await browser.close();
  console.log('rendered');
})();
