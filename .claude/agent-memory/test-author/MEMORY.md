# Test-author memory

## CAP behaviour
- [CAP rejection shapes](cap_rejection_shapes.md) — cds 9.8.4: @mandatory = 400 ASSERT_MANDATORY + target; @assert.unique = 500 SQLITE_CONSTRAINT_UNIQUE
- [CAP test facts](cap_test_facts.md) — facades not auto-registered under cds.test; req.params is `{ID}`; projection `virtual` stripped on INSERT unless `@Core.Computed: false`

## Lint and coverage traps
- [Test-tree lint gotchas](lint_gotchas_test_tree.md) — no BR/FUT ids in tests (lint:tracking-ids), 3-line header cap, per-file Service coverage threshold

## Fixtures
- Test-quality runs write regression tests that pass on day one; prove one bites by mutating a *test-side* support helper (never srv/) and restoring — e.g. a trailing space in a scenario's save-row mapper red-lined the CSV re-import storyline.

## Proving the red
- A red where every suite dies on one shared cause (e.g. `FOREIGN KEY constraint failed` once fixture seeds give way to undeployed CSVs) hides your own assertion bugs. Prove the suite against a throwaway prototype: copy the module to `C:/Projects/Life OS/.proto-pt/` (inside the repo so `../node_modules` resolves; exclude coverage/design), patch a quick impl, run, mutate to confirm tests bite, then `rm -rf` it. SPEC-02 2026-11-03: 247/247 green, and it surfaced the D-244 virtual-strip finding.
- Test-quality batch: apply one mutation per finding on *disjoint* code paths in a single prototype copy (unique folder name — parallel authors), run once with `--verbose`, and the `×` list must be exactly your new tests. 2026-11-03 tracker: 6 mutations, 7/7 new tests red, 0 old ones — one run proved every finding.
- A prototype mutation that leaves an unused local fails ts-jest (`noUnusedLocals`), the server never boots, and every test times out in `beforeAll`. That is a broken mutation, not a result.

## Tooling
- [Tooling gotchas](tooling_gotchas.md) — no `python` (REPL hang); heredoc edits fail; tar+perl prototype mutation; prettier --check is not a gate
- Test-quality finding paths can be stale (tests get moved between scenario files): F8 cited verbLayerFuts.test.ts:402 in a 397-line file; the FUT lived in methodologyFuts.test.ts. Grep the cited symbols before deferring.

## Financial Planner
- Check a shared fixture actually separates the values a mutation would swap before relying on it: RESPONSE_TWO_NEW's Netflix transacted_at and posted fall on the same date, so it cannot catch transactedAt-from-posted.

## Project Tracker
- Verb guards put the blocking list in `VerbError.remediation`, not `.message` (message only names the target; `verb.remediation.runDriver`). Briefs saying "message contains" mean remediation.
