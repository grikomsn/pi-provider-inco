---
"pi-provider-inco": patch
---

Resolve the catalog cache directory with pi's own `getAgentDir()`. An empty `PI_CODING_AGENT_DIR` no longer writes the cache under the current working directory, a `~/…` value is expanded instead of creating a literal `~` folder, and rebranded hosts use their own config directory.

Catalog discovery now also retries transient connection errors (for example `ECONNRESET` or `fetch failed`) and honours `Retry-After` on retried 429/5xx responses, capped at 5 seconds. Retries stay within the existing three attempts and single 10-second budget, and cancellation is never retried.
