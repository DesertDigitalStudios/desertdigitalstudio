'use strict';

const fs = require('fs');
const path = require('path');
const { fromAuditBusiness, slugify, computeOutreachScore, normalizeCityLabel } = require('../../tools/site-auditor/lead-intelligence');
const { PACKAGES } = require('../../proposals/builder');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CRM_FILE = path.join(DATA_DIR, 'crm-data.json');
const LEGACY_LEADS_FILE = path.join(ROOT, 'leads.json');
const SAMPLE_REPORTS = [
  path.resolve(ROOT, '../tools/site-auditor/sample-output/report.json')
];

const STAGES = ['Scored', 'Research', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Parked'];
const CONTACT_OVERRIDES = {
  'the-horseshoe-benson': {
    publicEmail: 'thehorseshoe@yahoo.com',
    publicEmails: ['thehorseshoe@yahoo.com'],
    nextAction: 'Follow up on the audit email and offer a simple homepage refresh.'
  },
  'gypsy-sips-caf-sierra-vista': {
    publicEmail: 'gypsygips@gmail.com',
    publicEmails: ['gypsygips@gmail.com'],
    nextAction: 'Follow up on the outreach and turn the audit into a quick proposal.'
  }
};
const SEED_STAGE_OVERRIDES = {
  'the-horseshoe-benson': 'Contacted',
  'gypsy-sips-caf-sierra-vista': 'Contacted'
};

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

function packagesList() {
  return Object.values(PACKAGES).map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    price: pkg.price,
    timeline: pkg.timeline,
    headline: pkg.headline
  }));
}

