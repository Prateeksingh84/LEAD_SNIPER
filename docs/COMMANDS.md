# COMMANDS.md

# Assignment 1 — Lead Sniper
## n8n + GitHub API + Gemini + Slack/Discord

This file contains the commands required to set up, run, test, validate,
export, and stop the Lead Sniper workflow.

---

## 1. Assignment Objective

Build an automated High-Value Lead tracker that:

1. Monitors GitHub repository stargazers.
2. Detects newly observed stars.
3. Fetches the full GitHub profile of each new stargazer.
4. Determines whether the user is a High-Value Lead.
5. Uses an AI/LLM to generate a one-sentence sales pitch.
6. Sends the lead information to Slack or Discord.
7. Handles duplicate stars.
8. Handles GitHub API rate limits and failures.

### High-Value Lead Rule

```text
followers > 100 OR public_repos > 50
```

The comparison must use strict `>` conditions.

---

## 2. Prerequisites

Install / have available:

- Docker Desktop
- Git
- n8n
- GitHub account
- GitHub Personal Access Token
- Gemini API key
- Slack Incoming Webhook OR Discord Webhook

Recommended demo repository:

```text
n8n-io/n8n
```

Alternative:

```text
tiangolo/fastapi
```

---

## 3. Project Directory

Recommended structure:

```text
LEAD_SNIPER_
└── n8n
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── docker-compose.yml
    ├── lead-sniper.workflow.json
    ├── COMMANDS.md
    ├── LOGIC_LOG.md
    └── README.md
```

Create:

```powershell
mkdir "C:\Users\prath\Desktop\CODING\LEAD_SNIPER_"
cd "C:\Users\prath\Desktop\CODING\LEAD_SNIPER_"
mkdir n8n
cd n8n
```

---

## 4. Verify Installation

```powershell
docker --version
```

```powershell
docker compose version
```

```powershell
git --version
```

```powershell
docker ps
```

---

## 5. Environment Configuration

Create:

```powershell
New-Item .env -ItemType File
```

Example non-secret configuration:

```env
LEAD_SNIPER_REPO_OWNER=n8n-io
LEAD_SNIPER_REPO_NAME=n8n
LEAD_SNIPER_DEMO_USERNAME=octocat
LEAD_SNIPER_MAX_STARS_PER_POLL=100
LEAD_SNIPER_MAX_PROFILES_PER_POLL=20
NOTIFICATION_PROVIDER=slack
```

Use n8n Credentials for:

```text
GitHub
Gemini / LLM
Slack
Discord
```

Never commit `.env` or API secrets.

---

## 6. Create .gitignore

```powershell
New-Item .gitignore -ItemType File
```

Recommended:

```gitignore
.env
.n8n/
node_modules/
*.log
```

---

## 7. Start n8n

```powershell
cd "C:\Users\prath\Desktop\CODING\LEAD_SNIPER_\n8n"
```

```powershell
docker compose --env-file .\.env up -d
```

Verify:

```powershell
docker ps
```

Open:

```text
http://localhost:5678
```

---

## 8. Recreate n8n

```powershell
docker compose --env-file .\.env up -d --force-recreate
```

---

## 9. View n8n Logs

```powershell
docker compose logs n8n
```

Follow logs:

```powershell
docker compose logs -f n8n
```

Stop following:

```text
Ctrl + C
```

---

## 10. Stop n8n

```powershell
docker compose --env-file .\.env down
```

Start again:

```powershell
docker compose --env-file .\.env up -d
```

---

## 11. GitHub API — Test Stargazers

```powershell
curl.exe -L "https://api.github.com/repos/n8n-io/n8n/stargazers"
```

Alternative:

```powershell
curl.exe -L "https://api.github.com/repos/tiangolo/fastapi/stargazers"
```

Generic endpoint:

```text
GET /repos/{owner}/{repo}/stargazers
```

---

## 12. GitHub API — Test User Profile

Required enrichment endpoint:

```text
GET /users/{username}
```

Test:

