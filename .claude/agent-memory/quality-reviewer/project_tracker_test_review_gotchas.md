---
name: project-tracker-test-review-gotchas
description: Where real coverage gaps hide in Project Tracker's test suite despite ~100% numbers — facade registrations, merged-row guards, sortKey
metadata:
  type: project
---

- **Facade is excluded from coverage (`Facade\.ts$`), so 100% on trackerService.ts proves nothing about
  which events a guard is registered for.** Read `srv/modules/tracker/trackerFacade.ts` registrations against
  each rule: as of 2026-11-02 Defect/Initiative/Milestone guard CREATE+UPDATE but TestRun guards CREATE only,
  so an OData PATCH can orphan a TestRun.
- **Duplicate guards self-exclude via `excludeId` in trackerDataService.ts** — `.filter(row => row.ID !== excludeId)`
  is a line, not a branch, so coverage stays 100% even though no test writes a row's own name/storyId back.
- **`@lifeos.sortKey` has no runtime consumer** (grep srv/ mcp/ = 0 hits). A "$orderby against sortKey" test is
  CAP framework behaviour, not a gap — don't report it despite TEST_STRATEGY §7.2 listing it.
- **The brief's `support/*Mocks.ts` glob matches nothing here.** The unit doubles are
  `test/unit/tracker/support/requestDouble.ts` and `test/unit/verbs/support/fakeRunner.ts`; read those instead.
- **`TaskQueueItem` is model logic, not just a projection**: its `where status.code <> 'complete'` (db/schema.cds) is
  pinned only by `taskQueue.length > 0` in readPath/projectView specs, so it can be dropped with every test green.
- Built scope (2026-11-02): only SPEC-01 + S-00; `test/integration/scenarios/verbLayerFuts.test.ts` runs all 16
  SPEC-01 FUTs. A "tracker lens" run = SPEC-01 §4/§5 + TEST_STRATEGY §9's assertable surface; SPEC-02+ is unbuilt.

**Why:** these were the only real gaps a 99.5%-coverage suite still had; the numbers point elsewhere.
**How to apply:** on any Project Tracker test-quality run, start from the facade registrations and TEST_STRATEGY §9's
contract list, not from the coverage table.
