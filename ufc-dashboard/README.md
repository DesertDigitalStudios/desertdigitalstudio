# UFC Dashboard MVP

Separate local dashboard for weekly UFC fight research.

## What it does now
- Pulls the next upcoming UFC card from UFCStats
- Pulls fighter stat pages for that card
- Builds simple matchup comparisons and heuristic betting leans
- Adds an odds layer with two modes:
  - automatic API mode if `ODDS_API_KEY` is set
  - local manual fallback from `data/manual-odds.json`
- Compares model win % vs implied odds % to surface simple value spots
- Serves a local dashboard UI

## Commands
- Update data: `node scripts/update-data.js`
- Run dashboard: `node server.js`

## URL
- Default local URL: `http://127.0.0.1:3838`

## Odds setup
- Copy `.env.example` values into your shell or launch config if you want live API odds
- Without an API key, edit `data/manual-odds.json`
- Use American odds format, for example `-145` or `+120`

## Next upgrades
- Better fighter trend scoring
- Betting journal and results tracking
- Scheduled weekly refresh via launchd
- Props, totals, and method-of-victory markets

## Notes
- Current lean/confidence system is heuristic only.
- This is for research support, not guaranteed picks.
