const fs = require('fs');
const path = require('path');

const OUT_FILE = path.join(__dirname, '..', 'data', 'ufc-data.json');
const UPCOMING_EVENTS_URL = 'http://www.ufcstats.com/statistics/events/upcoming';

function clean(value = '') {
  return String(value)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSlug(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseNumber(value) {
  if (!value || value === '--') return null;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function parsePercent(value) {
  if (!value || value === '--') return null;
  return parseNumber(String(value).replace('%', ''));
}

function parseRecord(recordText = '') {
  const match = clean(recordText).match(/Record:\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/i);
  if (!match) return { wins: null, losses: null, draws: null, total: null };
  const wins = Number(match[1]);
  const losses = Number(match[2]);
  const draws = Number(match[3]);
  return { wins, losses, draws, total: wins + losses + draws };
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 OpenClaw UFC Dashboard' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.text();
}

function extractStatMap(html) {
  const stats = {};
  for (const match of html.matchAll(/<li class="b-list__box-list-item[^>]*>([\s\S]*?)<\/li>/gi)) {
    const item = match[1];
    const label = clean((item.match(/<i[^>]*>([\s\S]*?)<\/i>/i) || [])[1]).replace(/:$/, '');
    const rawValue = clean(item.replace(/<i[^>]*>[\s\S]*?<\/i>/i, ''));
    if (label) stats[label] = rawValue || null;
  }
  return stats;
}

function extractEventMeta(html) {
  const name = clean((html.match(/<span class="b-content__title-highlight">([\s\S]*?)<\/span>/i) || [])[1]);
  const stats = extractStatMap(html);
  return {
    name,
    date: stats.Date || '',
    location: stats.Location || ''
  };
}

function extractUpcomingEvents(html) {
  const rows = [...html.matchAll(/<tr class="b-statistics__table-row">([\s\S]*?)<\/tr>/gi)];
  return rows.map((match) => {
    const row = match[1];
    const eventUrl = (row.match(/href="(http:\/\/www\.ufcstats\.com\/event-details\/[^"]+)"/i) || [])[1];
    if (!eventUrl) return null;
    const name = clean((row.match(/<a[^>]*class="b-link b-link_style_black"[^>]*>([\s\S]*?)<\/a>/i) || [])[1]);
    const date = clean((row.match(/<span class="b-statistics__date">([\s\S]*?)<\/span>/i) || [])[1]);
    const cellMatches = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => clean(m[1]));
    const location = cellMatches[cellMatches.length - 1] || '';
    return { name: name || 'Upcoming Event', url: eventUrl, date, location };
  }).filter(Boolean);
}

function extractFights(html) {
  const rows = [...html.matchAll(/<tr class="b-fight-details__table-row[^"]*?[\s\S]*?<\/tr>/gi)];
  return rows.map((match) => {
    const row = match[0];
    const fightUrl = (row.match(/data-link="(http:\/\/www\.ufcstats\.com\/fight-details\/[^"]+)"/i) || [])[1];
    if (!fightUrl) return null;
    const fighterMatches = [...row.matchAll(/href="(http:\/\/www\.ufcstats\.com\/fighter-details\/[^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/gi)]
      .map((m) => ({ url: m[1], name: clean(m[2]) }))
      .filter((item, index, list) => item.url && item.name && list.findIndex(other => other.url === item.url) === index);
    if (fighterMatches.length < 2) return null;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => clean(m[1]));
    const maybeWeightClass = cells.find((cell) => /weight/i.test(cell)) || '';
    return {
      id: toSlug(`${fighterMatches[0].name}-${fighterMatches[1].name}`),
      fightUrl,
      weightClass: maybeWeightClass,
      fighterA: fighterMatches[0],
      fighterB: fighterMatches[1]
    };
  }).filter(Boolean);
}

function extractRecentFights(html, fighterName) {
  const rows = [...html.matchAll(/<tr class="b-fight-details__table-row[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);
  const recent = [];
  for (const match of rows) {
    const row = match[1];
    if (/\bnext\b/i.test(row)) continue;
    const cols = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
    if (cols.length < 10) continue;
    const result = clean(cols[0]);
    const names = [...cols[1].matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)].map((m) => clean(m[1])).filter(Boolean);
    const opponent = names.find((name) => name !== fighterName) || names[1] || names[0] || 'Unknown';
    const eventParts = [...cols[6].matchAll(/<p class="b-fight-details__table-text">([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter(Boolean);
    const methodParts = [...cols[7].matchAll(/<p class="b-fight-details__table-text">([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter(Boolean);
    recent.push({
      result: result.toUpperCase(),
      opponent,
      event: eventParts[0] || 'Unknown event',
      date: eventParts[1] || '',
      method: methodParts.filter(Boolean).join(' ').trim(),
      round: clean(cols[8]),
      time: clean(cols[9])
    });
    if (recent.length >= 5) break;
  }
  return recent;
}

async function fetchFighter(url) {
  const html = await fetchText(url);
  const stats = extractStatMap(html);
  const name = clean((html.match(/<span class="b-content__title-highlight">([\s\S]*?)<\/span>/i) || [])[1]);
  const record = parseRecord((html.match(/<span class="b-content__title-record">([\s\S]*?)<\/span>/i) || [])[1]);
  const profile = {
    name,
    url,
    nickname: clean((html.match(/<p class="b-content__Nickname">([\s\S]*?)<\/p>/i) || [])[1]) || null,
    height: stats.Height || null,
    weight: stats.Weight || null,
    reach: stats.Reach || null,
    stance: stats.STANCE || null,
    dob: stats.DOB || null,
    slpm: parseNumber(stats.SLpM),
    strikeAcc: parsePercent(stats['Str. Acc.']),
    sapm: parseNumber(stats.SApM),
    strikeDef: parsePercent(stats['Str. Def']),
    tdAvg: parseNumber(stats['TD Avg.']),
    tdAcc: parsePercent(stats['TD Acc.']),
    tdDef: parsePercent(stats['TD Def.']),
    subAvg: parseNumber(stats['Sub. Avg.']),
    record,
    recentFights: extractRecentFights(html, name)
  };
  return profile;
}

function diff(a, b) {
  if (a == null || b == null) return null;
  return Number((a - b).toFixed(2));
}

function winsInRecent(recent = []) {
  return recent.filter(f => /^W$/i.test(f.result)).length;
}

function buildFightAnalysis(fighterA, fighterB) {
  const notes = [];
  const metrics = {
    slpmEdge: diff(fighterA.slpm, fighterB.slpm),
    sapmEdge: diff(fighterB.sapm, fighterA.sapm),
    tdAvgEdge: diff(fighterA.tdAvg, fighterB.tdAvg),
    tdDefEdge: diff(fighterA.tdDef, fighterB.tdDef),
    reachEdge: diff(parseNumber(fighterA.reach), parseNumber(fighterB.reach)),
    recentFormEdge: diff(winsInRecent(fighterA.recentFights), winsInRecent(fighterB.recentFights)),
    experienceEdge: diff(fighterA.record.total, fighterB.record.total)
  };

  const scoreA = [
    (metrics.slpmEdge || 0) * 1.2,
    (metrics.sapmEdge || 0) * 1.4,
    (metrics.tdAvgEdge || 0) * 1.3,
    ((metrics.tdDefEdge || 0) / 10) * 1.1,
    ((metrics.reachEdge || 0) / 2) * 0.7,
    (metrics.recentFormEdge || 0) * 0.9,
    ((metrics.experienceEdge || 0) / 5) * 0.5
  ].reduce((sum, val) => sum + val, 0);

  if ((metrics.slpmEdge || 0) > 0.8) notes.push(`${fighterA.name} has the stronger striking pace.`);
  if ((metrics.sapmEdge || 0) > 0.8) notes.push(`${fighterA.name} absorbs less damage per minute.`);
  if ((metrics.tdAvgEdge || 0) > 0.8) notes.push(`${fighterA.name} shows the more active wrestling game.`);
  if ((metrics.tdDefEdge || 0) > 8) notes.push(`${fighterA.name} owns the stronger takedown defense on paper.`);
  if ((metrics.reachEdge || 0) > 3) notes.push(`${fighterA.name} has a meaningful reach edge.`);
  if ((metrics.recentFormEdge || 0) >= 2) notes.push(`${fighterA.name} has the better recent form.`);

  let lean = 'Pass';
  if (scoreA > 3) lean = `Lean ${fighterA.name}`;
  else if (scoreA < -3) lean = `Lean ${fighterB.name}`;

  const confidence = Math.min(100, Math.round(Math.abs(scoreA) * 12));

  return {
    lean,
    confidence,
    notes: notes.slice(0, 4),
    metrics,
    caution: 'Heuristic only. Check injuries, weigh-ins, short notice, and live odds before betting.'
  };
}

async function main() {
  const upcomingHtml = await fetchText(UPCOMING_EVENTS_URL);
  const upcomingEvents = extractUpcomingEvents(upcomingHtml);
  const nextEvent = upcomingEvents[0];
  if (!nextEvent) throw new Error('No upcoming event found');

  const eventHtml = await fetchText(nextEvent.url);
  const eventMeta = extractEventMeta(eventHtml);
  const fights = extractFights(eventHtml);

  const fighterCache = new Map();
  async function getFighter(url) {
    if (!fighterCache.has(url)) {
      fighterCache.set(url, fetchFighter(url));
    }
    return fighterCache.get(url);
  }

  const enrichedFights = [];
  for (const fight of fights) {
    const fighterA = await getFighter(fight.fighterA.url);
    const fighterB = await getFighter(fight.fighterB.url);
    enrichedFights.push({
      ...fight,
      fighterA,
      fighterB,
      analysis: buildFightAnalysis(fighterA, fighterB)
    });
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    source: {
      events: UPCOMING_EVENTS_URL,
      note: 'Primary stats source: UFCStats. Odds layer not wired yet in MVP.'
    },
    nextEvent: {
      ...nextEvent,
      name: eventMeta.name || nextEvent.name,
      date: eventMeta.date || nextEvent.date,
      location: eventMeta.location || nextEvent.location,
      totalFights: enrichedFights.length
    },
    upcomingEvents: upcomingEvents.slice(0, 6),
    fights: enrichedFights,
    generatedInsights: {
      bestConfidenceLeans: enrichedFights
        .filter(fight => fight.analysis.lean !== 'Pass')
        .sort((a, b) => b.analysis.confidence - a.analysis.confidence)
        .slice(0, 5)
        .map(fight => ({
          matchup: `${fight.fighterA.name} vs ${fight.fighterB.name}`,
          lean: fight.analysis.lean,
          confidence: fight.analysis.confidence
        }))
    }
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Updated UFC dashboard data: ${OUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
