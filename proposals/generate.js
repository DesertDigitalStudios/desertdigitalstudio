#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { generateProposalFiles } = require('./builder');

async function main() {
  const leadPath = process.argv[2];
  const packageId = process.argv[3] || 'refresh';
  const price = process.argv[4] ? Number(process.argv[4]) : undefined;

  if (!leadPath) {
    console.error('Usage: node proposals/generate.js <lead.json> [packageId] [price]');
    process.exit(1);
  }

  const lead = JSON.parse(fs.readFileSync(path.resolve(leadPath), 'utf8'));
  const result = await generateProposalFiles({ lead, packageId, price });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
