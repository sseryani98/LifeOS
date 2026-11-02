---
name: test-review-gotchas
description: Reusable checks that found real defects in test-quality reviews of Financial Planner (mock key-insensitivity, fixture leaks from tracked real exports, chained integration specs, OR-clause fixtures)
metadata:
  type: project
---

Checks that caught real defects in a test-quality review (ingestion, 2026-11-02). Apply to every module.

- **Key-insensitive reference mocks.** `support/*Mocks.ts` often stubs a lookup as `jest.fn(async () => SOME_ID)` ignoring its argument (e.g. `getAlertTypeId` in `test/unit/ingestion/support/simplefinMocks.ts`). Any `toHaveBeenCalledWith({ alertType_ID: SOME_ID })` is then meaningless — there it even asserted the "Connection Error" seed id on an unmapped-account alert. Grep mocks for lookups that ignore their key.
- **Fixture leaks from tracked real exports.** `Financial Planner/design/actual-csvs/*.csv` (real bank exports) is git-tracked. Fixtures "trimmed from the real exports" copy identifiers verbatim — `test/shared/data/ingestion/csv.ts` carried a real masked PAN. Grep fixture strings against `design/actual-csvs/`.
- **Chained integration specs.** Look for a test with no Act, or comments like "created by the prior test" — `simpleFinSync.test.ts` and `csvImportSave.test.ts` chained state across `it`s, breaching TEST_STRATEGY §6.3. Storyline chains are only allowed under `integration/scenarios/` (§6.4).
- **Fixtures that satisfy every clause of an OR.** A "pending" fixture with both `pending:true` and `posted:0` hides `||`→`&&`. Similarly a "most-frequent vendor" fixture with one vendor hides a first-seen mutation. Check that each guard clause gets its own fixture.
- **Mappers covered 100% but never asserted.** Coverage can come entirely through a Service test whose `toMatchObject` skips the mapped scalars (amount, dates). When a mapper has no spec of its own, check which of its output fields any assertion actually reads.

**Why:** these are judgment-layer gaps that coverage and the lint suite report as green.
**How to apply:** run these greps first in any test-quality pass, before reading tests one by one.
