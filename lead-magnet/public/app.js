function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const form = document.getElementById('audit-form');
const statusNode = document.getElementById('status');
const resultNode = document.getElementById('result');

form.addEventListener('submit', async event => {
  event.preventDefault();
  statusNode.textContent = 'Running audit…';
  resultNode.classList.add('muted');
  resultNode.textContent = 'Checking the homepage now…';

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    businessName: document.getElementById('businessName').value.trim(),
    website: document.getElementById('website').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    goals: document.getElementById('goals').value.trim()
  };

  try {
    const response = await fetch('/api/public-audit/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);

    const audit = data.submission?.audit || {};
    resultNode.classList.remove('muted');
    resultNode.innerHTML = `
      <div class="result-grid">
        <div class="result-card"><div class="result-label">Score</div><div class="result-value">${esc(audit.score || 0)}/100</div></div>
        <div class="result-card"><div class="result-label">Top issues</div><div>${esc((audit.topIssues || []).join(' · ') || 'No major misses flagged')}</div></div>
        <div class="result-card"><div class="result-label">Next step</div><div>Reply to the DDS follow-up to get a manual review.</div></div>
      </div>
      <p>${esc(audit.summary || 'Audit complete.')}</p>
      <div class="check-list">
        ${(audit.checks || []).map(check => `<div class="check ${check.pass ? 'pass' : 'fail'}"><strong>${esc(check.label)}</strong>${esc(check.pass ? 'Looks good in this quick scan.' : check.failMessage)}</div>`).join('')}
      </div>
    `;
    statusNode.textContent = 'Done';
  } catch (error) {
    statusNode.textContent = 'Error';
    resultNode.classList.add('muted');
    resultNode.textContent = error.message;
  }
});
