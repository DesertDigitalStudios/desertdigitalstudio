const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/branding/business-cards/print-ready';
fs.mkdirSync(outDir, { recursive: true });

const lightLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-light.svg', 'utf8');
const logoMini = lightLogo.replace('width="600" height="200"', '');

const PHONE = '(210) 993-0509';
const QR_URL = 'https://www.desertdigitalstudio.com';

const baseStyles = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #ffffff; }
  .sheet { width: 1125px; height: 675px; position: relative; overflow: hidden; background: linear-gradient(145deg,#ffffff 0%,#f9fafb 55%,#f3f4f6 100%); }
  .texture { position:absolute; inset:0; background-image:linear-gradient(rgba(15,23,42,.03) 1px, transparent 1px),linear-gradient(90deg, rgba(15,23,42,.03) 1px, transparent 1px); background-size: 34px 34px; mask-image: linear-gradient(180deg, rgba(0,0,0,.4), transparent 78%); }
  .glow { position:absolute; inset:0; background:radial-gradient(circle at 82% 16%, rgba(245,158,11,.10), transparent 24%),radial-gradient(circle at 16% 82%, rgba(245,158,11,.05), transparent 26%); }

  /* FRONT */
  .front-wrap { position:absolute; inset:64px 90px; display:flex; flex-direction:column; gap:22px; }
  .eyebrow { font-size: 19px; letter-spacing: .22em; text-transform: uppercase; color:#8b98a8; font-weight:700; }
  .tag { font-size: 56px; line-height: 1.06; font-weight: 800; letter-spacing: -.05em; color:#0f172a; max-width: 680px; }
  .front-footer { margin-top:auto; display:flex; align-items:center; justify-content:space-between; }
  .pill { display:inline-block; padding:14px 24px; border:1.5px solid rgba(245,158,11,.25); background:#fff7e7; border-radius:999px; color:#9a6100; font-weight:800; font-size:26px; }
  .logo-lg { width: 400px; }
  .qr-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; }
  .qr-wrap img { width:148px; height:148px; border-radius:10px; border:2px solid rgba(245,158,11,.2); }
  .qr-label { font-size:15px; color:#8b98a8; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }

  /* BACK */
  .back-wrap { position:absolute; inset:64px 90px; display:grid; grid-template-columns: 1.12fr .88fr; gap: 32px; }
  .name { font-size: 60px; font-weight: 800; letter-spacing: -.05em; color:#0f172a; }
  .role { margin-top:10px; font-size: 24px; color:#b76d00; font-weight:700; letter-spacing:.08em; text-transform: uppercase; }
  .meta { margin-top:28px; display:grid; gap:15px; }
  .meta-item { padding-bottom:14px; border-bottom:1px solid rgba(15,23,42,.08); }
  .label { font-size: 13px; letter-spacing: .18em; text-transform: uppercase; color:#8b98a8; font-weight:700; margin-bottom:6px; }
  .value { font-size: 28px; font-weight: 650; color:#111827; }
  .value.small { font-size: 24px; color:#475467; }
  .right-col { display:flex; flex-direction:column; gap:18px; padding-top:4px; }
  .mini-logo { width: 200px; }
  .list { display:grid; gap:13px; flex:1; }
  .service { padding:15px 18px; border:1px solid #ebe3d3; border-radius:16px; background:#fff8ec; font-size:25px; font-weight:800; color:#8a5600; }
`;

async function buildHtml(qrDataUrl) {
  const frontHtml = `<!doctype html>
<html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
<div class="sheet">
  <div class="texture"></div><div class="glow"></div>
  <div class="front-wrap">
    <div class="logo-lg">${logoMini}</div>
    <div>
      <div class="eyebrow">Southern Arizona Web Design</div>
      <div class="tag">Modern websites for Southern Arizona small businesses.</div>
    </div>
    <div class="front-footer">
      <div class="pill">desertdigitalstudio.com</div>
      <div class="qr-wrap">
        <img src="${qrDataUrl}" alt="QR Code" />
        <span class="qr-label">Scan to visit</span>
      </div>
    </div>
  </div>
</div>
</body></html>`;

  const backHtml = `<!doctype html>
<html><head><meta charset="utf-8"/><style>${baseStyles}</style></head><body>
<div class="sheet">
  <div class="texture"></div><div class="glow"></div>
  <div class="back-wrap">
    <div>
      <div class="name">Gabriel Maciel</div>
      <div class="role">Founder · Web Designer</div>
      <div class="meta">
        <div class="meta-item"><div class="label">Phone</div><div class="value">${PHONE}</div></div>
        <div class="meta-item"><div class="label">Email</div><div class="value">gabriel@desertdigitalstudio.com</div></div>
        <div class="meta-item"><div class="label">Website</div><div class="value">desertdigitalstudio.com</div></div>
        <div class="meta-item"><div class="label">Based in</div><div class="value small">Benson, AZ · Serving Southern Arizona</div></div>
      </div>
    </div>
    <div class="right-col">
      <div class="mini-logo">${logoMini}</div>
      <div class="list">
        <div class="service">Web Design</div>
        <div class="service">Local SEO</div>
        <div class="service">Maintenance</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;

  return { frontHtml, backHtml };
}

async function renderSide(browser, name, html) {
  const page = await browser.newPage({ viewport: { width: 1125, height: 675 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(outDir, `${name}.png`), type: 'png' });
  await page.pdf({
    path: path.join(outDir, `${name}.pdf`),
    width: '3.75in', height: '2.25in',
    printBackground: true,
    margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
    pageRanges: '1'
  });
  await page.close();
}

(async () => {
  const qrDataUrl = await QRCode.toDataURL(QR_URL, {
    margin: 1, width: 300,
    color: { dark: '#0f172a', light: '#ffffff' }
  });

  const { frontHtml, backHtml } = await buildHtml(qrDataUrl);

  fs.writeFileSync(path.join(outDir, 'dds-business-card-front.html'), frontHtml);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-back.html'), backHtml);
  fs.writeFileSync(path.join(outDir, 'dds-business-card-spec.txt'), [
    'Desert Digital Studio — Print-Ready Business Card',
    `Phone: ${PHONE}`,
    `QR Code: ${QR_URL}`,
    'Final size: 3.5in x 2in',
    'Exported with bleed: 3.75in x 2.25in',
    'Raster: 1125 x 675 px (300 DPI)',
    'Files: front/back PNG + PDF'
  ].join('\n'));

  const browser = await chromium.launch({ headless: true });
  await renderSide(browser, 'dds-business-card-front', frontHtml);
  await renderSide(browser, 'dds-business-card-back', backHtml);
  await browser.close();

  console.log('done');
})();
