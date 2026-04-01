const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const EMAIL_LOG = '/Users/gabrielmaciel/.openclaw/workspace/tools/email-monitor/email-log.json';
const LEADS_FILE = path.join(__dirname, 'leads.json');

app.get('/emails', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(EMAIL_LOG, 'utf8'));
    res.json(Array.isArray(data) ? data.slice(0, 10) : []);
  } catch (e) {
    res.json([]);
  }
});

app.get('/leads', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.post('/leads', (req, res) => {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3737, () => console.log('Dashboard API running on :3737'));
