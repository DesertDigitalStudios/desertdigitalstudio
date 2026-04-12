# UFC Dashboard MVP

Separate local dashboard for weekly UFC fight research.

## What it does now
- Pulls the next upcoming UFC card from UFCStats
- Pulls fighter stat pages for that card
- Builds simple matchup comparisons and heuristic betting leans
- Serves a local dashboard UI

## Commands
- Update data: `node scripts/update-data.js`
- Run dashboard: `node server.js`

## URL
- Default local URL: `http://127.0.0.1:3838`

## Next upgrades
- Odds API integration
- Better fighter trend scoring
- Betting journal and results tracking
- Scheduled weekly refresh via launchd

## Notes
- Current lean/confidence system is heuristic only.
- This is for research support, not guaranteed picks.
