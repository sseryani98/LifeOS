# OPA5 journeys: OPA5 is alive, typed, and ships a Fiori Elements V4 test library — but headless execution now depends on a community runner

**OPA5 with `sap.fe.test` is the right journey-tier tool for Life OS's Fiori Elements apps and is Recommended; the open risk is not SAP's direction but the headless/coverage chain, which is no longer SAP-owned.** SAP still names OPA5 its integration-test tool, the API ships unchanged in the OpenUI5 2.0 nightly, and the Fiori Elements test library (`sap.fe.test`) is public, typed in `@sapui5/types` 1.136.16, and is what SAP's own Fiori tools generate for FE V4 apps. What has changed is the runner: `karma-ui5` is deprecated (Nov 2024) and the replacement SAP points to is the community `ui5-test-runner`, which can drive OPA pages headlessly through Playwright against an already-running server such as `cds-serve`. OPA journeys must not become E2E tests against live Postgres (SAP's own restriction), and `sap.fe.test` journeys over stock FE behaviour would violate "never test the framework" — so the journey tier is narrow: controller extensions, custom actions/sections, freestyle flows, shell composition. The answer would flip to wdi5 if the headless+coverage spike (topic 6) fails, since wdi5 consumes the same `sap.fe.test` page objects.

**Mode:** Compare · **Verdict:** Recommended · **Confidence:** Medium · **Feeds:** Test Strategy journey tier · **Researched:** 2026-11-04 · **Status:** Draft

---

## OPA5 is not maintenance-only: it is still SAP's named integration tool and survives into 2.x

**The "maintenance-only" premise does not hold on any evidence found.** The current OpenUI5 "Testing" page (ui5/docs `main`, fetched 2026-11-04) states verbatim "We recommend OPA5 for integration tests. OPA5 is part of OpenUI5. It is built on top of QUnit and provides good integration with OpenUI5," and introduces wdi5 only as the E2E complement ("WDIO ... lacks awareness of the app's web framework ... wdi5, which is a WDIO plugin, bridges this gap"). Neither that page nor the OPA5 topic page carries a deprecation or status note (Documented). The `Opa5.js` source on `SAP/openui5` master has no `@deprecated` tag (Verified: `grep -n "@deprecated" Opa5.js` → no match, 1576 lines). The OpenUI5 2.0 nightly distribution still serves the module (Verified: `curl -w "%{http_code}" https://sdk.openui5.org/nightly/2/resources/sap/ui/test/Opa5.js` → `200`, 10571 bytes; `sap-ui-version.json` reports `2.0.0-SNAPSHOT`, build `202611020356`). The "Introducing OpenUI5 2.x" SAP blog mentions no test-API removal (Documented, Oliver Graeff, undated page).

What I could *not* measure is development velocity (commit history on `sap/ui/test` was blocked — see below). "Stable, not deprecated" is the defensible claim; "actively evolving" is Unknown.

## `sap.fe.test` exists for this exact stack, is public and typed, and is what SAP generates

**Fiori Elements V4 apps get a first-party OPA5 test library whose page objects speak FE vocabulary (`onTable`, `onFilterBar`, `onHeader`, dialogs) and a `JourneyRunner`.** The 1.136.16 API reference (`test-resources/sap/fe/test/designtime/apiref/api.json`, Verified) lists `sap.fe.test.JourneyRunner`, `ListReport`, `ObjectPage`, `TemplatePage`, `Shell`, `BaseArrangements/Actions/Assertions`, and ~40 `sap.fe.test.api.*` classes (Table, FilterBar, Form, Header, Footer, Dialog*), all `visibility: public`, none flagged deprecated or experimental. The typings ship: `@sapui5/types@1.136.16` contains `types/sap.fe.test.d.ts` with 38 `declare module "sap/fe/test/..."` blocks including `JourneyRunner` (Verified by unpacking the tarball). SAP's Fiori tools tutorial "Write OPA Tests for an SAP Fiori Elements for OData V4 Application" (developers.sap.com, Documented) generates exactly this shape — `OpaTests.qunit.js` → `JourneyRunner.run({launchUrl, opaConfig, pages})`, page objects extending `ListReport`/`ObjectPage` with app-specific actions — so this is SAP's reference pattern, not a community convention.

