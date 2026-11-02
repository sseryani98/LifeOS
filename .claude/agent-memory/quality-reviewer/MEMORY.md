# Quality Reviewer Memory

## Test review — every module

- [Test review gotchas](test_review_gotchas.md) — key-insensitive mocks, real-export fixture leaks, chained integration specs, OR-clause fixtures, unasserted mappers
- [Review gotchas](reference_review_gotchas.md) — cat -n line offsets, Facade coverage blind spot, no SELECT global in unit tier, payload-only UPDATE guards

## Financial Planner

- [Functional coverage gotchas](functional_coverage_gotchas.md) — FRM logic in app/ controllers, vacuous default-equal mocks, uncovered DataService filters, cds9 req.params
- [Integration review checks](integration_review_checks.md) — facade registration under cds.test, req.params shape, _enc exposure, order dependency

## Project Tracker

- [PT test gaps](project_tracker_test_review_gotchas.md) — facade registrations, sortKey not a gap, no *Mocks.ts, TaskQueueItem filter
