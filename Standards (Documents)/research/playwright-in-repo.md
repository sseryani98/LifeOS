# playwright-in-repo: Plain Playwright can be the in-repo UI5 journey suite, because UI5 ships the waiter and locator primitives wdi5 itself borrows

**Playwright (**refuted 2026-11-04:** `@playwright/test` is in neither root `node_modules` nor `package.json` — only the `npx @playwright/mcp` server exists; ~3 packages to install) is Recommended for the journey tier: UI5-aware waiting and locating come from `sap.ui.test.RecordReplay`, which is injected into the page with one `page.evaluate` — the same mechanism wdi5 uses — and TS coverage comes from a `coverage: true` switch already present in ui5-tooling-transpile 3.12.0.** What holds: no new runtime dependency, TypeScript authoring for free, `webServer` can own `cds-serve`. What does not: Fiori Elements' OPA test library (`sap.fe.test` ListReport/ObjectPage helpers) is unusable from Playwright, so FE journeys address controls by FE's documented stable IDs instead of page-object verbs. Cost: a ~100-line in-repo helper (`waitForUI5`, control-selector lookup, coverage dump) that the project then owns. What would change the answer: if the gate must express FE journeys with SAP's own FE page objects, wdi5 (sibling `wdi5-e2e`) is the only route to them.

**Mode:** Compare · **Verdict:** Recommended · **Confidence:** Medium (mechanism verified in package sources; no spike run on the real app) · **Feeds:** Test Strategy journey tier · **Researched:** 2026-11-04 · **Status:** Draft

---

## Waiting on UI5 rendering and OData is solved by UI5 itself, not by Playwright

**`sap.ui.test.RecordReplay.waitForUI5` is a public UI5 API (since 1.60) that resolves when XHR, fetch, promises, timeouts, navigation, animations, UI updates and module loads are all idle; Playwright reaches it through `page.evaluate`.** The RecordReplay source in SAP/openui5 (master, read 2026-11-04) documents `waitForUI5({timeout: 15000, interval: 400})` as "Wait for UI5 to complete processing, poll until all asynchronous work is finished, or timeout" and delegates to `sap/ui/test/autowaiter/_autoWaiterAsync`, whose registry lists `_XHRWaiter`, `_fetchWaiter`, `_timeoutWaiter`, `_promiseWaiter`, `_navigationContainerWaiter`, CSS/JS animation waiters, `_UIUpdatesWaiter`, `_moduleWaiter`, `_resourceWaiter` (Documented). The OData V4 `$batch` traffic is XHR, so it is covered.

This is not a theory: wdi5 3.0.12 (`wdio-ui5-service`, unpacked from npm, `dist/cjs/client-side-js/injectUI5.cjs`) does exactly this inside `browser.execute`: `sap.ui.require(["sap/ui/test/RecordReplay", ...])` then `window.bridge = RecordReplay`, and every wdi5 command calls `window.bridge.waitForUI5(window.wdi5.waitForUI5Options)` (Verified: `grep -n "bridge.waitForUI5" package/dist/cjs/client-side-js/*.cjs`). Playwright's `page.evaluate` is the equivalent of `browser.execute`. The kill criterion ("cannot wait reliably on UI5 rendering/OData completion") is therefore not met.

The in-repo helper, as a Playwright fixture:

```ts
// test/ui/fixtures.ts
import { test as base, expect, Page } from "@playwright/test";

async function injectUI5(page: Page) {
  await page.waitForFunction(() => !!(window as any).sap?.ui);
  await page.evaluate(
    () =>
      new Promise<void>((res, rej) =>
        (window as any).sap.ui.require(
          ["sap/ui/test/RecordReplay"],
          (RR: any) => {
            (window as any).__rr = RR;
            res();
          },
          rej,
        ),
      ),
  );
}
async function waitForUI5(page: Page) {
  // serialise: _autoWaiterAsync rejects re-entrant calls
  await page.evaluate(() =>
    (window as any).__rr.waitForUI5({ timeout: 15000, interval: 400 }),
  );
}
export const test = base.extend<{ ui5: { waitForUI5: () => Promise<void> } }>({
  ui5: async ({ page }, use) => {
    await use({ waitForUI5: () => waitForUI5(page) });
  },
});
export { expect };
```

Two documented caveats shape the helper. `_autoWaiterAsync.waitAsync` rejects with "waitAsync is already running and cannot be called again at this moment" when called re-entrantly (Verified in source, line 44) — so the helper must serialise calls, never fire them from parallel `Promise.all`. `_timeoutWaiter` ignores timeouts above `maxDelay: 1000` ms and does not wrap `setInterval` at all (Documented, source comment "long runnes are some application level timeouts => we do not care for them"); any polling in `shared/` (e.g. chart cards) is invisible to it and needs an explicit `expect.poll`.

