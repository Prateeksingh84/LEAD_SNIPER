# Assignment 1 — n8n Setup & Operations Guide

## 1. Purpose

This document explains the recommended self-hosted n8n setup and node-by-node behavior for the Lead Sniper workflow.

## 2. Prerequisites

- Self-hosted n8n
- GitHub token/credential suitable for the repository/API access being used
- Gemini/LLM provider credential
- Slack Incoming Webhook or Discord Webhook
- Public GitHub repository to monitor

Recommended demo repository:

```text
n8n-io/n8n
```

The assignment also gives `tiangolo/fastapi` as an example.

## 3. Self-Hosted n8n with Docker

Recommended project layout:

```text
LEAD_SNIPER_
└── n8n
    ├── .env
    ├── .env.example
    ├── docker-compose.yml
    └── lead-sniper.workflow.json
```

Start:

```powershell
cd "C:\Users\prath\Desktop\CODING\LEAD_SNIPER_\n8n"
docker compose --env-file .\.env up -d
```

Check:

```powershell
docker ps
```

Open:

```text
http://localhost:5678
```

Recreate after environment changes:

```powershell
docker compose --env-file .\.env up -d --force-recreate
```

Stop:

```powershell
docker compose --env-file .\.env down
```

## 4. Credentials and Environment Variables

Use n8n credentials for provider secrets wherever possible.

Typical non-secret configuration:

```env
LEAD_SNIPER_REPO_OWNER=n8n-io
LEAD_SNIPER_REPO_NAME=n8n
LEAD_SNIPER_DEMO_USERNAME=octocat
LEAD_SNIPER_MAX_STARS_PER_POLL=100
LEAD_SNIPER_MAX_PROFILES_PER_POLL=20
NOTIFICATION_PROVIDER=slack
```

Never commit `.env`.

## 5. Node-by-Node Setup

### Node 1 — Schedule Trigger

Purpose: production polling.

Recommended interval:

```text
Every 15 minutes
```

### Node 2 — Polling Mode

Set:

```text
mode = poll
```

### Node 3 — Manual Demo Trigger

Purpose: deterministic screen-recording path.

### Node 4 — Demo Mode

Example:

```text
mode = demo
demoUsername = octocat
```

### Node 5 — GitHub Monitor + Enrich

Responsibilities:

1. Fetch stargazers for the selected repository.
2. Identify new stars.
3. Deduplicate previously processed stars.
4. Call:

```text
GET https://api.github.com/users/{username}
```

5. Normalize profile fields.
6. Calculate the High-Value decision.
7. Handle errors/rate limits.

Expected normalized output:

```json
{
  "login": "octocat",
  "name": "Example Name",
  "company": "Example Company",
  "bio": "Example biography",
  "followers": 120,
  "public_repos": 52,
  "profile_url": "https://github.com/octocat",
  "isHighValue": true
}
```

### Node 6 — High-Value Lead Filter

Use:

```text
followers > 100 OR public_repos > 50
```

True branch:

```text
AI Sales Pitch
```

False branch:

```text
Stop
```

### Node 7 — Gemini / LLM — Message a Model

Use a real LLM node.

Recommended prompt:

```text
You are a B2B sales research assistant.

Analyze the GitHub user's Bio and Company information.

Generate exactly ONE sentence explaining why this high-value GitHub lead is worth reaching out to.

Use only the information provided.
Do not invent facts.
Do not mention follower count or repository count.
Keep the sentence concise, specific, and professional.

GitHub User Profile:
Name: {{ $json.name || 'Unknown' }}
Username: {{ $json.login || 'Unknown' }}
Company: {{ $json.company || 'Not provided' }}
Bio: {{ $json.bio || 'Not provided' }}
GitHub Profile: {{ $json.profile_url || 'Not provided' }}
```

Role:

```text
User
```

The model must return one sentence.

### Node 8 — Format Notification

The formatter must combine:

```text
Original GitHub profile
+
AI model output
```

Target object:

```json
{
  "name": "...",
  "login": "...",
  "profile_url": "...",
  "company": "...",
  "bio": "...",
  "followers": 123,
  "public_repos": 45,
  "salesPitch": "..."
}
```

Important: do not assume the AI response contains the original GitHub profile fields.

### Node 9 — Discord or Slack?

Prefer a normal workflow field for routing rather than making the entire routing decision depend on an environment-variable expression in the editor.

Example:

```text
notificationProvider = slack
```

Route:

```text
discord → Discord
slack   → Slack
```

### Node 10 — Slack Notification

Use the Slack Incoming Webhook URL.

Recommended payload:

```json
{
  "text": "🚨 *High-Value GitHub Lead*\n\n*Name:* ...\n*GitHub:* ...\n*Company:* ...\n*Bio:* ...\n*Followers:* ...\n*Public repos:* ...\n\n*AI Sales Pitch:* ..."
}
```

### Node 11 — Discord Notification

Recommended payload:

```json
{
  "content": "🚨 **High-Value GitHub Lead**\n**Name:** ...\n**GitHub:** ...\n**Company:** ...\n**Bio:** ...\n**Followers:** ...\n**Public repos:** ...\n**AI Sales Pitch:** ..."
}
```

## 6. Testing Procedure

### Test A — GitHub enrichment

Run:

```text
Manual Demo Trigger
→ Demo Mode
→ GitHub Monitor + Enrich
```

Verify real profile data.

### Test B — High-Value filter

Verify a profile that meets the threshold goes through TRUE.

Verify a profile below both thresholds stops at FALSE.

### Test C — AI

Verify `company` and `bio` are present in AI input.

Verify output is one sentence.

### Test D — Notification

Verify Slack/Discord receives Name, Bio and AI Pitch.

### Test E — Production polling

Enable the schedule and confirm a new star causes the workflow to run.

## 7. Common n8n Problems

### `$env` access denied

n8n can block environment-variable access from workflow nodes. Use a supported credential or ordinary workflow fields for non-secret configuration where possible.

### AI node has no input

Run from the upstream trigger/path rather than executing the AI node in isolation.

### Notification fields are `undefined`

Inspect the formatter. It must merge the previous GitHub data with the AI response.

### Webhook URL is empty

Verify the runtime configuration and recreate the container after changing environment variables.

### Provider/quota error

Check the model-provider credential, project/account quota and billing. A workflow change cannot create provider credits.

## 8. Final Export Procedure

1. Test the entire workflow successfully.
2. Export the workflow from the current n8n instance.
3. Replace any older JSON in the repository.
4. Confirm the exported JSON uses the same AI provider demonstrated live.
5. Confirm the formatter matches the actual AI response structure.
6. Confirm no secrets were exported.

## 9. Final Evidence

Capture:

```text
1. Workflow canvas
2. Successful AI execution
3. Successful Slack/Discord message
4. Rate-limit explanation / Logic Log
5. Demo recording
```
