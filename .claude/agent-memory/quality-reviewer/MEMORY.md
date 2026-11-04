# Quality Reviewer Memory

## Test review — every module

- [Test review gotchas](test_review_gotchas.md) — key-insensitive mocks, real-export fixture leaks, chained integration specs, OR-clause fixtures, unasserted mappers
- [Review gotchas](reference_review_gotchas.md) — cat -n line offsets, Facade coverage blind spot, no SELECT global in unit tier, payload-only UPDATE guards, srv/mcp twin key constants, cuid fill + probe recipe

## Financial Planner

- [Functional coverage gotchas](modules/financial-planner/functional_coverage_gotchas.md) — FRM logic in app/ controllers, vacuous default-equal mocks, uncovered DataService filters, cds9 req.params
- [Integration review checks](modules/financial-planner/integration_review_checks.md) — facade registration under cds.test, req.params shape, _enc exposure, order dependency

## Project Tracker

- [PT test gaps](modules/project-tracker/test_gaps.md) — facade registrations, sortKey not a gap, no *Mocks.ts, TaskQueueItem filter, guard-order pairs, unseeded actor
