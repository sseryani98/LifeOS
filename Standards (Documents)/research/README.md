# Research pack — UI5 testing as a build gate

**Gate verdict: GO WITH CAVEATS.** The Test Strategy amendment can be designed now — every
framework question has a documented answer and no kill criterion tripped — but the one thing it
rests on, a UI5 suite running inside `npm test` with coverage of the TypeScript sources, is
**Unproven until the prescribed spike runs** (two packages to install, Sandro's call).

**Researched:** 2026-11-04 · **Feeds:** Test Strategy amendment (Financial Planner §9 / D-80,
Project Tracker §15 / D-195), the shared test rules, `build.js` gate · **Status:** Draft

Context: 2026-11-04 project decision — UI5 testing is a gate, not a learning exercise; all UI5
code in every module is tested to production grade with thresholds. The earlier pack
(`plaid-research.md`, `simplefin-research.md`, `churning-in-canada.md`) is unrelated.

## The pack

| Doc | Mode | Verdict | Confidence | Feeds |
| --- | --- | --- | --- | --- |
| [qunit-unit-tests.md](qunit-unit-tests.md) | Compare | **Recommended** — QUnit 2 Test Starter, `*.qunit.ts`, run by `ui5-test-runner` remote mode, coverage from `ui5-tooling-transpile` | Medium | Unit tier |
| [opa5-journeys.md](opa5-journeys.md) | Compare | **Recommended** — OPA5 + `sap.fe.test` for FE apps, plain OPA5 page objects for freestyle; same runner as QUnit | Medium | Journey tier |
| [wdi5-e2e.md](wdi5-e2e.md) | Compare | **Viable alternative** (scout said Recommended; downgraded in reconciliation, see below) | Medium | Journey tier |
| [playwright-in-repo.md](playwright-in-repo.md) | Compare | **Viable alternative** for in-repo journeys; already the `/functional-test` tier (scout said Recommended; see below) | Medium | Journey tier |
| [fiori-elements-testability.md](fiori-elements-testability.md) | Ground | — (no recommendation) | Medium | Philosophy |
| [gate-integration.md](gate-integration.md) | Validate | **Unproven** — fully documented, nothing executed; spike prescribed | Medium | Gate, `build.js` |

## Reconciliation — where the scouts disagreed

**Three journey scouts each recommended their own option.** The host's comparison, by evidence
tier and fit:

| | OPA5 (+ `sap.fe.test`) | wdi5 | Playwright |
| --- | --- | --- | --- |
| SAP's 1.136 "Testing" topic recommends it | Yes (integration) | Yes (E2E) | Not mentioned |
| `sap.fe.test` ListReport/ObjectPage page objects | Yes | Yes (via `browser.fe`) | No |
| Runner | `ui5-test-runner` — same as QUnit | WebdriverIO + Mocha (second runner) | Playwright test runner (already installed) |
| New dependencies | `ui5-test-runner`, `nyc` | + 460 packages / 121 MB (Verified) | none |
| TS coverage path | transpile `coverage` → runner nyc | transpile `coverage` → hand-harvested `__coverage__` (Unknown in wdi5 docs) | transpile `coverage` → hand-harvested |
| UI5-aware waiting | built in (`autoWait`) | built in (RecordReplay bridge) | reachable (`RecordReplay.waitForUI5` via `page.evaluate`) |
| Backend for journeys | `cds-serve` dev profile = in-memory SQLite (Verified: `package.json [development]`) | same | same |

**OPA5 wins for the in-repo journey tier** because it shares one runner and one coverage pipeline
with the unit tier and is the only option besides wdi5 that reaches `sap.fe.test`; wdi5's only
unique capability over OPA5 is a Node-side test process, bought with a second runner and the
heaviest dependency set in the comparison. **Playwright keeps the tier it already owns** —
`/functional-test` against real Postgres — and is the fallback if OPA5 proves unusable under the
custom shell (risk R2). This is a Compare-mode recommendation, not a design; the Test Strategy
amendment makes the call.

**Karma: dead or alive?** `karma-ui5` is deprecated and archived (Documented, 2025-12-12), yet
SAP's own `cap-sflight` sample still runs it (Verified, commit 2026-10-19). Both hold: it still
works, nobody maintains it. Rejected for a new gate.

**Coverage middleware.** `@ui5/middleware-code-coverage` stable says "not compatible with
TypeScript-based projects"; its TS-capable 3.0.0-alpha needs UI5 CLI v5 and UI5 ≥ 1.136.25 — the
repo is CLI 4.0.59 / 1.136.16. `ui5-tooling-transpile` 3.12.0 — the pinned version — carries its
own `coverage` option (babel-plugin-istanbul, already in `node_modules`). Transpile wins; the SAP
middleware returns as a question if the repo ever moves to CLI v5.

**Runner naming.** `@ui5/test-runner` does not exist. The runner is the community
`ui5-test-runner` (ArnaudBuchholz, MIT). v6 needs Node ≥ 24.11.1; the repo runs **Node 22.23.4**
(Verified), so the pin is **5.14.2**.

## What changed — assumption ledger

| Prior assumption | Result |
| --- | --- |
| QUnit is still SAP's unit framework | **holds** |
| Karma replaced by an SAP runner (`@ui5/test-runner`) | **refuted** — replacement is community-owned |
| OPA5 is maintenance-only | **refuted** — SAP recommends it, ships in UI5 2.0 nightly, `sap.fe.test` typed in 1.136 |
| SAP steers new E2E work to wdi5 | **holds** — but it is not the only route |
| Playwright cannot wait reliably on UI5 | **refuted** — `RecordReplay.waitForUI5` is public since 1.60 |
| Near-zero logic in FE apps → little to unit-test | **holds for the unit tier, refuted for coverage** — annotation-driven behaviour and extensions are "ours" and SAP covers them at the journey tier |
| A UI5 suite fits in `npm test` | **unknown** — holds on paper, spike pending |

## Open risks

| # | Risk | What settles it |
| --- | --- | --- |
| R1 | **Gate chain unexecuted** — runner + `cds-serve --start` + transpile coverage + thresholds in one `npm test` | **Re-owned by the initiative's first build story, Sprint 2** (Sandro, 2026-11-04): it installs `ui5-test-runner@5.14.2` and `nyc`, runs the spike in `gate-integration.md` §Recommendation 3×, and lands the gate wiring. Until it closes, the Test Strategy amendment marks the gate mechanics **provisional** |
| R2 | **`sap.fe.test.Shell` hard-codes FLP**; FE apps are hosted in a custom `sap.tnt.ToolPage` shell. Page objects for ListReport/ObjectPage should still resolve (IDs are `appId::targetId`, Inferred) | One journey with `launchUrl` at the shell route |
| R3 | **No page object for FPM custom pages** (`TemplatePage` constructor is protected) — Project Tracker's only page is FPM, so D-195 cannot be reversed with `sap.fe.test` alone | Decide: plain OPA5 page object for FPM, or Playwright for that module |
| R4 | **Unit-testing a `ControllerExtension` in isolation is undocumented** (`@ui5-protected` constructor, no public `base` type) | QUnit spike: instantiate with a fake `base`; else extract hook logic into plain functions as a standard |
| R5 | **Coverage directory collision** — runner recreates `coverage/` by default and would delete Jest's `test-results.json` | Always pass `--coverage-report-dir coverage-ui5 --report-dir report-ui5` |
| R6 | **Runner runs `npm install -g` at runtime** for missing drivers, bypassing the lockfile | Always pass `--no-npm-install` |
| R7 | **Single-maintainer runner**, 5.x line vs 11-day-old v6 | Pin 5.14.2; revisit when Node moves to 24 |
| R8 | **Merged threshold** (UI5 + Jest in one number) needs an extra `nyc merge` step | Separate per-tier thresholds unless the spike proves the merge clean |
| R9 | **`app/shared/` coverage** depends on how `cds-plugin-ui5` serves it (own `ui5.yaml`, namespace `com.financialplanner.shared`, Verified) | Spike step: confirm `/shared/` is instrumented |

## Decays

| Finding | Dates it |
| --- | --- |
| `ui5-test-runner` 6.0.5 / 5.14.2 versions and Node floor | npm, checked 2026-11-04 |
| `@ui5/middleware-code-coverage` 3.0.0-alpha.1 TS support, CLI v5 requirement | 2026-10-30 release; a repo move to CLI v5 reopens it |
| OPA5 present in UI5 2.0 nightly | 2.0.0-SNAPSHOT build 2026-11-02 |
| wdi5 3.0.12 / WebdriverIO 9 | 2026-09-11 |
| `cap-sflight` still on karma-ui5 | commit 7f42e85, 2026-10-19 |

## Consumers

- **Test Strategy amendment** (Financial Planner §9, Project Tracker §15; cross-module part → shared
  test rules): unit tier = QUnit on `shared/`, base classes, custom controls, formatters, freestyle
  controller logic; journey tier = OPA5 + `sap.fe.test` on every FE app's annotation contract and
  extensions, plain OPA5 on freestyle and the shell; thresholds per tier (R8).
- **`build.js` gate**: `npm test` chains Jest and the runner; `gate-runner` parses `report-ui5/report.json`
  beside Jest's JSON; the `hasJestLayer` hook in `build.js` becomes the `ui5` author's entry point.
- **Harness**: a `ui5-test-author` agent (keep `test-author` for CAP), per the 2026-11-04 plan.

## Second wave (if the first holds)

1. R1 is a build story, not research. Spike R2 (FE page objects under the tnt shell) — prescribed in `opa5-journeys.md` / `wdi5-e2e.md`.
2. FPM page strategy for Project Tracker (R3).
3. `ControllerExtension` unit-testability (R4) → may become a coding standard.
4. Deterministic journey data: dev-profile in-memory SQLite + `db/data` CSVs vs `iResetTestData()` override.
