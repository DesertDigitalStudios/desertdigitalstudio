const state = {
  crm: null,
  emails: [],
  onboarding: null,
  selectedLeadId: null,
  selectedOnboardingLeadId: null
};

function $(id) {
  return document.getElementById(id);
}

const stageField = $('lead-stage');
const proposalLeadField = $('proposal-lead');
const proposalPackageField = $('proposal-package');
const auditLeadField = $('audit-lead');
const auditPackageField = $('audit-package');
const onboardingLeadField = $('onboarding-lead');
const onboardingStatusField = $('onboarding-status');
const onboardingPackageField = $('onboarding-package');

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2600);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function tierBadge(tier, score) {
  const safeTier = tier || 'skip';
  return `<span class="badge ${safeTier}">${safeTier.toUpperCase()} · ${score || 0}</span>`;
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseList(value) {
  return String(value || '')
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function blankOnboardingState() {
  return {
    updatedAt: new Date().toISOString(),
    stages: ['Intake', 'Assets requested', 'Build prep', 'In progress', 'Launch prep', 'Launched'],
    clients: []
  };
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function contactInfoForLead(lead) {
  const emails = [...new Set(normalizeList(lead.publicEmail).concat(normalizeList(lead.publicEmails)))].filter(Boolean);
  const phones = [...new Set(normalizeList(lead.phone).concat(normalizeList(lead.phones)))].filter(Boolean);
  const instagram = (lead.instagramHandle || '').trim();
  const facebook = (lead.facebookPage || '').trim();
  const notes = `${lead.notes || ''} ${lead.enrichmentNotes || ''} ${lead.nextAction || ''}`.toLowerCase();
  const hasSocialTrail = Boolean(instagram || facebook) || /instagram|facebook|tiktok|linkedin|dm|message/.test(notes);
  return {
    emails,
    phones,
    instagram,
    facebook,
    hasSocialTrail,
    hasWebsite: Boolean(lead.hasWebsite !== false && lead.website),
    noWebsite: lead.hasWebsite === false || !lead.website
  };
}

function enrichmentRouteForLead(lead) {
  const contact = contactInfoForLead(lead);
  if (contact.emails.length) {
    return {
      label: 'Email first',
      tone: 'ready',
      reason: 'A clean public email already exists, so this lead is ready for direct outreach.'
    };
  }

  if (contact.phones.length && contact.hasSocialTrail) {
    return {
      label: 'Call or DM follow-up',
      tone: 'mixed',
      reason: 'No clean email yet, but you do have a phone number and signs of a social path.'
    };
  }

  if (contact.phones.length) {
    return {
      label: 'Phone first',
      tone: 'phone',
      reason: 'Phone is the best direct path right now, especially if email is missing.'
    };
  }

  if (contact.hasSocialTrail) {
    return {
      label: 'Social DM follow-up',
      tone: 'social',
      reason: 'The notes suggest an Instagram or social trail, so DM is the best next path.'
    };
  }

  if (contact.noWebsite) {
    return {
      label: 'Research + walk-in candidate',
      tone: 'manual',
      reason: 'No website and no direct contact means this one needs research, social lookup, or in-person outreach.'
    };
  }

  return {
    label: 'Manual enrichment sweep',
    tone: 'manual',
    reason: 'There is enough promise here to keep it alive, but the contact path still needs work.'
  };
}

function suggestedEnrichmentAction(lead) {
  const route = enrichmentRouteForLead(lead).label;
  const bestMethod = lead.bestContactMethod ? `Best current method is ${lead.bestContactMethod}. ` : '';
  if (route === 'Email first') return `${bestMethod}Draft a short email that references the top 2 issues and offers a free audit summary.`;
  if (route === 'Phone first') return `${bestMethod}Call the business, confirm the decision-maker, and ask for the best email for a quick website audit summary.`;
  if (route === 'Call or DM follow-up') return `${bestMethod}Use the phone number first, then fall back to social DM if nobody picks up or you need the owner contact.`;
  if (route === 'Social DM follow-up') return `${bestMethod}Send a short DM, ask for the best email to send a quick audit summary, and note the profile used.`;
  if (route === 'Research + walk-in candidate') return `${bestMethod}Search Google Maps, Facebook, and Instagram for a usable contact path. If nothing turns up, treat it as a walk-in or phone-first lead.`;
  return `${bestMethod}Do a quick manual research sweep, capture the best contact path, and set a concrete follow-up date.`;
}

function enrichmentChecklist(lead) {
  const contact = contactInfoForLead(lead);
  return [
    { label: 'Clean email captured', done: contact.emails.length > 0 },
    { label: 'Phone captured', done: contact.phones.length > 0 },
    { label: 'Owner / contact named', done: Boolean((lead.contactName || '').trim()) },
    { label: 'Social path captured', done: Boolean(contact.instagram || contact.facebook) },
    { label: 'Best contact method chosen', done: Boolean((lead.bestContactMethod || '').trim()) },
    { label: 'Website status verified', done: lead.hasWebsite === false || Boolean(lead.website) },
    { label: 'Next action set', done: Boolean((lead.nextAction || '').trim()) },
    { label: 'Follow-up date set', done: Boolean(lead.followUpOn) },
    { label: 'Last touch logged', done: Boolean(lead.lastTouch) }
  ];
}

function enrichmentCompleteness(lead) {
  const checklist = enrichmentChecklist(lead);
  const done = checklist.filter(item => item.done).length;
  return Math.round((done / checklist.length) * 100);
}

function enrichmentPriorityScore(lead) {
  const contact = contactInfoForLead(lead);
  let score = Number(lead.outreachScore || 0);
  if (['prime', 'pursue'].includes(lead.outreachTier)) score += 25;
  if (!contact.emails.length) score += 22;
  if (!contact.phones.length) score += 8;
  if (!contact.instagram && !contact.facebook) score += 8;
  if (!lead.contactName) score += 6;
  if (!lead.bestContactMethod) score += 8;
  if (!lead.nextAction) score += 10;
  if (!lead.followUpOn && lead.stage === 'Contacted') score += 14;
  if (contact.noWebsite) score += 8;
  if (lead.stage === 'Research') score += 6;
  if (lead.stage === 'Scored') score += 4;
  return score;
}

function enrichmentQueue() {
  return sortedLeads()
    .filter(lead => !['Won', 'Parked'].includes(lead.stage))
    .filter(lead => ['prime', 'pursue', 'watch'].includes(lead.outreachTier))
    .map(lead => ({
      ...lead,
      enrichmentPriority: enrichmentPriorityScore(lead),
      enrichmentCompleteness: enrichmentCompleteness(lead)
    }))
    .sort((a, b) => b.enrichmentPriority - a.enrichmentPriority || a.enrichmentCompleteness - b.enrichmentCompleteness)
    .slice(0, 12);
}

function leadById(id) {
  return (state.crm?.leads || []).find(lead => lead.id === id);
}

function onboardingByLeadId(leadId) {
  return (state.onboarding?.clients || []).find(client => client.leadId === leadId || client.id === leadId);
}

const TIER_ORDER = { prime: 0, pursue: 1, watch: 2, skip: 3 };

function sortedLeads() {
  return [...(state.crm?.leads || [])].sort((a, b) => {
    const ta = TIER_ORDER[a.outreachTier] ?? 4;
    const tb = TIER_ORDER[b.outreachTier] ?? 4;
    if (ta !== tb) return ta - tb;
    return b.outreachScore - a.outreachScore;
  });
}

function countChecklistDone(client) {
  return Object.values(client?.checklist || {}).filter(Boolean).length;
}

function defaultOnboardingRecord(lead) {
  return {
    id: lead?.id || '',
    leadId: lead?.id || '',
    businessName: lead?.businessName || '',
    website: lead?.website || '',
    contactName: '',
    contactEmail: lead?.publicEmail || '',
    contactPhone: lead?.phone || '',
    status: 'Intake',
    kickoffDate: new Date().toISOString().slice(0, 10),
    launchTargetDate: '',
    packageId: lead?.proposal?.packageId || lead?.recommendedPackage || 'refresh',
    price: lead?.proposal?.price || lead?.estimatedValue || 0,
    goals: '',
    priorityPages: [],
    requestedFeatures: [],
    notes: '',
    checklist: {
      brandAssets: false,
      photos: false,
      copy: false,
      domainAccess: false,
      hostingAccess: false,
      analytics: false,
      googleBusiness: false,
      launchApproval: false
    },
    packet: {
      status: 'Not generated',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      jsonPath: null
    }
  };
}

function isOverdue(lead) {
  if (!lead.followUpOn) return false;
  const due = new Date(lead.followUpOn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function isDueToday(lead) {
  if (!lead.followUpOn) return false;
  const due = new Date(lead.followUpOn);
  const today = new Date();
  return due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate();
}

function isDueSoon(lead) {
  if (!lead.followUpOn) return false;
  const due = new Date(lead.followUpOn);
  const today = new Date();
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
}

function renderEnrichmentWorkbench() {
  const root = $('enrichment-workbench');
  if (!root || !state.crm) return;

  const queue = enrichmentQueue();
  const selected = leadById(state.selectedLeadId) || queue[0];
  const route = selected ? enrichmentRouteForLead(selected) : null;
  const checklist = selected ? enrichmentChecklist(selected) : [];
  const reachableNow = sortedLeads().filter(lead => ['prime', 'pursue'].includes(lead.outreachTier) && contactInfoForLead(lead).emails.length).length;
  const noWebsiteOpps = sortedLeads().filter(lead => contactInfoForLead(lead).noWebsite).length;

  if (!selected) {
    root.innerHTML = '<div class="empty-state">No leads available for enrichment yet.</div>';
    return;
  }

  root.innerHTML = `
    <div class="enrichment-grid">
      <div class="enrichment-queue">
        <div class="enrichment-stats">
          <div class="enrichment-stat"><span>Queue</span><strong>${queue.length}</strong></div>
          <div class="enrichment-stat"><span>Reachable now</span><strong>${reachableNow}</strong></div>
          <div class="enrichment-stat"><span>No-website opps</span><strong>${noWebsiteOpps}</strong></div>
        </div>
        <div class="enrichment-list">
          ${queue.map(lead => `
            <button class="enrichment-item ${lead.id === selected.id ? 'selected' : ''}" data-enrichment-lead="${esc(lead.id)}">
              <div class="enrichment-item-top">
                <strong>${esc(lead.businessName)}</strong>
                ${tierBadge(lead.outreachTier, lead.outreachScore)}
              </div>
              <div class="enrichment-item-meta">${esc(lead.city || '—')} · ${esc(lead.stage || 'Scored')}</div>
              <div class="enrichment-item-route">${esc(enrichmentRouteForLead(lead).label)}</div>
              <div class="enrichment-item-bar">
                <span style="width:${Math.max(8, lead.enrichmentCompleteness)}%"></span>
              </div>
              <div class="enrichment-item-note">Completeness ${lead.enrichmentCompleteness}% · Priority ${lead.enrichmentPriority}</div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="enrichment-detail">
        <div class="enrichment-detail-top">
          <div>
            <div class="panel-title">Selected lead</div>
            <h3>${esc(selected.businessName)}</h3>
            <p class="panel-subtitle">${esc(selected.city || '—')} · ${esc(selected.stage || 'Scored')} · ${esc(selected.recommendedPackage || 'refresh')}</p>
          </div>
          <div class="enrichment-route tone-${esc(route.tone)}">
            <span>Best route</span>
            <strong>${esc(route.label)}</strong>
          </div>
        </div>

        <div class="enrichment-two-col">
          <div class="enrichment-card">
            <div class="panel-title">Why this route</div>
            <p>${esc(route.reason)}</p>
            <div class="contact-stack">
              <div><span>Email</span><strong>${esc(contactInfoForLead(selected).emails[0] || 'None yet')}</strong></div>
              <div><span>Phone</span><strong>${esc(contactInfoForLead(selected).phones[0] || 'None yet')}</strong></div>
              <div><span>Instagram</span><strong>${esc(contactInfoForLead(selected).instagram || 'None yet')}</strong></div>
              <div><span>Facebook</span><strong>${esc(contactInfoForLead(selected).facebook || 'None yet')}</strong></div>
              <div><span>Website</span><strong>${contactInfoForLead(selected).noWebsite ? 'No website' : esc(selected.website || 'Has website')}</strong></div>
            </div>
          </div>

          <div class="enrichment-card">
            <div class="panel-title">Suggested next move</div>
            <p>${esc(suggestedEnrichmentAction(selected))}</p>
            <div class="form-actions">
              <button type="button" class="btn" id="apply-enrichment-suggestion">Use suggested next action</button>
              <button type="button" class="btn btn-ghost" id="jump-to-lead-editor">Open lead editor</button>
            </div>
          </div>
        </div>

        <div class="enrichment-two-col">
          <div class="enrichment-card">
            <div class="panel-title">Checklist</div>
            <div class="enrichment-checklist">
              ${checklist.map(item => `
                <div class="check-row ${item.done ? 'done' : 'missing'}">
                  <span>${item.done ? '✓' : '•'}</span>
                  <strong>${esc(item.label)}</strong>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="enrichment-card">
            <div class="panel-title">Context</div>
            <div class="context-list">
              <div><span>Owner / contact</span><strong>${esc(selected.contactName || 'Not captured')}</strong></div>
              <div><span>Best contact method</span><strong>${esc(selected.bestContactMethod || 'Not chosen')}</strong></div>
              <div><span>Research status</span><strong>${esc(selected.researchStatus || 'Not started')}</strong></div>
              <div><span>Quick pitch</span><strong>${esc(selected.quickPitch || 'None yet')}</strong></div>
              <div><span>Top issues</span><strong>${esc((selected.topIssues || []).slice(0, 3).join(', ') || 'None logged')}</strong></div>
              <div><span>Next action</span><strong>${esc(selected.nextAction || 'Not set')}</strong></div>
              <div><span>Enrichment notes</span><strong>${esc((selected.enrichmentNotes || 'No enrichment notes yet').slice(0, 180))}</strong></div>
              <div><span>Notes</span><strong>${esc((selected.notes || 'No notes yet').slice(0, 180))}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-enrichment-lead]').forEach(button => {
    button.addEventListener('click', () => {
      state.selectedLeadId = button.dataset.enrichmentLead;
      renderAll();
    });
  });

  $('apply-enrichment-suggestion')?.addEventListener('click', async () => {
    const lead = leadById(state.selectedLeadId);
    if (!lead) return;
    const route = enrichmentRouteForLead(lead).label;
    lead.nextAction = suggestedEnrichmentAction(lead);
    if (!lead.bestContactMethod) {
      if (route === 'Email first') lead.bestContactMethod = 'email';
      else if (route === 'Phone first' || route === 'Call or DM follow-up') lead.bestContactMethod = 'phone';
      else if (route === 'Social DM follow-up') lead.bestContactMethod = lead.instagramHandle ? 'instagram' : 'facebook';
      else if (route === 'Research + walk-in candidate') lead.bestContactMethod = 'research';
    }
    if (!lead.researchStatus) {
      lead.researchStatus = route === 'Email first' ? 'Ready for outreach' : 'Finding contact path';
    }
    if (!lead.followUpOn && lead.stage === 'Contacted') {
      const follow = new Date();
      follow.setDate(follow.getDate() + 3);
      lead.followUpOn = follow.toISOString().slice(0, 10);
    }
    await saveCRM('Applied enrichment suggestion');
  });

  $('jump-to-lead-editor')?.addEventListener('click', () => {
    $('lead-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function renderTodaysFocus() {
  const leads = sortedLeads().filter(lead => !['Won', 'Parked', 'Closed Lost'].includes(lead.stage));
  const overdue = leads.filter(isOverdue);
  const today = leads.filter(isDueToday);
  const soon = leads.filter(l => isDueSoon(l) && !isDueToday(l) && !isOverdue(l));
  const noDate = leads.filter(l => l.stage === 'Contacted' && !l.followUpOn);

  const focusLeads = [
    ...overdue.map(l => ({ lead: l, tag: 'OVERDUE', cls: 'focus-overdue' })),
    ...today.map(l => ({ lead: l, tag: 'TODAY', cls: 'focus-today' })),
    ...soon.map(l => ({ lead: l, tag: 'SOON', cls: 'focus-soon' })),
    ...noDate.map(l => ({ lead: l, tag: 'NO DATE', cls: 'focus-nodate' }))
  ];

  const panel = $('focus-panel');
  if (!focusLeads.length) {
    panel.innerHTML = '';
    return;
  }

  panel.innerHTML = `
    <div class="panel focus-panel-inner">
      <div class="panel-head">
        <div>
          <div class="panel-title">Today's Focus</div>
          <p class="panel-subtitle">Follow-ups that need attention — overdue, due today, or missing a date.</p>
        </div>
      </div>
      <div class="focus-grid">
        ${focusLeads.slice(0, 8).map(({ lead, tag, cls }) => `
          <div class="focus-card ${cls}" data-focus-lead="${esc(lead.id)}">
            <div class="focus-top">
              <span class="focus-tag">${tag}</span>
              <span class="focus-biz">${esc(lead.businessName)}</span>
            </div>
            <div class="focus-meta">${esc(lead.city || '')} · ${esc(lead.stage || '')}</div>
            <div class="focus-action">${esc(lead.nextAction || 'No next action set')}</div>
            ${lead.followUpOn ? `<div class="focus-date">Due ${esc(String(lead.followUpOn).slice(0,10))}</div>` : ''}
            ${lead.publicEmail ? `<a class="focus-email" href="mailto:${esc(lead.publicEmail)}">${esc(lead.publicEmail)}</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  panel.querySelectorAll('.focus-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return;
      state.selectedLeadId = card.dataset.focusLead;
      renderAll();
      document.getElementById('lead-score-body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderSummary() {
  const leads = sortedLeads();
  const prime = leads.filter(lead => lead.outreachTier === 'prime').length;
  const reachable = leads.filter(lead => lead.publicEmail).length;
  const proposals = leads.filter(lead => lead.proposal?.status === 'Drafted').length;
  const won = leads.filter(lead => lead.stage === 'Won').length;
  const overdueCt = leads.filter(l => isOverdue(l) && !['Won','Parked'].includes(l.stage)).length;
  const pipelineValue = leads
    .filter(lead => !['Parked', 'Won'].includes(lead.stage))
    .reduce((sum, lead) => sum + Number(lead.estimatedValue || 0), 0);

  $('summary-grid').innerHTML = [
    ['Total leads', leads.length, 'All records currently in the CRM'],
    ['Prime leads', prime, 'Best use of outreach time right now'],
    ['Reachable by email', reachable, 'Public email captured'],
    ['Follow-ups overdue', overdueCt, overdueCt > 0 ? '⚠️ Needs attention' : 'All caught up'],
    ['Proposals drafted', proposals, 'Generated from the proposal builder'],
    ['Won', won, 'Closed deals so far'],
    ['Pipeline value', formatMoney(pipelineValue), 'Open deal value still in motion']
  ].map(([label, value, note]) => `
    <div class="summary-card${label === 'Follow-ups overdue' && overdueCt > 0 ? ' summary-card-warn' : ''}">
      <div class="summary-label">${esc(label)}</div>
      <div class="summary-value">${esc(value)}</div>
      <div class="summary-note">${esc(note)}</div>
    </div>
  `).join('');

  $('updated-at').textContent = formatDate(state.crm?.updatedAt || state.onboarding?.updatedAt);
}

function renderLeadTable() {
  const body = $('lead-score-body');
  const leads = sortedLeads();
  body.innerHTML = leads.map(lead => {
    const selected = state.selectedLeadId === lead.id ? 'selected' : '';
    const contact = lead.publicEmail
      ? `<span class="badge email">${esc(lead.publicEmail)}</span>`
      : (lead.phone ? `<span class="badge stage">${esc(lead.phone)}</span>` : '<span class="muted">Need contact</span>');

    return `
      <tr class="score-row ${selected}" data-lead-id="${esc(lead.id)}">
        <td>${tierBadge(lead.outreachTier, lead.outreachScore)}</td>
        <td>
          <strong>${esc(lead.businessName)}</strong><br>
          <span class="muted">${esc(lead.city || '—')}</span>
        </td>
        <td><span class="badge stage">${esc(lead.stage || 'Scored')}</span></td>
        <td>${contact}</td>
        <td>
          <div>${lead.hasWebsite ? `${esc(lead.auditScore || 0)}/100 audit` : 'No website'}</div>
          <div class="muted">${esc(lead.topIssues?.slice(0, 2).join(' · ') || 'No issues logged yet')}</div>
        </td>
        <td>${esc(lead.recommendedPackage || 'refresh')}</td>
        <td>
          <div class="reasons">
            ${(lead.priorityReasons || []).slice(0, 2).map(reason => `<span class="reason-chip">${esc(reason)}</span>`).join('') || '<span class="muted">No reasons captured yet</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  body.querySelectorAll('.score-row').forEach(row => {
    row.addEventListener('click', () => {
      state.selectedLeadId = row.dataset.leadId;
      if (!state.selectedOnboardingLeadId) state.selectedOnboardingLeadId = row.dataset.leadId;
      renderAll();
    });
  });
}

function moveLeadStage(leadId, direction) {
  const lead = leadById(leadId);
  if (!lead) return;
  const stages = state.crm.stages || [];
  const current = stages.indexOf(lead.stage);
  if (current === -1) return;
  const next = current + direction;
  if (next < 0 || next >= stages.length) return;
  lead.stage = stages[next];
  saveCRM('Lead moved');
}

function renderPipeline() {
  const board = $('pipeline-board');
  const stages = state.crm.stages || [];
  const leads = sortedLeads();

  board.innerHTML = stages.map((stage, index) => {
    const stack = leads.filter(lead => lead.stage === stage).map(lead => `
      <div class="pipeline-card ${state.selectedLeadId === lead.id ? 'selected' : ''}" data-card-id="${esc(lead.id)}">
        <div class="pipeline-top">
          <div class="pipeline-name">${esc(lead.businessName)}</div>
          <div>${tierBadge(lead.outreachTier, lead.outreachScore)}</div>
        </div>
        <div class="pipeline-meta">${esc(lead.city || '—')} · ${esc(lead.publicEmail || lead.phone || 'Need contact')}</div>
        <div class="muted">${esc(lead.nextAction || 'No next action set')}</div>
        <div class="pipeline-stamps">
          ${isOverdue(lead) ? '<span class="mini-chip chip-overdue">⚠ Overdue</span>' : ''}
          ${isDueToday(lead) ? '<span class="mini-chip chip-today">Due today</span>' : ''}
          ${lead.proposal?.status === 'Drafted' ? '<span class="mini-chip">Proposal</span>' : ''}
          ${lead.auditReport?.status === 'Generated' ? '<span class="mini-chip">Audit</span>' : ''}
          ${onboardingByLeadId(lead.id) ? '<span class="mini-chip">Onboarding</span>' : ''}
        </div>
        <div class="pipeline-actions">
          <button data-dir="-1" ${index === 0 ? 'disabled' : ''}>←</button>
          <button data-dir="1" ${index === stages.length - 1 ? 'disabled' : ''}>→</button>
        </div>
      </div>
    `).join('') || '<div class="muted">No leads here yet.</div>';

    return `
      <div class="pipeline-col">
        <h3>${esc(stage)}</h3>
        <div class="pipeline-stack">${stack}</div>
      </div>
    `;
  }).join('');

  board.querySelectorAll('.pipeline-card').forEach(card => {
    card.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (button) {
        event.stopPropagation();
        moveLeadStage(card.dataset.cardId, Number(button.dataset.dir));
        return;
      }

      state.selectedLeadId = card.dataset.cardId;
      state.selectedOnboardingLeadId = card.dataset.cardId;
      renderAll();
    });
  });
}

function fillStageOptions() {
  stageField.innerHTML = (state.crm?.stages || [])
    .map(stage => `<option value="${esc(stage)}">${esc(stage)}</option>`)
    .join('');
}

function fillPackageOptions(select, selectedValue) {
  select.innerHTML = (state.crm?.packages || []).map(pkg => `
    <option value="${esc(pkg.id)}">${esc(pkg.name)} · ${formatMoney(pkg.price)}</option>
  `).join('');

  if (selectedValue) select.value = selectedValue;
}

function fillProposalOptions() {
  proposalLeadField.innerHTML = sortedLeads().map(lead => `
    <option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.outreachTier)} · ${lead.outreachScore}</option>
  `).join('');

  fillPackageOptions(proposalPackageField);

  if (state.selectedLeadId) {
    proposalLeadField.value = state.selectedLeadId;
    syncProposalFormToLead();
  }
}

function fillAuditOptions() {
  auditLeadField.innerHTML = sortedLeads().map(lead => `
    <option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.auditScore || 0)}/100 audit</option>
  `).join('');

  fillPackageOptions(auditPackageField);

  if (state.selectedLeadId) {
    auditLeadField.value = state.selectedLeadId;
    syncAuditFormToLead();
  }
}

function fillOnboardingOptions() {
  onboardingLeadField.innerHTML = sortedLeads().map(lead => `
    <option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.stage || 'Scored')}</option>
  `).join('');

  fillPackageOptions(onboardingPackageField);

  onboardingStatusField.innerHTML = (state.onboarding?.stages || blankOnboardingState().stages)
    .map(stage => `<option value="${esc(stage)}">${esc(stage)}</option>`)
    .join('');

  const preferredLeadId = state.selectedOnboardingLeadId || state.selectedLeadId || sortedLeads()[0]?.id || '';
  if (preferredLeadId) {
    onboardingLeadField.value = preferredLeadId;
    state.selectedOnboardingLeadId = preferredLeadId;
  }
}

function renderLeadForm() {
  const lead = leadById(state.selectedLeadId);
  if (!lead) {
    $('lead-detail-empty').classList.remove('hidden');
    $('lead-form').classList.add('hidden');
    return;
  }

  $('lead-detail-empty').classList.add('hidden');
  $('lead-form').classList.remove('hidden');
  $('lead-id').value = lead.id;
  $('lead-business').value = lead.businessName || '';
  $('lead-city').value = lead.city || '';
  $('lead-stage').value = lead.stage || 'Scored';
  $('lead-tier').value = `${lead.outreachTier || 'skip'} · ${lead.outreachScore || 0}`;
  $('lead-email').value = lead.publicEmail || '';
  $('lead-phone').value = lead.phone || '';
  $('lead-contact-name').value = lead.contactName || '';
  $('lead-website').value = lead.website || '';
  $('lead-best-contact-method').value = lead.bestContactMethod || '';
  $('lead-instagram').value = lead.instagramHandle || '';
  $('lead-facebook').value = lead.facebookPage || '';
  $('lead-value').value = lead.estimatedValue || '';
  $('lead-research-status').value = lead.researchStatus || 'Not started';
  $('lead-followup').value = lead.followUpOn ? String(lead.followUpOn).slice(0, 10) : '';
  $('lead-lasttouch').value = lead.lastTouch ? String(lead.lastTouch).slice(0, 10) : '';
  $('lead-nextaction').value = lead.nextAction || '';
  $('lead-enrichment-notes').value = lead.enrichmentNotes || '';
  $('lead-notes').value = lead.notes || '';
}

function collectLeadForm() {
  return {
    id: $('lead-id').value,
    businessName: $('lead-business').value.trim(),
    city: $('lead-city').value.trim(),
    stage: $('lead-stage').value,
    publicEmail: $('lead-email').value.trim() || null,
    publicEmails: $('lead-email').value.trim() ? [$('lead-email').value.trim()] : [],
    phone: $('lead-phone').value.trim() || null,
    phones: $('lead-phone').value.trim() ? [$('lead-phone').value.trim()] : [],
    contactName: $('lead-contact-name').value.trim(),
    website: $('lead-website').value.trim() || null,
    bestContactMethod: $('lead-best-contact-method').value || null,
    instagramHandle: $('lead-instagram').value.trim(),
    facebookPage: $('lead-facebook').value.trim(),
    estimatedValue: Number($('lead-value').value || 0),
    researchStatus: $('lead-research-status').value,
    followUpOn: $('lead-followup').value || null,
    lastTouch: $('lead-lasttouch').value || null,
    nextAction: $('lead-nextaction').value.trim(),
    enrichmentNotes: $('lead-enrichment-notes').value,
    notes: $('lead-notes').value
  };
}

function syncProposalFormToLead() {
  const lead = leadById(proposalLeadField.value);
  if (!lead) return;
  proposalPackageField.value = lead.proposal?.packageId || lead.recommendedPackage || 'refresh';
  $('proposal-price').value = lead.proposal?.price || lead.estimatedValue || 0;
}

function syncAuditFormToLead() {
  const lead = leadById(auditLeadField.value);
  if (!lead) return;
  auditPackageField.value = lead.auditReport?.packageId || lead.proposal?.packageId || lead.recommendedPackage || 'refresh';
  $('audit-price').value = lead.auditReport?.price || lead.proposal?.price || lead.estimatedValue || 0;
}

function renderAuditResult() {
  const lead = leadById(auditLeadField.value || state.selectedLeadId);
  if (!lead?.auditReport?.pdfPath) {
    $('audit-result').innerHTML = 'No client-facing audit generated yet.';
    $('audit-result').classList.add('muted');
    return;
  }

  $('audit-result').classList.remove('muted');
  $('audit-result').innerHTML = `
    <strong>Latest audit:</strong><br>
    Generated ${esc(formatDate(lead.auditReport.lastGeneratedAt))}<br>
    HTML: <code>${esc(lead.auditReport.htmlPath || '—')}</code><br>
    PDF: <code>${esc(lead.auditReport.pdfPath || '—')}</code>
  `;
}

function renderOnboardingForm() {
  const leadId = onboardingLeadField.value || state.selectedOnboardingLeadId || state.selectedLeadId;
  const lead = leadById(leadId);

  if (!lead) {
    $('onboarding-empty').classList.remove('hidden');
    $('onboarding-form').classList.add('hidden');
    $('onboarding-result').innerHTML = 'No onboarding packet generated yet.';
    return;
  }

  $('onboarding-empty').classList.add('hidden');
  $('onboarding-form').classList.remove('hidden');
  const client = onboardingByLeadId(lead.id) || defaultOnboardingRecord(lead);

  $('onboarding-id').value = client.id || lead.id;
  $('onboarding-business').value = client.businessName || lead.businessName || '';
  onboardingStatusField.value = client.status || 'Intake';
  $('onboarding-contact-name').value = client.contactName || '';
  $('onboarding-contact-email').value = client.contactEmail || '';
  $('onboarding-contact-phone').value = client.contactPhone || '';
  $('onboarding-website').value = client.website || lead.website || '';
  onboardingPackageField.value = client.packageId || lead.proposal?.packageId || lead.recommendedPackage || 'refresh';
  $('onboarding-price').value = client.price || lead.proposal?.price || lead.estimatedValue || 0;
  $('onboarding-kickoff').value = client.kickoffDate ? String(client.kickoffDate).slice(0, 10) : '';
  $('onboarding-launch-target').value = client.launchTargetDate ? String(client.launchTargetDate).slice(0, 10) : '';
  $('onboarding-goals').value = client.goals || '';
  $('onboarding-pages').value = (client.priorityPages || []).join('\n');
  $('onboarding-features').value = (client.requestedFeatures || []).join('\n');
  $('onboarding-notes').value = client.notes || '';

  $('check-brandAssets').checked = !!client.checklist?.brandAssets;
  $('check-photos').checked = !!client.checklist?.photos;
  $('check-copy').checked = !!client.checklist?.copy;
  $('check-domainAccess').checked = !!client.checklist?.domainAccess;
  $('check-hostingAccess').checked = !!client.checklist?.hostingAccess;
  $('check-analytics').checked = !!client.checklist?.analytics;
  $('check-googleBusiness').checked = !!client.checklist?.googleBusiness;
  $('check-launchApproval').checked = !!client.checklist?.launchApproval;

  renderOnboardingResult(client);
}

function collectOnboardingForm() {
  const lead = leadById(onboardingLeadField.value);
  return {
    id: $('onboarding-id').value || lead?.id,
    leadId: lead?.id,
    businessName: $('onboarding-business').value || lead?.businessName || '',
    website: $('onboarding-website').value.trim(),
    contactName: $('onboarding-contact-name').value.trim(),
    contactEmail: $('onboarding-contact-email').value.trim(),
    contactPhone: $('onboarding-contact-phone').value.trim(),
    status: onboardingStatusField.value,
    kickoffDate: $('onboarding-kickoff').value || null,
    launchTargetDate: $('onboarding-launch-target').value || null,
    packageId: onboardingPackageField.value,
    price: Number($('onboarding-price').value || 0),
    goals: $('onboarding-goals').value.trim(),
    priorityPages: parseList($('onboarding-pages').value),
    requestedFeatures: parseList($('onboarding-features').value),
    notes: $('onboarding-notes').value.trim(),
    checklist: {
      brandAssets: $('check-brandAssets').checked,
      photos: $('check-photos').checked,
      copy: $('check-copy').checked,
      domainAccess: $('check-domainAccess').checked,
      hostingAccess: $('check-hostingAccess').checked,
      analytics: $('check-analytics').checked,
      googleBusiness: $('check-googleBusiness').checked,
      launchApproval: $('check-launchApproval').checked
    },
    packet: {
      ...(onboardingByLeadId(lead?.id)?.packet || {})
    }
  };
}

function renderOnboardingResult(client = onboardingByLeadId(onboardingLeadField.value || state.selectedOnboardingLeadId)) {
  if (!client?.packet?.pdfPath) {
    const checklistDone = client ? countChecklistDone(client) : 0;
    $('onboarding-result').classList.add('muted');
    $('onboarding-result').innerHTML = client
      ? `Checklist progress: ${checklistDone}/8 complete. No onboarding packet generated yet.`
      : 'No onboarding packet generated yet.';
    return;
  }

  $('onboarding-result').classList.remove('muted');
  $('onboarding-result').innerHTML = `
    <strong>Onboarding packet:</strong><br>
    Checklist progress: ${countChecklistDone(client)}/8 complete<br>
    Generated ${esc(formatDate(client.packet.lastGeneratedAt))}<br>
    HTML: <code>${esc(client.packet.htmlPath || '—')}</code><br>
    PDF: <code>${esc(client.packet.pdfPath || '—')}</code>
  `;
}

function renderEmails() {
  const feed = $('email-feed');
  if (!state.emails.length) {
    feed.innerHTML = '<div class="empty-state">No email activity found.</div>';
    return;
  }

  feed.innerHTML = state.emails.slice(0, 6).map(email => `
    <div class="email-card">
      <div class="email-subject">${esc(email.subject || '(no subject)')}</div>
      <div class="email-from">${esc(email.from || 'Unknown sender')}</div>
      <div class="email-date">${esc(formatDate(email.date || new Date().toISOString()))}</div>
      <div class="email-body">${esc((email.body || '').slice(0, 180) || 'No preview')}</div>
    </div>
  `).join('');
}

function renderAll() {
  if (!state.crm) return;
  fillStageOptions();
  renderSummary();
  renderTodaysFocus();
  renderEnrichmentWorkbench();
  renderLeadTable();
  renderPipeline();
  renderLeadForm();
  fillProposalOptions();
  fillAuditOptions();
  fillOnboardingOptions();
  renderAuditResult();
  renderOnboardingForm();
  renderEmails();
}

async function saveCRM(successMessage = 'CRM saved') {
  state.crm = await api('/api/crm', {
    method: 'POST',
    body: JSON.stringify(state.crm)
  });
  showToast(successMessage);
  renderAll();
}

async function saveOnboardingState(successMessage = 'Onboarding saved') {
  state.onboarding = await api('/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(state.onboarding || blankOnboardingState())
  });
  showToast(successMessage);
  renderAll();
}

function upsertOnboardingClient(client) {
  state.onboarding = state.onboarding || blankOnboardingState();
  const clients = [...(state.onboarding.clients || [])];
  const index = clients.findIndex(item => item.id === client.id || item.leadId === client.leadId);
  if (index >= 0) {
    clients[index] = {
      ...clients[index],
      ...client,
      checklist: {
        ...(clients[index].checklist || {}),
        ...(client.checklist || {})
      },
      packet: {
        ...(clients[index].packet || {}),
        ...(client.packet || {})
      }
    };
  } else {
    clients.push(client);
  }

  state.onboarding.clients = clients;
  state.onboarding.updatedAt = new Date().toISOString();
}

async function loadData() {
  try {
    $('api-status').textContent = 'online';
    const [crm, emails, onboarding] = await Promise.all([
      api('/api/crm'),
      api('/emails').catch(() => []),
      api('/api/onboarding').catch(() => blankOnboardingState())
    ]);

    state.crm = crm;
    state.emails = emails;
    state.onboarding = onboarding;

    if (!state.selectedLeadId && state.crm.leads?.length) {
      state.selectedLeadId = sortedLeads()[0]?.id || null;
    }

    if (!state.selectedOnboardingLeadId && state.selectedLeadId) {
      state.selectedOnboardingLeadId = state.selectedLeadId;
    }

    renderAll();
  } catch (error) {
    $('api-status').textContent = 'offline';
    showToast(error.message);
  }
}

$('save-btn').addEventListener('click', () => saveCRM());
$('recalc-btn').addEventListener('click', async () => {
  const result = await api('/api/crm/recalculate', { method: 'POST', body: '{}' });
  state.crm = result.crm;
  showToast('Scores refreshed');
  renderAll();
});
$('import-btn').addEventListener('click', async () => {
  const reportPath = $('report-path').value.trim();
  if (!reportPath) return;
  const result = await api('/api/crm/import-audit', {
    method: 'POST',
    body: JSON.stringify({ reportPath })
  });
  state.crm = result.crm;
  showToast(`Imported ${reportPath}`);
  renderAll();
});

$('lead-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const updatedLead = collectLeadForm();
  state.crm.leads = state.crm.leads.map(lead => lead.id === updatedLead.id ? {
    ...lead,
    ...updatedLead,
    proposal: {
      ...(lead.proposal || {}),
      price: updatedLead.estimatedValue || lead.proposal?.price || 0
    },
    auditReport: {
      ...(lead.auditReport || {}),
      price: updatedLead.estimatedValue || lead.auditReport?.price || lead.proposal?.price || 0
    }
  } : lead);
  await saveCRM('Lead saved');
});

$('lead-prev-stage').addEventListener('click', () => moveLeadStage($('lead-id').value, -1));
$('lead-next-stage').addEventListener('click', () => moveLeadStage($('lead-id').value, 1));

proposalLeadField.addEventListener('change', () => {
  state.selectedLeadId = proposalLeadField.value;
  syncProposalFormToLead();
  renderAll();
});
proposalPackageField.addEventListener('change', () => {
  const pkg = (state.crm.packages || []).find(item => item.id === proposalPackageField.value);
  if (pkg && !$('proposal-price').value) $('proposal-price').value = pkg.price;
});

$('proposal-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const leadId = proposalLeadField.value;
  const packageId = proposalPackageField.value;
  const price = Number($('proposal-price').value || 0);
  const focusNote = $('proposal-focus').value.trim();
  const payload = await api('/api/proposals/generate', {
    method: 'POST',
    body: JSON.stringify({ leadId, packageId, price, focusNote })
  });
  $('proposal-result').innerHTML = `
    <strong>Generated:</strong><br>
    HTML: <code>${esc(payload.result.htmlPath)}</code><br>
    PDF: <code>${esc(payload.result.pdfPath)}</code>
  `;
  await loadData();
  showToast('Proposal generated');
});

auditLeadField.addEventListener('change', () => {
  state.selectedLeadId = auditLeadField.value;
  syncAuditFormToLead();
  renderAll();
});
auditPackageField.addEventListener('change', () => {
  const pkg = (state.crm.packages || []).find(item => item.id === auditPackageField.value);
  if (pkg && !$('audit-price').value) $('audit-price').value = pkg.price;
});

$('audit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const leadId = auditLeadField.value;
  const packageId = auditPackageField.value;
  const price = Number($('audit-price').value || 0);
  const introNote = $('audit-intro').value.trim();
  const focusNote = $('audit-focus').value.trim();
  const payload = await api('/api/audits/generate', {
    method: 'POST',
    body: JSON.stringify({ leadId, packageId, price, introNote, focusNote })
  });
  state.crm = payload.crm;
  $('audit-result').innerHTML = `
    <strong>Generated:</strong><br>
    HTML: <code>${esc(payload.result.htmlPath)}</code><br>
    PDF: <code>${esc(payload.result.pdfPath)}</code>
  `;
  showToast('Client audit generated');
  renderAll();
});

onboardingLeadField.addEventListener('change', () => {
  state.selectedOnboardingLeadId = onboardingLeadField.value;
  renderOnboardingForm();
});
onboardingPackageField.addEventListener('change', () => {
  const pkg = (state.crm.packages || []).find(item => item.id === onboardingPackageField.value);
  if (pkg && !$('onboarding-price').value) $('onboarding-price').value = pkg.price;
});

$('onboarding-seed-btn').addEventListener('click', async () => {
  const leadId = onboardingLeadField.value;
  const payload = await api('/api/onboarding/seed-from-lead', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
  state.onboarding = payload.onboarding;
  state.selectedOnboardingLeadId = leadId;
  showToast('Onboarding started from lead');
  renderAll();
});

$('onboarding-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const client = collectOnboardingForm();
  upsertOnboardingClient(client);
  await saveOnboardingState('Onboarding saved');
});

$('onboarding-packet-btn').addEventListener('click', async () => {
  const client = collectOnboardingForm();
  upsertOnboardingClient(client);
  const leadId = onboardingLeadField.value;
  const payload = await api('/api/onboarding/generate-packet', {
    method: 'POST',
    body: JSON.stringify({ leadId, client })
  });
  state.onboarding = payload.onboarding;
  state.selectedOnboardingLeadId = leadId;
  showToast('Onboarding packet generated');
  renderAll();
});

loadData();
