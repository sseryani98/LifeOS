# wdi5 E2E: the recommended UI5-aware E2E framework, and it attaches to cds-serve without a second server

**wdi5 (`wdio-ui5-service` 3.0.12) is SAP's documented E2E recommendation for SAPUI5 1.136, runs in TypeScript headless, and attaches to any URL where UI5 bootstraps — including the CAP-served app on :4004 — so the kill criterion is refuted.** What it costs is the WebdriverIO 9 stack: 460 packages / 121 MB of devDependencies beside a Playwright that needs only `@playwright/test` (~3 packages — it is not installed; refuted 2026-11-04), a second automation protocol (BiDi over WebDriver), and a browser-driver download step. Its Fiori Elements test library (`sap.fe.test`, shipped in SAPUI5 1.136.16 and served from the CDN) gives journey helpers for ListReport/ObjectPage that nothing else offers, but the `Shell` helper assumes FLP, so the custom `sap.tnt.ToolPage` shell needs own page objects. wdi5 does not produce code coverage of app TypeScript; coverage must come from the unit tier or from instrumenting the transpile step (sibling `gate-integration`). The answer flips to Playwright if the team decides UI5-aware locators and the FE helpers are not worth 460 packages — see `playwright-in-repo`.

**Mode:** Compare · **Verdict:** Recommended (for the journey tier, conditional on dependency-weight acceptance) · **Confidence:** Medium · **Feeds:** Test Strategy journey tier · **Researched:** 2026-11-04 · **Status:** Draft

---

## SAP names wdi5, not Playwright, as the E2E tool

**The SAPUI5 1.136.16 "Testing" topic lists exactly two recommended tools: OPA5 for integration and wdi5 for E2E.** (Documented: ui5.sap.com/1.136.16, topic 7cdee404cac441888539ed7bfe076e57, fetched 2026-11-04: "wdi5, which is a WDIO plugin, bridges this gap and provides two key benefits, namely control locators and synchronization with the web framework.") Playwright is not named anywhere in that topic. The sibling "Test Automation" topic (ae448243822448d8ba04b4784f4b09a0) says SAPUI5 "does not provide features for any specific test runner" and points to community `ui5-test-runner` and `wdio-qunit-service` — relevant to `qunit-unit-tests`, not here.

wdi5 is an SAP-community project (github.com/ui5-community/wdi5), not an SAP product. Maintenance is active: 3.0.0 on 2025-10-12 (WebdriverIO 9, BiDi default, "UI5 legacy-free" support), 3.0.12 on 2026-09-11 (Verified: `npm view wdio-ui5-service` → `time.modified 2026-09-11`, CHANGELOG in repo). Prerequisites: Node ≥ 20, UI5 ≥ 1.60 (Documented: docs/installation.md; package `engines: node >=20, npm >=10`).

## It attaches to cds-serve: the kill criterion is refuted

**wdi5 needs only a URL where UI5 bootstraps; it injects itself at runtime via `sap.ui.require(["sap/ui/test/RecordReplay", …])` inside the page and never talks to the dev server.** (Verified: read `dist/cjs/client-side-js/injectUI5.cjs` of 3.0.12 — line 35 requires `sap/ui/test/RecordReplay`, line 53 `window.bridge = RecordReplayUi5LocalRef`.) The docs' "start with `ui5 serve`" wording (docs/running.md) is a convenience, not a requirement; `baseUrl` is documented as "URL to your running UI5 app" and must "point directly to the index.html where the UI5 application is bootstrapped" (Documented: docs/configuration.md).

The project's own CAP example does exactly what Life OS needs (Verified: `examples/cap-bookshop-wdi5` in the wdi5 repo, checked out 2026-11-04):

```js
// examples/cap-bookshop-wdi5/app/admin-books/webapp/test/wdi5/wdio.conf.js
baseUrl: "http://localhost:4004/fiori-apps.html#Books-manage",
services: ["ui5"],
framework: "mocha",
```

```json
// root package.json of the wdi5 repo
"_startApp:cap": "npm run start --workspace=examples/cap-bookshop-wdi5",   // cds deploy && cds run
"_test:cap-app": "wait-on tcp:4004 && npm run wdi5 --workspace=examples/cap-bookshop-wdi5 -- --headless",
"test:capAuth":  "run-p -r _startApp:cap _test:cap-app"
```

