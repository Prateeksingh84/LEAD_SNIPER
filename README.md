# Yellow.ai — AI Automation Intern — Assignment 1

## Lead Sniper: real-time GitHub high-value lead tracker

This implementation follows the assignment's required sequence:

**Polling → Stargazers → `/users/{username}` enrichment → `followers > 100 OR public_repos > 50` → LLM sales pitch → Discord/Slack**

### Included

- Importable n8n workflow JSON
- Scheduled polling every 15 minutes
- Manual demo trigger
- GitHub API authentication
- Stargazer deduplication with workflow static data
- Serial profile enrichment and request-volume guard
- GitHub rate-limit header handling + bounded retry/backoff
- Required High-Value Lead filter
- OpenAI n8n AI node
- Discord webhook output
- Slack webhook output
- Logic Log
- Demo recording script
- Automated core-logic tests

### Important live-run note

The actual successful Discord/Slack screenshot must be captured from your own live n8n execution because the webhook URL and OpenAI/GitHub credentials are private.

### Test locally

```bash
npm test
```

The test suite validates the assignment's thresholds, dedupe key construction, and bounded backoff behavior.
