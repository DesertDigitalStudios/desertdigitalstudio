# Lead Scanning and Intake

## Purpose
Generate new DDS leads from local market scans and move the usable ones into the CRM.

## Current workflow
1. Run the nightly local business scan.
2. Use Yelp discovery to surface businesses by city and category.
3. Audit websites and capture website/contact/social details when available.
4. Import usable leads into the CRM.
5. Review the morning rollup for best next actions.

## Quality checks
- Keep results geographically relevant to the city being scanned.
- Capture email first, then social, then phone/walk-in path.
- Treat no-website businesses as strong walk-in/phone opportunities, not automatic skips.

## Notes
- CRM is the operational source of truth.
- Obsidian is for research/context, not live stage updates.
