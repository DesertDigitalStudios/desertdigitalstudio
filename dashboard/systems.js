const systemsState = {
  caseStudies: null,
  leadMagnet: null,
  contentEngine: null,
  followups: null,
  selectedStudyId: null
};

function upsertById(items, item) {
  const list = [...(items || [])];
  const index = list.findIndex(entry => entry.id === item.id || (item.leadId && entry.leadId === item.leadId));
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  return list;
}

function sourceListForType(sourceType) {
  if (sourceType === 'case-study') {
    return (systemsState.caseStudies?.studies || []).map(study => ({ id: study.id, label: `${study.businessName} · ${study.status}` }));
  }
  if (sourceType === 'lead-magnet') {
    return (systemsState.leadMagnet?.submissions || []).map(item => ({ id: item.id, label: `${item.businessName || item.website} · ${item.audit?.score || 0}/100` }));
  }
  if (sourceType === 'lead') {
    return (state.crm?.leads || []).map(lead => ({ id: lead.id, label: `${lead.businessName} · ${lead.outreachTier} · ${lead.outreachScore}` }));
  }
  return (state.crm?.packages || []).map(pkg => ({ id: pkg.id, label: `${pkg.name} · ${formatMoney(pkg.price)}` }));
}

function currentStudy() {
  return (systemsState.caseStudies?.studies || []).find(study => study.id === systemsState.selectedStudyId)
    || (systemsState.caseStudies?.studies || [])[0]
    || null;
}

function setStudyFromLead(leadId) {
  const existing = (systemsState.caseStudies?.studies || []).find(study => study.leadId === leadId || study.id === `${leadId}-case-study`);
  if (existing) {
    systemsState.selectedStudyId = existing.id;
  }
}

function renderCaseStudySelects() {
  const leadSelect = $('case-study-lead');
  const studyStatus = $('case-study-status');
  const leads = state.crm?.leads || [];

  leadSelect.innerHTML = leads.map(lead => `<option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.stage || 'Scored')}</option>`).join('');
  studyStatus.innerHTML = (systemsState.caseStudies?.statuses || ['Draft', 'Review', 'Published'])
    .map(status => `<option value="${esc(status)}">${esc(status)}</option>`).join('');

  if (!leadSelect.value && leads[0]?.id) leadSelect.value = leads[0].id;
  if (!systemsState.selectedStudyId && systemsState.caseStudies?.studies?.length) {
    systemsState.selectedStudyId = systemsState.caseStudies.studies[0].id;
  }
  if (leadSelect.value) setStudyFromLead(leadSelect.value);
}

function renderCaseStudyForm() {
  renderCaseStudySelects();
  const leadId = $('case-study-lead').value;
  const lead = (state.crm?.leads || []).find(item => item.id === leadId);
  const study = (systemsState.caseStudies?.studies || []).find(item => item.leadId === leadId || item.id === systemsState.selectedStudyId);

  $('case-study-empty').classList.toggle('hidden', !!lead);
  $('case-study-form').classList.toggle('hidden', !lead);
  if (!lead) return;

  $('case-study-id').value = study?.id || `${lead.id}-case-study`;
  $('case-study-status').value = study?.status || 'Draft';
  $('case-study-headline').value = study?.headline || `${lead.businessName}: before/after website turnaround`;
  $('case-study-challenge').value = study?.challenge || lead.quickPitch || '';
  $('case-study-solution').value = study?.solution || 'DDS cleaned up the site structure, trust signals, messaging, and CTA path.';
  $('case-study-outcome').value = study?.outcome || 'Replace with the real result, review, or measurable impact.';
  $('case-study-wins').value = (study?.wins || []).join('\n');
  $('case-study-testimonial').value = study?.testimonial || '';
  $('case-study-attribution').value = study?.quoteAttribution || `${lead.businessName} team`;

  const generated = study?.generated;
  $('case-study-result').classList.toggle('muted', !generated?.pdfPath);
  $('case-study-result').innerHTML = generated?.pdfPath
    ? `<strong>Latest case study:</strong><br>Generated ${esc(formatDate(generated.lastGeneratedAt))}<br>HTML: <code>${esc(generated.htmlPath || '—')}</code><br>PDF: <code>${esc(generated.pdfPath || '—')}</code>`
    : 'Seed a draft from a lead, tighten the story, then generate the public-facing case study PDF.';

  $('case-study-list').innerHTML = (systemsState.caseStudies?.studies || []).slice(0, 5).map(item => `
    <div class="mini-list-item ${systemsState.selectedStudyId === item.id ? 'selected' : ''}" data-study-id="${esc(item.id)}">
      <strong>${esc(item.businessName)}</strong>
      <span>${esc(item.status)} · ${esc(item.projectType || 'Website refresh')}</span>
    </div>
  `).join('') || '<div class="empty-state">No case studies yet.</div>';

  document.querySelectorAll('[data-study-id]').forEach(node => {
    node.addEventListener('click', () => {
      systemsState.selectedStudyId = node.dataset.studyId;
      const selected = (systemsState.caseStudies?.studies || []).find(item => item.id === node.dataset.studyId);
      if (selected?.leadId) $('case-study-lead').value = selected.leadId;
      renderCaseStudyForm();
    });
  });
}

