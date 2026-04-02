#!/usr/bin/env node
'use strict';

const { generateContentDraft, saveContentDraft } = require('./builder');

async function main() {
  const sourceType = process.argv[2] || 'service';
  const sourceId = process.argv[3] || 'refresh';
  const draft = generateContentDraft({ sourceType, sourceId });
  const files = saveContentDraft({ draft });
  console.log(JSON.stringify({ draft, files }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
