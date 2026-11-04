# QUnit unit tests: QUnit stays, Karma is gone, `ui5-test-runner` (community) is the headless runner, and coverage of TS sources comes from `babel-plugin-istanbul` inside `ui5-tooling-transpile`

**QUnit 2 via the UI5 Test Starter remains SAP's unit framework for UI5 1.136, and the supported headless path is the community `ui5-test-runner` pointed at the test suite page in remote mode, with TypeScript coverage produced by the `coverage` option that ui5-tooling-transpile 3.12.0 (the exact version pinned in the repo) already provides.** What holds: TS authoring is first-class (SAP's own walkthrough writes `*.qunit.ts`), no second framework is needed, and the runner can start/stop `cds-serve` itself and enforce per-metric thresholds. What does not hold: there is no SAP-owned runner (the `@ui5/test-runner` name in the brief does not exist on npm; the real package is `ui5-test-runner` by Arnaud Buchholz), and v6 requires Node >= 24.11.1, which is unverified for this repo. What it costs: one devDependency (plus on-demand `nyc`, `babel-plugin-istanbul`), a second `ui5.yaml` per app for instrumented serving, and a test page per app. What would change the answer: if the repo cannot move to Node 24 and v5.14 proves unmaintained, the fallback is a 60-line Playwright script that opens `testsuite.qunit.html` and reads QUnit's results (Playwright: only the MCP server is installed — `@playwright/test` would be added; refuted 2026-11-04).

**Mode:** Compare · **Verdict:** Recommended (`ui5-test-runner` remote mode + transpile-side istanbul) · **Confidence:** Medium · **Feeds:** Test Strategy unit tier · **Researched:** 2026-11-04 · **Status:** Draft

---

## QUnit is still the framework; the Test Starter is the setup

**SAP's current docs author QUnit tests in TypeScript and orchestrate them with the Test Starter, with no sign of deprecation.** The UI5 walkthrough "Step 27: Unit Test with QUnit (TypeScript)" (ui5/docs `main`, fetched 2026-11-04) creates `webapp/test/unit/model/formatter.ts`, an entry module `webapp/test/unit/unitTests.qunit.ts` (`import "./model/formatter";`), a generic `Test.qunit.html` loading `resources/sap/ui/test/starter/runTest.js`, and `testsuite.qunit.ts` typed with `satisfies SuiteConfiguration` from `sap/ui/test/starter/config` (Documented). It states the conventions that matter for the standard: tests import the module under test by full namespace, not relative path; test files end in `.qunit.ts`; "a unit test should be written for formatters, controller logic, and other individual functionality"; "all dependencies are replaced by stubs" (Documented). The Test Starter "Concept and Basic Setup" page recommends pinning `qunit: { version: 2 }` and `sinon: { version: 4 }` so a framework upgrade cannot break tests (Documented). `@sapui5/types` 1.136.x pulls `@types/qunit` 2.5.4 transitively (Verified: npm registry metadata, 2026-11-04); `@types/sinon` is not included and must be added if Sinon is used (Inferred from the same metadata).

The built-in Test Starter `coverage` option still loads Blanket (`configuration-options-738ed02.md`, Documented); it is browser-only and not usable for a gate. Ignore it.

## Karma is dead on both ends; the replacement is community-owned

