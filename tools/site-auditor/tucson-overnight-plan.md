# Tucson Overnight Lead Scan Plan

## Goal
Find Tucson businesses with:
- weak / outdated websites
- public contact emails
- strong reviews or clear demand
- good fit for Desert Digital Studio outreach

## Best lead formula
**Good reputation + weak website + public email = hot lead**

## Outreach-worthiness rule
Do not prioritize by audit score alone.
Prioritize businesses that are:
- reachable
- meaningfully weak online
- worth helping
- not already polished enough that the pitch feels forced

## Priority categories
Run these first:
1. restaurants
2. cafes
3. salons
4. barbers
5. home services
6. boutique retail
7. wellness / chiropractic / medspa
8. tourist / experience businesses

## What to collect for each lead
- business name
- city
- website
- phone
- public email (if available)
- review score
- review count
- website audit score
- top issues
- priority rank
- notes / pitch angle

## Priority scoring formula
Start with website opportunity, then add reputation value.

### Website opportunity score (0–100)
Use site auditor score:
- No website = highest priority
- 0–39 = very hot
- 40–54 = warm
- 55–69 = usable but weak
- 70+ = lower priority unless other factors are strong

### Reputation boost
Add priority if:
- 4.3+ stars
- 30+ reviews
- active-looking business

Suggested rank logic:
- **Tier 1** = public email + weak/no site + 4.3+ stars + solid reviews
- **Tier 2** = public email + weak site + decent reputation
- **Tier 3** = weak site but no email, or weak reputation

## Overnight workflow
1. Build small manual category lists or scrape candidate businesses
2. Audit their websites
3. Pull public contact emails where visible
4. Record review score and review count
5. Rank leads by priority
6. Draft outreach emails using Qwen
7. Save final review list for Gabriel

## Output folders
- Reports: `/Users/gabrielmaciel/Desktop/Audit reports/`
- Working files: `/Users/gabrielmaciel/.openclaw/workspace/tools/site-auditor/`

## Model split
- Website checks / scraping / auditing → tools
- Bulk summaries / ranking notes / email drafts → local Qwen (`qwen3:14b`)
- Final send decisions → GPT

## Important rule
Do **not** auto-send a large batch overnight.
Generate a reviewed shortlist first.

## Best next-day action
Review the top 10–20 leads and send only the strongest opportunities.
