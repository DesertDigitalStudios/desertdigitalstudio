#!/usr/bin/env node
/**
 * auto-import-leads.js
 * Scans nightly report folders for today's local date, imports new leads into
 * the CRM, and enriches existing leads when newer reports contain better
 * contact data.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CRM_PATH = '/Users/gabrielmaciel/.openclaw/workspace/dashboard/data/crm-data.json';
const REPORTS_BASES = [
  path.join(os.homedir(), 'Desktop', 'Audit reports'),
  '/Users/gabrielmaciel/.openclaw/workspace/reports'
];
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Phoenix' }).format(new Date());

const CITIES = [
  { dir: 'nightly-tucson', city: 'Tucson' },
  { dir: 'nightly-sierra-vista', city: 'Sierra Vista' },
  { dir: 'nightly-benson', city: 'Benson' },
  { dir: 'nightly-tombstone', city: 'Tombstone' },
  { dir: 'nightly-willcox', city: 'Willcox' },
  { dir: 'nightly-vail', city: 'Vail' }
];

const CATEGORIES = [
  'restaurants', 'cafes', 'salons', 'barbers', 'home-services',
  'auto-repair', 'dental', 'gyms', 'retail', 'tattoo-shops'
];

const TIER_ORDER = { prime: 0, pursue: 1, watch: 2, skip: 3 };

function slugify(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function businessKey(name, city) {
  return `${normalizeName(name)}|${String(city || '').trim().toLowerCase()}`;
}

function cleanEmails(emails) {
  return [...new Set((emails || []).filter(Boolean).map(e => String(e).trim().toLowerCase()))].filter(e => {
    if (!e.includes('@') || !e.includes('.')) return false;
    if (e.startsWith('user@')) return false;
    if (/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(e)) return false;
    if (/(example|yourname|youremail)@/i.test(e)) return false;
    return true;
  });
}

function normalizePhones(phone, phones = []) {
  const raw = [phone, ...(phones || [])].filter(Boolean).map(value => String(value).trim());
  return [...new Set(raw.filter(value => value.replace(/\D/g, '').length >= 7))];
}

function loadCRM() {
  return JSON.parse(fs.readFileSync(CRM_PATH, 'utf8'));
}

function saveCRM(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(CRM_PATH, JSON.stringify(data, null, 2));
}

function firstExistingPath(paths) {
  return paths.find(candidate => fs.existsSync(candidate)) || null;
}

function mergeUniqueStrings(existing = [], incoming = []) {
  return [...new Set([...(existing || []), ...(incoming || [])].filter(Boolean))];
}

function enrichLeadFromBusiness(lead, business, city, cat, reportPath) {
  const emails = cleanEmails(business.publicEmails || []);
  const phones = normalizePhones(business.phone, business.phones || []);
  const beforeEmails = cleanEmails([lead.publicEmail, ...(lead.publicEmails || [])]);
  const beforePhones = normalizePhones(lead.phone, lead.phones || []);

  lead.publicEmails = mergeUniqueStrings(beforeEmails, emails);
  lead.publicEmail = lead.publicEmails[0] || null;
  lead.phones = mergeUniqueStrings(beforePhones, phones);
  lead.phone = lead.phone || lead.phones[0] || null;
  lead.website = lead.website || business.website || null;
  lead.hasWebsite = Boolean(lead.website);
  lead.platform = lead.platform || business.platform || 'custom';
  lead.socialLinks = { ...(lead.socialLinks || {}), ...(business.socialLinks || {}) };
  lead.socialHandles = { ...(lead.socialHandles || {}), ...(business.socialHandles || {}) };
  lead.topIssues = lead.topIssues?.length ? lead.topIssues : (business.topIssues || []);
  lead.priorityReasons = mergeUniqueStrings(lead.priorityReasons || [], business.priorityReasons || []);
  lead.cautions = mergeUniqueStrings(lead.cautions || [], business.cautions || []);
  lead.quickPitch = lead.quickPitch || business.quickPitch || '';
  lead.nextAction = lead.nextAction || business.nextAction || 'Review and send outreach if a good fit.';
  lead.sourceReport = lead.sourceReport || reportPath;
  lead.notes = lead.notes || `Imported from nightly ${city} scan ${TODAY}. Category: ${cat}.`;

  if (typeof business.outreachScore === 'number' && business.outreachScore > (lead.outreachScore || 0)) {
    lead.outreachScore = business.outreachScore;
    lead.outreachTier = business.outreachTier || lead.outreachTier;
    lead.shouldPursue = Boolean(business.shouldPursue);
  }

  return {
    addedEmails: Math.max(0, lead.publicEmails.length - beforeEmails.length),
    addedPhones: Math.max(0, lead.phones.length - beforePhones.length)
  };
}

function buildLead(b, city, cat, reportPath) {
  const emails = cleanEmails(b.publicEmails);
  const phones = normalizePhones(b.phone, b.phones || []);
  const id = `${slugify(b.name)}-${city.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    id,
    businessName: b.name,
    city,
    website: b.website || null,
    hasWebsite: !!b.website,
    publicEmail: emails[0] || null,
    publicEmails: emails,
    phone: phones[0] || null,
    phones,
    platform: b.platform || 'custom',
    socialLinks: b.socialLinks || {},
    socialHandles: b.socialHandles || {},
    outreachScore: b.outreachScore || 0,
    outreachTier: b.outreachTier || 'watch',
    shouldPursue: b.shouldPursue || false,
    stage: 'Scored',
    auditScore: b.score || 0,
    siteHealth: b.grade || null,
    leadTemperature: b.leadTemperature || null,
    topIssues: b.topIssues || [],
    priorityReasons: b.priorityReasons || [],
    cautions: b.cautions || [],
    recommendedPackage: b.recommendedPackage || 'refresh',
    estimatedValue: b.estimatedValue || 900,
    quickPitch: b.quickPitch || '',
    nextAction: b.nextAction || 'Review and send outreach if a good fit.',
    lastTouch: null,
    followUpOn: null,
    notes: `Imported from nightly ${city} scan ${TODAY}. Category: ${cat}.`,
    proposal: { status: 'Not started', lastGeneratedAt: null, htmlPath: null, pdfPath: null, packageId: b.recommendedPackage || 'refresh', price: b.estimatedValue || 900 },
    sourceReport: reportPath,
    importedAt: new Date().toISOString()
  };
}

function main() {
  const crm = loadCRM();
  const leads = crm.leads || [];
  const existingByKey = new Map(leads.map(lead => [businessKey(lead.businessName, lead.city), lead]));
  const imported = [];
  const enriched = [];
  const skipped = [];

  for (const { dir, city } of CITIES) {
    const dateDir = firstExistingPath(REPORTS_BASES.map(base => path.join(base, dir, TODAY)));
    if (!dateDir) continue;

    for (const cat of CATEGORIES) {
      const reportPath = path.join(dateDir, cat, 'report.json');
      if (!fs.existsSync(reportPath)) continue;

      let data;
      try {
        data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch {
        continue;
      }

      for (const b of (data.businesses || [])) {
        const emails = cleanEmails(b.publicEmails);
        const isWatchWithEmail = b.outreachTier === 'watch' && emails.length > 0;
        if (!['prime', 'pursue'].includes(b.outreachTier) && !isWatchWithEmail) {
          skipped.push(b.name);
          continue;
        }

        const key = businessKey(b.name, city);
        const existing = existingByKey.get(key);

        if (existing) {
          const update = enrichLeadFromBusiness(existing, b, city, cat, reportPath);
          if (update.addedEmails || update.addedPhones) {
            enriched.push({
              name: existing.businessName,
              city: existing.city,
              addedEmails: update.addedEmails,
              addedPhones: update.addedPhones,
              email: existing.publicEmail
            });
          }
          continue;
        }

        const lead = buildLead(b, city, cat, reportPath);
        leads.push(lead);
        existingByKey.set(key, lead);
        imported.push(lead);
      }
    }
  }

  if (imported.length > 0 || enriched.length > 0) {
    crm.leads = leads;
    saveCRM(crm);
  }

  const best = imported
    .filter(l => l.publicEmail || Object.keys(l.socialHandles || {}).length > 0)
    .sort((a, b) => {
      const ta = TIER_ORDER[a.outreachTier] ?? 4;
      const tb = TIER_ORDER[b.outreachTier] ?? 4;
      if (ta !== tb) return ta - tb;
      return b.outreachScore - a.outreachScore;
    })
    .slice(0, 8);

  const result = {
    date: TODAY,
    imported: imported.length,
    enriched: enriched.length,
    withEmail: imported.filter(l => l.publicEmail).length,
    enrichedWithEmail: enriched.filter(l => l.email).length,
    skippedLowTier: skipped.length,
    bestLeads: best.map(l => ({
      name: l.businessName,
      city: l.city,
      tier: l.outreachTier,
      score: l.outreachScore,
      email: l.publicEmail,
      socialHandles: l.socialHandles || {},
      pitch: l.quickPitch
    }))
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

main();
