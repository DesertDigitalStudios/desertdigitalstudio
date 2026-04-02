#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { generateOnboardingPacket } = require('./builder');

async function main() {
  const clientPath = process.argv[2];

  if (!clientPath) {
    console.error('Usage: node onboarding/generate.js <client.json>');
    process.exit(1);
  }

  const client = JSON.parse(fs.readFileSync(path.resolve(clientPath), 'utf8'));
  const result = await generateOnboardingPacket({ client });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
