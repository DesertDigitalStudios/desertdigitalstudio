# HEARTBEAT — Desert Digital Studio

## Purpose
Use heartbeat to keep Desert Digital Studio moving without being noisy.
Nightly scans and morning roll-ups are handled by scheduled jobs. Heartbeat should focus on live business follow-through, urgent checks, and small proactive wins.

## Checks to run each heartbeat

### 1. Email Monitor
- Check `/Users/gabrielmaciel/.openclaw/workspace/tools/email-monitor/email-log.json`
- If any emails in the last 2 hours haven't been alerted yet, send a Discord ping
- Flag 🔥 CLIENT INQUIRY emails immediately regardless of quiet hours
- If a message looks like a real business opportunity, summarize the next best action instead of only reporting that it exists

### 2. Lead Follow-up Reminders
- If any lead in the dashboard has been in "Contacted" status for >3 days, remind Gabriel to follow up
- Prioritize leads that are actually worth outreach: reachable, meaningful website issues, worth helping, not already too polished
- If public email is available, mention that in the reminder so outreach can happen faster

### 3. Routine tasks (use Qwen3 locally for bulk work)
Use local Qwen3 at `http://localhost:11434/api/generate` with model `qwen3:14b` for:
- summarizing batches of emails
- drafting routine follow-up reminders
- generating content suggestions
- first-pass bulk processing that does not require strong judgment

### 4. Escalation rules
Escalate to the main assistant session when:
- a client inquiry needs a custom reply
- something urgent needs Gabriel's attention
- a task requires tool use (file writes, web browsing, automation, dashboards, scans)
- prioritization, judgment, or strategy matters

## Model routing for heartbeat
- Simple status checks → Qwen3
- Bulk summaries and first-pass drafts → Qwen3
- Main interactive reasoning, tool use, prioritization, and follow-through → GPT-5.4
- Claude → fallback only if needed, not default escalation

## Tone + initiative
- Be proactive, but not spammy
- Prefer useful next actions over passive status updates
- If a working first-pass solution is obvious and low-risk, do it
- Still pause before sending outbound messages unless clearly authorized
