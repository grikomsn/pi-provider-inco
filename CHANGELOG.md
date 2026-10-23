# pi-provider-inco

## 1.0.1

### Patch Changes

- 3941964: Fix inference from npm-installed providers in bundled pi. Use the host-exposed OpenAI Completions transport factory so requests no longer fail with a missing `@earendil-works/pi-ai/api/openai-completions` module.

## 1.0.0

### Major Changes

- ab2ee12: Release the stable Inco AI provider for pi, with live model discovery, credential-scoped fallback catalogs, streaming chat, native API key authentication, and verified reasoning controls.

## 0.1.0

### Minor Changes

- Add the Inco AI provider with live model discovery, credential-scoped fallback catalogs, streaming chat, and verified reasoning controls.