```powershell
curl.exe -L "https://api.github.com/users/octocat"
```

Expected fields include:

```text
login
name
company
bio
followers
following
public_repos
public_gists
location
blog
email
created_at
updated_at
```

---

## 13. GitHub Authentication Test

For manual testing only:

```powershell
$env:GITHUB_TOKEN="YOUR_GITHUB_TOKEN"
```

Then:

```powershell
curl.exe -L `
  -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  -H "Accept: application/vnd.github+json" `
  "https://api.github.com/user"
```

Never commit the token.

---

## 14. Check GitHub Rate Limit

```powershell
curl.exe -L `
  -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  -H "Accept: application/vnd.github+json" `
  "https://api.github.com/rate_limit"
```

Important values:

```text
limit
remaining
used
reset
```

---

## 15. Lead Sniper Workflow

```text
Schedule Trigger
       ↓
Polling Mode
       ↓
GitHub Stargazers
       ↓
New Star Detection
       ↓
Deduplication
       ↓
User Profile Enrichment
       ↓
Profile Normalization
       ↓
High-Value Lead Filter
       ↓
      TRUE
       ↓
Gemini / LLM
       ↓
AI Sales Pitch
       ↓
Notification Formatting
       ↓
Slack / Discord
```

FALSE branch:

```text
High-Value Filter
       ↓
     FALSE
       ↓
      STOP
```

---

## 16. Production Trigger

Use:

```text
Schedule Trigger
```

Recommended:

```text
Every 15 minutes
```

---

## 17. Manual Demo Trigger

Use:

```text
Manual Trigger
```

Recommended path:

```text
Manual Trigger
       ↓
Demo Mode
       ↓
GitHub Monitor
       ↓
Profile Enrichment
       ↓
High-Value Filter
       ↓
Gemini
       ↓
Slack / Discord
```

Recommended demo username:

```text
octocat
```

---

## 18. High-Value Lead Filter

Exact condition:

```text
followers > 100 OR public_repos > 50
```

Examples:

```text
101 followers + 0 repos
→ HIGH-VALUE

0 followers + 51 repos
→ HIGH-VALUE

101 followers + 51 repos
→ HIGH-VALUE

100 followers + 50 repos
→ NOT HIGH-VALUE

25 followers + 20 repos
→ NOT HIGH-VALUE
```

Do not replace `>` with `>=`.

---

## 19. AI Sales Pitch

The LLM receives:

```text
Bio
Company
```

Use:

```text
You are a B2B sales research assistant.

Analyze the GitHub user's Bio and Company information.

Generate exactly ONE concise professional sentence explaining why this
person may be relevant for outreach.

Use ONLY the information provided.

Do not invent:
- job title
- company responsibilities
- products
- funding
- technical skills
- business needs
- purchasing authority
- personal information

If Bio or Company is missing, use only the available information.

Return only the one-sentence sales pitch.
```

Expected output:

```text
One sentence only.
```

---

## 20. Slack Test

Replace the placeholder with the actual webhook.

