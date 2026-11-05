---
name: opa-journey-recipe
description: How to write a plain-OPA5 journey that passes the shared lint/tsc, launches through the shell, and how to prove it red without touching the tree (Playwright page.route mutation)
metadata:
  type: reference
---

Measured 2026-11-04 on FP `connection-manager/webapp/test/integration/` (first OPA5 journey in the repo).

- **Prove a red without editing source:** a scratchpad Node script using root `node_modules/playwright` (1.56.1)
  `page.route("**/<served path>")` → `route.fetch()` → `body.split(from).join(to)` → `route.fulfill`, then open the
  Test Starter page and wait for `#qunit-testresult .failed`. Works for transpiled+instrumented `.js`
  (`_selectedConnection = context;` survives istanbul), view `.xml`, and `/service/<svc>/$metadata*` (drop a LineItem).
  Print "pattern not found" so a silent miss is visible.
- **Lint vs OPA idioms:** `Given/When/Then` params fail `naming-convention` → `given/when/then` (`_when` if unused;
  `_When` trims to `When` and still fails). Page-object methods need a verb (`iPressX`, `pressX` fail; `runX`, `checkX`
  pass). A `success:` key in a waitFor literal is an objectLiteralMethod → build the selector, then assign
  `wait.success = fn` (helper in `support/opaWaitFor.ts`).
- **Types:** `PageObjectDefinition` has no `arrangements` → launch with `given.iStartMyAppInAFrame({source, autoWait,
  timeout})` and tear down with `then.iTeardownMyAppFrame()`. `new Ancestor(x)` needs `as unknown as Matcher`.
- **Shell launch:** source `/index.html#/<NAV_CONFIG hash>` deep-links through the shell. Iframe coverage IS collected
  (CM `Component.ts` went to 100% from the journey).
- **FPM ids are FE-generated** (`<app>::<target>--idConnectionsTable-content::CustomAction::addConnection`): find by
  `viewName` + `controlType` + text/header matcher + `Ancestor(table)`. Pass `enabled: false` for a `requiresSelection`
  action. `visible="false"` on an mdc Column still leaves it in `getColumns()` — a header/LineItem mutation is the real red.
- **Port 4104 is shared by parallel authors:** a concurrent `test:ui5` hits EADDRINUSE and the runner reuses the
  other run's server, so another tree's in-progress spec can red your run. Read the per-suite table, not the exit code.