function buildLeadFromLegacy(lead) {
  const notes = lead.notes || '';
  const emailMatch = notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = notes.match(/(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  const score = typeof lead.score === 'number' ? lead.score : 0;
  const failedChecks = [];

  if (lead.score === 'nosite') failedChecks.push('No Website');
  if (/meta/i.test(notes)) failedChecks.push('Meta Description');
  if (/h1/i.test(notes)) failedChecks.push('H1 Heading');
  if (/copyright|2014|2021/i.test(notes)) failedChecks.push('Copyright Up-to-Date');
  if (/phone missing|contact info/i.test(notes)) failedChecks.push('Contact Info');
  if (/facebook/i.test(notes)) failedChecks.push('Platform / Website Quality');

  const outreach = computeOutreachScore({
    website: lead.score === 'nosite' ? null : '__known-site__',
    siteScore: score,
    error: lead.score === 'nosite' ? 'No website found' : null,
    failedChecks,
    emails: emailMatch ? [emailMatch[0].toLowerCase()] : [],
    phones: phoneMatch ? [phoneMatch[0].trim()] : [],
    platform: /facebook/i.test(notes) ? 'facebook' : 'custom'
  });

  return {
    id: slugify(`${lead.biz}-${normalizeCityLabel(lead.city)}`),
    businessName: lead.biz,
    city: normalizeCityLabel(lead.city),
    website: lead.website || null,
    hasWebsite: lead.score !== 'nosite',
    publicEmail: emailMatch ? emailMatch[0].toLowerCase() : null,
    publicEmails: emailMatch ? [emailMatch[0].toLowerCase()] : [],
    phone: phoneMatch ? phoneMatch[0].trim() : null,
    phones: phoneMatch ? [phoneMatch[0].trim()] : [],
    platform: /facebook/i.test(notes) ? 'facebook' : 'custom',
    outreachScore: outreach.outreachScore,
    outreachTier: outreach.outreachTier,
    shouldPursue: outreach.shouldPursue,
    stage: STAGES.includes(lead.status) ? lead.status : 'Scored',
    auditScore: lead.score === 'nosite' ? 0 : score,
    siteHealth: lead.score === 'nosite' ? 'F' : null,
    leadTemperature: lead.score === 'nosite' ? '🔥🔥🔥 HOT LEAD (no site)' : null,
    topIssues: failedChecks,
    priorityReasons: outreach.priorityReasons,
    cautions: outreach.cautions,
    recommendedPackage: outreach.recommendedPackage,
    estimatedValue: outreach.estimatedValue,
    quickPitch: outreach.quickPitch,
    nextAction: outreach.nextAction,
    lastTouch: null,
    followUpOn: null,
    notes,
    proposal: {
      status: lead.status === 'Proposal' ? 'Drafted' : 'Not started',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      packageId: outreach.recommendedPackage,
      price: outreach.estimatedValue
    },
    sourceReport: 'legacy-dashboard',
    importedAt: new Date().toISOString()
  };
}

function blankData() {
  return {
    updatedAt: new Date().toISOString(),
    packages: packagesList(),
    stages: STAGES,
    metrics: {
      monthlyRevenueGoal: 2000,
      payments: []
    },
    leads: []
  };
}

function mergeLead(existing, incoming) {
  if (!existing) return incoming;
  return {
    ...incoming,
    ...existing,
    businessName: existing.businessName || incoming.businessName,
    city: existing.city || incoming.city,
    website: incoming.website || existing.website,
    publicEmail: incoming.publicEmail || existing.publicEmail,
    publicEmails: incoming.publicEmails?.length ? incoming.publicEmails : (existing.publicEmails || []),
    phone: incoming.phone || existing.phone,
    phones: incoming.phones?.length ? incoming.phones : (existing.phones || []),
    outreachScore: incoming.outreachScore,
    outreachTier: incoming.outreachTier,
    shouldPursue: incoming.shouldPursue,
    auditScore: incoming.auditScore,
    topIssues: incoming.topIssues?.length ? incoming.topIssues : (existing.topIssues || []),
    priorityReasons: incoming.priorityReasons?.length ? incoming.priorityReasons : (existing.priorityReasons || []),
    cautions: incoming.cautions?.length ? incoming.cautions : (existing.cautions || []),
    recommendedPackage: existing.recommendedPackage || incoming.recommendedPackage,
    estimatedValue: existing.estimatedValue || incoming.estimatedValue,
    nextAction: existing.nextAction || incoming.nextAction,
    notes: existing.notes || incoming.notes || '',
    proposal: {
      ...incoming.proposal,
      ...existing.proposal,
      packageId: existing.proposal?.packageId || incoming.proposal?.packageId,
      price: existing.proposal?.price || incoming.proposal?.price
    }
  };
}

function recalcLead(lead) {
  const override = CONTACT_OVERRIDES[lead.id] || {};
  const outreach = computeOutreachScore({
    website: lead.hasWebsite ? (lead.website || '__known-site__') : null,
    siteScore: lead.auditScore,
    error: !lead.hasWebsite ? 'No website found' : null,
    failedChecks: lead.topIssues || [],
    emails: override.publicEmails || lead.publicEmails || (lead.publicEmail ? [lead.publicEmail] : []),
    phones: lead.phones || (lead.phone ? [lead.phone] : []),
    platform: lead.platform || 'custom'
  });

  const seeded = {
    ...lead,
    ...override,
    publicEmail: override.publicEmail || lead.publicEmail || null,
    publicEmails: override.publicEmails || lead.publicEmails || (lead.publicEmail ? [lead.publicEmail] : []),
    hasWebsite: lead.hasWebsite !== false,
    outreachScore: outreach.outreachScore,
    outreachTier: outreach.outreachTier,
    shouldPursue: outreach.shouldPursue,
    priorityReasons: outreach.priorityReasons,
    cautions: outreach.cautions,
    recommendedPackage: lead.recommendedPackage || outreach.recommendedPackage,
    estimatedValue: lead.estimatedValue || outreach.estimatedValue,
    nextAction: lead.nextAction || outreach.nextAction,
    quickPitch: lead.quickPitch || outreach.quickPitch,
    proposal: {
      status: 'Not started',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      packageId: outreach.recommendedPackage,
      price: outreach.estimatedValue,
      ...(lead.proposal || {})
    }
  };

  return seeded;
}

function importAuditReport(data, reportPath) {
  const report = readJson(reportPath, null);
  if (!report || !Array.isArray(report.businesses)) {
    throw new Error(`Invalid audit report: ${reportPath}`);
  }

  const byId = new Map((data.leads || []).map(lead => [lead.id, lead]));
  report.businesses.forEach(business => {
    const imported = fromAuditBusiness(business, reportPath);
    const existing = byId.get(imported.id);
    byId.set(imported.id, mergeLead(existing, imported));
  });

  return {
    ...data,
    leads: Array.from(byId.values()).map(recalcLead).sort((a, b) => b.outreachScore - a.outreachScore),
    updatedAt: new Date().toISOString()
  };
}

function createSeedData() {
  let data = blankData();
  const legacyLeads = readJson(LEGACY_LEADS_FILE, []);
  if (Array.isArray(legacyLeads)) {
    data.leads.push(...legacyLeads.map(buildLeadFromLegacy));
  }

  SAMPLE_REPORTS.forEach(reportPath => {
    if (fs.existsSync(reportPath)) {
      data = importAuditReport(data, reportPath);
    }
  });

  data.leads = data.leads.map(recalcLead)
    .map(lead => ({
      ...lead,
      stage: SEED_STAGE_OVERRIDES[lead.id] || lead.stage
    }))
    .sort((a, b) => b.outreachScore - a.outreachScore);
  data.updatedAt = new Date().toISOString();
  return data;
}

function ensureCRMFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(CRM_FILE)) {
    writeJson(CRM_FILE, createSeedData());
  }
}

function loadCRM() {
  ensureCRMFile();
  return readJson(CRM_FILE, blankData());
}

function saveCRM(data) {
  const normalized = {
    ...blankData(),
    ...data,
    packages: packagesList(),
    stages: STAGES,
    leads: (data.leads || []).map(recalcLead).sort((a, b) => b.outreachScore - a.outreachScore),
    updatedAt: new Date().toISOString()
  };
  writeJson(CRM_FILE, normalized);
  return normalized;
}

module.exports = {
  CRM_FILE,
  STAGES,
  packagesList,
  loadCRM,
  saveCRM,
  ensureCRMFile,
  importAuditReport,
  createSeedData
};
