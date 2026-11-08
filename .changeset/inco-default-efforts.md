---
"pi-provider-inco": patch
---

Honor per-model default reasoning efforts: unspecified requests now land on the route's nominated default (verified Copilot-bridge profiles first, then the live catalog's nested `reasoning.efforts.default`), and pi's default `medium` thinking level steers to that effort when the model rejects `medium`. Persisted catalogs are versioned so stale cache shapes no longer parse into fallback defaults.