**karma-ui5 was deprecated (last release 4.1.0, 2024-11-08; repo archived 2025-12-12) and Karma itself says "deprecated and is not accepting new features or general bug fixes".** The karma-ui5 README (SAP/karma-ui5 `main`) says "pick a successor from the available UI5 community projects" and links a SAP Community blog that I could not fetch (Cloudflare challenge, see below) (Documented for the README; Unknown for the blog's content). npm marks `karma-ui5@4.1.0` deprecated and `karma@6.4.4` is the last release, 2024-07-29 (Verified: registry). Note the contradiction: SAP/openui5 `master` and the ui5-ecosystem-showcase `ui5-tsapp` still run `karma-ui5` (Verified: their package.json), so Karma works today, but building a new production gate on a doubly-deprecated stack is Rejected.

**`@ui5/test-runner` does not exist** (registry returns "Not found"; `github.com/SAP/ui5-test-runner` returns a client error). The real package is `ui5-test-runner`, GitHub `ArnaudBuchholz/ui5-test-runner`, MIT, "designed and built as a substitute of the UI5 karma runner" (Documented: README in the 6.0.5 tarball). Latest 6.0.5, published 2026-11-03; v6.0.0 on 2026-10-24 raised the engine to Node >= 24.11.1; the last v5 (5.14.2, 2026-10-07) accepts Node >= 18 (Verified: registry). It is actively maintained but a single-maintainer community project, not SAP-owned (Inferred from repo ownership).

### Runner comparison

| Option                                                                                                                                       | Headless                                              | TS sources                          | Coverage + thresholds                                                      | Attaches to cds-serve                                     | New deps                                   | Verdict                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `ui5-test-runner` v6, `--driver playwright`, remote mode                                                                                     | Chromium (Playwright/Puppeteer/WDIO/Selenium drivers) | served/transpiled by cds-plugin-ui5 | nyc merge/report, `--coverage-check-{lines,branches,functions,statements}` | yes, `--url` + `--start "cds-serve"` + `--start-wait-url` | 1 (+ nyc, babel-plugin-istanbul on demand) | **Recommended**                                                                                               |
| Playwright script that opens `testsuite.qunit.html`, polls `QUnit.done`, dumps `window.top.__coverage__`, then `nyc report --check-coverage` | yes                                                   | same                                | DIY via nyc                                                                | yes                                                       | 0 new (nyc)                                | Viable alternative / fallback                                                                                 |
| karma-ui5 + karma-ui5-transpile                                                                                                              | yes                                                   | yes                                 | karma-coverage                                                             | needs `url` to cds-serve                                  | 4+ deprecated packages                     | Rejected                                                                                                      |
| Jest (jsdom) importing app TS directly                                                                                                       | n/a                                                   | only files with no `sap/*` imports  | Jest's own                                                                 | no UI5 runtime                                            | 0                                          | Rejected as the tier; the loader/`sap.ui.define` transform makes it fail for anything touching UI5 (Inferred) |

## Coverage of TypeScript sources is solved on the transpile side, not the runner side

**Instrument during transpilation with `babel-plugin-istanbul`; let the runner only collect and report.** Two documented routes exist. The runner's `docs/coverage.md` ("TypeScript @ui5/cli projects", `main`, 2026-11-04) tweaks `ui5-tooling-transpile-middleware` with an inline `babelConfig` whose plugin list ends in `istanbul`, and an `.nycrc.json` of `{"all": true, "sourceMap": false, "exclude": ["**/test/**/*.ts"]}` (Documented). Simpler and version-exact: ui5-tooling-transpile 3.12.0 (2026-07-13, CHANGELOG PR #1414) added a `coverage: boolean|Object` option that "includes babel-plugin-istanbul ... the plugin is added last so that it instruments the already transformed source", with `babel-plugin-istanbul` as an optional peer dependency (Documented). The runner's ADR-0009 explains how instrumented sources served by an external server are consumed: pass `--coverage --coverage-source-dir <webapp>`, which skips the runner's own `nyc instrument`, reads `window.top.__coverage__` per page, rewrites relative keys against `coverageSourceDir`, then `nyc merge` + `nyc report`; thresholds are checked with all four metrics and a failure appears as a failed test "Global code coverage check" in the report and exit code (Documented). The runner forces `sourceMap: false` in nyc, so line numbers come from babel-plugin-istanbul's own input-source-map handling, which is how the runner's TS instructions report `.ts` lines (Inferred; the single check is the spike below).

Swapping in the instrumented config without touching the dev `ui5.yaml` is supported by cds-plugin-ui5: `cds.cds-plugin-ui5.modules.<moduleId>.configFile` or `CDS_PLUGIN_UI5_MODULES='{"<app-folder>":{"configFile":"ui5-coverage.yaml"}}' cds-serve` (Documented: cds-plugin-ui5 README, `main`).

Minimal shape per app (Inferred composition of the documented pieces):

```yaml
# app/csv-import-wizard/ui5-coverage.yaml
specVersion: "4.0"
extends: ui5.yaml # if the repo's ui5.yaml has no `extends` support, duplicate it
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
      configuration:
        transformTypeScript: true
        coverage: true # babel-plugin-istanbul, ui5-tooling-transpile >= 3.12.0
        excludes: ["/test/"]
```

```bash
npm i -D ui5-test-runner@6 babel-plugin-istanbul nyc
CDS_PLUGIN_UI5_MODULES='{"csv-import-wizard":{"configFile":"ui5-coverage.yaml"}}' \
npx ui5-test-runner --driver playwright --browser chromium \
  --start "cds-serve" --start-wait-url http://localhost:4004/ \
  --url http://localhost:4004/<mountPath>/test/testsuite.qunit.html \
  --coverage --coverage-source-dir app/csv-import-wizard/webapp \
  --coverage-check-lines 80 --coverage-check-branches 70 \
  --coverage-check-functions 80 --coverage-check-statements 80 \
  --junit-xml-filename junit.xml --report-dir coverage/ui5-report
```

`--start` spawns the command detached, polls `--start-wait-url` until 2xx and stops the process after the run (Documented: `options/start.md`, `options/startWaitUrl.md`). The playwright driver launches Chromium only today (firefox/webkit "declared / not yet launched") and auto-runs `npx playwright install chromium` if missing (Documented: `browsers/v6/playwright.md`). Several `--url` values can be passed to test several apps in one run; aggregating coverage across apps is documented via `nyc merge` of per-project `coverage.json` (Documented: `coverage.md`, "Aggregate coverage for several projects").

## The "shared/" folder is the first thing to unit-test and the hardest to serve

**The 14 shared TS files (BaseController, DialogManager, Messaging, util/, VizFrameCard, ApexChartCard) are the richest unit target, but the brief does not say whether `app/shared` has its own `ui5.yaml` and namespace.** The Test Starter needs a test suite under a resource root the server serves; if `shared/` is consumed only through other apps' `resourceRoots`, its tests must live in one host app's `test/` folder and import `shared` by namespace (Inferred). This is a disk check (below).

## Prior assumption, graded

"QUnit is still SAP's unit framework": **holds**. SAP's 2026 TypeScript walkthrough and Test Starter docs are QUnit 2 only; no replacement is announced. The implicit assumption behind the question, "Karma retired, replaced by `@ui5/test-runner`": **half-refuted**. Karma and karma-ui5 are deprecated, but SAP did not ship a replacement; it pointed at community projects, and the de-facto successor is the community `ui5-test-runner`.

## What we could not establish

- **The SAP blog "Deprecation of karma-ui5 plugin"** (community.sap.com, ba-p/13954060): blocked by a Cloudflare challenge for both WebFetch and curl. It may name specific successors. Check: open it in a browser and record which tools SAP recommends.
- **Node version of the repo** (`.nvmrc`, `engines`, `node -v`): decides `ui5-test-runner@6` (Node >= 24.11.1) vs `@5` (Node >= 18). Check: `node -v` in the workspace.
- **Whether coverage lands on `.ts` lines** with `coverage: true` in ui5-tooling-transpile 3.12.0 plus `sourceMap: false` forced by the runner: Documented by the runner's TS instructions for the manual babelConfig route, Inferred for the 3.12.0 shorthand. Check: run the command above against one app; `coverage/lcov.info` must list `SF:.../*.ts` paths with plausible line counts.
- **Does cds-plugin-ui5 serve `test/*.ts` through the transpile middleware and expose `resources/sap/ui/test/starter/*`** from the configured framework? Expected yes (the middleware "handles by default all requests to .js files", transpile README), but unverified under cds-serve rather than `ui5 serve`. Check: `curl -I http://localhost:4004/<mountPath>/test/testsuite.qunit.html` and `.../resources/sap/ui/test/starter/createSuite.js` return 200.
- **`app/shared` packaging**: own `ui5.yaml`/namespace or not. Check: `ls app/shared/ui5.yaml` and grep `resourceRoots` in the six manifests.
- **Fiori Elements apps with 0-1 controllers** (transactions, connection-manager): what, if anything, is unit-testable there is sibling `fiori-elements-testability`'s question; the runner choice here does not depend on it.

## Recommendation

**Recommended:** QUnit 2 + Sinon via the Test Starter, authored as `*.qunit.ts` under each app's `webapp/test/unit`, run headless by `ui5-test-runner` (Playwright driver, remote mode, `--start cds-serve`), with coverage instrumented by `ui5-tooling-transpile` `coverage: true` through a per-app `ui5-coverage.yaml` selected via `CDS_PLUGIN_UI5_MODULES`, and thresholds enforced with the four `--coverage-check-*` flags. Pin `ui5-test-runner@6` if Node >= 24.11.1, else `@5.14`.

**Fallback:** a repo-local Playwright runner script (Playwright is installed) that opens each `testsuite.qunit.html`, waits for `QUnit.config.stats`/`QUnit.done`, fails on any failed assertion, writes `window.top.__coverage__` to `.nyc_output/`, then `nyc report --check-coverage`. Zero new frameworks; costs ~1 day and ongoing ownership.

**What would reverse it:** the spike showing coverage cannot be attributed to `.ts` lines (then instrument via the explicit `babelConfig` route from the runner docs, or drop to the fallback); `ui5-test-runner` losing maintenance (single maintainer); or the SAP blog naming a different SAP-endorsed runner.

Gate wiring (one `npm test` beside Jest, merged coverage) is sibling `gate-integration`'s question; this document supplies the command it should spike.
