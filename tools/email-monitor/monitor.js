#!/usr/bin/env node
/**
 * Desert Digital Studio — Smart Email Monitor
 * Watches gabriel@desertdigitalstudio.com via IMAP
 * Pings Discord with full email content + smart classification + draft replies
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const IMAP_BASE_CONFIG = {
  user: 'gabriel@desertdigitalstudio.com',
  password: 'arP6jSWisQ2H',
  port: 993,
  tls: true,
  connTimeout: 10000,
  authTimeout: 10000,
  socketTimeout: 15000,
  keepalive: false,
  tlsOptions: { rejectUnauthorized: false }
};

const IMAP_HOSTS = ['imappro.zoho.com', 'imap.zoho.com'];

const DISCORD_CHANNEL = 'channel:1487016164931539024';
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
const STATE_FILE = path.join(__dirname, '.email-state.json');
const LOG_FILE = path.join(__dirname, 'email-log.json');
const DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Quiet hours (no pings) — MST
const QUIET_START = 22; // 10pm
const QUIET_END = 7;    // 7am

// Keywords that flag a client inquiry
const INQUIRY_KEYWORDS = ['website', 'quote', 'price', 'cost', 'interested', 'design', 'help', 'build', 'seo', 'hire', 'contact', 'inquiry', 'services', 'estimate', 'project'];

// Vendor / platform outreach that is not a real lead
const VENDOR_PATTERNS = [
  'yelp.com',
  'yelp places',
  'places project',
  'api trial',
  'share how you\'re using',
  'provide guidance',
  'schedule a short google meet'
];

const SPAM_PATTERNS = [
  'tranny69.com',
  'ligma@balls.com',
  'test test',
  'asdf',
  'qwerty',
  'free money',
  'crypto',
  'casino',
  'viagra'
];

const LOW_SIGNAL_SUBJECTS = ['test', 'hello', 'hi'];

// Senders/domains to ignore (spam/marketing)
const IGNORE_PATTERNS = ['noreply@', 'no-reply@', 'donotreply@', 'newsletter@', 'marketing@', 'notifications@', 'hello@squarespace', 'mail@waveapps', 'zoho.com'];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getSeenUIDs() {
  try { return new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).uids || []); }
  catch { return new Set(); }
}

function readState() {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return {
      uids: raw.uids || [],
      alerts: raw.alerts || {}
    };
  } catch {
    return { uids: [], alerts: {} };
  }
}

function saveSeenUIDs(uids) {
  const state = readState();
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, uids: [...uids] }));
}

function buildAlertKey(from, subject, body) {
  const base = `${String(from || '').toLowerCase()}|${String(subject || '').toLowerCase()}|${truncate(body || '', 120).toLowerCase()}`;
  return Buffer.from(base).toString('base64');
}

function shouldSuppressDuplicateAlert(from, subject, body) {
  const state = readState();
  const alerts = state.alerts || {};
  const now = Date.now();
  const key = buildAlertKey(from, subject, body);
  const last = alerts[key];

  for (const [k, ts] of Object.entries(alerts)) {
    if (!ts || (now - ts) > DEDUPE_WINDOW_MS) delete alerts[k];
  }

  if (last && (now - last) < DEDUPE_WINDOW_MS) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, alerts }, null, 2));
    return true;
  }

  alerts[key] = now;
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, alerts }, null, 2));
  return false;
}

function logEmail(entry) {
  let log = [];
  try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch {}
  log.unshift({ ...entry, date: new Date().toISOString() });
  if (log.length > 200) log = log.slice(0, 200);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function isQuietHours() {
  const hour = new Date().getHours();
  return hour >= QUIET_START || hour < QUIET_END;
}

function shouldIgnore(from) {
  const f = (from || '').toLowerCase();
  return IGNORE_PATTERNS.some(p => f.includes(p));
}

function extractField(text, field) {
  const match = String(text || '').match(new RegExp(`${field}:\\s*([^\\n]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function isClearlySpam(subject, body, from) {
  const text = `${subject || ''} ${body || ''} ${from || ''}`.toLowerCase();
  if (SPAM_PATTERNS.some(pattern => text.includes(pattern))) return true;

  const extractedEmail = extractField(body, 'Email').toLowerCase();
  const extractedName = extractField(body, 'Name').toLowerCase();
  const lowSignalSubject = LOW_SIGNAL_SUBJECTS.includes(String(subject || '').trim().toLowerCase());
  const fakeEmail = /@(balls\.com|example\.com|test\.com)$/i.test(extractedEmail);
  const suspiciousName = ['test', 'asdf', 'qwerty', 'g feria'].includes(extractedName);

  if (lowSignalSubject && !String(body || '').toLowerCase().includes('project')) return true;
  if (fakeEmail) return true;
  if (suspiciousName && lowSignalSubject) return true;
  return false;
}

function classifyEmail(subject, body, from) {
  const text = ((subject || '') + ' ' + (body || '')).toLowerCase();
  const fromText = String(from || '').toLowerCase();
  const isVendor = VENDOR_PATTERNS.some(pattern => text.includes(pattern) || fromText.includes(pattern));
  const isReply = (subject || '').toLowerCase().startsWith('re:');
  const isAuditLead = String(subject || '').toLowerCase().includes('[free audit lead]') || text.includes('crm-friendly json');
  const spam = isClearlySpam(subject, body, from);
  const hasInquiryKeywords = INQUIRY_KEYWORDS.some(kw => text.includes(kw));
  const extractedEmail = extractField(body, 'Email').toLowerCase();
  const hasRealContact = /@/.test(extractedEmail) && !/(balls\.com|example\.com|test\.com)$/i.test(extractedEmail);
  const hasBusinessName = Boolean(extractField(body, 'Business'));
  const likelyLegitAuditLead = isAuditLead && hasRealContact && hasBusinessName && !spam;
  const isInquiry = likelyLegitAuditLead || (hasInquiryKeywords && !spam);

  if (spam) return { type: 'spam', emoji: '🚫', label: 'SPAM / LOW-QUALITY SUBMISSION' };
  if (isVendor) return { type: 'vendor', emoji: '🛠️', label: 'VENDOR / PLATFORM EMAIL' };
  if (isInquiry) return { type: 'inquiry', emoji: '🔥', label: 'CLIENT INQUIRY' };
  if (isReply) return { type: 'reply', emoji: '💬', label: 'REPLY' };
  return { type: 'general', emoji: '📬', label: 'NEW EMAIL' };
}

function draftReply(subject, body, from) {
  const text = ((body || '')).slice(0, 500);
  const isInquiry = INQUIRY_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
  if (!isInquiry) return null;
  // Try Qwen first, fall back to template
  try {
    const http = require('http');
    const prompt = `You are drafting a reply email for Gabriel Maciel at Desert Digital Studio (web design, based in Benson AZ). Someone emailed with subject "${subject}". Here is their message:\n\n${text}\n\nWrite a short, warm, professional reply under 100 words. Be helpful and direct. Do not add a subject line — just the body. Sign off as Gabriel, Desert Digital Studio, (210) 993-0509.`;
    const payload = JSON.stringify({ model: 'qwen3:14b', prompt, stream: false, options: { temperature: 0.4, num_predict: 300 } });
    // Sync call via child_process
    const { execSync } = require('child_process');
    const result = execSync(`curl -s -X POST http://localhost:11434/api/generate -H 'Content-Type: application/json' -d ${JSON.stringify(payload)}`, { timeout: 30000 });
    const parsed = JSON.parse(result.toString());
    let text2 = (parsed.response || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (text2.length > 50) return text2;
  } catch (e) { /* fall through to template */ }
  const firstName = (from || '').split(/[\s<@]/)[0] || 'there';
  return `Hi ${firstName},\n\nThank you for reaching out to Desert Digital Studio! I'd love to learn more about what you're looking for.\n\nI'll follow up shortly — or feel free to reply with any details about your business and what you need.\n\nGabriel\nDesert Digital Studio\ngabriel@desertdigitalstudio.com\n(210) 993-0509`;
}