| Capability | Fiori Elements (ListReport/ObjectPage, 3 apps) | FPM page (`sap.fe.core.fpm`, 1 ref) | Freestyle (`csv-import-wizard`, `shell`) |
|---|---|---|---|
| Page objects | `sap.fe.test.ListReport` / `ObjectPage` + custom actions/assertions (Documented) | `sap.fe.test.TemplatePage` exists; FPM-specific coverage Unknown | Plain `Opa5.createPageObjects` / class extending `Opa5` (Documented, TS walkthrough step 28) |
| App start | `JourneyRunner` → `iStartMyApp` → iframe on `launchUrl` (Verified from `BaseArrangements.js`) | same | `iStartMyUIComponent` in-page (faster, Documented) or iframe |
| Shell helpers | `sap.fe.test.Shell` assumes FLP (tiles, shell back button) — **not usable against the custom `sap.tnt.ToolPage` shell** (Inferred from `Shell.js` method list) | same | Must write own shell page object |

Two design-relevant facts from the source (Verified): `iStartMyApp(sIntent, params)` builds `launchUrl + "?" + params + "#" + intent` and hands it to `iStartMyAppInAFrame` — so `launchUrl` can be the app's own `index.html` or the Life OS shell, no FLP sandbox required; and `JourneyRunner` defaults `autoWait: true, timeout: 30, viewNamespace: "sap.fe.templates"`, i.e. FE's own waiting logic is on by default.

## The "never test the framework" rule shrinks the journey tier to our code paths

**`sap.fe.test`'s stock actions (filter, sort, navigate, edit) exercise Fiori Elements, not Life OS; a journey earns its place only when it crosses code the module wrote.** The wdi5 FE-testlib page (ui5-community/wdi5 `docs/fe-testlib.md`, Documented) states the library "is meant for app-specific tests, such as custom actions and complex UI annotations. It isn't meant for testing framework functionality." Applied to the inventory: `transactions` (0 controllers) has no journey obligation until a controller extension or custom section appears; `admin-master-data` and `connection-manager` (1 controller each) get journeys only through their extension points; `csv-import-wizard` (7 TS files) and `shell` are the real journey surface. Whether annotation-driven behaviour counts as "ours" is topic 5's question; I flag only that `sap.fe.test` makes asserting it cheap, which is a temptation, not a mandate.

## Headless OPA is possible but the runner is community-owned, and coverage has a version trap

**No SAP-owned headless runner exists any more.** `karma-ui5`'s README says "DEPRECATED ... pick a successor from the available UI5 community projects" and npm marks 4.1.0 (2024-11-08) deprecated (Verified via registry). The de-facto successor is `ui5-test-runner` (npm `ui5-test-runner` — *not* `@ui5/test-runner`, which returns 404), v6.0.5 published 2026-11-03, MIT, maintained by Arnaud Buchholz (SAP employee, personal repo) (Verified via registry). It is explicitly "designed and built as a substitute of the UI5 karma runner," runs each test page in parallel browser tabs, and its *remote mode* "can test applications that are already served": `ui5-test-runner --url http://host/path/testsuite.qunit.html` (Documented, `docs/modes/remote.md`). Driver table lists `playwright` with `chromium` (Documented) — matching what the repo already has. Node requirement is `>= 24.11.1` (Documented README) — check the module's Node.

Coverage in remote mode needs `@ui5/middleware-code-coverage` in the served app's `ui5.yaml` (Documented, `docs/coverage.md`); that middleware "instruments the transpiled JavaScript and remaps the collected coverage back onto the original `.ts` source" (Documented, SAP/ui5-tooling-extensions README `main`). **Trap:** that same README states it "requires UI5 CLI v5 or higher, and a minimum UI5 version of 1.120.52, 1.136.25, or 1.155.0" — the repo has `@ui5/cli` 4.0.59 and UI5 1.136.16. Published versions: 2.0.4 (2026-08-18) and 3.0.0-alpha.1 (2026-10-30); which line the README on `main` describes is Unknown. This is topic 6's spike to pin.

