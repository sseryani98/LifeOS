---
name: lint-gotchas-test-tree
description: Financial Planner test-tree lint traps that bite after writing - tracking ids in JSDoc, 3-line header cap, per-file Service coverage threshold
metadata:
  type: feedback
---

- **Never write `BR-nn` / `FUT-nnn` in a test** — not in a JSDoc, not in a `describe` title. `lint:tracking-ids` scans `test/` too (only `integration/scenarios/` data is exempt). Trace to the rule in your reasoning/output, state the *behaviour* in the JSDoc.
  **Why:** 2026-11-02 ingestion run — 5 violations from `/** BR-02: ... */` and `describe("... (BR-16)")`.
- **File-header `//` comment blocks cap at 3 lines** (`lint:comment-length`, inline cap). Extending a spec's header by one line fails it.
- **`./srv/modules/**/*Service.ts` coverage threshold is per file** (85% branches). Deleting a vacuous test can drop a file under it: removing the `toBeInstanceOf(SimpleFINService)` constructor test took simpleFinService.ts 92%→84%. Re-run scoped coverage after any deletion; reach the default seams with a real behaviour test (e.g. an integration builder passing only `{ http }` so the default encryption factory must decrypt the seeded ciphertext).
- Run linters with `npm run -s lint:<name>` from the module; ESLint with `npx eslint test/unit/<mod> test/integration/<mod>`.

Related: [[cap-test-facts]]
