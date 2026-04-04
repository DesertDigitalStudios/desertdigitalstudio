const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/branding/business-cards/print-ready';
fs.mkdirSync(outDir, { recursive: true });

const lightLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-light.svg', 'utf8');
const logoMini = lightLogo.replace('width="600" height="200"', '');

const baseStyles = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #ffffff; }
  .sheet { width: 1125px; height: 675px; position: relative; overflow: hidden; background: linear-gradient(145deg,#ffffff 0%,#f9fafb 55%,#f3f4f6 100%); }
  .texture { position:absolute; inset:0; background-image:linear-gradient(rgba(15,23,42,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(15,23,42,.03) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(180deg, rgba(0,0,0,.4), transparent 78%); }
  .glow { position:absolute; inset:0; background:radial-gradient(circle at 82% 16%, rgba(245,158,11,.10), transparent 24%),radial-gradient(circle at 16% 82%, rgba(245,158,11,.05), transparent 26%); }
  .front-wrap { position:absolute; inset:64px 90px; display:flex; flex-direction:column; gap:26px; }
  .eyebrow { font-size: 19px; letter-spacing: .22em; text-transform: uppercase; color:#8b98a8; font-weight:700; }
  .tag { font-size: 58px; line-height: 1.06; font-weight: 800; letter-spacing: -.05em; color:#0f172a; max-width: 690px; }
  .pill { margin-top:auto; align-self:flex-start; display:inline-block; padding:14px 24px; border:1.5px solid rgba(245,158,11,.25); background:#fff7e7; border-radius:999px; color:#9a6100; font-weight:800; font-size:26px; }
  .logo-lg { width: 420px; }

  .back-wrap { position:absolute; inset:66px 90px; display:grid; grid-template-columns: 1.12fr .88fr; gap: 34px; }
  .name { font-size: 64px; font-weight: 800; letter-spacing: -.05em; color:#0f172a; }
  .role { margin-top:12px; font-size: 25px; color:#b76d00; font-weight:700; letter-spacing:.08em; text-transform: uppercase; }
  .meta { margin-top:36px; display:grid; gap:18px; }
  .meta-item { padding-bottom:16px; border-bottom:1px solid rgba(15,23,42,.08); }
  .label { font-size: 14px; letter-spacing: .18em; text-transform: uppercase; color:#8b98a8; font-weight:700; margin-bottom:7px; }
  .value { font-size: 31px; font-weight: 650; color:#111827; }
  .small { font-size: 27px; color:#475467; }
  .list { display:grid; gap:15px; align-content:start; padding-top:12px; }
  .service { padding:18px 20px; border:1px solid #ebe3d3; border-radius:18px; background:#fff8ec; font-size:27px; font-weight:800; color:#8a5600; }
  .mini-logo { width: 220px; justify-self:end; opacity:.98; }
  .right-col { display:grid; grid-template-rows: auto 1fr; }
`;

const frontHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${baseStyles}</style>
</head>
<body>
  <div class="sheet">
    <div class="texture"></div>
    <div class="glow"></div>
    <div class="front-wrap">
      <div class="logo-lg">${logoMini}</div>
      <div>
        <div class="eyebrow">Southern Arizona Web Design</div>
        <div class="tag">Modern websites for Southern Arizona small businesses.</div>
      </div>
      <div class="pill">desertdigitalstudio.com</div>
    </div>
  </div>
</body>
</html>`;

const backHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${baseStyles}</style>
</head>
<body>
  <div class="sheet">
    <div class="texture"></div>
    <div class="glow"></div>
    <div class="back-wrap">
      <div>
        <div class="name">Gabriel Maciel</div>
        <div class="role">Founder · Web Designer</div>
        <div class="meta">
          <div class="meta-item"><div class="label">Email</div><div class="value">gabriel@desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Website</div><div class="value">desertdigitalstudio.com</div></div>
          <div class="meta-item"><div class="label">Based in</div><div class="value small">Benson, Arizona · Serving Southern Arizona</div></div>
        </div>
      </div>
      <div class="right-col">
        <div class="mini-logo">${logoMini}</div>
        <div class="list">
          <div class="service">Web Design</div>
          <div class="service">Local SEO</div>
          <div class="service">Website Maintenance</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const bleedBackgroundSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="675" viewBox="0 0 1125 675">
  <defs>
    <linearGradient id="bgFront" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="55%" stop-color="#f9fafb"/>
      <stop offset="100%" stop-color="#f3f4f6"/>
    </linearGradient>
    <radialGradient id="g1" cx="82%" cy="16%" r="24%">
      <stop offset="0%" stop-color="rgba(245,158,11,0.10)"/>
      <stop offset="100%" stop-color="rgba(245,158,11,0)"/>
    </radialGradient>
    <radialGradient id="g2" cx="16%" cy="82%" r="26%">
      <stop offset="0%" stop-color="rgba(245,158,11,0.05)"/>
      <stop offset="100%" stop-color="rgba(245,158,11,0)"/>
    </radialGradient>
  </defs>
  <rect width="1125" height="675" fill="url(#bgFront)"/>
  <rect width="1125" height="675" fill="url(#g1)"/>
  <rect width="1125" height="675" fill="url(#g2)"/>
</svg>`;

async function renderSide(browser, name, html) {
  const page = await browser.newPage({ viewport: { width: 1125, height: 675 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(outDir, `${name}.png`), type: 'png' });
  await page.pdf({ path: path.join(outDir, `${name}.pdf`), width: '3.75in', height: '2.25in', printBackground: true, margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' }, pageRanges: '1' });
  await page.close();
}

(async () => {
  fs.writeFileSync(path.join(outDir, 'dds-business-card-front.html'), frontHtml);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-back.html'), backHtml);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-front-bleed.svg'), bleedBackgroundSvg);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-back-bleed.svg'), bleedBackgroundSvg);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-spec.txt'), [
    'Desert Digital Studio business card — print-ready hybrid version',
    'Final size: 3.5in x 2in',
    'Bleed size exported: 3.75in x 2.25in',
    'Raster export: 1125 x 675 px (300 DPI equivalent)',
    'Files: front/back PNG + PDF + HTML proof'
  ].join('\n'));

  const browser = await chromium.launch({ headless: true });
  await renderSide(browser, 'dds-business-card-front', frontHtml);
  await renderSide(browser, 'dds-business-card-back', backHtml);
  await browser.close();

  console.log('print-ready files rendered');
})();
