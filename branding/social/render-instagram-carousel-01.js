const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

const outDir = '/Users/gabrielmaciel/.openclaw/workspace/branding/social';
fs.mkdirSync(outDir, { recursive: true });

const lightLogo = fs.readFileSync('/Users/gabrielmaciel/.openclaw/workspace/logos/logo-a-light.svg', 'utf8');
const screenshotPath = '/Users/gabrielmaciel/.openclaw/workspace/logos/website-screenshot.png';
const screenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
const screenshotDataUri = `data:image/png;base64,${screenshotBase64}`;

const slides = [
  {
    file: 'dds-instagram-carousel-01-slide-1.png',
    pill: 'Swipe carousel • Slide 1/5',
    eyebrow: 'Website quick audit',
    title: '3 signs your website is costing you customers.',
    subtitle: 'A lot of small business sites are quietly losing trust, leads, and calls. Here are three of the biggest red flags I keep seeing.',
    bullets: [
      'Hard to contact',
      'Looks rough on mobile',
      'Facebook is doing all the work'
    ],
    cta: 'Swipe to see the 3 signs',
    mode: 'hero'
  },
  {
    file: 'dds-instagram-carousel-01-slide-2.png',
    pill: 'Slide 2/5',
    eyebrow: 'Sign #1',
    title: 'People should not have to hunt for your contact info.',
    subtitle: 'If your phone number, form, hours, or address are buried, customers bounce instead of reaching out.',
    bullets: [
      'No clear phone number',
      'Contact form hidden or missing',
      'Address and hours hard to find'
    ],
    cta: 'Easy fix, big trust boost',
    mode: 'number',
    number: '01'
  },
  {
    file: 'dds-instagram-carousel-01-slide-3.png',
    pill: 'Slide 3/5',
    eyebrow: 'Sign #2',
    title: 'If it feels outdated on mobile, it hurts trust fast.',
    subtitle: 'Most people check a business from their phone first. If the site feels cramped, slow, or awkward, they leave.',
    bullets: [
      'Tiny text and awkward spacing',
      'Slow loading sections',
      'Buttons that are hard to tap'
    ],
    cta: 'Mobile matters more than ever',
    mode: 'number',
    number: '02'
  },
  {
    file: 'dds-instagram-carousel-01-slide-4.png',
    pill: 'Slide 4/5',
    eyebrow: 'Sign #3',
    title: 'A Facebook page is not the same thing as a real website.',
    subtitle: 'Facebook can help, but it should not be your whole online presence. A real site makes you look more established and easier to trust.',
    bullets: [
      'No central place to send people',
      'Weak search visibility',
      'Less control over your brand'
    ],
    cta: 'Own your home online',
    mode: 'number',
    number: '03'
  },
  {
    file: 'dds-instagram-carousel-01-slide-5.png',
    pill: 'Slide 5/5',
    eyebrow: 'Call to action',
    title: 'Want me to run a free quick audit on your site?',
    subtitle: 'I’ll tell you what looks strong, what feels weak, and what I would fix first. No pressure, just a useful outside look.',
    bullets: [
      'Local, straight-up feedback',
      'Built for Southern Arizona businesses',
      'Free audit available now'
    ],
    cta: 'desertdigitalstudio.com',
    mode: 'hero-end'
  }
];

function renderSlide(slide) {
  const numberBlock = slide.number
    ? `<div class="number-wrap"><div class="number">${slide.number}</div></div>`
    : '';

  const rightPanel = slide.mode === 'hero' || slide.mode === 'hero-end'
    ? `<div class="shot-wrap">
        <div class="shot-card ${slide.mode === 'hero-end' ? 'end' : ''}">
          <div class="shot-top"><div class="tiny-dot"></div><div class="tiny-dot"></div><div class="tiny-dot"></div></div>
          <img class="shot" src="${screenshotDataUri}" alt="Desert Digital Studio website screenshot" />
          <div class="badge">Built in Benson, AZ<br/>for small businesses</div>
        </div>
      </div>`
    : `<div class="insight-card">
        ${numberBlock}
        <div class="insight-text">Clean websites make businesses feel <span class="accent">easier to trust</span>, easier to contact, and easier to choose.</div>
      </div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    :root {
      --bg: #0a0f16;
      --bg2: #121a26;
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
    .logo { width: 310px; }
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
      grid-template-columns: 1.08fr .92fr;
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
      max-width: 580px;
    }
    .accent { color: #ffb52e; }
    .sub {
      margin-top: 22px;
      color: var(--muted);
      font-size: 26px;
      line-height: 1.35;
      max-width: 540px;
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
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      box-shadow: 0 18px 40px rgba(0,0,0,.25);
      max-width: 430px;
      line-height: 1.2;
    }
    .cta .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--amber);
      box-shadow: 0 0 18px rgba(245,158,11,.7);
    }
    .shot-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
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
    .shot-card.end { transform: rotate(-4deg); }
    .shot-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 28px;
      background: linear-gradient(145deg, rgba(245,158,11,.28), rgba(255,255,255,.06), rgba(245,158,11,.05));
      z-index: -1;
    }
    .shot-top { display: flex; gap: 8px; padding: 2px 4px 14px; }
    .tiny-dot {
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
    .insight-card {
      min-height: 590px;
      border-radius: 34px;
      background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
      border: 1px solid rgba(255,255,255,.10);
      box-shadow: 0 24px 80px rgba(0,0,0,.35);
      padding: 42px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .insight-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(245,158,11,.18), transparent 40%);
      pointer-events: none;
    }
    .number-wrap {
      margin-bottom: 24px;
    }
    .number {
      font-size: 132px;
      line-height: 1;
      letter-spacing: -.08em;
      font-weight: 800;
      color: rgba(255,181,46,.96);
    }
    .insight-text {
      font-size: 36px;
      line-height: 1.12;
      color: #eef2f7;
      max-width: 360px;
      font-weight: 700;
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
      <div class="pill">${slide.pill}</div>
    </div>
    <div class="content">
      <div>
        <div class="eyebrow">${slide.eyebrow}</div>
        <h1>${slide.title.replace(/\b(websites?)\b/i, '<span class="accent">$1</span>')}</h1>
        <div class="sub">${slide.subtitle}</div>
        <div class="bullets">
          ${slide.bullets.map(item => `<div class="bullet"><span>•</span>${item}</div>`).join('')}
        </div>
        <div class="cta"><div class="dot"></div>${slide.cta}</div>
      </div>
      ${rightPanel}
    </div>
    <div class="footer">
      <div><strong>Desert Digital Studio</strong> • Southern Arizona web design</div>
      <div style="color:#d8e0ea; font-weight:600;">Free audit available</div>
    </div>
  </div>
</body>
</html>`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const slide of slides) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1080, deviceScaleFactor: 2 } });
    await page.setContent(renderSlide(slide), { waitUntil: 'load' });
    await page.screenshot({ path: path.join(outDir, slide.file) });
    await page.close();
    console.log('Created', path.join(outDir, slide.file));
  }
  await browser.close();
})();
