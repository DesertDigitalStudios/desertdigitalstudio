const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/branding/social';
fs.mkdirSync(outDir, { recursive: true });

const lightLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-light.svg', 'utf8');
const screenshotPath = '/Users/gabrielmaciel/.openclaw/workspace/logos/website-screenshot.png';
const screenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
const screenshotDataUri = `data:image/png;base64,${screenshotBase64}`;

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --bg: #0a0f16;
      --bg2: #121a26;
      --card: rgba(17, 24, 39, 0.84);
      --line: rgba(255,255,255,0.08);
      --text: #eef2f7;
      --muted: #b7c0cc;
      --amber: #f59e0b;
      --amberSoft: rgba(245, 158, 11, 0.18);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background:
        radial-gradient(circle at 12% 12%, rgba(245,158,11,.18), transparent 24%),
        radial-gradient(circle at 85% 20%, rgba(245,158,11,.10), transparent 22%),
        radial-gradient(circle at 74% 84%, rgba(245,158,11,.08), transparent 22%),
        linear-gradient(180deg, var(--bg), var(--bg2));
      color: var(--text);
    }
    .canvas {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      padding: 72px;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: linear-gradient(180deg, rgba(0,0,0,.85), transparent 82%);
      pointer-events: none;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 2;
    }
    .logo {
      width: 310px;
    }
    .pill {
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(245,158,11,.28);
      background: rgba(245,158,11,.10);
      color: #ffd591;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: .04em;
    }
    .content {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 34px;
      margin-top: 56px;
      align-items: center;
    }
    .eyebrow {
      color: #ffcc7a;
      text-transform: uppercase;
      letter-spacing: .22em;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 18px;
    }
    h1 {
      margin: 0;
      font-size: 72px;
      line-height: .96;
      letter-spacing: -.05em;
      max-width: 560px;
    }
    .accent { color: #ffb52e; }
    .sub {
      margin-top: 22px;
      color: var(--muted);
      font-size: 26px;
      line-height: 1.35;
      max-width: 520px;
    }
    .bullets {
      margin-top: 28px;
      display: grid;
      gap: 12px;
      color: #d7dee8;
      font-size: 22px;
      font-weight: 500;
    }
    .bullet span {
      color: #ffcc7a;
      margin-right: 10px;
    }
    .cta {
      margin-top: 34px;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 18px 24px;
      border-radius: 20px;
      background: rgba(255,255,255,.06);
      border: 1px solid var(--line);
      font-size: 21px;
      font-weight: 700;
      color: var(--text);
      box-shadow: 0 18px 40px rgba(0,0,0,.25);
    }
    .cta .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--amber);
      box-shadow: 0 0 18px rgba(245,158,11,.7);
    }
    .shot-wrap {
      position: relative;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shot-card {
      width: 100%;
      max-width: 430px;
      padding: 18px;
      border-radius: 28px;
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
      border: 1px solid rgba(255,255,255,.10);
      box-shadow: 0 24px 80px rgba(0,0,0,.38);
      transform: rotate(5deg);
      position: relative;
    }
    .shot-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 28px;
      background: linear-gradient(145deg, rgba(245,158,11,.28), rgba(255,255,255,.06), rgba(245,158,11,.05));
      z-index: -1;
    }
    .shot-top {
      display: flex;
      gap: 8px;
      padding: 2px 4px 14px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255,255,255,.25);
    }
    .shot {
      width: 100%;
      border-radius: 18px;
      display: block;
      border: 1px solid rgba(255,255,255,.08);
    }
    .badge {
      position: absolute;
      right: -18px;
      bottom: 54px;
      padding: 12px 16px;
      border-radius: 18px;
      background: rgba(10,15,22,.92);
      border: 1px solid rgba(245,158,11,.22);
      color: #ffd591;
      font-size: 15px;
      font-weight: 800;
      line-height: 1.25;
      box-shadow: 0 16px 36px rgba(0,0,0,.35);
    }
    .footer {
      position: absolute;
      left: 72px;
      right: 72px;
      bottom: 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #aeb8c5;
      font-size: 18px;
      z-index: 2;
    }
    .footer strong { color: #dce4ee; }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="grid"></div>
    <div class="topbar">
      <div class="logo">${lightLogo}</div>
      <div class="pill">Southern Arizona web design</div>
    </div>

    <div class="content">
      <div>
        <div class="eyebrow">Instagram Post 02</div>
        <h1>Your business deserves <span class="accent">more</span> than just a Facebook page.</h1>
        <div class="sub">
          We build clean, modern websites for local businesses that want to look legit, get found online, and make it easier for customers to reach out.
        </div>
        <div class="bullets">
          <div class="bullet"><span>•</span>Custom website builds</div>
          <div class="bullet"><span>•</span>Website refreshes + cleanup</div>
          <div class="bullet"><span>•</span>Free website audits for local businesses</div>
        </div>
        <div class="cta"><div class="dot"></div> desertdigitalstudio.com</div>
      </div>

      <div class="shot-wrap">
        <div class="shot-card">
          <div class="shot-top"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
          <img class="shot" src="${screenshotDataUri}" alt="Desert Digital Studio website screenshot" />
          <div class="badge">Built in Benson, AZ<br/>for small businesses</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div><strong>Desert Digital Studio</strong> • Websites that feel local and polished</div>
      <div style="color:#d8e0ea; font-weight:600;">Free audit available</div>
    </div>
  </div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080, deviceScaleFactor: 2 } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(outDir, 'dds-instagram-post-02.png') });
  await browser.close();
  console.log('Created', path.join(outDir, 'dds-instagram-post-02.png'));
})();
