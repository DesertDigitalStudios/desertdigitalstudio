const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadCRM, saveCRM, importAuditReport, packagesList } = require('./lib/crm');
const { loadOnboarding, saveOnboarding, createOnboardingFromLead, mergeClient, upsertClient } = require('./lib/onboarding');
const { loadCaseStudies, saveCaseStudies, createCaseStudyFromLead, upsertStudy } = require('./lib/case-studies');
const { loadLeadMagnet, saveLeadMagnet, createSubmission, upsertSubmission } = require('./lib/lead-magnet');
const { loadContentEngine, saveContentEngine, upsertDraft } = require('./lib/content-engine');
const { loadFollowups, saveFollowups, upsertSequence } = require('./lib/followups');
const { generateProposalFiles } = require('../proposals/builder');
const { generateAuditFiles } = require('../audits/builder');
const { generateOnboardingPacket } = require('../onboarding/builder');
const { generateCaseStudyFiles } = require('../case-studies/builder');
const { runFreeAudit, generateLeadMagnetFiles } = require('../lead-magnet/builder');
const { generateContentDraft, saveContentDraft } = require('../content-engine/builder');
const { generateFollowupSequence, saveFollowupSequence } = require('../followups/builder');

const app = express();
const EMAIL_LOG = '/Users/gabrielmaciel/.openclaw/workspace/tools/email-monitor/email-log.json';

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(__dirname));
app.use('/free-audit', express.static(path.resolve(__dirname, '../lead-magnet/public')));

function safeReadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function findLead(crm, leadId) {
  return (crm.leads || []).find(lead => lead.id === leadId);
}

function findClient(onboarding, leadId) {
  return (onboarding.clients || []).find(client => client.leadId === leadId || client.id === leadId);
}

function findCaseStudy(caseStudies, studyId) {
  return (caseStudies.studies || []).find(study => study.id === studyId || study.leadId === studyId);
}

function upsertCRMLeadFromInboundAudit(payload) {
  const crm = loadCRM();
  const leadId = payload.crmLeadId || payload.id;
  const existing = (crm.leads || []).find(lead => lead.id === leadId || (payload.email && lead.publicEmail === payload.email && lead.website === payload.website));
  const inboundLead = {
    ...(existing || {}),
    id: leadId,
    businessName: payload.businessName || existing?.businessName || payload.name || 'Inbound audit lead',
    city: existing?.city || '',
    website: payload.website || existing?.website || '',
    hasWebsite: true,
    publicEmail: payload.email || existing?.publicEmail || null,
    publicEmails: payload.email ? [payload.email] : (existing?.publicEmails || []),
    phone: payload.phone || existing?.phone || null,
    phones: payload.phone ? [payload.phone] : (existing?.phones || []),
    platform: existing?.platform || 'custom',
    stage: existing?.stage || 'Qualified',
    auditScore: payload.audit?.score || existing?.auditScore || 0,
    topIssues: payload.audit?.topIssues || existing?.topIssues || [],
    quickPitch: payload.audit?.summary || existing?.quickPitch || 'Inbound free audit request submitted through the public lead magnet.',
    notes: [
      'Inbound lead from public free audit page.',
      payload.goals ? `Goals: ${payload.goals}` : '',
      payload.audit?.summary ? `Audit summary: ${payload.audit.summary}` : ''
    ].filter(Boolean).join(' '),
    nextAction: existing?.nextAction || 'Reply with the audit summary and offer a manual review call.',
    proposal: existing?.proposal || {
      status: 'Not started',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      packageId: 'refresh',
      price: 900
    }
  };

  const next = {
    ...crm,
    leads: [...(crm.leads || []).filter(lead => lead.id !== inboundLead.id), inboundLead]
  };
  const saved = saveCRM(next);
  return (saved.leads || []).find(lead => lead.id === inboundLead.id);
}

function resolveContentSource({ sourceType, sourceId }) {
  if (sourceType === 'case-study') {
    const caseStudies = loadCaseStudies();
    return findCaseStudy(caseStudies, sourceId);
  }

  if (sourceType === 'lead-magnet') {
    const leadMagnet = loadLeadMagnet();
    return (leadMagnet.submissions || []).find(item => item.id === sourceId);
  }

  if (sourceType === 'lead') {
    const crm = loadCRM();
    return findLead(crm, sourceId);
  }

  return { id: sourceId };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, at: new Date().toISOString() });
});

