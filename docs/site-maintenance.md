# Marketing site maintenance

Root and `portfolio/` contain duplicate deployment sources. Keep the homepage, four city pages, favicon assets, and API handlers synchronized until the Vercel project root is confirmed and duplication is intentionally removed. Do not deploy the entire workspace with an ad-hoc static server.

## November 2026 conversion fixes

- Work cards follow Gabriel's supplied portfolio layout, with explicit fictional/example labels and working contact links.
- Quote blocks are explicitly example copy, not customer endorsements. Replace with approved real feedback when available.
- About names Gabriel Maciel and uses an initials avatar.
- Shared header/footer markup includes Work, About, contact, and free audit links on all four city pages.
- Existing prices remain unchanged; no phone number, social URL, booking link, or review badge has been invented.
- Contact POST `/api/contact` requires SMTP_HOST, SMTP_USER, SMTP_PASS; optional SMTP_PORT and ALERT_TO_EMAIL. Reuses the audit service's existing variable names. Missing configuration produces an error, never false success. Verify real delivery after deployment with the owner's authorization; local tests use mocked SMTP.
- Canonicals and unique city metadata retained; Phoenix removed from homepage claims; SVG and ICO favicons added.

## Verification

2026-11-04: 45 Playwright checks passed across 390px, 768px, and 1920px: project/quote counts, hidden initial success, no horizontal overflow/dead anchors, drawer navigation, desktop area grid, four city pages, unique titles, JSON-LD parse, and mocked contact success/failure. Eight isolated contact handler checks passed (method, validation, honeypot, missing SMTP, rejected/accepted delivery, field limits, malformed JSON). No real email was sent.

Deployment blocked: GitHub push dry-run rejected credentials. Reconnect GitHub in OpenClaw Settings → Agents → Tools; then recheck remote main before pushing. Vercel is documented as auto-deploying main. Verify the deployed favicon, five pages, and contact configuration before declaring launch complete. The plural domain currently fails DNS resolution and is separate from this change.
