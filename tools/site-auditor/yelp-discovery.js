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
const INPUT_DIR = path.resolve(__dirname, 'input');

const CITY_CONFIG = {
  'Tucson, AZ': {
    latitude: 32.2226,
    longitude: -110.9747,
    radius: 30000,
    aliases: ['tucson']
  },
  'Sierra Vista, AZ': {
    latitude: 31.5455,
    longitude: -110.2773,
    radius: 18000,
    aliases: ['sierra vista']
  },
  'Benson, AZ': {
    latitude: 31.9679,
    longitude: -110.2945,
    radius: 12000,
    aliases: ['benson']
  },
  'Tombstone, AZ': {
    latitude: 31.7129,
    longitude: -110.0676,
    radius: 10000,
    aliases: ['tombstone']
  },
  'Willcox, AZ': {
    latitude: 32.2528,
    longitude: -109.8320,
    radius: 12000,
    aliases: ['willcox', 'willcox az']
  },
  'Vail, AZ': {
    latitude: 32.0478,
    longitude: -110.7123,
    radius: 18000,
    aliases: ['vail']
  }
};

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
    const cityConfig = CITY_CONFIG[location];
    const params = new URLSearchParams({
      categories: yelpCat,
      limit: Math.min(limit, 50),
      sort_by: 'best_match'
    });

    if (cityConfig?.latitude && cityConfig?.longitude) {
      params.set('latitude', String(cityConfig.latitude));
      params.set('longitude', String(cityConfig.longitude));
      params.set('radius', String(cityConfig.radius || 15000));
    } else {
      params.set('location', location);
    }

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

function isLocalResult(business, city) {
  const config = CITY_CONFIG[city];
  if (!config?.aliases?.length) return true;
  const haystack = [
    business.location?.city,
    business.location?.display_address?.join(', '),
    business.location?.address1,
    business.location?.address2,
    business.location?.address3
  ].filter(Boolean).join(' | ').toLowerCase();

  return config.aliases.some(alias => haystack.includes(String(alias).toLowerCase()));
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function loadStaticWebsiteMap(city, category) {
  const citySlug = city.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-');
  const inputPath = path.join(INPUT_DIR, `${citySlug}-${category}.json`);
  if (!fs.existsSync(inputPath)) return new Map();

  try {
    const items = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const map = new Map();
    for (const item of items || []) {
      if (item?.name && item?.website) {
        map.set(normalizeName(item.name), item.website);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function yelpToInputFormat(businesses, city, category) {
  const seen = new Set();
  const staticWebsiteMap = loadStaticWebsiteMap(city, category);

  return businesses
    .filter(b => b.name && !b.is_closed)
    .filter(b => isLocalResult(b, city))
    .filter(b => {
      const key = `${String(b.id || '').toLowerCase()}|${String(b.name || '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(b => ({
      name: b.name,
      website: staticWebsiteMap.get(normalizeName(b.name)) || undefined,
      city: city.split(',')[0].trim(),
      category,
      yelpId: b.id,
      yelpUrl: b.url,
      phone: b.phone || null,
      rating: b.rating,
      reviewCount: b.review_count,
      address: b.location?.display_address?.join(', ') || null
    }));
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

module.exports = { yelpSearch, yelpToInputFormat, loadApiKey, YELP_CATEGORIES, CITY_CONFIG };

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
