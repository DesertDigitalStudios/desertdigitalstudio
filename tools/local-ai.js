#!/usr/bin/env node
/**
 * local-ai.js — Interface with local Qwen3 via Ollama API
 *
 * Usage:
 *   node local-ai.js "Your prompt here"
 *   echo "prompt" | node local-ai.js
 *
 * Options:
 *   --model <name>    Model to use (default: qwen3:14b)
 *   --raw             Output raw JSON instead of just the response
 */

const http = require('http');

const args = process.argv.slice(2);
const modelIdx = args.indexOf('--model');
const model = modelIdx !== -1 ? args[modelIdx + 1] : 'qwen3:14b';
const raw = args.includes('--raw');

async function query(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, prompt, stream: false });
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(raw ? parsed : parsed.response);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  let prompt = args.filter(a => !a.startsWith('--') && a !== model).join(' ');

  if (!prompt && !process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    prompt = Buffer.concat(chunks).toString().trim();
  }

  if (!prompt) {
    console.error('Usage: node local-ai.js "Your prompt here"');
    process.exit(1);
  }

  try {
    const response = await query(prompt);
    console.log(response);
  } catch (err) {
    console.error('Error calling Ollama:', err.message);
    console.error('Make sure Ollama is running: brew services start ollama');
    process.exit(1);
  }
}

main();
