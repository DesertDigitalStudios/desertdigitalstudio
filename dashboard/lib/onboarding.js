'use strict';

const fs = require('fs');
const path = require('path');
const { PACKAGES } = require('../../proposals/builder');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const ONBOARDING_FILE = path.join(DATA_DIR, 'onboarding-data.json');
const ONBOARDING_STAGES = ['Intake', 'Assets requested', 'Build prep', 'In progress', 'Launch prep', 'Launched'];

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uniqueStrings(values) {
  return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
}

function defaultChecklist() {
  return {
    brandAssets: false,
    photos: false,
    copy: false,
    domainAccess: false,
    hostingAccess: false,
    analytics: false,
    googleBusiness: false,
    launchApproval: false
  };
}

function packageSnapshot(packageId) {
  const pkg = PACKAGES[packageId] || PACKAGES.refresh;
  return {
    packageId: pkg.id,
    packageName: pkg.name,
    price: pkg.price,
    timeline: pkg.timeline,
    headline: pkg.headline,
    deliverables: [...(pkg.deliverables || [])]
  };
}

function blankData() {
  return {
    updatedAt: new Date().toISOString(),
    stages: ONBOARDING_STAGES,
    clients: []
  };
}

function createOnboardingFromLead(lead, overrides = {}) {
  if (!lead || !lead.id) {
    throw new Error('Lead is required to create onboarding');
  }

  const pkg = packageSnapshot(overrides.packageId || lead.proposal?.packageId || lead.recommendedPackage || 'refresh');
  const kickoffDate = overrides.kickoffDate || todayISO();

  return {
    id: overrides.id || lead.id,
    leadId: lead.id,
    businessName: overrides.businessName || lead.businessName,
    website: overrides.website || lead.website || '',
    contactName: overrides.contactName || '',
    contactEmail: overrides.contactEmail || lead.publicEmail || '',
    contactPhone: overrides.contactPhone || lead.phone || '',
    status: overrides.status || 'Intake',
    kickoffDate,
    launchTargetDate: overrides.launchTargetDate || '',
    packageId: pkg.packageId,
    packageName: overrides.packageName || pkg.packageName,
    price: Number(overrides.price || lead.proposal?.price || lead.estimatedValue || pkg.price || 0),
    timeline: overrides.timeline || pkg.timeline,
    headline: overrides.headline || pkg.headline,
    deliverables: uniqueStrings(overrides.deliverables?.length ? overrides.deliverables : pkg.deliverables),
    goals: overrides.goals || '',
    priorityPages: uniqueStrings(overrides.priorityPages || []),
    requestedFeatures: uniqueStrings(overrides.requestedFeatures || []),
    notes: overrides.notes || '',
    checklist: {
      ...defaultChecklist(),
      ...(overrides.checklist || {})
    },
    packet: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(overrides.packet || {})
    },
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeClient(existing, incoming) {
  const pkg = packageSnapshot(incoming.packageId || existing?.packageId || 'refresh');
  return {
    ...(existing || {}),
    ...(incoming || {}),
    id: incoming.id || existing?.id,
    leadId: incoming.leadId || existing?.leadId,
    businessName: incoming.businessName || existing?.businessName,
    website: incoming.website || existing?.website || '',
    contactName: incoming.contactName || existing?.contactName || '',
    contactEmail: incoming.contactEmail || existing?.contactEmail || '',
    contactPhone: incoming.contactPhone || existing?.contactPhone || '',
    status: incoming.status || existing?.status || 'Intake',
    packageId: incoming.packageId || existing?.packageId || pkg.packageId,
    packageName: incoming.packageName || existing?.packageName || pkg.packageName,
    price: Number(incoming.price || existing?.price || pkg.price || 0),
    timeline: incoming.timeline || existing?.timeline || pkg.timeline,
    headline: incoming.headline || existing?.headline || pkg.headline,
    deliverables: uniqueStrings(
      incoming.deliverables?.length ? incoming.deliverables
        : existing?.deliverables?.length ? existing.deliverables
        : pkg.deliverables
    ),
    goals: incoming.goals || existing?.goals || '',
    priorityPages: uniqueStrings(incoming.priorityPages?.length ? incoming.priorityPages : (existing?.priorityPages || [])),
    requestedFeatures: uniqueStrings(incoming.requestedFeatures?.length ? incoming.requestedFeatures : (existing?.requestedFeatures || [])),
    notes: incoming.notes || existing?.notes || '',
    checklist: {
      ...defaultChecklist(),
      ...(existing?.checklist || {}),
      ...(incoming.checklist || {})
    },
    packet: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(existing?.packet || {}),
      ...(incoming.packet || {})
    },
    createdAt: existing?.createdAt || incoming.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function ensureOnboardingFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(ONBOARDING_FILE)) {
    writeJson(ONBOARDING_FILE, blankData());
  }
}

function loadOnboarding() {
  ensureOnboardingFile();
  return readJson(ONBOARDING_FILE, blankData());
}

function saveOnboarding(data) {
  const normalized = {
    ...blankData(),
    ...data,
    stages: ONBOARDING_STAGES,
    clients: (data.clients || [])
      .map(client => mergeClient(null, client))
      .sort((a, b) => String(a.businessName || '').localeCompare(String(b.businessName || ''))),
    updatedAt: new Date().toISOString()
  };

  writeJson(ONBOARDING_FILE, normalized);
  return normalized;
}

function upsertClient(data, client) {
  const current = data || blankData();
  const clients = [...(current.clients || [])];
  const index = clients.findIndex(item => item.id === client.id || item.leadId === client.leadId);

  if (index >= 0) {
    clients[index] = mergeClient(clients[index], client);
  } else {
    clients.push(mergeClient(null, client));
  }

  return {
    ...current,
    stages: ONBOARDING_STAGES,
    clients,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  ONBOARDING_FILE,
  ONBOARDING_STAGES,
  blankData,
  defaultChecklist,
  packageSnapshot,
  createOnboardingFromLead,
  mergeClient,
  ensureOnboardingFile,
  loadOnboarding,
  saveOnboarding,
  upsertClient
};