OPA's own documented restrictions still apply (Documented, OPA5 topic): "No screen capturing. No testing across more than one page. No remote test execution. End-to-end tests are not recommended because of authentication issues and fragile test data." For Life OS that means journeys must run against deterministic data, not the user's live Postgres — the `functional-tester` agent already owns real-DB E2E.

## TypeScript authoring is first-class

**OPA5 page objects and journeys are documented in TypeScript by SAP itself** (Documented, ui5/docs walkthrough step 28 TS): a page object is `export default class HelloPanelPage extends Opa5 { ... this.waitFor({ id, viewName, actions: new Press() }) }` and a journey is

```ts
import opaTest from "sap/ui/test/opaQunit";
const onTheHelloPanelPage = new HelloPanelPage();
QUnit.module("Navigation");
opaTest("Should open the Hello dialog", function () {
    onTheHelloPanelPage.iStartMyUIComponent({ componentConfig: { name: "ui5.walkthrough" } });
    onTheHelloPanelPage.iPressTheSayHelloWithDialogButton();
    onTheHelloPanelPage.iShouldSeeTheHelloDialog();
    onTheHelloPanelPage.iTeardownMyApp();
});
```

These are ordinary UI5 TS modules, so `ui5-tooling-transpile` 3.12.0 transpiles them like app code (Inferred — the walkthrough uses the same tooling; not run here).

## Prior assumption, graded

"OPA5 is maintenance-only" — **refuted on status, unknown on velocity.** SAP's docs still recommend it, no deprecation marker exists anywhere found, it ships in 2.0 nightly, and the FE test library on top of it is public and typed. I could not read the commit log for `sap/ui/test`, so "stable but rarely touched" remains possible.

Kill criteria: "SAP deprecates it" — not triggered. "FE journeys unsupported" — not triggered; the opposite is true.

## What we could not establish

- **Commit velocity on `sap/ui/test` and `sap/fe/test`**: GitHub API/commit pages were blocked (`gh api` 403 "access not enabled", github.com robots). Settle with `git log --since=2025-01-01 --oneline -- src/sap.ui.core/src/sap/ui/test | wc -l` on a clone.
- **Does `cds-plugin-ui5` honour `@ui5/middleware-code-coverage` and ui5-test-runner's `?instrument=true` on the mounted path?** Needs disk + a run; topic 6's spike.
- **Which `@ui5/middleware-code-coverage` version works with `@ui5/cli` 4.0.59 + UI5 1.136.16**: compare `npm view @ui5/middleware-code-coverage@2.0.4 readme` against the `main` README.
- **FPM page support in `sap.fe.test`** (`TemplatePage` description is one line): check the 1.136 API doc for `TemplatePage.actions/assertions` members.
- **Deterministic data for journeys**: whether the module can start `cds-serve` with an in-memory SQLite profile for the OPA run (CAP capability, not verified here).
- SAP community blogs ("UI5's unified test tech stack", "Deprecation of karma-ui5 plugin") were robots-blocked; the karma-ui5 README quote stands in for them.

## Recommendation

**Recommended:** OPA5 + `sap.fe.test` for FE/FPM apps, plain OPA5 TS page objects for `csv-import-wizard` and the shell, journeys limited to module-owned behaviour, run headless via `ui5-test-runner --url` (Playwright driver) against `cds-serve` with deterministic test data. **Viable alternative:** wdi5 — it consumes the same `sap.fe.test` page objects through `FioriElementsFacade.execute` (Documented, wdi5 fe-testlib), so page-object work is portable; it trades in-browser speed and zero new deps for the WebdriverIO stack (topic 3). **Rejected for this tier:** plain Playwright for FE journeys — it would re-implement what `sap.fe.test` already encodes (Inferred; topic 4 may disagree for freestyle). **Fallback:** if topic 6 shows `ui5-test-runner` + coverage middleware cannot be made CI-stable on `@ui5/cli` 4 / 1.136.16, move journeys to wdi5 and keep OPA page objects. **What would reverse it:** an SAP deprecation of `sap.ui.test`, or a `ui5-test-runner` abandonment with no successor (single-maintainer risk).
