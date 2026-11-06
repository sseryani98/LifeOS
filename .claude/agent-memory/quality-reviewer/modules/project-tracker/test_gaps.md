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

- **SPEC-04 twin paths (2026-11-05):** project_view's *verb* re-sorts its queue (`mcp/verbs/projectView.ts`
  `_sortQueueByTier`) separately from the OData `projectViewService.applyQueueDerivations`; `projectViewQueue.test.ts`
  reads OData only, so the verb sort can be deleted green. A "page == verb" parity spec proves nothing about
  tie-breaks when its world has one tier-1 candidate — check the parity world forces the tie. Also grep
  `expect.stringMatching(/\S/)` placeholders: next-action `description` was pinned only by that.

**Why:** these were the only real gaps a 99.5%-coverage suite still had; the numbers point elsewhere.
**How to apply:** on any Project Tracker test-quality run, start from the facade registrations and TEST_STRATEGY §9's
contract list, not from the coverage table.

- **TDD-red computed-path loaders outlive green** (2026-11-04, SPEC-03; that file was deleted later the same day — re-grep, don't cite it): `test/shared/support/migrationModule.ts`
  `require(join(...))`s srv/ so red-phase suites type-check before the domain exists; after green it makes the
  support re-declare srv types (`registerValidator.ts` vs `migration/types.ts`) and drift goes uncaught by `tsc`.
  Grep `require(join` under test/ on every domain review; other suites import srv directly.
  **Recurred SPEC-04 (2026-11-05):** `test/unit/tracker/support/nextActionResolverModule.ts` — the test-author
  re-creates this pattern every TDD-red story, so expect it on every post-build review.
- **Verb copies of OData-derived fields** (SPEC-04, D-266): `project_view` verb reads `TrackerService.TaskQueueItems`
  through the gateway so the after-READ fills `tier`; D-266 says that copy is "proven by the single handler", but no
  verb spec asserts it — a NaN comparator sort is silent. Check verb payloads that reuse a read handler's virtuals.
- **A file missing from the coverage table was never loaded by any test** (2026-11-04, SPEC-03): `scripts/` has no
  band until SPEC-09, so `scripts/migrateFinancialPlanner.ts` (call order, `process.exitCode = 1`) sat at 0% with the
  suite green; its scenario FUTs run one layer in, at `MigrationService`. The spawn pattern for a script-tier spec is
  `test/script/support/originHarness.ts`. Diff the table against the build's changed-file list. **Resolved by the
  next SPEC-03 pass (still 2026-11-04): the file is gone and grep finds 0 hits — a brief may still list it; ignore.**
- **Code-value constants are never pinned to their CSV** (2026-11-04): `CODES.FRICEW_TYPES` (srv/modules/shared/constants.ts)
  gates zod, migrationValidator and reconciliation, but `test/protocol/data/toolSurface.ts` imports it as its own
  oracle, and `methodologySeed.test.ts` pins only `seededLibrary.ts` to the CSVs. Check any hoisted code list for a
  constant-vs-`readCodeList()` test.
- **`intact = a && b && c …` reconciliation predicates read 100% branch-covered with most conjuncts dead** (2026-11-04,
  SPEC-03 `reconciliationFindings.ts` `findChainOffenders`): only conjuncts with a tamper in
  `test/integration/migration/data/reconcileTampers.ts` are protected. Map each conjunct to a tamper; DB-impossible
  states (unique/not-null `position`) need a unit call on the static finder instead. Also: the migration snapshot is
  embedded, so every §5 bad-data rejection (fricewType, orphan defect) is unreachable end-to-end without a tamper or a unit test.
- **SPEC-03 seams (2026-11-04):** MigrationService reads its source from an embedded JSON, so the 400 register
  refusals are unreachable unless a spec tampers the *store* first (e.g. rename a sprint so `_resolveSprints` misses).
  `position` is `not null` + `@assert.unique`, so BR-33a's ordering failure is untamperable under SQLite — it needs a
  pure unit test of `ReconciliationFindings`. The scenario FUTs call the service, not `scripts/migrateFinancialPlanner.ts`.

- **A `scenarios`-module review of a UI story is empty by design** (2026-11-05, SPEC-04): D-238's scenarios tier is
  for no-UI stories only, and D-266 rules SPEC-04 gets no `integration/scenarios/` spec (FUTs live in
  `test/integration/tracker/tests/nextAction*.test.ts` / `projectView*.test.ts`). The brief still lists scenarios files
  + SPEC-04 source. Check `git status test/integration/scenarios` and the story's D-nn tier ruling first; only flag a
  scenarios spec the change broke (e.g. `futHarness.ts nextStepOf` reads `stepCode` only, so the payload rename
  `storyId→story`, `label→name` was invisible there — pinned instead in `readNextAction.ts`).

- **SPEC-04 seams (2026-11-05):** the OData `ProjectView` headline is filled by `ProjectViewMapper.toNextActionFields`, a
  path separate from the verb payload — the verb-path `toEqual` and the "view equals next_action" test (verb `view.nextAction`)
  never read the flat `nextAction*` virtuals the page binds. Also: `ProjectViewService` sorts/splices queue and
  completions *after* the DB read, and every spec reads via `$expand`; the page's `macros:Table` reads the nav path paged
  (`$count`/`$top`), which no spec exercises. And `app/project-view/` shipped `.ts` with no UI5 leg (no
  `ui5-test-runner.json`, no `webapp/test/`) — check `ls app/*/webapp/test` on every UI story.

## MCP gateway reads run through srv READ handlers (structure review)

`TrackerGateway` runs CQL on `ctx.service` (`mcp/verbs/shared/runVerb.ts`), so a SELECT on a service entity fires the
srv after-READ handlers — virtuals arrive filled and rows arrive in the handler's order. A gateway-side `.sort()` on such a
read can silently undo that order, and a verb then re-sorts to recover it. Seen: `readTaskQueue` re-sorted by `QUEUE.ORDER`
over `TaskQueueItems` (handler orders by tier rank), then `projectView._sortQueueByTier` restored it. Check every gateway
sort against the entity's read handler before accepting it.
