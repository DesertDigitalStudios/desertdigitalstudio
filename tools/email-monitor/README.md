# Email Monitor

Watches gabriel@desertdigitalstudio.com via IMAP and pings Discord when new emails arrive.

## Run
```bash
cd /Users/gabrielmaciel/.openclaw/workspace/tools/email-monitor
node monitor.js &
```

## Config
- IMAP: imap.zoho.com:993
- Email: gabriel@desertdigitalstudio.com
- Check interval: every 2 minutes
- App password stored in monitor.js

## Note
Restarts needed after Mac reboot. TODO: add to launchd for auto-start.