function collectCaseStudyForm() {
  const leadId = $('case-study-lead').value;
  const lead = (state.crm?.leads || []).find(item => item.id === leadId);
  const existing = (systemsState.caseStudies?.studies || []).find(item => item.leadId === leadId || item.id === $('case-study-id').value);

  return {
    ...(existing || {}),
    id: $('case-study-id').value,
    leadId,
    businessName: lead?.businessName || existing?.businessName || '',
    city: lead?.city || existing?.city || '',
    website: lead?.website || existing?.website || '',
    status: $('case-study-status').value,
    headline: $('case-study-headline').value.trim(),
    challenge: $('case-study-challenge').value.trim(),
    solution: $('case-study-solution').value.trim(),
    outcome: $('case-study-outcome').value.trim(),
    wins: parseList($('case-study-wins').value),
    testimonial: $('case-study-testimonial').value.trim(),
    quoteAttribution: $('case-study-attribution').value.trim(),
    generated: {
      ...(existing?.generated || {})
    }
  };
}

async function saveCaseStudyDraft() {
  const study = collectCaseStudyForm();
  systemsState.caseStudies = systemsState.caseStudies || { statuses: ['Draft', 'Review', 'Published'], studies: [] };
  systemsState.caseStudies.studies = upsertById(systemsState.caseStudies.studies, study);
  systemsState.caseStudies = await api('/api/case-studies', {
    method: 'POST',
    body: JSON.stringify(systemsState.caseStudies)
  });
  systemsState.selectedStudyId = study.id;
  renderCaseStudyForm();
  showToast('Case study draft saved');
}

function renderLeadMagnetPanel() {
  const submissions = systemsState.leadMagnet?.submissions || [];
  $('lead-magnet-count').textContent = submissions.length;
  $('lead-magnet-url').textContent = `${location.origin}/free-audit/`;
  $('lead-magnet-feed').innerHTML = submissions.slice(0, 6).map(item => `
    <div class="mini-list-item">
      <strong>${esc(item.businessName || item.website)}</strong>
      <span>${esc(item.email || 'No email')} · ${esc(item.audit?.score || 0)}/100 · ${esc(item.status || 'New')}</span>
    </div>
  `).join('') || '<div class="empty-state">No free-audit submissions yet.</div>';
}

function renderContentSourceOptions() {
  const type = $('content-source-type').value;
  const select = $('content-source-id');
  const options = sourceListForType(type);
  select.innerHTML = options.map(item => `<option value="${esc(item.id)}">${esc(item.label)}</option>`).join('');
}

function renderContentEnginePanel() {
  renderContentSourceOptions();
  $('content-pack-list').innerHTML = (systemsState.contentEngine?.drafts || []).slice(0, 5).map(item => `
    <div class="mini-list-item">
      <strong>${esc(item.title)}</strong>
      <span>${esc(item.sourceType)} · ${esc(formatDate(item.generatedAt))}</span>
    </div>
  `).join('') || '<div class="empty-state">No content packs generated yet.</div>';
}

function renderFollowupsPanel() {
  const leadSelect = $('followup-lead');
  leadSelect.innerHTML = (state.crm?.leads || []).map(lead => `<option value="${esc(lead.id)}">${esc(lead.businessName)} · ${esc(lead.stage || 'Scored')}</option>`).join('');
  $('followup-list').innerHTML = (systemsState.followups?.sequences || []).slice(0, 5).map(item => `
    <div class="mini-list-item">
      <strong>${esc(item.businessName)}</strong>
      <span>${esc(item.sequenceTypeLabel || item.sequenceType)} · ${esc(formatDate(item.generatedAt))}</span>
    </div>
  `).join('') || '<div class="empty-state">No follow-up sequences generated yet.</div>';
}

