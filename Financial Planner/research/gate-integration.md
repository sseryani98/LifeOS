# gate-integration: A UI5 suite can sit inside `npm test` beside Jest, but only via `ui5-test-runner` in remote mode against a runner-spawned `cds-serve`, and that chain is unproven on this machine

**One `npm test` that runs Jest, then `ui5-test-runner` (headless Chromium through the Playwright already installed, TS instrumented by `ui5-tooling-transpile`'s own `coverage` option, nyc thresholds enforced by the runner) is documented end to end, but no part of it has been executed here.** What holds: the runner needs no second long-lived server, because `--start`/`--start-wait-url` spawn and kill `cds-serve` per run, and `cds-plugin-ui5` lets a test-only `ui5.yaml` be injected by environment variable. What does not: coverage cannot be merged into Jest's numbers without a custom nyc step, and the runner's default output folder would wipe Jest's `coverage/`. The cost is three devDependencies (`ui5-test-runner`, `nyc`, `babel-plugin-istanbul`), a Node ≥ 24.11.1 requirement for the current major, and a `build.js` change to read a second results file. The answer flips to Not viable if `cds-plugin-ui5` does not serve the per-app `test/` folder with the transpile middleware applied, or if `cds-serve` cannot boot without a reachable Postgres in the gate.

**Mode:** Validate · **Verdict:** Unproven (pending the prescribed spike) · **Confidence:** Medium · **Feeds:** Test Strategy gate + build.js · **Researched:** 2026-11-04 · **Status:** Draft

---

## Karma is gone; `ui5-test-runner` is the only maintained headless QUnit/OPA runner, and it is one `npm test` step
**`karma-ui5` is archived and deprecated; `ui5-test-runner` 6.0.5 (unscoped npm name, not `@ui5/test-runner`) is a CLI with two runtime deps that exits non-zero on any failed page.** The SAP/karma-ui5 GitHub page states "This repository was archived by the owner on Dec 12, 2025" and "This project has been deprecated. We recommend you to pick a successor from the available UI5 community projects" (Documented, fetched 2026-11-04). The npm registry lists `ui5-test-runner` latest 6.0.5 published 2026-11-03, `engines.node >=24.11.1`, dependencies only `reserve` and `punyexpr`; the 5.x line (5.14.2, `node >=18`) is still published (Verified, `npm view` 2026-11-04). The package README describes it as "designed and built as a substitute of the UI5 karma runner" (Documented). In source, every failure path sets `Exit.code = -1` (`src/modes/test/index.ts`, `src/cli.ts`, commit 2aae0e7, 2026-11-04), so a shell `&&` chain after Jest is sufficient for the gate (Verified by reading the clone at `/home/claude/arnaudbuchholz/ui5-test-runner`). v6 is 11 days old; its docs are what this document cites, and the v5 option table confirms `--start`, `--start-wait-url`, `--coverage-check-*`, `--no-npm-install` and the Playwright driver also exist in 5.x (Documented, `docs/v5_options.md`, `docs/browsers/v5/`), so the Node version decides the major, not the feature set.

## Remote mode against a runner-spawned `cds-serve` removes the "second server" kill criterion
**The runner's `--start` option spawns a command "in detached mode and will be automatically stopped after the tests complete", and `--start-wait-url` polls until a 2xx, default `--start-timeout` 30000 ms (Documented, `docs/options/start.md`, `startWaitUrl.md`, `startTimeout.md`).** The remote-mode page is explicit that when the app is served by another tool "you must use remote mode and point the runner at the running URL with `--url`" (Documented, `docs/modes/remote.md`). Legacy mode is ruled out anyway: it serves raw files from `webapp` and knows nothing of `ui5-tooling-transpile`, so `.ts` would never be transpiled (Inferred from `docs/web_server.md`). `cds-plugin-ui5` 0.17.4 mounts each app under its `mountPath` through "the UI5 CLI express middlewares", so the `server.customMiddleware` chain in each app's `ui5.yaml` (where the transpile middleware lives per the module facts) applies (Documented, cds-plugin-ui5 README, fetched 2026-11-04). Whether the plugin serves `<app>/webapp/test/**` and the framework `resources/` (`sap/ui/test/starter/createSuite.js` for the Test Starter) depends on each app's `ui5.yaml` `framework` section and bootstrap `src`, which were not in the host's facts (Unknown; disk check in the spike). The Test Starter page for 1.136.16 names no runner and only requires `testsuite.qunit.html` + `testsuite.qunit.js` built on `sap/ui/test/starter/createSuite.js` (Documented, ui5.sap.com/1.136.16/docs/topics/22f50c0f…, fetched 2026-11-04).

## Coverage of TS sources is instrumented by `ui5-tooling-transpile` itself, not by the runner
**`ui5-tooling-transpile` 3.12.0 (installed) has a `coverage: boolean|Object` option that appends `babel-plugin-istanbul` last, "to instrument the already transformed source", and warns instead of instrumenting when the optional peer `babel-plugin-istanbul` is missing (Documented, package README; Verified in `lib/util.js` lines 806–822 fetched from main, and `peerDependenciesMeta` on 3.12.0 in the registry).** The middleware passes Babel the real filesystem path (`determineResourceFSPath`, `lib/middleware.js` line 104), so `window.__coverage__` keys are absolute `.ts` paths; the runner's `collect.ts` checks the first key is readable on disk and only remaps otherwise (Verified in both sources). With `--coverage-source-dir <app>/webapp` the runner "skips local instrumentation", generates an nyc `all: true` baseline, merges per-page JSON with `nyc merge`, and runs `nyc report --check-coverage --branches --functions --lines --statements` with all four flags explicitly, failing the run with a synthetic failed test "Global code coverage check" (Verified, `src/modes/test/coverage/{instrument,collect,report}.ts`; design in `docs/adr/0009-coverage-architecture.md`). The runner forces `sourceMap: false` and `coverageGlobalScope: "window.top"` into `.nycrc.json` (Documented, `docs/coverage.md`); position mapping to TS lines therefore depends on `babel-plugin-istanbul` consuming Babel's inline source map, which its README says it does by default (Documented, babel-plugin-istanbul 8.0.0 README). Whether the resulting line numbers are TS-accurate is the one coverage claim the spike must look at by eye.

Two collisions are certain from source: the runner's `coverageReportDir` default is `coverage` and `report.ts` calls `Folder.recreate(configuration.coverageReportDir)`, which would delete Jest's `coverage/` including `coverage/test-results.json`; and the runner's `reportDir` default `report` is where `report.json` (CTRF), `report.html` and `junit.xml` land (Verified, source + `docs/v6_breaking_changes.md`). Both must be redirected.

| Concern | Jest (today) | ui5-test-runner (proposed) | Gate consequence |
|---|---|---|---|
| Results file | `coverage/test-results.json` | `report-ui5/report.json` (CTRF) + `junit.xml` | `build.js` reads a second file |
| Coverage data | Istanbul JSON in `coverage/` | nyc merged JSON in `.nyc_output/merged/coverage.json`, lcov in `coverage-ui5/` | separate thresholds, or an extra `nyc merge` + `nyc report --check-coverage` step over both JSONs (Documented, `docs/coverage.md` "Aggregate coverage") |
| Thresholds | `coverageThreshold` in Jest config | `--coverage-check-{lines,branches,functions,statements}` | two threshold sets, same shape |
| Browser | none | Playwright driver, Chromium "wired today" (Documented, `docs/browsers/v6/playwright.md`) | reuse installed Playwright; pass `--no-sandbox` via `UI5TR_CHROME_ARGS` only if the gate runs in a container |
| Installs at runtime | none | auto-installs missing driver/nyc with `npm install -g` by default | always pass `--no-npm-install` (Documented, `docs/dependency_management.md`) |

## Prior assumption, graded
"It fits in `npm test`": **holds on paper, unverified.** Everything needed for a single command is documented; nothing has been run. Kill criterion 1 (second long-lived server) is refuted by `--start`. Kill criterion 2 (flaky under coverage) is unknown: the runner sets no page timeout by default (`pageTimeout` default none) and runs two pages in parallel, and instrumented OPA journeys against real Postgres are the plausible flake source; the spike runs the chain three times.

## What we could not establish
- Node version on the host (`node -v`): decides `ui5-test-runner@6` vs `@5.14.2`. Not in the facts.
- Whether `cds-plugin-ui5` serves `<app>/webapp/test/*.qunit.html` and transpiles `test/**/*.ts`: check with `curl -I http://localhost:4004/<mountPath>/test/testsuite.qunit.html` after spike step 2.
- Whether the apps bootstrap UI5 from CDN or from `framework` deps in `ui5.yaml` (controls where `sap/ui/test/starter/createSuite.js` comes from): `grep -n "framework\|libraries" app/*/ui5.yaml` and the `src=` in each `index.html`.
- Whether `cds-serve` boots with Postgres unreachable (QUnit-only runs do not need data): `cds serve` with the DB stopped.
- How `app/shared/` is served and whether its TS passes through a transpile middleware (coverage of 14 shared files depends on it): `ls app/shared` for a `ui5.yaml`, and the resource-roots in a consuming manifest.
- Whether the installed Playwright version satisfies the runner's in-process use (`chromium.launch`, `newContext`, `addInitScript`): the runner's own devDependency is `^1.64.1`; API used is 1.x-stable (Inferred). Spike step 4 settles it.
- Jest/Istanbul JSON and nyc JSON merge cleanly (same Istanbul format, but path roots differ): spike step 7 optional branch.

## Verdict
**Unproven.** The design is sound and every link is documented; the chain has not been executed. Caveats: (1) redirect `--report-dir` and `--coverage-report-dir` or Jest's artifacts are destroyed; (2) pin all three packages and run with `--no-npm-install`; (3) thresholds stay per-tier unless the merge step proves clean; (4) v6 requires Node 24.11.1+. Fallback if the spike fails at serving or transpiling tests through `cds-plugin-ui5`: `--start "npx ui5 serve --config ui5-test.yaml"` per app (one runner invocation per app, sequential in `npm test`), which drops the DB dependency for QUnit but needs a mock/real backend for OPA journeys (sibling `opa5-journeys`). Fallback if coverage positions are wrong: thresholds on the UI5 tier are deferred and the gate enforces pass/fail only until fixed.

### The spike (host runs; nothing installed before step 3 approval)

Packages that must be installed and do not exist in the repo today: `ui5-test-runner` (`@6` if `node -v` ≥ 24.11.1, else `@5.14.2`), `nyc` (18.0.0, `node 20 || >=22`), `babel-plugin-istanbul` (8.0.0). Nothing else; Playwright and Chromium are present.

```bash
# 0. Pre-checks (read-only)
node -v; npx playwright --version; grep -n "framework\|customMiddleware\|mountPath" "Financial Planner/app/csv-import-wizard/ui5.yaml"
# expect: node version; playwright 1.x; a transpile middleware entry and a mountPath

# 1. Author one smoke test in the freestyle app (TS, Test Starter layout)
#   webapp/test/testsuite.qunit.html + testsuite.qunit.ts + unit/unitTests.qunit.ts (one real assertion on a shared util)

# 2. Serve manually; prove the test page and transpiled test module are served
cd "Financial Planner" && npx cds-serve &   # Postgres up
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4004/<mountPath>/test/testsuite.qunit.html   # expect 200
curl -s http://localhost:4004/<mountPath>/test/unit/unitTests.qunit.js | head -3                        # expect sap.ui.define(...), not TS
# a 404 here = cds-plugin-ui5 does not expose test/ → fallback (ui5 serve per app)

# 3. Install (needs approval), pinned
npm i -D ui5-test-runner@6 nyc@18.0.0 babel-plugin-istanbul@8.0.0   # or ui5-test-runner@5.14.2

# 4. Runner in remote mode against the manual server, no coverage
npx ui5-test-runner --no-npm-install --ci --driver playwright --report-dir report-ui5 \
  --url http://localhost:4004/<mountPath>/test/testsuite.qunit.html
echo "exit=$?"   # expect exit=0, report-ui5/report.json + junit.xml; proves Playwright driver + page detection

# 5. Coverage via transpile: ui5-test.yaml = ui5.yaml + `coverage: true` on the transpile middleware
#    .nycrc.json at module root: {"all":true,"sourceMap":false,"exclude":["**/test/**"]}
kill %1
CDS_PLUGIN_UI5_MODULES='{"<moduleId>":{"configFile":"ui5-test.yaml"}}' \
npx ui5-test-runner --no-npm-install --ci --driver playwright --report-dir report-ui5 \
  --start "cds-serve" --start-wait-url http://localhost:4004/<mountPath>/test/testsuite.qunit.html --start-timeout 60000 \
  --coverage --coverage-source-dir "app/csv-import-wizard/webapp" --coverage-settings .nycrc.json \
  --coverage-report-dir coverage-ui5 --coverage-reporters lcov json \
  --url http://localhost:4004/<mountPath>/test/testsuite.qunit.html
# expect: the text summary lists .ts files (untested ones at 0%), server killed afterwards, coverage/ from Jest untouched
# "no coverage data found for page" = instrumentation not applied → check babel-plugin-istanbul resolution from the app dir
# open coverage-ui5/lcov-report and confirm highlighted lines match the .ts source, not transpiled AMD

# 6. Threshold enforcement
<same as 5> --coverage-check-lines 100 ; echo "exit=$?"   # expect non-zero and "Global code coverage check" failed in report.json

# 7. The gate shape, three runs for stability
npm test   # script: jest --json --outputFile=coverage/test-results.json --coverage && ui5-test-runner --config ui5-test-runner.json
for i in 1 2 3; do /usr/bin/time -f "%e s" npm test >/dev/null; echo "exit=$?"; done   # expect three exit=0, consistent timing
ls coverage/test-results.json coverage-ui5/lcov.info report-ui5/report.json   # all present
# optional merge: mkdir -p .cov-all && cp coverage/coverage-final.json .cov-all/jest.json && cp .nyc_output/merged/coverage.json .cov-all/ui5.json \
#   && npx nyc merge .cov-all .cov-all/all.json && npx nyc report --temp-dir .cov-all --reporter text --check-coverage --lines 80 --branches 0 --functions 0 --statements 0
```

Outcome map: step 2 fails → serving model wrong, use fallback; step 4 fails → driver/Playwright mismatch, try `--driver puppeteer` (would need another install); step 5 shows 0 files → instrumentation not reaching the served code; step 6 exits 0 → thresholds not enforced, gate cannot rely on the runner; step 7 varies → flaky, raise `--parallel 1` and add `--page-timeout`, rerun.
