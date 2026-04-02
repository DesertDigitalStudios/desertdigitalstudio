'use strict';

const fs = require('fs');
const path = require('path');
const { slugify } = require('../../tools/site-auditor/lead-intelligence');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CASE_STUDIES_FILE = path.join(DATA_DIR, 'case-studies-data.json');
const CASE_STUDY_STATUSES = ['Draft', 'Review', 'Published'];

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

function uniqueStrings(values) {
  return [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
}

function blankData() {
  return {
    updatedAt: new Date().toISOString(),
    statuses: CASE_STUDY_STATUSES,
    studies: []
  };
}

function defaultMetrics(auditScore = 0) {
  const beforeScore = Number(auditScore || 0);
  const afterScore = beforeScore ? Math.min(beforeScore + 18, 98) : 85;
  return [
    { label: 'Website audit score', before: beforeScore || 'Not measured', after: afterScore, change: beforeScore ? `+${afterScore - beforeScore}` : 'Set baseline' },
    { label: 'Customer trust', before: 'Inconsistent', after: 'Clear + modern', change: 'Better first impression' },
    { label: 'Mobile path', before: 'Friction', after: 'Fast call / map / contact path', change: 'Cleaner conversions' }
  ];
}

function createCaseStudyFromLead(lead, overrides = {}) {
  if (!lead || !lead.id) {
    throw new Error('Lead is required to seed a case study');
  }

  const issueList = uniqueStrings(overrides.challengePoints?.length ? overrides.challengePoints : (lead.topIssues || []));
  const deliverables = uniqueStrings(overrides.deliverables?.length ? overrides.deliverables : [
    lead.hasWebsite === false ? 'Launch a real business website' : 'Homepage refresh',
    'Mobile cleanup',
    'Clear contact / CTA path',
    'SEO basics and metadata pass'
  ]);

  return {
    id: overrides.id || `${lead.id}-case-study`,
    leadId: lead.id,
    businessName: overrides.businessName || lead.businessName,
    city: overrides.city || lead.city || '',
    website: overrides.website || lead.website || '',
    status: overrides.status || 'Draft',
    headline: overrides.headline || `${lead.businessName}: from ${lead.hasWebsite === false ? 'no real website' : 'friction-heavy website'} to a cleaner customer path`,
    industry: overrides.industry || 'Local business',
    projectType: overrides.projectType || (lead.recommendedPackage === 'launch-pad' ? 'Website launch' : 'Website refresh'),
    summary: overrides.summary || lead.quickPitch || 'Draft before/after story seeded from CRM data. Replace the projected details with real client results before publishing publicly.',
    challenge: overrides.challenge || `The starting point was a weaker-than-it-should-be website presence with issues around ${issueList.length ? issueList.join(', ').toLowerCase() : 'trust, clarity, and conversion'}.`,
    solution: overrides.solution || 'DDS tightened the structure, messaging, contact flow, and trust signals so the site feels easier to use and easier to trust.',
    outcome: overrides.outcome || 'Draft outcome placeholder: replace this with the real result after launch, review, or client feedback.',
    challengePoints: issueList.length ? issueList : ['Weak first impression', 'Unclear next step for visitors'],
    deliverables,
    wins: uniqueStrings(overrides.wins?.length ? overrides.wins : [
      lead.hasWebsite === false ? 'Business now has a real website foundation' : 'Cleaner first impression',
      'Stronger mobile contact flow',
      'More obvious calls to action'
    ]),
    metrics: Array.isArray(overrides.metrics) && overrides.metrics.length ? overrides.metrics : defaultMetrics(lead.auditScore),
    testimonial: overrides.testimonial || 'Add the client quote here once the project is complete.',
    quoteAttribution: overrides.quoteAttribution || `${lead.businessName} team`,
    before: {
      label: 'Before',
      score: Number(overrides.before?.score ?? lead.auditScore ?? 0),
      notes: overrides.before?.notes || `Saved CRM issues: ${(lead.topIssues || []).join(', ') || 'General cleanup needed'}`,
      screenshotPath: overrides.before?.screenshotPath || ''
    },
    after: {
      label: 'After',
      score: Number(overrides.after?.score ?? (lead.auditScore ? Math.min(Number(lead.auditScore) + 18, 98) : 85)),
      notes: overrides.after?.notes || 'Replace with real after-launch notes, screenshots, and measurable improvement.',
      screenshotPath: overrides.after?.screenshotPath || ''
    },
    generated: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(overrides.generated || {})
    },
    createdAt: overrides.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeStudy(existing, incoming) {
  return {
    ...(existing || {}),
    ...(incoming || {}),
    id: incoming.id || existing?.id || `${slugify(incoming.businessName || existing?.businessName || 'case-study')}-case-study`,
    leadId: incoming.leadId || existing?.leadId || null,
    businessName: incoming.businessName || existing?.businessName || '',
    city: incoming.city || existing?.city || '',
    website: incoming.website || existing?.website || '',
    status: incoming.status || existing?.status || 'Draft',
    headline: incoming.headline || existing?.headline || '',
    industry: incoming.industry || existing?.industry || 'Local business',
    projectType: incoming.projectType || existing?.projectType || 'Website refresh',
    summary: incoming.summary || existing?.summary || '',
    challenge: incoming.challenge || existing?.challenge || '',
    solution: incoming.solution || existing?.solution || '',
    outcome: incoming.outcome || existing?.outcome || '',
    challengePoints: uniqueStrings(incoming.challengePoints?.length ? incoming.challengePoints : (existing?.challengePoints || [])),
    deliverables: uniqueStrings(incoming.deliverables?.length ? incoming.deliverables : (existing?.deliverables || [])),
    wins: uniqueStrings(incoming.wins?.length ? incoming.wins : (existing?.wins || [])),
    metrics: Array.isArray(incoming.metrics) && incoming.metrics.length ? incoming.metrics : (existing?.metrics || []),
    testimonial: incoming.testimonial || existing?.testimonial || '',
    quoteAttribution: incoming.quoteAttribution || existing?.quoteAttribution || '',
    before: {
      ...(existing?.before || {}),
      ...(incoming.before || {})
    },
    after: {
      ...(existing?.after || {}),
      ...(incoming.after || {})
    },
    generated: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null,
      ...(existing?.generated || {}),
      ...(incoming.generated || {})
    },
    createdAt: existing?.createdAt || incoming.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function ensureCaseStudiesFile() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(CASE_STUDIES_FILE)) {
    writeJson(CASE_STUDIES_FILE, blankData());
  }
}

function loadCaseStudies() {
  ensureCaseStudiesFile();
  return readJson(CASE_STUDIES_FILE, blankData());
}

function saveCaseStudies(data) {
  const normalized = {
    ...blankData(),
    ...data,
    statuses: CASE_STUDY_STATUSES,
    studies: (data.studies || [])
      .map(study => mergeStudy(null, study))
      .sort((a, b) => String(a.businessName || '').localeCompare(String(b.businessName || ''))),
    updatedAt: new Date().toISOString()
  };

  writeJson(CASE_STUDIES_FILE, normalized);
  return normalized;
}

function upsertStudy(data, study) {
  const current = data || blankData();
  const studies = [...(current.studies || [])];
  const index = studies.findIndex(item => item.id === study.id || (study.leadId && item.leadId === study.leadId));

  if (index >= 0) {
    studies[index] = mergeStudy(studies[index], study);
  } else {
    studies.push(mergeStudy(null, study));
  }

  return {
    ...current,
    statuses: CASE_STUDY_STATUSES,
    studies,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  CASE_STUDIES_FILE,
  CASE_STUDY_STATUSES,
  blankData,
  createCaseStudyFromLead,
  loadCaseStudies,
  saveCaseStudies,
  upsertStudy,
  mergeStudy
};
