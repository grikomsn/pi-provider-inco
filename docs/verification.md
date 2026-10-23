# Bootstrap verification

Verified on 2026-10-24 (Asia/Jakarta) with Node.js 24.18.0, OpenCode 2.1.4, and pi 1.4.0.

- Strict TypeScript checks and all 15 injected-fake tests passed.
- `npm run package` verified the publishable file list.
- The real pi CLI loaded this checkout, discovered Inco AI routes, streamed a structured read-tool call, and completed an assistant follow-up with the synthetic fixture contents.
- The real pi TUI ran in a separate tmux server using temporary configuration and state, and returned the correct answer to a synthetic arithmetic request.
- A live synthetic rejected-key check returned no models, including any built-in source entries.
- An additional live run authenticated from pi-owned `auth.json` with `INCO_API_KEY` absent and completed a synthetic inference.
- Inference used `inco/deepseek-v4.1-flash:fast` with reasoning disabled for CLI tool checks. No personal projects or existing client sessions were used as inference context.

The live checks cover this route and these flows. Per-model effort restrictions, refusal handling, catalog replacement, credential isolation, output limits, and cancellation are additionally covered with fakes. They do not establish live behavior of every catalog route or Inco AI's account-side retention policy.

Reproduce with `node --env-file=/path/to/.env scripts/verify-live.mjs --saved-key --tui`. This spends service credits and requires the client executable and tmux. The script suppresses provider payloads and prints pass/fail metadata only.

## Packed-package transport regression

Verified on 2026-10-24 with bundled pi 1.4.0 and Node.js 24.18.0.

- The 1.0.0 package failed inference when extracted outside the development checkout without local SDK peers. A controlled test reproduced the missing `@earendil-works/pi-ai/api/openai-completions` module using injected network fakes.
- The fixed provider uses pi's host-exposed `openAICompletionsApi` factory. The same packed-package test now completes a synthetic GLM 5.3 Flash stream and validates the fixed endpoint and `high` reasoning effort without contacting a service.
- A separately packed fixed provider passed live CLI inference, a structured read-tool round trip, and an isolated TUI arithmetic check with `inco/glm-5.3-flash` and thinking `high`.
- The live run used pi-owned credentials in temporary `auth.json`, with `INCO_API_KEY` removed from the client environment. The extracted package had no locally installed SDK peers.
- Strict TypeScript checks, all 16 tests, and package validation passed. These checks cover the reported model and the installed-package loading path; they do not establish live behavior for every model.

Set `INCO_VERIFY_MODEL=glm-5.3-flash`, `INCO_VERIFY_THINKING=high`, and `INCO_VERIFY_SOURCE=/path/to/extracted/package` when running the verification script to reproduce the live packed-package check.
