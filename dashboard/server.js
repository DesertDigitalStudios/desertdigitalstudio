const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadCRM, saveCRM, importAuditReport, packagesList } = require('./lib/crm');
const { loadOnboarding, saveOnboarding, createOnboardingFromLead, mergeClient, upsertClient } = require('./lib/onboarding');
const { generateProposalFiles } = require('../proposals/builder');
const { generateAuditFiles } = require('../audits/builder');
const { generateOnboardingPacket } = require('../onboarding/builder');

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
