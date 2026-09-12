# Logic Log — GitHub API Rate Limits

## Authentication

The workflow makes authenticated GitHub API requests using `GITHUB_TOKEN`. Authenticated requests receive a substantially higher primary rate limit than unauthenticated requests.

## Request volume control

1. Stargazers are read with `per_page=100`.
2. The workflow processes at most `LEAD_SNIPER_MAX_PROFILES_PER_POLL` new users per scheduled execution (default 20).
3. Profile requests are intentionally **serial**, not concurrent, to reduce the chance of GitHub secondary rate limiting.
4. A 15-minute polling interval is used by the Schedule Trigger.

## Rate-limit headers

The GitHub response headers are inspected for:

- `x-ratelimit-remaining`
- `x-ratelimit-reset`
- `retry-after`

When GitHub returns `403`/`429`, the retry behavior follows the response headers. If a retry-after delay is short enough, the workflow sleeps and retries with bounded exponential backoff. If the primary reset is far in the future, the workflow stops the current polling cycle cleanly instead of hammering the API.

## Retry policy

Transient `5xx` responses are retried with exponential backoff. Rate-limit responses are retried only when the API gives a safe bounded wait period.

## Why serial profile enrichment?

The stargazer list request can return many users. Sending profile requests concurrently would increase request burstiness. GitHub recommends avoiding concurrent REST API requests as a way to reduce secondary rate-limit risk.

## Deduplication

The workflow stores processed star keys in workflow static data. The key is built from the GitHub login and star timestamp when available, so a user is not repeatedly alerted for the same star.
