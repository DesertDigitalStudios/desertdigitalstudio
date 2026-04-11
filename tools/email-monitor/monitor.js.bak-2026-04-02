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
const IMAP_CONFIG = {
  user: 'gabriel@desertdigitalstudio.com',
  password: 'arP6jSWisQ2H',
  host: 'imap.zoho.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const DISCORD_CHANNEL = 'channel:1487016164931539024';
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes
const STATE_FILE = path.join(__dirname, '.email-state.json');
const LOG_FILE = path.join(__dirname, 'email-log.json');

// Quiet hours (no pings) — MST
const QUIET_START = 22; // 10pm
const QUIET_END = 7;    // 7am

// Keywords that flag a client inquiry
const INQUIRY_KEYWORDS = ['website', 'quote', 'price', 'cost', 'interested', 'design', 'help', 'build', 'seo', 'hire', 'contact', 'inquiry', 'services'];

// Senders/domains to ignore (spam/marketing)
const IGNORE_PATTERNS = ['noreply@', 'no-reply@', 'donotreply@', 'newsletter@', 'marketing@', 'notifications@', 'hello@squarespace', 'mail@waveapps', 'zoho.com'];

// ─── HELPERS ───────────────────────────────────────────────────────────────
function getSeenUIDs() {
  try { return new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')).uids || []); }
  catch { return new Set(); }
}

function saveSeenUIDs(uids) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ uids: [...uids] }));
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

function classifyEmail(subject, body, from) {
  const text = ((subject || '') + ' ' + (body || '')).toLowerCase();
  const isInquiry = INQUIRY_KEYWORDS.some(kw => text.includes(kw));
  const isReply = (subject || '').toLowerCase().startsWith('re:');
  
  if (isInquiry) return { type: 'inquiry', emoji: '🔥', label: 'CLIENT INQUIRY' };
  if (isReply) return { type: 'reply', emoji: '💬', label: 'REPLY' };
  return { type: 'general', emoji: '📬', label: 'NEW EMAIL' };
}

function draftReply(subject, body, from) {
  const text = ((body || '')).slice(0, 500);
  const firstName = (from || '').split(/[\s<@]/)[0] || 'there';
  
  // Simple template-based draft
  if (INQUIRY_KEYWORDS.some(kw => text.toLowerCase().includes(kw))) {
    return `Hi ${firstName},\n\nThank you for reaching out to Desert Digital Studio! I'd love to learn more about what you're looking for.\n\nI'll give you a call or follow up shortly — or feel free to reply here with any details about your business and what you need.\n\nLooking forward to connecting!\n\nGabriel\nDesert Digital Studio\ngabriel@desertdigitalstudio.com\ndesertdigitalstudio.com`;
  }
  return null;
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

  if (shouldIgnore(from)) {
    console.log('Ignored (marketing/noreply):', subject);
    return;
  }

  const { type, emoji, label } = classifyEmail(subject, body, from);
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
function checkMail() {
  const imap = new Imap(IMAP_CONFIG);
  const seenUIDs = getSeenUIDs();
  const newUIDs = new Set(seenUIDs);

  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err) => {
      if (err) { console.error('Inbox error:', err.message); imap.end(); return; }

      imap.search(['UNSEEN'], (err, uids) => {
        if (err || !uids || uids.length === 0) {
          imap.end(); return;
        }

        const fresh = uids.filter(uid => !seenUIDs.has(uid));
        if (fresh.length === 0) { imap.end(); return; }

        console.log(`${fresh.length} new message(s)`);
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

        fetch.once('end', () => {
          saveSeenUIDs(newUIDs);
          imap.end();
        });
      });
    });
  });

  imap.once('error', err => console.error('IMAP:', err.message));
  imap.once('end', () => console.log(`[${new Date().toLocaleTimeString()}] Check complete`));
  imap.connect();
}

// ─── START ─────────────────────────────────────────────────────────────────
console.log('🌵 Desert Digital Studio — Smart Email Monitor');
console.log(`📬 Watching gabriel@desertdigitalstudio.com every ${CHECK_INTERVAL_MS / 60000} min`);
console.log(`🌙 Quiet hours: ${QUIET_START}:00 – ${QUIET_END}:00 MST (inquiries always alert)`);

checkMail();
setInterval(checkMail, CHECK_INTERVAL_MS);
