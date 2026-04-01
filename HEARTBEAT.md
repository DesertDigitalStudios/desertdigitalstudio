# HEARTBEAT — Desert Digital Studio

## Checks to run each heartbeat

### 1. Email Monitor
- Check `/Users/gabrielmaciel/.openclaw/workspace/tools/email-monitor/email-log.json`
- If any emails in the last 2 hours haven't been alerted yet, send a Discord ping
- Flag 🔥 CLIENT INQUIRY emails immediately regardless of quiet hours

### 2. Lead Follow-up Reminders
- If any lead in the dashboard has been in "Contacted" status for >3 days, remind Gabriel to follow up
- Check the leads data if accessible

### 3. Routine tasks (use Qwen3 locally — do NOT use Claude API)
For any of the following, call Qwen3 at http://localhost:11434/api/generate with model qwen3:14b:
- Summarizing new emails
- Drafting routine follow-up reminders
- Generating content suggestions

Only escalate to the main Claude session if:
- A client inquiry needs a custom reply
- Something urgent needs Gabriel's attention
- A task requires tool use (file writes, web browsing, etc.)

## Cost optimization rules
- Simple status checks → Qwen3
- Email summaries → Qwen3
- Content drafts → Qwen3
- Complex reasoning, builds, tool use → Claude
