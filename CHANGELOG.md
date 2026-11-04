# pi-provider-inco

## 1.0.2

### Patch Changes

- 7c01c6b: Resolve the catalog cache directory with pi's own `getAgentDir()`. An empty `PI_CODING_AGENT_DIR` no longer writes the cache under the current working directory, a `~/…` value is expanded instead of creating a literal `~` folder, and rebranded hosts use their own config directory.

  Catalog discovery now also retries transient connection errors (for example `ECONNRESET` or `fetch failed`) and honours `Retry-After` on retried 429/5xx responses, capped at 5 seconds. Retries stay within the existing three attempts and single 10-second budget, and cancellation is never retried.

## 1.0.1

### Patch Changes

- 3941964: Fix inference from npm-installed providers in bundled pi. Use the host-exposed OpenAI Completions transport factory so requests no longer fail with a missing `@earendil-works/pi-ai/api/openai-completions` module.

## 1.0.0

### Major Changes

- ab2ee12: Release the stable Inco AI provider for pi, with live model discovery, credential-scoped fallback catalogs, streaming chat, native API key authentication, and verified reasoning controls.

## 0.1.0

### Minor Changes

- Add the Inco AI provider with live model discovery, credential-scoped fallback catalogs, streaming chat, and verified reasoning controls.
