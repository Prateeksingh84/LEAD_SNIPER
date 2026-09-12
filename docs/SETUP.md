# Assignment 1 â€” n8n Setup

## 1. Prerequisites

Use n8n Desktop or self-hosted n8n. Import `n8n/lead-sniper.workflow.json`.

Create an OpenAI credential in n8n and select it on the **AI â€” Sales Pitch** node.

Set these n8n environment variables before starting n8n:

```text
GITHUB_TOKEN=your GitHub token
LEAD_SNIPER_REPO_OWNER=n8n-io
LEAD_SNIPER_REPO_NAME=n8n
LEAD_SNIPER_DEMO_USERNAME=octocat
LEAD_SNIPER_MAX_STARS_PER_POLL=100
LEAD_SNIPER_MAX_PROFILES_PER_POLL=20
LEAD_SNIPER_PRIMARY_RATE_LIMIT_SLEEP_MAX_MS=120000
NOTIFICATION_PROVIDER=discord
DISCORD_WEBHOOK_URL=your Discord webhook URL
SLACK_WEBHOOK_URL=your Slack webhook URL
```

For Windows PowerShell, you can set a variable for the current session with:

```powershell
$env:GITHUB_TOKEN = "ghp_..."
```

For a persistent local setup, configure the variables through the n8n process environment rather than committing them to Git.

## 2. First scheduled run

Activate the workflow. On the first polling run, the workflow **bootstraps** by recording the current first page of stargazers as seen, without sending alerts. This prevents a historical flood of notifications.

Later polling runs compare the current first page against the persisted state and process only unseen stars.

## 3. Demo run

Use **Manual Demo Trigger**. It injects `LEAD_SNIPER_DEMO_USERNAME` (default `octocat`) into the exact same enrichment â†’ filter â†’ AI â†’ notification path.

This lets you produce a successful Discord/Slack screenshot without waiting for a new real star.

## 4. Resetting bootstrap state

If you need to re-seed the workflow, deactivate/reactivate the workflow after clearing the workflow's static data, or duplicate the workflow for a clean demo environment.

## 5. Notification provider

The included workflow has both Discord and Slack branches. Set:

```text
NOTIFICATION_PROVIDER=discord
```

or

```text
NOTIFICATION_PROVIDER=slack
```

Only the selected provider receives the message.



