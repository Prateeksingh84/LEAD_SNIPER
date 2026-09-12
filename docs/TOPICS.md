# Assignment 1 — Lead Sniper Topics

## 1. Core Assignment

- Goal: identify influential GitHub users who star a selected repository.
- Tooling: n8n or Yellow.ai.
- APIs/services: GitHub API and Slack/Discord webhooks.
- Output: a High-Value Lead notification.

## 2. GitHub Stargazers

Study:

- Repository stargazers.
- Polling.
- Webhooks vs polling at a conceptual level.
- Repository owner/name.
- Pagination.
- New-star detection.
- Star timestamps when available.

Core endpoint concept:

```text
/repos/{owner}/{repo}/stargazers
```

## 3. Profile Enrichment

Required endpoint:

```text
/users/{username}
```

Important fields from the assignment sample:

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

Key concept:

```text
Stargazer
   ↓
Full user profile
   ↓
Lead qualification
```

## 4. High-Value Lead Rule

Required:

```text
followers > 100 OR public_repos > 50
```

Study:

- Boolean OR.
- Strict greater-than comparison.
- Boundary cases.
- n8n IF nodes.
- TRUE/FALSE branches.

Examples:

```text
101 followers + 0 repos → High-Value
0 followers + 51 repos → High-Value
100 followers + 50 repos → Stop
```

## 5. AI Sales Pitch

Required inputs:

```text
Bio
Company
```

Required output:

```text
One sentence
```

Study:

- Prompt design.
- Model roles/messages.
- Grounding in supplied data.
- Avoiding hallucinated facts.
- Handling missing fields.
- Extracting model output in n8n.

Prompt principles:

```text
Use only supplied information.
Do not invent facts.
Return exactly one sentence.
Keep it concise and professional.
```

## 6. Slack / Discord Notifications

### Slack

Study:

- Incoming Webhooks.
- HTTP POST.
- JSON payloads.
- Channel-specific webhook URLs.
- Secret handling.

### Discord

Study:

- Webhooks.
- HTTP POST.
- JSON `content` payload.
- Channel-specific webhook URLs.
- Secret handling.

Minimum required message data:

```text
Name
Bio
AI Sales Pitch
```

## 7. n8n Concepts

Study:

- Schedule Trigger.
- Manual Trigger.
- Set/Edit Fields.
- Code node.
- IF node.
- HTTP/API calls.
- AI/LLM nodes.
- Expressions.
- Credentials.
- Branching.
- Execution data.
- Execution history.
- Error handling.

## 8. n8n Data Mapping

Know the difference between:

```text
$json
```

and:

```text
$input
```

and understand how to reference previous-node data safely.

## 9. Deduplication and State

Study:

- Why polling can duplicate alerts.
- Deterministic event keys.
- Persistent state.
- Bootstrap behavior for existing stars.
- Processing only newly seen stars.

Pattern:

```text
New event
   ↓
Seen?
 /   \
YES   NO
 ↓     ↓
STOP  PROCESS
       ↓
     REMEMBER
```

## 10. GitHub Rate Limits

Study:

- Authenticated vs unauthenticated requests.
- Remaining request budget.
- Reset timing.
- Retry-after behavior.
- 403/429 handling.
- Backoff.
- Bounding request volume.
- Avoiding unnecessary request bursts.

For the Logic Log, be able to explain:

```text
What requests are made?
How many are allowed per cycle?
How do you detect a limit?
What happens when a limit is reached?
How do you prevent retry loops?
```

## 11. Error Handling

Study:

- HTTP 404.
- HTTP 403.
- HTTP 429.
- Network failures.
- Missing profile fields.
- AI-provider failures.
- Slack/Discord failures.
- Safe continuation of independent items.

## 12. Security

Study:

- Never commit `.env`.
- Never hardcode tokens.
- Use n8n credentials for supported secrets.
- Protect webhook URLs.
- Rotate credentials that were exposed.
- Inspect exported workflow JSON for secrets before submission.

## 13. Demo Requirements

Your recording should prove:

```text
Trigger
 ↓
Stargazer monitoring
 ↓
Profile enrichment
 ↓
High-Value filter
 ↓
AI pitch
 ↓
Slack/Discord message
```

Required submission evidence:

```text
Workflow JSON
Successful Slack/Discord screenshot
Logic Log
Demo recording
```

## 14. Submission Quality

Before submission verify:

- Exported JSON is from the final working workflow.
- Live AI provider matches exported JSON.
- Formatter matches actual AI output.
- Notification route matches the demonstrated provider.
- No secrets exist in source/export.
- Logic Log describes what actually happens.
- Screenshot is from a real webhook delivery.
- Demo shows a real execution.

## 15. Recommended Study Order

```text
1. GitHub Stargazers API
2. /users/{username} enrichment
3. n8n triggers
4. n8n HTTP/API calls
5. n8n data mapping
6. IF/filter logic
7. AI prompt design
8. Slack/Discord webhooks
9. Deduplication/state
10. Rate limits/retries
11. Security
12. Demo + submission evidence
```
