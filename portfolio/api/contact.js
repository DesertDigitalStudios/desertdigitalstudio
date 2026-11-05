const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const reply = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, { error: 'Method not allowed' }); }
  if (req.headers.origin && !['https://www.desertdigitalstudio.com', 'https://desertdigitalstudio.com'].includes(req.headers.origin)) return reply(403, { error: 'Origin not allowed' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return reply(400, { error: 'Invalid request' }); }
  if (!body || typeof body !== 'object') return reply(400, { error: 'Invalid request' });
  if (body.companyWebsite) return reply(400, { error: 'Invalid request' });
  const values = {};
  for (const key of ['name', 'business', 'email', 'phone', 'message']) {
    if (body[key] != null && typeof body[key] !== 'string') return reply(400, { error: 'Invalid field' });
    values[key] = (body[key] || '').trim();
    if (values[key].length > (key === 'message' ? 5000 : 254)) return reply(400, { error: 'Field too long' });
  }
  if (!values.name || !values.business || !values.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || /[\r\n]/.test(values.email)) return reply(400, { error: 'Complete required fields' });
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return reply(503, { error: 'Email delivery unavailable. Please email Gabriel directly.' });
  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 15000 });
    const result = await transport.sendMail({ from: `"Desert Digital Studio" <${process.env.SMTP_USER}>`, to: process.env.ALERT_TO_EMAIL || process.env.SMTP_USER, replyTo: values.email, subject: '[Website inquiry] New audit request', text: Object.entries(values).map(([key, value]) => `${key}: ${value}`).join('\n\n') });
    if (!result.accepted || !result.accepted.length) throw new Error('Not accepted');
    return reply(200, { ok: true });
  } catch { return reply(502, { error: 'Email delivery failed. Please try again or email Gabriel directly.' }); }
};