```powershell
$body = @{
    text = "Lead Sniper test notification"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "YOUR_SLACK_WEBHOOK_URL" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Verify the message appears in Slack.

---

## 21. Discord Test

```powershell
$body = @{
    content = "Lead Sniper test notification"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "YOUR_DISCORD_WEBHOOK_URL" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Verify the message appears in Discord.

---

## 22. Notification Format

Minimum required:

```text
Name
Bio
AI Sales Pitch
```

Recommended:

```text
Company
GitHub URL
Followers
Public Repositories
```

Example:

```text
🚀 High-Value GitHub Lead

Name: Example User
Company: Example Company

Bio:
Interested in open-source AI and developer tooling.

Followers: 120
Public Repositories: 52

AI Sales Pitch:
Their interest in open-source AI and developer tooling makes them a
potentially relevant technical contact for outreach.
```

---

## 23. Deduplication

The workflow must prevent duplicate notifications.

Logical flow:

```text
New Star
   ↓
Create Event Key
   ↓
Already Seen?
   ├── YES → STOP
   │
   └── NO
        ↓
     Process
        ↓
   Save Event Key
```

Recommended deterministic event key:

```text
<owner>/<repo>:<username>
```

Example:

```text
n8n-io/n8n:octocat
```

Use persistent state for production polling.

---

## 24. Pagination

GitHub stargazers can span multiple pages.

The workflow should either:

1. Support pagination, or
2. Explicitly bound records per polling cycle.

Recommended:

```env
LEAD_SNIPER_MAX_STARS_PER_POLL=100
```

---

## 25. Profile Request Limit

Each stargazer can require one profile API request.

Example:

```text
20 stargazers
→ up to 20 profile requests
```

Recommended:

```env
LEAD_SNIPER_MAX_PROFILES_PER_POLL=20
```

---

## 26. Rate-Limit Handling

The workflow should:

1. Authenticate API requests.
2. Limit request volume.
3. Inspect API responses.
4. Handle HTTP 403.
5. Handle HTTP 429.
6. Handle temporary 5xx errors.
7. Apply safe retry/backoff behavior.
8. Log failures.
9. Continue processing valid records where possible.

Document the implementation in:

```text
LOGIC_LOG.md
```

---

## 27. HTTP Error Handling

Expected handling:

```text
200
→ Process

403
→ Check authentication / rate limit

404
→ Log missing user/resource and continue

429
→ Backoff / retry safely

5xx
→ Handle temporary server failure
```

---

## 28. Validate Numeric Fields

Before filtering, verify:

```text
followers
public_repos
```

are numeric.

Then evaluate:

```text
followers > 100 OR public_repos > 50
```

---

## 29. Test the Workflow

Open:

```text
http://localhost:5678
```

Open the Lead Sniper workflow.

Run:

```text
Manual Trigger
```

Inspect:

```text
Manual Trigger
      ↓
Demo Mode
      ↓
GitHub Monitor
      ↓
Profile Enrichment
      ↓
Deduplication
      ↓
High-Value Filter
      ↓
Gemini
      ↓
Notification
```

---

## 30. Verify n8n Execution

Open:

```text
Executions
```

Verify:

```text
Trigger
GitHub API
Profile Enrichment
Deduplication
High-Value Filter
Gemini
Notification
```

The execution should complete successfully.

---

## 31. Export Workflow JSON

After the final workflow is tested:

```text
n8n
→ Open Lead Sniper workflow
→ Workflow menu
→ Download / Export
→ Save JSON
```

Filename:

```text
lead-sniper.workflow.json
```

---

## 32. Validate Workflow JSON

Check:

```powershell
Get-Item .\lead-sniper.workflow.json
```

Validate:

```powershell
Get-Content .\lead-sniper.workflow.json -Raw |
    ConvertFrom-Json |
    Out-Null
```

No error means the JSON is syntactically valid.

---

## 33. Inspect Workflow JSON

```powershell
Select-String `
    -Path .\lead-sniper.workflow.json `
    -Pattern "GitHub","Gemini","Slack","Discord","Schedule","Manual"
```

---

## 34. Git Setup

```powershell
git init
```

```powershell
git status
```

```powershell
git add .
```

```powershell
git status
```

```powershell
git commit -m "Add Lead Sniper workflow"
```

---

## 35. Secret Verification

Before pushing:

```powershell
git status
```

Check staged files:

```powershell
git diff --cached --name-only
```

Do NOT commit:

```text
.env
API keys
GitHub tokens
Slack webhook URLs
Discord webhook URLs
passwords
credentials
```

---

## 36. Final Repository Structure

```text
LEAD_SNIPER_
│
└── n8n/
    ├── .env.example
    ├── .gitignore
    ├── docker-compose.yml
    ├── lead-sniper.workflow.json
    ├── COMMANDS.md
    ├── LOGIC_LOG.md
    └── README.md
```

Optional:

```text
    ├── screenshots/
    │   └── successful-notification.png
    │
    └── demo/
        └── demo-link.txt
```

Never commit:

```text
.env
```

---

## 37. Successful Demo Checklist

```text
[ ] Docker is running
[ ] n8n is accessible
[ ] Workflow is imported
[ ] GitHub credential works
[ ] GitHub stargazers API works
[ ] User profile enrichment works
[ ] Deduplication works
[ ] High-Value condition is correct
[ ] Gemini works
[ ] AI returns exactly one sentence
[ ] Slack/Discord webhook works
[ ] Notification contains Name
[ ] Notification contains Bio
[ ] Notification contains AI Sales Pitch
[ ] Rate-limit handling is implemented/documented
[ ] No secrets are exposed
[ ] Workflow executes successfully
```

---

## 38. Demo Recording Flow

Record:

```text
1. Open n8n
2. Show Lead Sniper workflow
3. Show Manual Trigger
4. Execute workflow
5. Show GitHub profile data
6. Show High-Value Lead decision
7. Show Gemini output
8. Show formatted notification
9. Open Slack/Discord
10. Show successful notification
11. Explain deduplication
12. Explain rate-limit handling
```

---

## 39. Assignment Deliverables

### Workflow JSON

```text
lead-sniper.workflow.json
```

### Successful Notification Screenshot

```text
screenshots/successful-notification.png
```

The screenshot must clearly show:

```text
Name
Bio
AI Sales Pitch
```

### Logic Log

```text
LOGIC_LOG.md
```

Include:

```text
GitHub authentication
Rate-limit handling
Request-volume limits
Retry/backoff strategy
Error handling
Deduplication
High-Value filtering
```

### Demo Recording

Demonstrate:

```text
GitHub
→ Enrichment
→ Filter
→ Gemini
→ Slack/Discord
```

---

## 40. Final Validation

Run:

```powershell
docker ps
```

Then:

```powershell
Get-Item .\lead-sniper.workflow.json
```

Then:

```powershell
Get-Content .\lead-sniper.workflow.json -Raw |
    ConvertFrom-Json |
    Out-Null
```

Then:

```powershell
git status
```

Verify:

```text
[ ] Workflow works
[ ] JSON exists
[ ] JSON is valid
[ ] GitHub API works
[ ] Profile enrichment works
[ ] Filter works
[ ] Gemini works
[ ] Slack/Discord works
[ ] Deduplication works
[ ] Rate-limit handling is documented
[ ] Screenshot captured
[ ] Logic Log completed
[ ] Demo recorded
[ ] No secrets committed
```

---

## 41. Quick Start

Start:

```powershell
cd "C:\Users\prath\Desktop\CODING\LEAD_SNIPER_\n8n"
docker compose --env-file .\.env up -d
```

Open:

```text
http://localhost:5678
```

Run the Manual Trigger for the demo.

For production:

```text
Activate workflow
→ Schedule Trigger
→ Every 15 minutes
```

Stop:

```powershell
docker compose --env-file .\.env down
```

---

## 42. Core Assignment Logic

```text
GitHub Stargazers
       ↓
New Star Detection
       ↓
Deduplication
       ↓
GET /users/{username}
       ↓
Profile Normalization
       ↓
followers > 100
       OR
public_repos > 50
       ↓
      TRUE
       ↓
Analyze Bio + Company
       ↓
One-Sentence AI Sales Pitch
       ↓
Slack / Discord
```

FALSE:

```text
       ↓
     STOP
```

---

## 43. Final Export Rule

Always test the workflow BEFORE exporting the final JSON.

Correct sequence:

```text
Build
 ↓
Test
 ↓
Fix
 ↓
Test Again
 ↓
Successful Execution
 ↓
Export JSON
 ↓
Validate JSON
 ↓
Capture Screenshot
 ↓
Record Demo
 ↓
Submit
```

The submitted:

```text
lead-sniper.workflow.json
```

must correspond to the exact workflow demonstrated in the screenshot and
demo recording.

Do not submit an older workflow export.
