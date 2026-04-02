'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('../../tools/site-auditor/lead-intelligence');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const LEAD_MAGNET_FILE = path.join(DATA_DIR, 'lead-magnet-data.json');
const LEAD_MAGNET_STATUSES = ['New', 'Reviewed', 'Followed up', 'Converted'];

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
    statuses: LEAD_MAGNET_STATUSES,
    submissions: []
  };
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function createSubmission(input = {}) {
  const normalizedWebsite = normalizeUrl(input.website);
  const domain = normalizedWebsite ? new URL(normalizedWebsite).hostname.replace(/^www\./, '') : 'website';
  const idBase = input.email || `${input.businessName || input.name || 'audit'}-${domain}`;

  return {
    id: input.id || slugify(idBase),
    status: input.status || 'New',
    name: String(input.name || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    phone: String(input.phone || '').trim(),
    businessName: String(input.businessName || '').trim(),
    website: normalizedWebsite,
    goals: String(input.goals || '').trim(),
    notes: String(input.notes || '').trim(),
    source: input.source || 'Public free audit page',
    audit: input.audit || null,
    crmLeadId: input.crmLeadId || null,
    generated: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(input.generated || {})
    },
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeSubmission(existing, incoming) {
  const seeded = createSubmission(incoming);
  return {
    ...(existing || {}),
    ...seeded,
    id: seeded.id || existing?.id,
    status: incoming.status || existing?.status || seeded.status,
    audit: incoming.audit || existing?.audit || null,
    crmLeadId: incoming.crmLeadId || existing?.crmLeadId || null,
    generated: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(existing?.generated || {}),
      ...(incoming.generated || {})
    },
    createdAt: existing?.createdAt || seeded.createdAt,
    updatedAt: new Date().toISOString()
  };
}

function ensureLeadMagnetFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(LEAD_MAGNET_FILE)) {
    writeJson(LEAD_MAGNET_FILE, blankData());
  }
}

function loadLeadMagnet() {
  ensureLeadMagnetFile();
  return readJson(LEAD_MAGNET_FILE, blankData());
}

function saveLeadMagnet(data) {
  const normalized = {
    ...blankData(),
    ...data,
    statuses: LEAD_MAGNET_STATUSES,
    submissions: (data.submissions || [])
      .map(item => mergeSubmission(null, item))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    updatedAt: new Date().toISOString()
  };

  writeJson(LEAD_MAGNET_FILE, normalized);
  return normalized;
}

function upsertSubmission(data, submission) {
  const current = data || blankData();
  const submissions = [...(current.submissions || [])];
  const index = submissions.findIndex(item => item.id === submission.id || (submission.email && item.email === submission.email && item.website === submission.website));

  if (index >= 0) {
    submissions[index] = mergeSubmission(submissions[index], submission);
  } else {
    submissions.unshift(mergeSubmission(null, submission));
  }

  return {
    ...current,
    statuses: LEAD_MAGNET_STATUSES,
    submissions,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  LEAD_MAGNET_FILE,
  LEAD_MAGNET_STATUSES,
  blankData,
  normalizeUrl,
  createSubmission,
  loadLeadMagnet,
  saveLeadMagnet,
  upsertSubmission,
  mergeSubmission
};