function sendDiscord(msg) {
  try {
    execSync(`/opt/homebrew/bin/openclaw message send --channel discord --target "${DISCORD_CHANNEL}" --message ${JSON.stringify(msg)}`, { stdio: 'pipe' });
  } catch (e) {
    console.error('Discord send failed:', e.message);
  }
}

function truncate(str, len) {
  if (!str) return '';
  str = str.replace(/\s+/g, ' ').trim();
  return str.length > len ? str.slice(0, len) + '...' : str;
}

// ─── PROCESS EMAIL ─────────────────────────────────────────────────────────
function processEmail(parsed) {
  const from = parsed.from?.text || 'Unknown';
  const subject = parsed.subject || '(no subject)';
  const body = parsed.text || parsed.html?.replace(/<[^>]+>/g, ' ') || '';
  const bodyPreview = truncate(body, 600);

  if (shouldSuppressDuplicateAlert(from, subject, bodyPreview)) {
    console.log('Duplicate alert suppressed:', subject);
    return;
  }

  if (shouldIgnore(from)) {
    console.log('Ignored (marketing/noreply):', subject);
    return;
  }

  const { type, emoji, label } = classifyEmail(subject, body, from);
  if (type === 'spam') {
    logEmail({ from, subject, type, body: truncate(body, 1000) });
    console.log('Ignored (spam/low-quality):', subject);
    return;
  }
  const quiet = isQuietHours();
  const draft = draftReply(subject, body, from);

  // Log it
  logEmail({ from, subject, type, body: truncate(body, 1000) });

  // Build Discord message
  let msg = `${emoji} **${label}** at gabriel@desertdigitalstudio.com`;
  if (quiet) msg += ' *(quiet hours — heads up for morning)*';
  msg += `\n**From:** ${from}`;
  msg += `\n**Subject:** ${subject}`;
  msg += `\n\n${bodyPreview}`;

  if (draft) {
    msg += `\n\n---\n✏️ **Suggested Reply:**\n\`\`\`\n${draft}\n\`\`\``;
    msg += `\n*(Reply "send it" to me and I'll send this for you)*`;
  }

  // Send immediately even in quiet hours for inquiries
  if (!quiet || type === 'inquiry') {
    sendDiscord(msg);
    console.log(`[${new Date().toLocaleTimeString()}] Alert sent: [${label}] ${subject}`);
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] Quiet hours — suppressed: ${subject}`);
  }
}

// ─── IMAP CHECK ────────────────────────────────────────────────────────────
function connectAndCheck(host, seenUIDs, newUIDs) {
  return new Promise((resolve) => {
    const imap = new Imap({ ...IMAP_BASE_CONFIG, host });
    let settled = false;
    let connected = false;
    let sawNewMail = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve({ connected, sawNewMail });
    };

    const hardTimeout = setTimeout(() => {
      console.error(`IMAP(${host}): hard timeout`);
      try { imap.end(); } catch {}
      finish();
    }, 25000);

    imap.once('ready', () => {
      connected = true;
      console.log(`IMAP connected via ${host}`);
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error(`Inbox error (${host}):`, err.message);
          clearTimeout(hardTimeout);
          try { imap.end(); } catch {}
          return finish();
        }

        imap.search(['UNSEEN'], (err, uids) => {
          if (err || !uids || uids.length === 0) {
            clearTimeout(hardTimeout);
            try { imap.end(); } catch {}
            return finish();
          }

          const fresh = uids.filter(uid => !seenUIDs.has(uid));
          if (fresh.length === 0) {
            sawNewMail = false;
            clearTimeout(hardTimeout);
            try { imap.end(); } catch {}
            return finish();
          }

          sawNewMail = true;
          console.log(`${fresh.length} new message(s) via ${host}`);
          const fetch = imap.fetch(fresh, { bodies: '', markSeen: false });

          fetch.on('message', (msg) => {
            let uid;
            msg.on('attributes', attrs => { uid = attrs.uid; });
            msg.on('body', stream => {
              simpleParser(stream, (err, parsed) => {
                if (!err) processEmail(parsed);
                if (uid) newUIDs.add(uid);
              });
            });
          });

          fetch.once('error', (fetchErr) => {
            console.error(`Fetch error (${host}):`, fetchErr.message);
            clearTimeout(hardTimeout);
            try { imap.end(); } catch {}
            finish();
          });

          fetch.once('end', () => {
            saveSeenUIDs(newUIDs);
            clearTimeout(hardTimeout);
            try { imap.end(); } catch {}
            finish();
          });
        });
      });
    });

    imap.once('error', err => {
      clearTimeout(hardTimeout);
      console.error(`IMAP(${host}):`, err.message);
      finish();
    });

    imap.once('end', () => {
      clearTimeout(hardTimeout);
      console.log(`[${new Date().toLocaleTimeString()}] Check complete (${host})`);
      finish();
    });

    imap.connect();
  });
}

async function checkMail() {
  const seenUIDs = getSeenUIDs();
  const newUIDs = new Set(seenUIDs);

  for (const host of IMAP_HOSTS) {
    const result = await connectAndCheck(host, seenUIDs, newUIDs);
    if (result.connected) return;
    if (result.sawNewMail || newUIDs.size > seenUIDs.size) return;
  }
}

// ─── START ─────────────────────────────────────────────────────────────────
console.log('🌵 Desert Digital Studio — Smart Email Monitor');
console.log(`📬 Watching gabriel@desertdigitalstudio.com every ${CHECK_INTERVAL_MS / 60000} min`);
console.log(`🌙 Quiet hours: ${QUIET_START}:00 – ${QUIET_END}:00 MST (inquiries always alert)`);

checkMail();
setInterval(checkMail, CHECK_INTERVAL_MS);
