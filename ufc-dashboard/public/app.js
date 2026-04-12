async function loadData() {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error('Failed to load UFC dashboard data');
  return res.json();
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function metricCell(label, a, b, invert = false) {
  const av = a == null ? '—' : a;
  const bv = b == null ? '—' : b;
  let clsA = '';
  let clsB = '';
  if (a != null && b != null) {
    const aBetter = invert ? a < b : a > b;
    clsA = aBetter ? 'better' : 'worse';
    clsB = aBetter ? 'worse' : 'better';
  }
  return `
    <div class="metric-row">
      <span class="metric-label">${esc(label)}</span>
      <span class="metric-value ${clsA}">${esc(av)}</span>
      <span class="metric-value ${clsB}">${esc(bv)}</span>
    </div>
  `;
}

function recordText(record = {}) {
  if (record.wins == null) return '—';
  return `${record.wins}-${record.losses}-${record.draws}`;
}

function renderSummary(data) {
  const fights = data.fights || [];
  const withLean = fights.filter(f => f.analysis?.lean && f.analysis.lean !== 'Pass').length;
  const valueSpots = fights.filter(f => (f.odds?.edgeA || 0) >= 3 || (f.odds?.edgeB || 0) >= 3).length;
  const avgConfidence = fights.length
    ? Math.round(fights.reduce((sum, f) => sum + (f.analysis?.confidence || 0), 0) / fights.length)
    : 0;

  document.getElementById('summary-grid').innerHTML = [
    ['Card fights', fights.length, 'Current upcoming event'],
    ['Top leans', withLean, 'Matchups with a non-pass heuristic lean'],
    ['Value spots', valueSpots, 'Model edge vs current odds line'],
    ['Avg confidence', `${avgConfidence}%`, 'Heuristic only, not guaranteed edge'],
    ['Tracked events', (data.upcomingEvents || []).length, 'Current card plus the next few spots on the calendar']
  ].map(([label, value, note]) => `
    <div class="summary-card">
      <div class="summary-label">${esc(label)}</div>
      <div class="summary-value">${esc(value)}</div>
      <div class="summary-note">${esc(note)}</div>
    </div>
  `).join('');
}

function renderHeader(data) {
  document.getElementById('updated-at').textContent = formatDate(data.updatedAt);
  document.getElementById('fight-count').textContent = `${data.nextEvent?.totalFights || 0} fights`;
  document.getElementById('event-name').textContent = data.nextEvent?.name || '—';
  document.getElementById('event-date').textContent = data.nextEvent?.date || '—';
  document.getElementById('event-location').textContent = data.nextEvent?.location || '—';

  const topLeans = (data.generatedInsights?.bestConfidenceLeans || []).map(item => `
    <div class="lean-item">
      <strong>${esc(item.lean)}</strong>
      <span>${esc(item.matchup)}</span>
      <em>${esc(item.confidence)}%</em>
    </div>
  `).join('');

  const topValue = (data.generatedInsights?.bestValueSpots || []).map(item => `
    <div class="lean-item">
      <strong>${esc(item.valueLabel)}</strong>
      <span>${esc(item.matchup)}</span>
    </div>
  `).join('');

  document.getElementById('top-leans').innerHTML = `
    ${topLeans || '<div class="muted">No strong early leans yet. Probably a pass-heavy card by this simple model.</div>'}
    ${topValue ? `<div class="leans-divider">Best value looks</div>${topValue}` : ''}
  `;
}

function formatOdds(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n > 0 ? `+${n}` : `${n}`;
}

function renderUpcomingEvents(data) {
  document.getElementById('upcoming-events').innerHTML = (data.upcomingEvents || []).map(event => `
    <div class="event-card">
      <div class="event-name">${esc(event.name)}</div>
      <div class="event-meta">${esc(event.date || 'TBD')}</div>
      <div class="event-meta">${esc(event.location || 'TBD')}</div>
    </div>
  `).join('');
}

function renderFights(data) {
  const fightsHtml = (data.fights || []).map(fight => {
    const a = fight.fighterA;
    const b = fight.fighterB;
    return `
      <article class="fight-card">
        <div class="fight-top">
          <div>
            <div class="fight-matchup">${esc(a.name)} vs ${esc(b.name)}</div>
            <div class="fight-meta">${esc(fight.weightClass || 'Weight class pending / not surfaced by source')}</div>
          </div>
          <div class="lean-badge ${fight.analysis?.lean === 'Pass' ? 'pass' : 'active'}">${esc(fight.analysis?.lean || 'Pass')}</div>
        </div>

        <div class="fighter-heads">
          <div class="fighter-box">
            <h3>${esc(a.name)}</h3>
            <div class="fighter-sub">${esc(a.stance || 'Unknown stance')} · Reach ${esc(a.reach || '—')}</div>
            <div class="fighter-record">Record ${esc(recordText(a.record))}</div>
          </div>
          <div class="fighter-box">
            <h3>${esc(b.name)}</h3>
            <div class="fighter-sub">${esc(b.stance || 'Unknown stance')} · Reach ${esc(b.reach || '—')}</div>
            <div class="fighter-record">Record ${esc(recordText(b.record))}</div>
          </div>
        </div>

        <div class="metric-table">
          <div class="metric-header">
            <span></span>
            <span>${esc(a.name.split(' ')[0])}</span>
            <span>${esc(b.name.split(' ')[0])}</span>
          </div>
          ${metricCell('SLpM', a.slpm, b.slpm)}
          ${metricCell('SApM', a.sapm, b.sapm, true)}
          ${metricCell('Str Acc %', a.strikeAcc, b.strikeAcc)}
          ${metricCell('Str Def %', a.strikeDef, b.strikeDef)}
          ${metricCell('TD Avg', a.tdAvg, b.tdAvg)}
          ${metricCell('TD Def %', a.tdDef, b.tdDef)}
          ${metricCell('Sub Avg', a.subAvg, b.subAvg)}
        </div>

        <div class="notes-block">
          <div class="notes-title">Quick read</div>
          <ul>
            ${(fight.analysis?.notes || []).map(note => `<li>${esc(note)}</li>`).join('') || '<li>No strong edge popped yet, which usually means pass or wait for odds.</li>'}
          </ul>
          <div class="caution">${esc(fight.analysis?.caution || '')}</div>
        </div>

        <div class="odds-panel">
          <div class="notes-title">Odds and value</div>
          <div class="odds-source">${esc(fight.odds?.source || data.source?.oddsProvider || 'Manual / not set')} · ${esc(data.source?.oddsMode || 'manual')}</div>
          <div class="metric-table odds-table">
            <div class="metric-header">
              <span></span>
              <span>${esc(a.name.split(' ')[0])}</span>
              <span>${esc(b.name.split(' ')[0])}</span>
            </div>
            ${metricCell('Moneyline', formatOdds(fight.odds?.fighterAOdds), formatOdds(fight.odds?.fighterBOdds))}
            ${metricCell('Implied %', fight.odds?.impliedA, fight.odds?.impliedB)}
            ${metricCell('Model %', fight.odds?.modelA, fight.odds?.modelB)}
            ${metricCell('Edge %', fight.odds?.edgeA, fight.odds?.edgeB)}
          </div>
          <div class="value-label ${(fight.odds?.edgeA || 0) >= 3 || (fight.odds?.edgeB || 0) >= 3 ? 'value-live' : ''}">${esc(fight.odds?.valueLabel || 'No odds loaded')}</div>
        </div>

        <div class="recent-grid">
          <div>
            <div class="notes-title">${esc(a.name)} recent fights</div>
            <ul class="recent-list">
              ${(a.recentFights || []).slice(0, 4).map(f => `<li><strong>${esc(f.result)}</strong> vs ${esc(f.opponent)} · ${esc(f.method || '—')}</li>`).join('') || '<li>No recent fight history found.</li>'}
            </ul>
          </div>
          <div>
            <div class="notes-title">${esc(b.name)} recent fights</div>
            <ul class="recent-list">
              ${(b.recentFights || []).slice(0, 4).map(f => `<li><strong>${esc(f.result)}</strong> vs ${esc(f.opponent)} · ${esc(f.method || '—')}</li>`).join('') || '<li>No recent fight history found.</li>'}
            </ul>
          </div>
        </div>

        <div class="confidence-row">
          <span>Confidence</span>
          <div class="confidence-bar"><span style="width:${Math.max(4, fight.analysis?.confidence || 0)}%"></span></div>
          <strong>${esc(fight.analysis?.confidence || 0)}%</strong>
        </div>
      </article>
    `;
  }).join('');

  document.getElementById('fights-grid').innerHTML = fightsHtml || '<div class="muted">No fights loaded yet. Run the updater first.</div>';
}

loadData()
  .then(data => {
    renderHeader(data);
    renderSummary(data);
    renderUpcomingEvents(data);
    renderFights(data);
  })
  .catch(error => {
    document.getElementById('fights-grid').innerHTML = `<div class="muted">${esc(error.message)}</div>`;
  });
