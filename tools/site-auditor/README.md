# 🔍 Local Business Website Auditor

**Built by Koa for Gabriel's web development business**

Find local businesses with bad websites — your hottest sales leads.

---

## What It Does

1. **Searches** for local businesses in your target city + category
2. **Audits** each website across 11 quality checks
3. **Ranks them worst-to-best** — worst = hottest lead = easiest pitch
4. **Outputs** a readable markdown report + JSON data

## Quick Start

```bash
# Audit restaurants in Benson, AZ (with web discovery)
node audit.js --city "Benson, AZ" --category "restaurants" --limit 5

# Audit using a pre-built list (more reliable — see "Building Your Lead List" below)
node audit.js --city "Benson, AZ" --category "restaurants" --input my-businesses.json --output ./leads

# Save to a specific folder
node audit.js --city "Tucson, AZ" --category "dentists" --input dentists.json --output ./leads
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--city` | City to search (required) | — |
| `--category` | Business type (required) | — |
| `--limit` | Max businesses to audit | 5 |
| `--output` | Where to save reports | `.` (current dir) |
| `--timeout` | Page timeout in ms | 15000 |
| `--verbose` | Show detailed progress | false |
| `--input` | JSON file with pre-known businesses | — |

## Building Your Lead List (Recommended Workflow)

Web scraping for business discovery can be blocked by Google/Yelp. The most reliable workflow:

1. **Search manually on Yelp or Google Maps** for your target city + category
2. **Create a JSON file** with the businesses:

```json
[
  { "name": "Joe's Pizza", "website": "https://joespizza.com", "phone": "(520) 555-1234" },
  { "name": "Maria's Tacos", "website": null, "phone": "(520) 555-5678" },
  { "name": "The Burger Spot", "website": "http://burgerspot.net" }
]
```

3. **Run the audit** with `--input my-list.json`

The `website` field is optional — if null/missing, the tool tries to find it automatically.
No website at all? **Instant hot lead!**

## Output Files

| File | Description |
|------|-------------|
| `report.md` | Human-readable ranked report with pitch notes |
| `report.json` | Machine-readable data for further processing |

## Scoring System (0–100)

| Check | Max Points | Why It Matters |
|-------|-----------|----------------|
| 🔒 SSL (HTTPS) | 10 | Security + Google ranking |
| 📱 Mobile Responsive | 10 | 60%+ of searches are mobile |
| 📋 Page Title | 8 | SEO ranking factor |
| 📝 Meta Description | 8 | Google preview snippet |
| 🔤 H1 Heading | 7 | SEO structure |
| 🖼️ Image Alt Tags | 7 | Accessibility + SEO |
| 📞 Contact Info | 15 | Can customers reach them? |
| 📣 Social Media Links | 8 | Trust + engagement |
| ©️ Copyright Year | 5 | Looks current/maintained |
| ⚡ Page Load Speed | 12 | UX + ranking |
| 🎯 Clear CTA | 10 | Are they converting visitors? |

**Total: 100 points**

### Grade Scale
| Score | Grade | Lead Temp |
|-------|-------|-----------|
| 85–100 | A | ✅ Well built |
| 70–84 | B | 🌤️ Decent |
| 55–69 | C | 🔥 Lukewarm |
| 40–54 | D | 🔥🔥 Warm lead |
| 0–39 | F | 🔥🔥🔥 HOT LEAD |
| No site | — | 🔥🔥🔥 Perfect lead! |

## Sales Tips

### Best Categories to Target
- Restaurants & cafes
- Plumbers, electricians, HVAC
- Dentists, chiropractors
- Auto repair shops
- Hair salons & barbers
- Landscapers, cleaners

### Your Pitch Script
> "Hi, I'm Gabriel — I help local businesses in [city] get more customers online. I ran a free audit on your website and found [X] issues that might be costing you customers. Got 5 minutes?"

### What Each Issue Means for the Pitch
- **No website** → "You're invisible online. Your competitors are getting your customers."
- **No HTTPS** → "Browsers are warning customers your site isn't safe."
- **Not mobile** → "60% of your potential customers are leaving immediately."
- **No contact info** → "Customers can't find your phone number — you're losing calls."
- **Old copyright** → "Your site looks abandoned — customers won't trust it."

## Requirements

- Node.js v16+
- Playwright installed at `../browser/node_modules/playwright` (already set up)
- Internet connection

## Troubleshooting

**"No businesses found"**  
→ Try a broader category ("food" instead of "fine dining") or different city spelling

**Sites timing out**  
→ Increase timeout: `--timeout 30000`

**Getting blocked by Google**  
→ This is normal occasionally. The tool automatically falls back to DuckDuckGo and Yelp.

---

*Built with ❤️ by Koa — your AI business partner*
