---
name: project-tracker-test-review-gotchas
description: Where real coverage gaps hide in Project Tracker's test suite despite ~100% numbers — facade registrations, merged-row guards, sortKey
metadata:
  type: project
---

- **Facade is excluded from coverage (`Facade\.ts$`), so 100% on trackerService.ts proves nothing about
  which events a guard is registered for.** Read `srv/modules/tracker/trackerFacade.ts` registrations against
  each rule: on 2026-11-02 TestRun guarded CREATE only; fixed by 2026-11-03 (all four guard CREATE+UPDATE). Re-check
  on every run rather than trusting either state.
- **Duplicate guards self-exclude via `excludeId` in trackerDataService.ts** — `.filter(row => row.ID !== excludeId)`
  is a line, not a branch, so coverage stays 100% even though no test writes a row's own name/storyId back.
- **`@lifeos.sortKey` has no runtime consumer** (grep srv/ mcp/ = 0 hits). A "$orderby against sortKey" test is
  CAP framework behaviour, not a gap — don't report it despite TEST_STRATEGY §7.2 listing it.
- **The brief's `support/*Mocks.ts` glob matches nothing here.** The unit doubles are
  `test/unit/tracker/support/requestDouble.ts` and `test/unit/verbs/support/fakeRunner.ts`; read those instead.
- **`TaskQueueItem` is model logic, not just a projection**: its `where status.code <> 'complete'` (db/schema.cds) is
  pinned only by `taskQueue.length > 0` in readPath/projectView specs, so it can be dropped with every test green.
- **Guard scope vs `@assert.unique` drift (2026-11-03, SPEC-02):** the Milestone story-ID 409 went workspace-wide while
  db/schema.cds keeps the per-Initiative `storyId` unique, so TrackerService's class JSDoc ("409s in front of the store's
  two unique constraints") went stale. When a guard's scope changes, diff it against schema.cds and the class-level doc.
- Built scope (2026-11-02): only SPEC-01 + S-00 (SPEC-02 in build 2026-11-03); `test/integration/scenarios/verbLayerFuts.test.ts` runs all 16
  SPEC-01 FUTs. A "tracker lens" run = SPEC-01 §4/§5 + TEST_STRATEGY §9's assertable surface. SPEC-02 entered build
  2026-11-03 and its FUTs began landing in that same SPEC-01 file (bare `FUT-nnn` ids collide across specs).
- **Addressability FUTs ("no call returns `verb.target.notFound`") are only meaningful if `resolveStage`/
  `resolveSubtask` run before every `assert*` guard in the verb** — otherwise a wfl refusal masks an unknown code.
  Checked 2026-11-03 in mcp/verbs/*.ts: resolve-first holds; negative controls live in addressing.test.ts +
  unit stageGuards.test.ts. Re-check the order rather than calling the FUT vacuous.
- **Three-state guards hide `!== complete` vs `=== notStarted`** (2026-11-03): every predecessor-open fixture in
  `test/integration/tracker/data/chainStates.ts` leaves the blocker Not Started, so an In Progress blocker is never
  exercised. For any status guard, check a fixture exists for the middle state. Likewise a UI story's materialised
  chain equals the whole library, so "rows vs library" mutations only show on the backend (`shipsUi` false) story.
- **`EXPECTED_*` in `test/integration/tracker/data/seededLibrary.ts` are oracles pinned to the deployed CSVs by
  `methodologySeed.test.ts`**, so a spec iterating them instead of a DB read is not a coverage gap — don't report it.

- **A diff that reorders guards needs a both-conditions-hold test, or the revert is invisible.** SPEC-02's
  guard table (line ~256, "X → Y") is the precedence oracle. 2026-11-03: reopen_stage moved the empty-reason check
  after the not-complete check; no spec sent both, so reverting stayed green. Same check for single-blocker-only
  fixtures: every build subtask shares driver `/build`, so the remediation's driver `Set` dedup was never exercised.

- **Guard-order diffs: test each adjacent pair with BOTH conditions true.** SPEC-02 §3.1's guard table fixes per-verb
  order; 2026-11-03 the build moved reopen's empty-reason check behind `assertStageComplete` and no test sent an empty
  reason to a non-complete stage, so reverting the order stayed green. `git diff mcp/verbs` and diff the assert sequence.
- **`if (kind === HUMAN) return` style guards: check the unseeded/undefined input.** `assertHumanCaller` refuses an
  identity absent from `Actor`, but only seeded actors were tested, so a fail-open `!kind ||` edit survives.
- **SPEC-02 seams (2026-11-03):** the `after CREATE` Milestone handler writes the chain inside the caller's tx, so a
  rollback spec must count `countChainRows()` too, not only Milestones (registers.test.ts plan-rollback missed it).
  A "library change never refreshes" spec is vacuous unless a write path (PATCH the story) runs *after* the edit.
  "Whole blocking set" specs need a fixture with ≥2 blockers — `orderOfAppearance`/`toContain` cannot see a
  first-only `.find` or a dropped driver dedupe on one blocker. Guard-order tables in SPEC-02 §5 (reopen: notComplete
  → empty reason) need a fixture where both conditions hold at once.

**Why:** these were the only real gaps a 99.5%-coverage suite still had; the numbers point elsewhere.
**How to apply:** on any Project Tracker test-quality run, start from the facade registrations and TEST_STRATEGY §9's
contract list, not from the coverage table.
