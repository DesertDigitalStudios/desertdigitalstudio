# Site Auditor Build Summary

**Built:** March 27, 2026  
**Location:** `/Users/gabrielmaciel/.openclaw/workspace/tools/site-auditor/`  
**Purpose:** Help Gabriel identify local businesses with bad websites — sales leads for web dev work

---

## What Was Built

A Node.js CLI tool that audits local business websites and ranks them worst-first (hottest leads first).

### Files

| File | Purpose |
|------|---------|
| `audit.js` | Main CLI entry point — discovery + audit orchestration |
| `scorer.js` | 11-check scoring engine (0–100 points) |
| `reporter.js` | Markdown + JSON report generator |
| `package.json` | Minimal package manifest |
| `README.md` | Usage guide with sales pitch tips |
| `sample-input.json` | Example input list for 5 Benson AZ restaurants |
| `sample-output/report.md` | Real audit results from Benson AZ restaurants |
| `sample-output/report.json` | Same data as JSON |

### Usage

```bash
# With auto-discovery (may be blocked by Google/Yelp)
node audit.js --city "Benson, AZ" --category "restaurants" --limit 5

# With pre-built list (recommended)
node audit.js --city "Benson, AZ" --category "restaurants" --input my-list.json --output ./output
```

---

## Scoring System (11 checks, 100 points)

| Check | Points |
|-------|--------|
| SSL (HTTPS) | 10 |
| Mobile Responsive | 10 |
| Page Title | 8 |
| Meta Description | 8 |
| H1 Heading | 7 |
| Image Alt Tags | 7 |
| Contact Info | 15 |
| Social Media | 8 |
| Copyright Year | 5 |
| Page Load Speed | 12 |
| Clear CTA | 10 |

---

## Sample Results (Benson AZ Restaurants)

| Business | Score | Grade | Lead? |
|----------|-------|-------|-------|
| Benson City Grille | 0% | F | 🔥🔥🔥 NO WEBSITE |
| Farmhouse Restaurant | 71% | B | 🌤️ Decent |
| The Horseshoe | 72% | B | 🌤️ Decent |
| Mescal Bar and Grill | 79% | B | 🌤️ Decent |
| Horseshoe Cafe & Bakery | 89% | A | ✅ Well Built |

**Common issues found:** H1 heading missing (75%), outdated copyright (75%), missing CTAs (50%)

---

## Known Limitations / Notes

1. **Auto-discovery may fail** — Google and Yelp block headless Playwright scrapers. The `--input` JSON file workflow is more reliable. Recommend Gabriel manually look up businesses on Yelp/Google Maps and make a quick JSON list.

2. **Mescal Bar** redirected to their Facebook page (mescalbar.com → facebook.com). The tool audited the Facebook page, which scored higher than their real web presence deserves. Adding a check for "is this just a Facebook/social page?" would be a good improvement.

3. **Playwright reuse** — the tool borrows Playwright from `workspace/browser/node_modules/playwright` (two levels up). No separate npm install needed.

4. **Headless Chromium** — already installed via the browser workspace. Works immediately.

---

## Future Improvements

- [ ] Screenshot capture of each site for the report
- [ ] Detect "Facebook-only" web presence and flag it
- [ ] Google Maps API integration for better discovery (would need a key)
- [ ] CSV export for loading into CRM
- [ ] Email draft generator per lead ("Here's what I found on your site...")
- [ ] Auto-open report.md in browser after audit
