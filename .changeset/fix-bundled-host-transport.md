---
"pi-provider-inco": patch
---

Fix inference from npm-installed providers in bundled pi. Use the host-exposed OpenAI Completions transport factory so requests no longer fail with a missing `@earendil-works/pi-ai/api/openai-completions` module.
