# Quality Reviewer Memory

## Test review — every module

- [Test review gotchas](test_review_gotchas.md) — key-insensitive mocks, real-export fixture leaks, chained integration specs, OR-clause fixtures, unasserted mappers, dead data-map keys, twin TABLE maps, unasserted refusal keys, either/or quadrants, PG decimal-string coercion, empty-seed append blind spot, script coverage blind spot, UI5 stale selection field + stubbed-service wiring, mid-review churn, async pending-state races, page-read-path vs $expand, toContain tie dodge
- [Review gotchas](reference_review_gotchas.md) — **forked `code-review` that returns only "Skill execution completed" → return `[]`, never reconstruct**; cat -n offsets, Facade coverage blind spot, srv/mcp twin keys, spec-mandated twins, red-phase loader leftovers, cuid fill probe, after-READ sort over a paged read

## Financial Planner

- [Functional coverage gotchas](modules/financial-planner/functional_coverage_gotchas.md) — FRM logic in app/ controllers, vacuous default-equal mocks, uncovered DataService filters, cds9 req.params, edited-suggestion branch, no txn seed CSVs
- [Integration review checks](modules/financial-planner/integration_review_checks.md) — facade registration under cds.test, req.params shape, _enc exposure, order dependency

## Project Tracker

- [PT test gaps](modules/project-tracker/test_gaps.md) — facade registrations, sortKey not a gap, no *Mocks.ts, TaskQueueItem filter, guard-order pairs, unseeded actor, red-phase require loaders, SPEC-03 migration seams, SPEC-04 OData-vs-verb + paged-read seams + verb/OData twin sorts + parity-tie, scenarios-on-UI-story is empty (D-266), gateway re-sorts undoing srv READ-handler order
