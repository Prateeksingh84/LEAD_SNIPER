# Assignment 1 — Lead Sniper: Workflow Architecture

## 1. Objective

Build an automated **High-Value Lead tracker** that identifies influential GitHub users when they star a selected repository.

The assignment requires this core sequence:

```text
GitHub Stargazers
      ↓
New Star Detection
      ↓
User Profile Enrichment
      ↓
High-Value Lead Filter
      ↓
AI Sales Pitch
      ↓
Slack / Discord Notification
```

The assignment examples include `n8n-io/n8n` and `tiangolo/fastapi`. The required profile enrichment endpoint is `/users/{username}`. See the assignment's stated workflow and output requirements.

## 2. End-to-End Architecture

```text
                          ┌──────────────────────────────┐
                          │      Schedule Trigger        │
                          │       Every 15 Minutes       │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │     Polling Mode     │
                              └──────────┬──────────┘
                                         │
                                         ▼
                    ┌────────────────────────────────────┐
                    │       GitHub Monitor + Enrich      │
                    │                                    │
                    │  • Fetch repository stargazers     │
                    │  • Detect new stars                │
                    │  • Deduplicate                     │
                    │  • GET /users/{username}           │
                    │  • Normalize profile               │
                    │  • Rate-limit handling             │
                    └────────────────┬───────────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │ High-Value Lead Filter  │
                         │                         │
                         │ followers > 100         │
                         │          OR             │
                         │ public_repos > 50       │
                         └───────────┬─────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                       TRUE                    FALSE
                         │                       │
                         ▼                       ▼
                ┌──────────────────┐           STOP
                │ Gemini / LLM     │
                │ Sales Pitch      │
                │ Bio + Company    │
                └────────┬─────────┘
                         │
                         ▼
                ┌───────────────────────┐
                │ Format Notification   │
                │                       │
                │ Name                  │
                │ Bio                   │
                │ Company               │
                │ GitHub URL            │
                │ AI Sales Pitch        │
                └──────────┬────────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │ Provider Router    │
                  │ Discord / Slack    │
                  └─────────┬──────────┘
                            │
                   ┌────────┴─────────┐
                   ▼                  ▼
          ┌────────────────┐  ┌────────────────┐
          │ Discord Webhook│  │ Slack Webhook  │
          └────────────────┘  └────────────────┘
```

## 3. Demo Architecture

For recording, use a manual trigger so the same business logic can be demonstrated without waiting for a new GitHub star:

```text
Manual Demo Trigger
        ↓
Demo Mode
        ↓
GitHub Monitor + Enrich
        ↓
High-Value Lead Filter
        ↓
Gemini / LLM
        ↓
Format Notification
        ↓
Slack / Discord
```

The scheduled polling path remains the production path.

## 4. Data Flow

### Stargazer input

```text
username
repository
starred_at (when available)
```

### Enriched profile

Normalize into:

```text
login
name
company
bio
followers
public_repos
location
blog
email
profile_url
isHighValue
thresholdReason
```

### AI input

```text
Company
Bio
```

### Notification output

Minimum required content:

```text
Name
Bio
AI Sales Pitch
```

Recommended additional fields:

```text
Company
GitHub URL
Followers
Public repos
```

## 5. High-Value Decision Logic

The assignment's exact rule is:

```text
followers > 100 OR public_repos > 50
```

| Followers | Public Repos | Result |
|---:|---:|---|
| 101 | 0 | High-Value |
| 0 | 51 | High-Value |
| 101 | 51 | High-Value |
| 100 | 50 | Stop |
| 25 | 20 | Stop |

Use strict `>` comparisons; do not change them to `>=`.

## 6. Deduplication

Prevent repeated alerts for the same star:

```text
Fetched star
    ↓
Create deterministic key
    ↓
Already seen?
   /     \
 YES      NO
  ↓        ↓
 STOP   Process lead
           ↓
      Save key to state
```

For production polling, the state should persist between executions.

## 7. Rate-Limit Architecture

The Logic Log should explain:

1. GitHub authentication strategy.
2. Request-volume limits per polling cycle.
3. Inspection of rate-limit response headers.
4. Retry/backoff behavior for transient rate-limit responses.
5. Safe stopping when continuing would exceed the remaining budget.
6. Why profile requests are bounded rather than unbounded/concurrently flooded.

Useful headers:

```text
x-ratelimit-limit
x-ratelimit-remaining
x-ratelimit-reset
retry-after
```

## 8. Error Handling

Every external call should fail in a controlled way. A profile failure should not become a false lead.

Suggested structured error object:

```json
{
  "status": "PROFILE_ERROR",
  "login": "example",
  "errorCode": 404,
  "message": "..."
}
```

## 9. AI Failure Handling

If the model fails:

```text
AI request fails
      ↓
Record error
      ↓
Do not fabricate a sales pitch
```

## 10. Submission Architecture

The final submission package should contain:

```text
workflow JSON
successful Slack/Discord screenshot
Logic Log
Demo recording
```

The JSON must be exported from the **final working n8n workflow** so the submitted provider, expressions, routing and formatter match the workflow demonstrated on screen.

## 11. Final Validation

```text
[ ] Schedule trigger works
[ ] Manual demo trigger works
[ ] Stargazers are fetched
[ ] New stars are deduplicated
[ ] /users/{username} enrichment works
[ ] followers > 100 OR public_repos > 50 works
[ ] False branch stops
[ ] AI reads Bio + Company
[ ] AI returns exactly one sentence
[ ] Notification contains Name
[ ] Notification contains Bio
[ ] Notification contains AI pitch
[ ] Slack/Discord webhook works
[ ] Rate-limit handling is documented
[ ] Final workflow JSON exported
[ ] Successful message screenshot captured
[ ] Demo recording captured
```
