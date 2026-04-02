'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CONTENT_ENGINE_FILE = path.join(DATA_DIR, 'content-engine-data.json');
const CONTENT_STATUSES = ['Draft', 'Queued', 'Published'];

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
    statuses: CONTENT_STATUSES,
    drafts: []
  };
}

function createDraft(input = {}) {
  return {
    id: input.id || `content-${Date.now()}`,
    status: input.status || 'Draft',
    title: input.title || 'Untitled content pack',
    sourceType: input.sourceType || 'service',
    sourceId: input.sourceId || 'refresh',
    audience: input.audience || 'Local business owners',
    angle: input.angle || '',
    callToAction: input.callToAction || 'Book a free audit',
    generatedAt: input.generatedAt || new Date().toISOString(),
    outputs: input.outputs || {},
    htmlPath: input.htmlPath || null,
    jsonPath: input.jsonPath || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeDraft(existing, incoming) {
  const seeded = createDraft(incoming);
  return {
    ...(existing || {}),
    ...seeded,
    id: seeded.id || existing?.id,
    outputs: incoming.outputs || existing?.outputs || {},
    createdAt: existing?.createdAt || seeded.createdAt,
    updatedAt: new Date().toISOString()
  };
}

function ensureContentEngineFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(CONTENT_ENGINE_FILE)) {
    writeJson(CONTENT_ENGINE_FILE, blankData());
  }
}

function loadContentEngine() {
  ensureContentEngineFile();
  return readJson(CONTENT_ENGINE_FILE, blankData());
}

function saveContentEngine(data) {
  const normalized = {
    ...blankData(),
    ...data,
    statuses: CONTENT_STATUSES,
    drafts: (data.drafts || [])
      .map(item => mergeDraft(null, item))
      .sort((a, b) => new Date(b.generatedAt || b.createdAt || 0) - new Date(a.generatedAt || a.createdAt || 0)),
    updatedAt: new Date().toISOString()
  };

  writeJson(CONTENT_ENGINE_FILE, normalized);
  return normalized;
}

function upsertDraft(data, draft) {
  const current = data || blankData();
  const drafts = [...(current.drafts || [])];
  const index = drafts.findIndex(item => item.id === draft.id);

  if (index >= 0) {
    drafts[index] = mergeDraft(drafts[index], draft);
  } else {
    drafts.unshift(mergeDraft(null, draft));
  }

  return {
    ...current,
    statuses: CONTENT_STATUSES,
    drafts,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  CONTENT_ENGINE_FILE,
  CONTENT_STATUSES,
  blankData,
  createDraft,
  loadContentEngine,
  saveContentEngine,
  upsertDraft,
  mergeDraft
};