## Addressing UI5 controls without wdi5 has three documented handles

| Handle                                                                       | What it addresses                                                                                                                                                                                                                                                                                          | Source                                                                 | Cost                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| `page.locator('id=<stable id>')`                                             | Fiori Elements macros. FE documents the pattern `<ApplicationId>::<PageId>--fe::table::<Entity>::LineItem::Table` ("Interacting with a Table Using the API", SAP-docs/sapui5). Playwright's `id=` engine takes the raw attribute, so `::` and `--` need no CSS escaping (playwright.dev "Other locators"). | Documented                                                             | none                             |
| `getByRole` / `getByText` / `getByLabel`                                     | Freestyle views, dialogs, toolbar buttons; UI5 renders ARIA roles.                                                                                                                                                                                                                                         | Documented (Playwright) · Inferred (UI5 ARIA completeness per control) | none                             |
| `__rr.findDOMElementByControlSelector({selector})` + `interactWithControl`   | OPA-style selectors (`controlType`, `properties`, `bindingPath`, `i18NText`, `ancestor`) copied from the UI5 Test Recorder's **raw selector** dialect, which the Test Recorder doc (SAP-docs, 1.74+) describes as "just the control locator with no function invocations" for use in other frameworks.     | Documented                                                             | helper wrapper                   |
| `playwright-ui5` 1.6.9 (community, DetachHead, ISC, last publish 2026-06-25) | `ui5=sap.m.Button[text='Save']` custom selector engine                                                                                                                                                                                                                                                     | Reported (npm + README)                                                | one dev dep; unknown maintenance |

For freestyle views the project controls the markup, so `<core:CustomData key="testid" writeToDom="true"/>` plus `testIdAttribute: 'data-testid'` is also available (Inferred from UI5 CustomData `writeToDom` behaviour; not re-verified this round).

