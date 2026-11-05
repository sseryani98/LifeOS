# ui5-test-author memory

## Harness

- [Worktree base lag](worktree_base_lag.md) — worktree may start at main, behind the sprint branch; ff-merge before declaring a brief path missing

## UI5

- [UI5 test lint gotchas](ui5_test_lint_gotchas.md) — QUnit 2.3.2 has no assert.rejects; app/**/test ESLint block; linted layout; qunit types reference; how to run test:ui5; tracking-ids bans D-nnn/§; controller harness recipe; FE PageController onInit chain; no SPEC/BR ids in test JSDoc; verb-first fake names; no assert.true; MessageBox stub via sap.ui.require; CRLF-safe mutations; gate hang after finish (read report-ui5/ not the pipe); parallel gate runs collide on 4104 (isolated-run recipe); red test prints no diff
- [OPA5 journey recipe](opa_journey_recipe.md) — prove reds via Playwright page.route mutation (no tree edits); OPA lint/type dodges; shell iframe launch; shared port 4104 collisions

## Financial Planner

- [Shared formatDate time-zone shift](modules/financial-planner/shared_formatter_timezone.md) — date-only ISO renders a day early on this host; test with a local timestamp

## Project Tracker
