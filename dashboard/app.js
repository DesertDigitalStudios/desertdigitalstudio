const state = {
  crm: null,
  emails: [],
  selectedLeadId: null
};

const stageField = document.getElementById('lead-stage');
const proposalLeadField = document.getElementById('proposal-lead');
const proposalPackageField = document.getElementById('proposal-package');

function $(id) {
  return document.getElementById(id);
}

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

function leadById(id) {
  return (state.crm?.leads || []).find(lead => lead.id === id);
}

function sortedLeads() {
  return [...(state.crm?.leads || [])].sort((a, b) => b.outreachScore - a.outreachScore);
}

function renderSummary() {
  const leads = sortedLeads();
  const prime = leads.filter(lead => lead.outreachTier === 'prime').length;
  const reachable = leads.filter(lead => lead.publicEmail).length;
  const proposals = leads.filter(lead => lead.proposal?.status === 'Drafted').length;
  const won = leads.filter(lead => lead.stage === 'Won').length;
  const pipelineValue = leads
    .filter(lead => !['Parked', 'Won'].includes(lead.stage))
    .reduce((sum, lead) => sum + Number(lead.estimatedValue || 0), 0);

  $('summary-grid').innerHTML = [
    ['Total leads', leads.length, 'All records currently in the CRM'],
    ['Prime leads', prime, 'Best use of outreach time right now'],
    ['Reachable by email', reachable, 'Public email captured from notes or audits'],
    ['Proposals drafted', proposals, 'Generated from the built-in proposal system'],
    ['Pipeline value', formatMoney(pipelineValue), `${won} won lead${won === 1 ? '' : 's'} so far`]
  ].map(([label, value, note]) => `
    <div class="summary-card">
      <div class="summary-label">${esc(label)}</div>
      <div class="summary-value">${esc(value)}</div>
      <div class="summary-note">${esc(note)}</div>
    </div>
  `).join('');

  $('updated-at').textContent = formatDate(state.crm?.updatedAt);
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
      renderAll();
    });
  });
}

function fillStageOptions() {
  const options = (state.crm?.stages || []).map(stage => `<option value="${esc(stage)}">${esc(stage)}</option>`).join('');
  stageField.innerHTML = options;
}

function fillProposalOptions() {
  proposalLeadField.innerHTML = sortedLeads().map(lead => `
    <option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.outreachTier)} · ${lead.outreachScore}</option>
  `).join('');

  proposalPackageField.innerHTML = (state.crm?.packages || []).map(pkg => `
    <option value="${esc(pkg.id)}">${esc(pkg.name)} · ${formatMoney(pkg.price)}</option>
  `).join('');

  if (state.selectedLeadId) {
    proposalLeadField.value = state.selectedLeadId;
    syncProposalFormToLead();
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
  $('lead-website').value = lead.website || '';
  $('lead-value').value = lead.estimatedValue || '';
  $('lead-followup').value = lead.followUpOn ? String(lead.followUpOn).slice(0, 10) : '';
  $('lead-lasttouch').value = lead.lastTouch ? String(lead.lastTouch).slice(0, 10) : '';
  $('lead-nextaction').value = lead.nextAction || '';
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
    website: $('lead-website').value.trim() || null,
    estimatedValue: Number($('lead-value').value || 0),
    followUpOn: $('lead-followup').value || null,
    lastTouch: $('lead-lasttouch').value || null,
    nextAction: $('lead-nextaction').value.trim(),
    notes: $('lead-notes').value
  };
}

function syncProposalFormToLead() {
  const lead = leadById(proposalLeadField.value);
  if (!lead) return;
  proposalPackageField.value = lead.proposal?.packageId || lead.recommendedPackage || 'refresh';
  $('proposal-price').value = lead.proposal?.price || lead.estimatedValue || 0;
}

async function saveCRM(successMessage = 'CRM saved') {
  state.crm = await api('/api/crm', {
    method: 'POST',
    body: JSON.stringify(state.crm)
  });
  showToast(successMessage);
  renderAll();
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
  renderLeadTable();
  renderPipeline();
  renderLeadForm();
  fillProposalOptions();
  renderEmails();
}

async function loadData() {
  try {
    $('api-status').textContent = 'online';
    state.crm = await api('/api/crm');
    state.emails = await api('/emails').catch(() => []);
    if (!state.selectedLeadId && state.crm.leads?.length) {
      state.selectedLeadId = sortedLeads()[0]?.id || null;
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
    }
  } : lead);
  await saveCRM('Lead saved');
});

$('lead-prev-stage').addEventListener('click', () => moveLeadStage($('lead-id').value, -1));
$('lead-next-stage').addEventListener('click', () => moveLeadStage($('lead-id').value, 1));
proposalLeadField.addEventListener('change', syncProposalFormToLead);
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

loadData();
