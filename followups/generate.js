#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { generateFollowupSequence, saveFollowupSequence } = require('./builder');

async function main() {
  const leadPath = process.argv[2];
  const sequenceType = process.argv[3] || 'audit-nudge';
  if (!leadPath) {
    console.error('Usage: node followups/generate.js <lead.json> [sequenceType]');
    process.exit(1);
  }
  const lead = JSON.parse(fs.readFileSync(path.resolve(leadPath), 'utf8'));
  const sequence = generateFollowupSequence({ lead, sequenceType });
  const files = saveFollowupSequence({ sequence });
  console.log(JSON.stringify({ sequence, files }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
