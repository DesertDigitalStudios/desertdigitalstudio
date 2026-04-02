#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { generateCaseStudyFiles } = require('./builder');

async function main() {
  const studyPath = process.argv[2];
  if (!studyPath) {
    console.error('Usage: node case-studies/generate.js <study.json>');
    process.exit(1);
  }

  const study = JSON.parse(fs.readFileSync(path.resolve(studyPath), 'utf8'));
  const result = await generateCaseStudyFiles({ study });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
