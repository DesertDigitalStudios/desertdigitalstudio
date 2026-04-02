'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FOLLOWUPS_FILE = path.join(DATA_DIR, 'followups-data.json');
const FOLLOWUP_STATUSES = ['Draft', 'Queued', 'Sent'];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function blankData() {
  return {
    updatedAt: new Date().toISOString(),
    statuses: FOLLOWUP_STATUSES,
    sequences: []
  };
}

function createSequence(input = {}) {
  return {
    id: input.id || `followup-${Date.now()}`,
    leadId: input.leadId || null,
    businessName: input.businessName || '',
    sequenceType: input.sequenceType || 'audit-nudge',
    status: input.status || 'Draft',
    generatedAt: input.generatedAt || new Date().toISOString(),
    steps: input.steps || [],
    htmlPath: input.htmlPath || null,
    jsonPath: input.jsonPath || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeSequence(existing, incoming) {
  const seeded = createSequence(incoming);
  return {
    ...(existing || {}),
    ...seeded,
    id: seeded.id || existing?.id,
    steps: incoming.steps || existing?.steps || [],
    createdAt: existing?.createdAt || seeded.createdAt,
    updatedAt: new Date().toISOString()
  };
}

function ensureFollowupsFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(FOLLOWUPS_FILE)) {
    writeJson(FOLLOWUPS_FILE, blankData());
  }
}

function loadFollowups() {
  ensureFollowupsFile();
  return readJson(FOLLOWUPS_FILE, blankData());
}

function saveFollowups(data) {
  const normalized = {
    ...blankData(),
    ...data,
    statuses: FOLLOWUP_STATUSES,
    sequences: (data.sequences || [])
      .map(item => mergeSequence(null, item))
      .sort((a, b) => new Date(b.generatedAt || b.createdAt || 0) - new Date(a.generatedAt || a.createdAt || 0)),
    updatedAt: new Date().toISOString()
  };
  writeJson(FOLLOWUPS_FILE, normalized);
  return normalized;
}

function upsertSequence(data, sequence) {
  const current = data || blankData();
  const sequences = [...(current.sequences || [])];
  const index = sequences.findIndex(item => item.id === sequence.id);
  if (index >= 0) {
    sequences[index] = mergeSequence(sequences[index], sequence);
  } else {
    sequences.unshift(mergeSequence(null, sequence));
  }
  return {
    ...current,
    statuses: FOLLOWUP_STATUSES,
    sequences,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  FOLLOWUPS_FILE,
  FOLLOWUP_STATUSES,
  blankData,
  createSequence,
  loadFollowups,
  saveFollowups,
  upsertSequence,
  mergeSequence
};