async function loadSystems() {
  const [crm, caseStudies, leadMagnet, contentEngine, followups] = await Promise.all([
    api('/api/crm').catch(() => state.crm),
    api('/api/case-studies').catch(() => ({ statuses: ['Draft', 'Review', 'Published'], studies: [] })),
    api('/api/public-audit').catch(() => ({ submissions: [] })),
    api('/api/content-engine').catch(() => ({ drafts: [] })),
    api('/api/followups').catch(() => ({ sequences: [] }))
  ]);

  if (crm) state.crm = crm;
  systemsState.caseStudies = caseStudies;
  systemsState.leadMagnet = leadMagnet;
  systemsState.contentEngine = contentEngine;
  systemsState.followups = followups;

  renderCaseStudyForm();
  renderLeadMagnetPanel();
  renderContentEnginePanel();
  renderFollowupsPanel();
}

$('case-study-lead').addEventListener('change', () => {
  setStudyFromLead($('case-study-lead').value);
  renderCaseStudyForm();
});

$('case-study-seed-btn').addEventListener('click', async () => {
  const leadId = $('case-study-lead').value;
  const payload = await api('/api/case-studies/seed-from-lead', {
    method: 'POST',
    body: JSON.stringify({ leadId })
  });
  systemsState.caseStudies = payload.caseStudies;
  systemsState.selectedStudyId = payload.study?.id || null;
  renderCaseStudyForm();
  showToast('Case study draft seeded from lead');
});

$('case-study-form').addEventListener('submit', async event => {
  event.preventDefault();
  await saveCaseStudyDraft();
});

$('case-study-generate-btn').addEventListener('click', async () => {
  await saveCaseStudyDraft();
  const study = collectCaseStudyForm();
  const payload = await api('/api/case-studies/generate', {
    method: 'POST',
    body: JSON.stringify({ studyId: study.id, study })
  });
  systemsState.caseStudies = payload.caseStudies;
  systemsState.selectedStudyId = payload.study?.id || study.id;
  renderCaseStudyForm();
  showToast('Case study generated');
});

$('content-source-type').addEventListener('change', renderContentSourceOptions);
$('content-form').addEventListener('submit', async event => {
  event.preventDefault();
  const payload = await api('/api/content-engine/generate', {
    method: 'POST',
    body: JSON.stringify({
      sourceType: $('content-source-type').value,
      sourceId: $('content-source-id').value,
      angle: $('content-angle').value.trim(),
      audience: $('content-audience').value.trim(),
      callToAction: $('content-cta').value.trim()
    })
  });
  systemsState.contentEngine = payload.contentEngine;
  $('content-result').classList.remove('muted');
  $('content-result').innerHTML = `<strong>Generated content pack:</strong><br>HTML: <code>${esc(payload.draft.htmlPath || '—')}</code><br>JSON: <code>${esc(payload.draft.jsonPath || '—')}</code>`;
  renderContentEnginePanel();
  showToast('Content pack generated');
});

$('followup-form').addEventListener('submit', async event => {
  event.preventDefault();
  const payload = await api('/api/followups/generate', {
    method: 'POST',
    body: JSON.stringify({
      leadId: $('followup-lead').value,
      sequenceType: $('followup-type').value
    })
  });
  systemsState.followups = payload.followups;
  $('followup-result').classList.remove('muted');
  $('followup-result').innerHTML = `<strong>Generated ${esc(payload.sequence.sequenceTypeLabel || payload.sequence.sequenceType)}:</strong><br>Channel: <code>${esc(payload.sequence.recommendedChannel || 'Email')}</code><br>HTML: <code>${esc(payload.sequence.htmlPath || '—')}</code><br>JSON: <code>${esc(payload.sequence.jsonPath || '—')}</code>`;
  renderFollowupsPanel();
  showToast('Follow-up sequence generated');
});

loadSystems().catch(error => {
  $('lead-magnet-feed').innerHTML = `<div class="empty-state">${esc(error.message)}</div>`;
});
