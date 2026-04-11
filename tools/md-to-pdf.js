const fs = require('fs');
const path = require('path');
const { chromium } = require('/Users/gabrielmaciel/.openclaw/workspace/browser/node_modules/playwright');

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

(async()=>{
  const input = process.argv[2];
  const output = process.argv[3];
  if(!input||!output){console.error('Usage: node md-to-pdf.js <input.md> <output.pdf>');process.exit(1);}  
  const md = fs.readFileSync(input,'utf8');
  const title = path.basename(path.dirname(input)).replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase()) + ' Audit Report';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: Letter; margin: 0.5in; }
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#111827;}
  h1{font-size:24px;margin:0 0 12px;} .muted{color:#6b7280;font-size:12px;margin-bottom:18px;}
  pre{white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.45;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;}
  </style></head><body><h1>${esc(title)}</h1><div class="muted">Generated from today's audit markdown</div><pre>${esc(md)}</pre></body></html>`;
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  await page.setContent(html, {waitUntil:'load'});
  await page.pdf({path:output,format:'Letter',printBackground:true,margin:{top:'0.5in',right:'0.5in',bottom:'0.5in',left:'0.5in'}});
  await browser.close();
  console.log(output);
})();