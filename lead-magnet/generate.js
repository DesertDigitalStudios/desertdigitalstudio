#!/usr/bin/env node
'use strict';

const { runFreeAudit, generateLeadMagnetFiles } = require('./builder');

async function main() {
  const [name, email, businessName, website] = process.argv.slice(2);
  if (!name || !email || !businessName || !website) {
    console.error('Usage: node lead-magnet/generate.js <name> <email> <businessName> <website>');
    process.exit(1);
  }

  const submission = await runFreeAudit({ name, email, businessName, website });
  const files = await generateLeadMagnetFiles({ submission });
  console.log(JSON.stringify({ submission, files }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
