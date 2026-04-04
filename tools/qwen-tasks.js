#!/usr/bin/env node
/**
 * qwen-tasks.js
 * Local Qwen3 task runner for Desert Digital Studio.
 * All tasks run free via Ollama — zero API cost.
 *
 * Tasks:
 *   morning-brief     - plain-English lead summary
 *   outreach-draft    - first-pass outreach email for a lead
 *   reply-draft       - suggested reply to an inbound email
 *   followup-copy     - personalized follow-up sequence copy
 *   social-caption    - Instagram/Facebook caption ideas
 *   lead-summary      - one-paragraph lead research summary
 *   content-ideas     - content calendar ideas
 *   client-copy       - FAQ/about page copy for a client
 */

'use strict';

const http = require('http');

const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL = 'qwen3:14b';
const DEFAULT_TIMEOUT = 120000; // 2 min

function callQwen(prompt, opts = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: opts.temperature ?? 0.4,
        num_predict: opts.maxTokens ?? 600
      }
    });

    const req = http.request({
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          let text = (parsed.response || '').trim();
          // Strip <think>...</think> blocks (Qwen3 reasoning mode)
          text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
          resolve(text);
        } catch (e) {
          reject(new Error('Failed to parse Qwen response: ' + e.message));
        }
      });
    });

    req.setTimeout(DEFAULT_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Qwen request timed out'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── TASKS ───────────────────────────────────────────────────

async function morningBrief(leads) {
  if (!leads || !leads.length) return 'No new leads with clean emails today.';
  const leadsText = leads.slice(0, 6).map(l =>
    `- ${l.name} in ${l.city} | score ${l.score} | email: ${l.email || 'none'} | ${l.pitch || ''}`
  ).join('\n');
  return callQwen(
    `You are a brief writer for a small web design studio in Southern Arizona. Write a plain-English morning brief (4-6 sentences max) covering these new leads. Tell the owner which to contact first, why, and any quick notes. Be direct, casual, practical. No bullet points — flowing sentences.\n\nLeads:\n${leadsText}`
  );
}

async function outreachDraft(lead) {
  const issues = (lead.topIssues || []).slice(0, 3).join(', ') || 'a few trust and SEO issues';
  const noSite = !lead.website || !lead.hasWebsite;
  const prompt = noSite
    ? `Write a short, warm outreach email from Gabriel Maciel at Desert Digital Studio (based in Benson, AZ) to the owner of ${lead.businessName} in ${lead.city}. They have no website. Pitch building them a simple first site that helps customers find and contact them. Keep it under 120 words, casual, local, and non-pushy. Sign off with name, studio name, website (desertdigitalstudio.com), and phone (210) 993-0509. No subject line — just the body.`
    : `Write a short, warm outreach email from Gabriel Maciel at Desert Digital Studio (based in Benson, AZ) to the owner of ${lead.businessName} in ${lead.city}. Their website has these specific issues: ${issues}. Mention 2-3 of those issues naturally and offer a free audit summary. Keep it under 130 words, casual, local, non-pushy. Sign off with name, studio name, website (desertdigitalstudio.com), and phone (210) 993-0509. No subject line — just the body.`;
  return callQwen(prompt, { temperature: 0.5 });
}

async function replyDraft(email) {
  const from = email.from || 'the sender';
  const subject = email.subject || '(no subject)';
  const body = (email.body || '').slice(0, 600);
  return callQwen(
    `You are drafting a reply email for Gabriel Maciel at Desert Digital Studio. The incoming email is from ${from} with subject "${subject}". Here is the message:\n\n${body}\n\nWrite a short, warm, professional reply (under 100 words). Be helpful and direct. Do not add a subject line — just the reply body. Sign off as Gabriel, Desert Digital Studio.`,
    { temperature: 0.4 }
  );
}

async function followupCopy(lead, stepNumber, previousTouch) {
  const biz = lead.businessName;
  const issues = (lead.topIssues || []).slice(0, 2).join(' and ') || 'some website issues';
  const stepGuide = stepNumber === 1
    ? 'This is the first follow-up after no reply to the initial outreach. Friendly bump, mention the specific issues again briefly.'
    : stepNumber === 2
    ? 'This is the second follow-up. Soften the pitch — offer just the short version of the audit findings.'
    : 'This is the final soft-close follow-up. Low pressure, leave the door open, no guilt.';
  return callQwen(
    `Write a short follow-up email body (under 90 words) from Gabriel Maciel at Desert Digital Studio to the owner of ${biz}. Context: ${stepGuide}. The site issues were: ${issues}. Casual, local, warm, not salesy. Sign off as Gabriel. No subject line.`,
    { temperature: 0.5 }
  );
}

async function socialCaption(topic, audience = 'Southern Arizona small business owners') {
  return callQwen(
    `Write 3 short Instagram/Facebook caption options for Desert Digital Studio, a web design studio based in Benson AZ serving Southern Arizona small businesses. Topic: ${topic}. Audience: ${audience}. Each caption should be 1-3 sentences, conversational, end with a soft CTA or question, and include 3-5 relevant hashtags. Label them Option 1, Option 2, Option 3.`,
    { temperature: 0.7, maxTokens: 500 }
  );
}

async function leadSummary(lead) {
  const hasEmail = lead.publicEmail ? `Reachable at ${lead.publicEmail}.` : 'No public email — phone or walk-in only.';
  const issues = (lead.topIssues || []).join(', ') || 'general improvement areas';
  const noSite = !lead.hasWebsite;
  return callQwen(
    `Write a one-paragraph (3-4 sentences) internal lead summary for a web designer reviewing their outreach list. Business: ${lead.businessName} in ${lead.city}. ${noSite ? 'They have no website.' : `Their site has these issues: ${issues}.`} ${hasEmail} Outreach score: ${lead.outreachScore}. Explain why or why not to reach out, and the best approach. Be practical and direct.`,
    { temperature: 0.4 }
  );
}

async function contentIdeas(niche = 'web design for Southern Arizona small businesses', count = 10) {
  return callQwen(
    `Generate ${count} specific content ideas for an Instagram/Facebook/blog for a web design studio in Southern Arizona targeting local small businesses (restaurants, salons, barbers, auto shops, tattoo studios, etc.). Make the ideas practical, local, and useful for a one-person studio. Format as a numbered list.`,
    { temperature: 0.7, maxTokens: 700 }
  );
}

async function clientCopy(business, section, bullets) {
  const bulletText = (bullets || []).join('\n- ');
  return callQwen(
    `Write ${section} copy for a small business website. Business: ${business.name} in ${business.city}, category: ${business.category || 'local business'}. Key points to include:\n- ${bulletText}\n\nWrite in a warm, professional tone. 2-4 short paragraphs. No headers or markdown. This will go directly on their website.`,
    { temperature: 0.6, maxTokens: 500 }
  );
}

// ─── CLI / MODULE EXPORT ──────────────────────────────────────

const TASKS = { morningBrief, outreachDraft, replyDraft, followupCopy, socialCaption, leadSummary, contentIdeas, clientCopy };

if (require.main === module) {
  const task = process.argv[2];
  const inputPath = process.argv[3];

  if (!task || !TASKS[task]) {
    console.error(`Usage: node qwen-tasks.js <task> [input.json]\nTasks: ${Object.keys(TASKS).join(', ')}`);
    process.exit(1);
  }

  let input = {};
  if (inputPath) {
    try { input = JSON.parse(require('fs').readFileSync(inputPath, 'utf8')); } catch (e) { /* ok */ }
  }

  (async () => {
    try {
      // Allow flexible CLI usage — pass the whole input object or wrap it
      const result = await TASKS[task](input.leads || input.lead || input.email || input.topic || input.business || input);
      console.log(result);
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  })();
} else {
  module.exports = TASKS;
}