app.get('/emails', (req, res) => {
  const data = safeReadJson(EMAIL_LOG, []);
  res.json(Array.isArray(data) ? data.slice(0, 10) : []);
});

app.get('/api/crm', (req, res) => {
  res.json(loadCRM());
});

app.post('/api/crm', (req, res) => {
  try {
    const saved = saveCRM(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crm/import-audit', (req, res) => {
  try {
    const reportPath = req.body?.reportPath;
    if (!reportPath) {
      return res.status(400).json({ error: 'reportPath is required' });
    }

    const crm = loadCRM();
    const merged = importAuditReport(crm, reportPath);
    const saved = saveCRM(merged);
    res.json({
      ok: true,
      importedFrom: path.resolve(reportPath),
      totalLeads: saved.leads.length,
      crm: saved
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/crm/recalculate', (req, res) => {
  try {
    const saved = saveCRM(loadCRM());
    res.json({ ok: true, crm: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposals/generate', async (req, res) => {
  try {
    const { leadId, packageId, price, focusNote = '' } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await generateProposalFiles({
      lead,
      packageId: packageId || lead.proposal?.packageId,
      price: Number(price || lead.proposal?.price || 0),
      focusNote
    });

    const updated = {
      ...crm,
      leads: crm.leads.map(item => item.id === leadId ? {
        ...item,
        stage: item.stage === 'Won' ? 'Won' : 'Proposal',
        proposal: {
          ...(item.proposal || {}),
          status: 'Drafted',
          packageId: result.package.id,
          price: result.price,
          lastGeneratedAt: new Date().toISOString(),
          htmlPath: result.htmlPath,
          pdfPath: result.pdfPath,
          jsonPath: result.jsonPath
        }
      } : item)
    };

    saveCRM(updated);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audits/generate', async (req, res) => {
  try {
    const { leadId, packageId, price, introNote = '', focusNote = '' } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await generateAuditFiles({
      lead,
      packageId: packageId || lead.auditReport?.packageId || lead.proposal?.packageId || lead.recommendedPackage,
      price: Number(price || lead.auditReport?.price || lead.proposal?.price || lead.estimatedValue || 0),
      introNote,
      focusNote
    });

    const updated = {
      ...crm,
      leads: crm.leads.map(item => item.id === leadId ? {
        ...item,
        auditReport: {
          ...(item.auditReport || {}),
          status: 'Generated',
          packageId: result.package.id,
          price: result.price,
          score: result.score,
          lastGeneratedAt: new Date().toISOString(),
          htmlPath: result.htmlPath,
          pdfPath: result.pdfPath,
          jsonPath: result.jsonPath
        }
      } : item)
    };

    const saved = saveCRM(updated);
    res.json({ ok: true, result, crm: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/onboarding', (req, res) => {
  res.json(loadOnboarding());
});

app.post('/api/onboarding', (req, res) => {
  try {
    const saved = saveOnboarding(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/onboarding/seed-from-lead', (req, res) => {
  try {
    const { leadId, overrides = {} } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const onboarding = loadOnboarding();
    const seeded = createOnboardingFromLead(lead, overrides);
    const saved = saveOnboarding(upsertClient(onboarding, seeded));
    res.json({ ok: true, onboarding: saved, client: findClient(saved, leadId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/onboarding/generate-packet', async (req, res) => {
  try {
    const { leadId, client = {} } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    let onboarding = loadOnboarding();
    const existing = findClient(onboarding, leadId);
    const seeded = createOnboardingFromLead(lead, client);
    const mergedClient = existing ? mergeClient(existing, seeded) : seeded;
    const result = await generateOnboardingPacket({ client: mergedClient });

    onboarding = saveOnboarding(upsertClient(onboarding, {
      ...mergedClient,
      packet: {
        ...(mergedClient.packet || {}),
        status: 'Generated',
        lastGeneratedAt: new Date().toISOString(),
        htmlPath: result.htmlPath,
        pdfPath: result.pdfPath,
        jsonPath: result.jsonPath
      }
    }));

    res.json({ ok: true, result, onboarding, client: findClient(onboarding, leadId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/packages', (req, res) => {
  res.json(packagesList());
});

app.get('/api/case-studies', (req, res) => {
  res.json(loadCaseStudies());
});

app.post('/api/case-studies', (req, res) => {
  try {
    const saved = saveCaseStudies(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/case-studies/seed-from-lead', (req, res) => {
  try {
    const { leadId, overrides = {} } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const caseStudies = loadCaseStudies();
    const seeded = createCaseStudyFromLead(lead, overrides);
    const saved = saveCaseStudies(upsertStudy(caseStudies, seeded));
    res.json({ ok: true, caseStudies: saved, study: findCaseStudy(saved, seeded.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/case-studies/generate', async (req, res) => {
  try {
    const { studyId, study = {} } = req.body || {};
    if (!studyId && !study?.id) {
      return res.status(400).json({ error: 'studyId is required' });
    }

    let caseStudies = loadCaseStudies();
    const existing = findCaseStudy(caseStudies, studyId || study.id);
    const merged = existing ? { ...existing, ...study } : study;
    const result = await generateCaseStudyFiles({ study: merged });

    caseStudies = saveCaseStudies(upsertStudy(caseStudies, {
      ...merged,
      generated: {
        ...(merged.generated || {}),
        status: 'Generated',
        lastGeneratedAt: new Date().toISOString(),
        ...result
      }
    }));

    res.json({ ok: true, result, caseStudies, study: findCaseStudy(caseStudies, merged.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public-audit', (req, res) => {
  res.json(loadLeadMagnet());
});

app.post('/api/public-audit', (req, res) => {
  try {
    const saved = saveLeadMagnet(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/public-audit/submit', async (req, res) => {
  try {
    const { name, email, businessName, website, goals = '', phone = '' } = req.body || {};
    if (!name || !email || !businessName || !website) {
      return res.status(400).json({ error: 'name, email, businessName, and website are required' });
    }

    const audited = await runFreeAudit({ name, email, businessName, website, goals, phone });
    const submissionBase = createSubmission(audited);
    const crmLead = upsertCRMLeadFromInboundAudit({ ...submissionBase, goals, phone });
    const files = await generateLeadMagnetFiles({ submission: { ...submissionBase, crmLeadId: crmLead?.id } });

    const leadMagnet = loadLeadMagnet();
    const saved = saveLeadMagnet(upsertSubmission(leadMagnet, {
      ...submissionBase,
      goals,
      phone,
      crmLeadId: crmLead?.id || null,
      generated: {
        status: 'Generated',
        lastGeneratedAt: new Date().toISOString(),
        ...files
      }
    }));

    const submission = (saved.submissions || []).find(item => item.id === submissionBase.id);
    res.json({ ok: true, submission, crmLead, files, leadMagnet: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/content-engine', (req, res) => {
  res.json(loadContentEngine());
});

app.post('/api/content-engine', (req, res) => {
  try {
    const saved = saveContentEngine(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/content-engine/generate', (req, res) => {
  try {
    const { sourceType = 'service', sourceId = 'refresh', angle = '', audience = '', callToAction = '' } = req.body || {};
    const source = resolveContentSource({ sourceType, sourceId }) || {};
    const draft = generateContentDraft({ sourceType, sourceId, source, angle, audience, callToAction });
    const files = saveContentDraft({ draft });
    const contentEngine = loadContentEngine();
    const saved = saveContentEngine(upsertDraft(contentEngine, { ...draft, ...files }));
    res.json({ ok: true, draft: { ...draft, ...files }, contentEngine: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/followups', (req, res) => {
  res.json(loadFollowups());
});

app.post('/api/followups', (req, res) => {
  try {
    const saved = saveFollowups(req.body || {});
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/followups/generate', (req, res) => {
  try {
    const { leadId, sequenceType = 'audit-nudge' } = req.body || {};
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const crm = loadCRM();
    const lead = findLead(crm, leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const sequence = generateFollowupSequence({ lead, sequenceType });
    const files = saveFollowupSequence({ sequence });
    const followups = loadFollowups();
    const saved = saveFollowups(upsertSequence(followups, { ...sequence, ...files }));
    res.json({ ok: true, sequence: { ...sequence, ...files }, followups: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Backwards-compatible endpoints for older dashboard code.
app.get('/leads', (req, res) => {
  const crm = loadCRM();
  res.json(crm.leads || []);
});

app.post('/leads', (req, res) => {
  try {
    const crm = loadCRM();
    const next = { ...crm, leads: Array.isArray(req.body) ? req.body : [] };
    const saved = saveCRM(next);
    res.json({ ok: true, leads: saved.leads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(/^(?!\/api\/).*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3737, () => {
  console.log('DDS dashboard + CRM running on http://localhost:3737');
});