What is lost relative to wdi5: `window.fe_bridge` with `sap/fe/test/ListReport`, `ObjectPage`, `Shell` page objects (Verified present in wdi5's `testLibrary.cjs`), control-method proxying (`asControl(...).getProperty()`), and Test Recorder's wdi5 snippet dialect. Journeys in Playwright therefore read as "click the id, assert the DOM" rather than "onTheListReportPage.iExecuteAction". Under the "never test the framework" rule this is arguably the right shape: a Playwright journey asserts the module's own outcome (row appears, message strip text, navigation target), not FE internals.

## Coverage of TS app code is possible today, through the transpiler, not through SAP's coverage middleware

**ui5-tooling-transpile 3.12.0 — the version installed — has a `coverage` option that appends `babel-plugin-istanbul` as the last Babel plugin, keyed by the `.ts` file's filesystem path.** Verified by unpacking the npm tarball: `lib/util.js` lines 592–610 push `["babel-plugin-istanbul", configuration.coverage]` when `babel-plugin-istanbul` resolves (optional peer `>=6.0.0`, Verified in `package.json`), and `lib/middleware.js` line 84 passes `filename: determineResourceFSPath(resource)` "necessary for source map <-> source assoc". Because instrumentation runs in the same Babel pass as `@babel/preset-typescript`, the statement map is in TS coordinates and the coverage key is the `.ts` path — the same shape Jest's `babel-jest` produces (Inferred from Babel plugin ordering; the spike confirms).

Switching it on only for the test run is documented in cds-plugin-ui5: `configFile` per module, or `CDS_PLUGIN_UI5_MODULES='{"<module>":{"configFile":"ui5-coverage.yaml"}}' cds-serve` (cds-plugin-ui5 README). The host already verified that ui5.yaml `customMiddleware` runs under `cds-serve` (brief, transpile middleware). So:

```yaml
# app/<app>/ui5-coverage.yaml (copy of ui5.yaml + one key)
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
      configuration:
        coverage: { exclude: ["**/test/**"] } # babel-plugin-istanbul options
```

```ts
// afterEach: dump window.__coverage__ (default global of babel-plugin-istanbul)
const cov = await page.evaluate(() => (window as any).__coverage__);
fs.writeFileSync(`.nyc_output/${test.info().testId}.json`, JSON.stringify(cov));
// then: npx nyc report --reporter=json --reporter=text --check-coverage --lines 80
```

The alternative, SAP's `@ui5/middleware-code-coverage`, is Rejected for now: the stable 2.0.4 README (npm, published 2026-08-18) says "Not compatible with TypeScript-based projects"; TS plus input source maps arrive only in `3.0.0-alpha.1` (2026-10-30), which "requires UI5 CLI v5 or higher" and UI5 1.136.25 / 1.155.0 minimum (CHANGELOG + main README) — the repo is on `@ui5/cli` 4.0.59 and minUI5Version 1.136.16. Playwright's own `page.coverage` (V8, Chromium-only) plus `monocart-coverage-reports` is a Viable alternative needing no server-side switch but a converter dependency and source-map fidelity work (Inferred; not tested).

Merging with Jest: Jest emits Istanbul JSON (`coverage/coverage-final.json`); `nyc merge` combines both into one map for a single threshold — relevant to sibling `gate-integration`.

## Comparison

| Criterion                       | Plain Playwright                                                                   | wdi5 (see `wdi5-e2e`)                                                   | OPA5 (see `opa5-journeys`)             |
| ------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| New deps                        | 0 (+ `babel-plugin-istanbul`, `nyc` for coverage)                                  | WebdriverIO v9 stack (`@wdio/cli`, `webdriverio`, …; peerDeps Verified) | none (runs in browser; needs a runner) |
| UI5 waiting                     | RecordReplay via `page.evaluate` (Documented)                                      | same API, built in                                                      | native                                 |
| FE page objects (`sap.fe.test`) | no                                                                                 | yes (`fe_bridge`)                                                       | yes                                    |
| TS authoring                    | native (`@playwright/test`)                                                        | yes                                                                     | via transpile                          |
| Serving under `cds-serve`       | `webServer: { command: 'cds-serve', url }` (Documented)                            | wdio `baseUrl` to the running server                                    | needs page served by same server       |
| TS coverage                     | transpile `coverage` option (Verified in 3.12.0)                                   | same middleware trick                                                   | same                                   |
| Headless CI                     | system Chrome (as the MCP server uses); `@playwright/test` itself is not installed | needs chromedriver/WDIO runner                                          | needs headless runner                  |

## Prior assumption, graded

"Loses UI5-aware selectors, gains zero new deps" — **half refuted**. The zero-new-deps part holds (coverage adds two dev deps). The selector part is overstated: UI5-aware selection is available through `RecordReplay.findDOMElementByControlSelector` and FE's documented stable IDs; what is lost is the FE OPA page-object library and wdi5's control proxy, not selectors as such.

## What we could not establish

- **Whether loading `sap/ui/test/RecordReplay` into the FE app at runtime causes side effects** (the autowaiter monkey-patches XHR/fetch/setTimeout at load). wdi5 does it in production-like apps, so it is Reported-safe; settle with the spike below.
- **That coverage keys match Jest's path convention** for an `nyc merge`. Check: run one Playwright test with `ui5-coverage.yaml`, inspect `Object.keys(window.__coverage__)` — expect absolute `.ts` paths under `app/`.
- **The actual UI5 runtime version served** (manifest says minUI5Version 1.136.16; the loaded `sap-ui-core.js` may be newer) — matters only for the alpha SAP middleware; check `sap.ui.version` in the console.
- **Fiori Elements ARIA coverage for `getByRole`** against the real list/object pages — not documented per control; settle by `npx playwright codegen` against the running app.
- Searches run: npm registry (`playwright-ui5`, `playwright-sap`, `@ui5/middleware-code-coverage` versions/time), SAP-docs/sapui5 code search for "fe::table" and "stable ids", SAP/openui5 autowaiter sources, wdi5 3.0.12 tarball. No SAP-authored Playwright guidance was found anywhere (Unknown: searched ui5.sap.com topics and SAP-docs repo).

## Recommendation

**Recommended:** Playwright as the journey-tier runner, with an in-repo `test/ui/fixtures.ts` (inject RecordReplay, serialised `waitForUI5`, coverage dump), FE journeys addressed by stable IDs, freestyle journeys by role/label/CustomData, and TS coverage via `ui5-tooling-transpile` `coverage` + `nyc --check-coverage`. Spike (feeds `gate-integration`): add `babel-plugin-istanbul`, create `ui5-coverage.yaml`, start `cds-serve` with `CDS_PLUGIN_UI5_MODULES`, run one test that opens `admin-master-data`, calls `waitForUI5`, asserts a table row, and prints `Object.keys(window.__coverage__)`. Pass = keys are `.ts` paths and `waitForUI5` resolves within 15 s after `$batch`.

**Fallback:** wdi5 (sibling `wdi5-e2e`) if the spike shows `waitForUI5` timing out on the FE pages or the project wants `sap.fe.test` page objects; the same `ui5-coverage.yaml` carries over.

**What would reverse it:** SAP publishing official Playwright support (none found 2026-11-04); the FE page-object library being judged mandatory for FE journeys; or `RecordReplay` injection breaking the FE runtime (spike outcome).
