#!/usr/bin/env node
/**
 * yelp-discovery.js
 * Discovers local businesses via Yelp Fusion API.
 * Replaces the manual input JSON lists with real Yelp data.
 *
 * Usage:
 *   node yelp-discovery.js --city "Tucson, AZ" --category restaurants --limit 20
 *
 * Returns JSON array of businesses in the same format as input JSON files,
 * so it's a drop-in replacement for the manual lists.
 *
 * Free tier: 500 calls/day. Each city+category = 1 call.
 * At 6 cities x 10 categories = 60 calls/night. Well within free limit.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../../.yelp-config.json');

// ─── CONFIG ──────────────────────────────────────────────────────────────────

function loadApiKey() {
  if (process.env.YELP_API_KEY) return process.env.YELP_API_KEY;
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return cfg.apiKey;
  } catch {
    return null;
  }
}

function saveApiKey(key) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ apiKey: key }, null, 2));
  fs.chmodSync(CONFIG_PATH, 0o600); // owner read/write only
}

// ─── YELP CATEGORY MAPPING ───────────────────────────────────────────────────

const YELP_CATEGORIES = {
  'restaurants':    'restaurants',
  'cafes':          'cafes,coffee',
  'salons':         'hair,beautysvc',
  'barbers':        'barbers',
  'home-services':  'homeservices',
  'auto-repair':    'auto',
  'dental':         'dentists',
  'gyms':           'gyms,yoga,fitness',
  'retail':         'shopping',
  'tattoo-shops':   'tattoo'
};

// ─── YELP API ─────────────────────────────────────────────────────────────────

function yelpSearch({ location, categories, limit = 20, apiKey }) {
  return new Promise((resolve, reject) => {
    const yelpCat = YELP_CATEGORIES[categories] || categories;
    const params = new URLSearchParams({
      location,
      categories: yelpCat,
      limit: Math.min(limit, 50),
      sort_by: 'review_count'
    });

    const options = {
      hostname: 'api.yelp.com',
      path: `/v3/businesses/search?${params}`,
      headers: { Authorization: `Bearer ${apiKey}` }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Yelp API error ${res.statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.businesses || []);
        } catch (e) {
          reject(new Error('Failed to parse Yelp response'));
        }
      });
    }).on('error', reject);
  });
}

function yelpToInputFormat(businesses, city, category) {
  return businesses
    .filter(b => b.name && !b.is_closed)
    .map(b => ({
      name: b.name,
      website: b.url ? undefined : undefined, // Yelp doesn't give website URLs in search
      city: city.split(',')[0].trim(),
      category,
      yelpId: b.id,
      yelpUrl: b.url,
      phone: b.phone || null,
      rating: b.rating,
      reviewCount: b.review_count,
      address: b.location?.display_address?.join(', ') || null
    }))
    .filter(b => Object.keys(b).length > 0);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const opts = { city: null, category: null, limit: 20, save: false, key: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--city': opts.city = args[++i]; break;
      case '--category': opts.category = args[++i]; break;
      case '--limit': opts.limit = parseInt(args[++i]) || 20; break;
      case '--save': opts.save = true; break;
      case '--set-key': opts.key = args[++i]; break;
    }
  }

  // Save API key if provided
  if (opts.key) {
    saveApiKey(opts.key);
    console.log('✅ Yelp API key saved to', CONFIG_PATH);
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error('❌ No Yelp API key found. Run: node yelp-discovery.js --set-key YOUR_KEY');
    process.exit(1);
  }

  if (!opts.city || !opts.category) {
    console.error('Usage: node yelp-discovery.js --city "Tucson, AZ" --category restaurants [--limit 20] [--save]');
    process.exit(1);
  }

  try {
    const businesses = await yelpSearch({
      location: opts.city,
      categories: opts.category,
      limit: opts.limit,
      apiKey
    });

    const formatted = yelpToInputFormat(businesses, opts.city, opts.category);

    if (opts.save) {
      const citySlug = opts.city.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
      const outPath = path.resolve(__dirname, `input/${citySlug}-${opts.category}-yelp.json`);
      fs.writeFileSync(outPath, JSON.stringify(formatted, null, 2));
      console.log(`Saved ${formatted.length} businesses to ${outPath}`);
    } else {
      console.log(JSON.stringify(formatted, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

// ─── MODULE EXPORT ────────────────────────────────────────────────────────────

module.exports = { yelpSearch, yelpToInputFormat, loadApiKey, YELP_CATEGORIES };

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