So: one `cds-serve` on :4004 (which cds-plugin-ui5 already fronts with ui5-tooling-transpile), `wait-on`, then `wdio run`. No `ui5 serve`. For Life OS, `baseUrl` would be the shell's index.html under the `cds-plugin-ui5` mountPath; if a journey starts on a non-UI5 page, `skipInjectUI5OnStart: true` plus a manual `injectUI5()` is the documented path (Documented: docs/configuration.md).

## TypeScript and headless are first-class

**`npm init wdi5@latest -- --ts` scaffolds `wdio.conf.ts` + `tsconfig.json`; WebdriverIO 9 compiles TS tests itself when `tsx` is a devDependency.** (Documented: wdi5 docs/installation.md; webdriver.io/docs/typescript: "WebdriverIO will automatically detect if these dependencies are installed and will compile your config and tests for you.") Types come from `"types": ["node","@openui5/types","@wdio/globals/types","@wdio/mocha-framework","wdio-ui5-service/cjs","expect-webdriverio"]` (Documented: docs/recipes.md); `browser.asControl<sap.m.Table>(…)` is generic-typed. The app's own `ui5-tooling-transpile` is irrelevant to the test files — tests run in Node, not in the browser.

Headless is a capability flag, with a documented warning to pin a window size (Documented: docs/recipes.md):

```js
capabilities: [
  {
    browserName: "chrome",
    "goog:chromeOptions": { args: ["--window-size=1440,800", "--headless"] },
  },
];
```

Browser/driver: WebdriverIO 9 auto-downloads a matching ChromeDriver (and Chrome, if none found) — an internet-reaching step. The already-installed Playwright Chromium can be reused via `goog:chromeOptions.binary`, and a driver pinned via `wdio:chromedriverOptions.binary` or `CHROMEDRIVER_PATH` (Documented: webdriver.io/docs/capabilities, "Fully offline environments"). This is a gate-stability item for `gate-integration`.

## Dependency weight is the real cost: 460 packages, 121 MB

| Stack                                                                                                                 | Added packages                                 | node_modules | Protocol                                           | Source                                                   |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------ | -------------------------------------------------- | -------------------------------------------------------- |
| wdi5 3.0.12 + required wdio 9 peers (`@wdio/cli, globals, local-runner, mocha-framework, spec-reporter, webdriverio`) | 460 (486 lockfile entries, 309 top-level dirs) | 121 MB       | WebDriver BiDi (default), classic WebDriver opt-in | Verified: fresh `npm install` in scratch dir, 2026-11-04 |
| Playwright — **not in repo** (only `npx @playwright/mcp`)                                                             | `@playwright/test`, ~3                         | small        | CDP                                                | Brief said 0; **refuted** by measurement 2026-11-04      |

wdi5 itself declares a single runtime dependency (`compare-versions`); the weight is entirely WebdriverIO (Verified: `npm view wdio-ui5-service dependencies peerDependencies`). It also brings a second test runner (Mocha via `@wdio/mocha-framework`) beside Jest; wdio's Jasmine/Cucumber adapters exist, but no Jest adapter — wdi5 runs as its own `wdio run` process, which `npm test` would have to chain (feeds `gate-integration`).

## The Fiori Elements test library is the differentiator — with a shell caveat

**`sap.fe.test` ships in SAPUI5 1.136.16 and is served from the CDN under `/resources/sap/fe/test/`, so wdi5's `browser.fe.initialize()` facade works against the project's UI5 version without extra packaging.** (Verified: `curl -I https://ui5.sap.com/1.136.16/resources/sap/fe/test/ListReport.js` → 200, 10402 bytes; `@sapui5/sap.fe.test@1.136.16` exists on npm.) wdi5's facade wraps the library's OPA5 page objects in-browser (Verified: `dist/cjs/client-side-js/testLibrary.cjs` requires `sap/fe/test/ListReport|ObjectPage|Shell` and calls `Opa5.createPageObjects`). Scope is "Fiori Elements OData v4 only", wdi5 > 0.9.1, SAPUI5 > 1.88 (Documented: docs/fe-testlib.md). The page says explicitly "Do NOT test framework functionality" and that custom actions / complex annotations are the focus — the same line as the project's coding standard.

Two facts from reading the 1.136.16 library source matter for Life OS:

