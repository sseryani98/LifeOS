# Test-author memory

## CAP behaviour
- [CAP rejection shapes](cap_rejection_shapes.md) — cds 9.8.4: @mandatory = 400 ASSERT_MANDATORY + target; @assert.unique = 500 SQLITE_CONSTRAINT_UNIQUE
- [CAP test facts](cap_test_facts.md) — facades not auto-registered under cds.test; req.params is `{ID}` at 9.8.4; 400 assert pattern

## Lint and coverage traps
- [Test-tree lint gotchas](lint_gotchas_test_tree.md) — no BR/FUT ids in tests (lint:tracking-ids), 3-line header cap, per-file Service coverage threshold

## Fixtures
- Check a shared fixture actually separates the values a mutation would swap before relying on it: RESPONSE_TWO_NEW's Netflix transacted_at and posted fall on the same date, so it cannot catch transactedAt-from-posted.
- Test-quality runs write regression tests that pass on day one; prove one bites by mutating a *test-side* support helper (never srv/) and restoring — e.g. a trailing space in a scenario's save-row mapper red-lined the CSV re-import storyline.

## Tooling
- [Tooling gotchas](tooling_gotchas.md) — Python-in-heredoc edits fail (quotes, `${...}`); use Edit; prettier --check is not a gate
