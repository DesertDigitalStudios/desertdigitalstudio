function normalizeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function extractMetaDescription(html) {
  const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return m ? m[1].trim() : '';
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}

function hasContactSignals(html) {
  return /mailto:|tel:|contact|phone|call us|email us/i.test(html);
}

function hasCTA(html) {
  return /get started|contact us|book now|request|free quote|call now|schedule|learn more/i.test(html);
}

function scoreAudit({ title, metaDescription, h1, hasContact, hasCta, httpsOk }) {
  let score = 100;
  const checks = [];

  if (!httpsOk) {
    score -= 20;
    checks.push({ label: 'HTTPS', pass: false, failMessage: 'Site did not respond cleanly over HTTPS.' });
  } else {
    checks.push({ label: 'HTTPS', pass: true });
  }

  if (!title) {
    score -= 15;
    checks.push({ label: 'Title Tag', pass: false, failMessage: 'Homepage title is missing.' });
  } else {
    checks.push({ label: 'Title Tag', pass: true });
  }

  if (!metaDescription) {
    score -= 15;
    checks.push({ label: 'Meta Description', pass: false, failMessage: 'Meta description is missing.' });
  } else {
    checks.push({ label: 'Meta Description', pass: true });
  }

  if (!h1) {
    score -= 15;
    checks.push({ label: 'H1 Heading', pass: false, failMessage: 'Main page heading is missing or unclear.' });
  } else {
    checks.push({ label: 'H1 Heading', pass: true });
  }

  if (!hasContact) {
    score -= 20;
    checks.push({ label: 'Contact Path', pass: false, failMessage: 'Contact path is weak or not obvious.' });
  } else {
    checks.push({ label: 'Contact Path', pass: true });
  }

  if (!hasCta) {
    score -= 15;
    checks.push({ label: 'Calls to Action', pass: false, failMessage: 'Calls to action are weak or unclear.' });
  } else {
    checks.push({ label: 'Calls to Action', pass: true });
  }

  score = Math.max(0, score);
  const topIssues = checks.filter(c => !c.pass).map(c => c.label).slice(0, 3);
  const summary = topIssues.length
    ? `Your homepage has a few easy improvement opportunities: ${topIssues.join(', ')}.`
    : 'Your homepage looks solid in this quick snapshot.';

  return { score, checks, topIssues, summary };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const website = normalizeUrl(body.website);
    if (!website) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Website is required' }));
      return;
    }

    const response = await fetch(website, {
      headers: { 'user-agent': 'Desert Digital Studio Audit Bot/1.0' }
    });
    const finalUrl = response.url;
    const html = await response.text();

    const audit = scoreAudit({
      title: extractTitle(html),
      metaDescription: extractMetaDescription(html),
      h1: extractH1(html),
      hasContact: hasContactSignals(html),
      hasCta: hasCTA(html),
      httpsOk: finalUrl.startsWith('https://')
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      ok: true,
      submission: {
        name: body.name || '',
        email: body.email || '',
        businessName: body.businessName || '',
        website,
        audit
      }
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Audit failed' }));
  }
};