1. **View IDs are stable regardless of how the shell instantiates the component.** `sap.fe.test.ListReport` builds `ViewId = appId + "::" + componentId` (ListReport.js line 82), and `sap.fe.core` names template views `${oAppComponent.getMetadata().getComponentName()}::${pageId}` (TemplatedViewServiceFactory.ts line 124) — the manifest `sap.app.id`, not the runtime instance ID. So FE apps hosted as components inside the custom `sap.tnt.ToolPage` shell keep `appId::componentId` IDs, and the facade's `onTheMainPage` / `onTheDetailPage` should resolve. (Inferred from source; not run.)
2. **`sap.fe.test.Shell` assumes FLP** — it looks for `backBtn`, `shell-header`, and `sap.ushell.Container` (Shell.js lines 57–280). With no ushell, `onTheShell` is unusable; shell navigation in Life OS must be driven by own page objects with ordinary `browser.asControl` selectors, which the fe-testlib page documents as a supported mix.

If the apps are ever served from npm (`framework.libraries` in ui5.yaml) instead of the CDN, `sap.fe.test` is `sapInternal: true` (Verified: its `ui5.yaml`), so the consuming app needs `metadata.allowSapInternal: true` — the fe-app example's ui5.yaml carries that exact comment.

wdi5's own FE example runs on SAPUI5 **1.120**, not 1.136 (Verified: `examples/fe-app/webapp/index.html`); 1.136 compatibility is Inferred from the API being present, not Verified.

## Freestyle apps: plain `asControl` with RecordReplay selectors

For `csv-import-wizard` and `shell`, wdi5 offers `browser.asControl({selector:{id|controlType|bindingPath|properties|i18NText|ancestor|descendant|labelFor|interactable|viewName}})` then any UI5 API method on the proxy (Documented: docs/usage.md, docs/locators.md). Auto-wait on UI5 rendering and XHR/fetch is built into `RecordReplay.waitForUI5` with `ignoreAutoWaitUrls` for long-polling (Documented: docs/configuration.md). This is the capability `playwright-in-repo` must replicate by hand.

## Prior assumption, graded

**"SAP steers new E2E work to wdi5" — holds.** The 1.136.16 Testing topic recommends only OPA5 and wdi5; wdi5 is community-maintained but SAP-documented, and the kill criterion ("cannot attach to a CAP-served app without a separate UI5 server") is refuted by wdi5's own CAP example and by the injection mechanism.

## What we could not establish

- **FE facade on 1.136.16 inside a non-FLP tnt shell.** Not run. Settles it: start `cds-serve`, `npm init wdi5@latest -- --ts --baseUrl http://localhost:4004/<mountPath>/index.html`, one spec calling `browser.fe.initialize({onTheMainPage:{ListReport:{appId:"<sap.app.id of transactions>", componentId:"<routing target id>", entitySet:"<entity>"}}})` then `Then.onTheMainPage.iSeeThisPage()`. Pass = facade works; "view not found" = ID derivation differs under the shell.
- **Whether the shell's index.html bootstraps from CDN or npm**, which decides whether `sap.fe.test` needs `allowSapInternal`. Check: `grep sap-ui-core "Financial Planner/app/shell/webapp/index.html"` and `framework:` in its ui5.yaml.
- **Headless run time per journey against real Postgres** and BiDi stability with 1.136 (migration.md notes stale-element semantics changed under BiDi). Settles: run the spike above twice with `--headless`, time it, then once with `'wdio:enforceWebDriverClassic': true`.
- **Coverage of app TS from wdi5 runs.** Searched wdi5 docs (`grep -i coverage docs/*.md` → no hits). Unknown; wdi5 has no coverage story. Defer to `gate-integration`.

## Recommendation

**Recommended** for the journey tier when UI5-aware locators and FE ListReport/ObjectPage helpers are wanted; the FE helpers cover 3 of the 6 apps' generic flows so journeys only script Life OS's own actions, matching "never test the framework". Accept 460 packages and a `wait-on tcp:4004 && wdio run` chain in `npm test`; pin Chromium to the Playwright binary and the driver via `CHROMEDRIVER_PATH` for gate determinism.

**Viable alternative:** plain Playwright (`playwright-in-repo`) — zero new dependencies, but own waiting/selector layer and no FE helpers. **Rejected:** OPA5-in-browser as the E2E tier for the gate (needs a page-hosted runner; see `opa5-journeys`).

**Fallback:** if the spike shows the FE facade fails under the tnt shell, keep wdi5 for freestyle apps and FE custom actions via `asControl`, dropping the facade. **What would reverse it:** the host rejecting the dependency weight or a second runner in `npm test`, or `gate-integration` finding Playwright can already deliver UI5/OData waits with coverage — then Playwright becomes Recommended and wdi5 the alternative.
