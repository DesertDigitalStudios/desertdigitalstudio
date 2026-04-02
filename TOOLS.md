# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Browser (Playwright)

- **Script:** `workspace/browser/fetch.js`
- **Usage:** `node browser/fetch.js <url> [--text] [--selector <css>] [--screenshot] [--timeout <ms>]`
- **Output:** JSON with `url`, `title`, `content`, `screenshotPath`
- **Notes:** Chromium headless, capped at 50k chars. Use for JS-rendered pages or login sessions.

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## GitHub

- **Org:** DesertDigitalStudios
- **Repo:** desertdigitalstudio (Vercel-connected, auto-deploys on push)
- **Remote URL:** https://github.com/DesertDigitalStudios/desertdigitalstudio.git
- **Token:** [removed from repo; store locally outside git]
- **Token name:** desktop-push
- **To deploy:** clone to /tmp/dds-deploy, copy portfolio files, commit and push to main

## Business Operating Rules

### Standing business rules

- If a lead system needs setup, just build it.
- If a report should be prettier, improve it.
- If contact info should be captured, capture it during scans.
- If a process is repetitive, automate it.

### Default behavior rules

- Draft outreach, but do not send without review unless clearly authorized.
- Save reports to `~/Desktop/Audit reports`.
- Store useful business info in workspace notes/files.
- Use local Qwen for bulk grunt work automatically.

### Working style

- Get the working version first, then refine it.
- Do not wait for perfection before making useful progress.

### Still pause and ask for:

- sending real outbound emails/messages unless clearly authorized
- spending money
- deleting or overwriting important stuff
- anything that could create risk or embarrassment

## Local AI Routing

- **Primary chat model in OpenClaw:** `openai-codex/gpt-5.4`
- **Fallback model:** `anthropic/claude-sonnet-4-6`
- **Local bulk-work model:** `qwen3:14b` via Ollama
- **Open WebUI:** `http://localhost:8080`
- **Helper script:** `/Users/gabrielmaciel/.openclaw/workspace/tools/local-ai.js`

### Use Qwen automatically for:

- summarizing batches of emails
- drafting routine follow-up reminders
- content suggestions
- bulk copy variations
- repetitive text cleanup/reformatting
- first-pass brainstorming where precision is not critical

### Do NOT use Qwen by default for:

- client proposals
- pricing/strategy decisions
- sensitive client communication
- final sales copy
- ambiguous/high-stakes judgment calls
- important build/debug decisions

### House rule

- **GPT first** for normal day-to-day work
- **Claude** for nuance-heavy, strategic, or high-stakes writing/thinking
- **Qwen** for cheap local grunt work

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
