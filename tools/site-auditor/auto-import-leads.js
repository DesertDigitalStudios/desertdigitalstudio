#!/usr/bin/env node
/**
 * auto-import-leads.js
 * Scans all nightly report folders for today's date, imports new prime/pursue
 * leads into the CRM dashboard, and prints a brief of the best new ones.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CRM_PATH = '/Users/gabrielmaciel/.openclaw/workspace/dashboard/data/crm-data.json';
const REPORTS_BASE = path.join(os.homedir(), 'Desktop', 'Audit reports');
const TODAY = new Date().toISOString().slice(0, 10);

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cleanEmails(emails) {
  return (emails || []).filter(e => e && !e.startsWith('user@') && e.includes('@') && e.includes('.'));
}

function loadCRM() {
  return JSON.parse(fs.readFileSync(CRM_PATH, 'utf8'));
}

function saveCRM(data) {
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(CRM_PATH, JSON.stringify(data, null, 2));
}

function main() {
  const crm = loadCRM();
  const existingNames = new Set(crm.leads.map(l => l.businessName.toLowerCase()));
  const imported = [];
  const skipped = [];

  for (const { dir, city } of CITIES) {
    const dateDir = path.join(REPORTS_BASE, dir, TODAY);
    if (!fs.existsSync(dateDir)) continue;

    for (const cat of CATEGORIES) {
      const reportPath = path.join(dateDir, cat, 'report.json');
      if (!fs.existsSync(reportPath)) continue;

      let data;
      try {
        data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      } catch { continue; }

      for (const b of (data.businesses || [])) {
        const emails = cleanEmails(b.publicEmails);
        // Include watch leads IF they have a clean email — reachability elevates them
        const isWatchWithEmail = b.outreachTier === 'watch' && emails.length > 0;
        if (!['prime', 'pursue'].includes(b.outreachTier) && !isWatchWithEmail) {
          skipped.push(b.name);
          continue;
        }
        if (existingNames.has(b.name.toLowerCase())) continue;

        const id = `${slugify(b.name)}-${city.toLowerCase().replace(/\s+/g, '-')}`;

        const lead = {
          id,
          businessName: b.name,
          city,
          website: b.website || null,
          hasWebsite: !!b.website,
          publicEmail: emails[0] || null,
          publicEmails: emails,
          phone: typeof b.phone === 'string' && b.phone.length > 6 ? b.phone : null,
          phones: typeof b.phone === 'string' && b.phone.length > 6 ? [b.phone] : [],
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
          sourceReport: `nightly-${city.toLowerCase().replace(/\s+/g, '-')}-${TODAY}-${cat}`,
          importedAt: new Date().toISOString()
        };

        crm.leads.push(lead);
        existingNames.add(b.name.toLowerCase());
        imported.push(lead);
      }
    }
  }

  if (imported.length > 0) {
    saveCRM(crm);
  }

  // Sort best leads for the brief — prioritize prime/pursue, then watch with email
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
    withEmail: imported.filter(l => l.publicEmail).length,
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
