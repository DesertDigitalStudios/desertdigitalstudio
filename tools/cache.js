#!/usr/bin/env node
/**
 * cache.js — Simple file-based cache for audit results and repeated queries
 * Prevents re-running the same work and burning API tokens
 *
 * Usage:
 *   const cache = require('./cache');
 *   cache.get('key')           // returns value or null if expired/missing
 *   cache.set('key', value)    // stores with timestamp
 *   cache.has('key')           // true if exists and not expired
 *   cache.clear('key')         // remove one entry
 *   cache.purge()              // remove all expired entries
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'audit-cache.json');
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days default

function load() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); }
  catch { return { _note: 'audit cache', _version: 1 }; }
}

function save(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

function get(key, ttl = TTL_MS) {
  const data = load();
  const entry = data[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) return null; // expired
  return entry.value;
}

function set(key, value) {
  const data = load();
  data[key] = { value, ts: Date.now() };
  save(data);
}

function has(key, ttl = TTL_MS) {
  return get(key, ttl) !== null;
}

function clear(key) {
  const data = load();
  delete data[key];
  save(data);
}

function purge(ttl = TTL_MS) {
  const data = load();
  const now = Date.now();
  let removed = 0;
  for (const key of Object.keys(data)) {
    if (key.startsWith('_')) continue;
    if (data[key].ts && now - data[key].ts > ttl) {
      delete data[key];
      removed++;
    }
  }
  save(data);
  return removed;
}

function stats() {
  const data = load();
  const keys = Object.keys(data).filter(k => !k.startsWith('_'));
  const now = Date.now();
  const valid = keys.filter(k => now - data[k].ts <= TTL_MS).length;
  return { total: keys.length, valid, expired: keys.length - valid };
}

module.exports = { get, set, has, clear, purge, stats };
