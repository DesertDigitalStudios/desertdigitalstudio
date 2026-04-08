#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const STATE_PATH = path.resolve(__dirname, 'openclaw-usage-state.json');
const THRESHOLD = 50;

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function getUsage() {
  const raw = execFileSync('openclaw', ['status', '--json', '--usage'], {
    encoding: 'utf8',
    timeout: 30000
  });
  return JSON.parse(raw);
}

function main() {
  const status = getUsage();
  const provider = (status.usage?.providers || []).find(p => p.provider === 'openai-codex');
  const week = (provider?.windows || []).find(w => String(w.label).toLowerCase() === 'week');

  if (!week || typeof week.usedPercent !== 'number') {
    console.log('No weekly OpenAI/Codex usage window found.');
    return;
  }

  const state = loadState();
  const resetAt = week.resetAt || null;
  if (state.resetAt !== resetAt) {
    state.resetAt = resetAt;
    state.week50Alerted = false;
  }

  state.lastSeenPercent = week.usedPercent;
  state.lastCheckedAt = new Date().toISOString();

  if (week.usedPercent >= THRESHOLD && !state.week50Alerted) {
    const msg = `Heads up — OpenClaw weekly GPT usage just hit ${week.usedPercent}% of the ChatGPT/Codex limit.`;
    execFileSync('openclaw', ['system', 'event', '--mode', 'now', '--text', msg], {
      encoding: 'utf8',
      timeout: 30000
    });
    state.week50Alerted = true;
    state.week50AlertedAt = new Date().toISOString();
    console.log(`Alert sent at ${week.usedPercent}%`);
  } else {
    console.log(`Weekly usage at ${week.usedPercent}%, no alert needed.`);
  }

  saveState(state);
}

main();
