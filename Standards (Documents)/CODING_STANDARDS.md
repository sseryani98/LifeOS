# Life OS — Coding Standards

The shared standards every Life OS module builds to. They were written for Financial Planner and
moved here 2026-11-04, once Project Tracker was in build (root `CLAUDE.md` §Standards). Examples
still come from the planner; the rules apply to every module. A module's own `CLAUDE.md` carries
only its architecture, folder structure and carve-outs — a carve-out there beats a rule here.

Lint-enforced rules name their `lint:*` script or ESLint rule id; `lint:doc-claims` in every module
checks those names against the module's `package.json`, so a claim here that names no live script
fails the build.

## Coding Patterns

> Full rationale and examples for the standards below live in [TECHNICAL_STANDARDS.md](../Financial%20Planner/design/TECHNICAL_STANDARDS.md). This file carries the trigger + carve-outs + lint gate; lint-enforced rules name their `lint:*` script so you aim right on the first pass rather than round-tripping through a lint failure.

### CDS

- **Entities:** PascalCase singular. **Fields:** camelCase. **FKs:** CAP auto-generated (`cardInstance_ID`). **Namespace:** `com.lifeos.{module}` (root `CLAUDE.md` §Cross-Module Rulings; Financial Planner still declares `com.financialplanner`, D-16). One `schema.cds` per domain folder under `db/`
- **Service files split by kind:** `srv/{name}-service.cds` is a shell — `using` lines plus an empty `service X @(path) {}`. Members go in `srv/{name}/` as `extend service X with {…}`: `entities.cds` (projections only), `types.cds`, `actions.cds` (unbound, plus bound via `extend X.Entity with actions`), `calculations.cds` (`case`/computed columns via `extend projection`), `annotations.cds`. Add only the files a service needs. A sibling file's names don't resolve inside `extend` — import them (`using {X, X.SomeType} from './types'`). `lint:cds-layout`
- **Code lists for dropdowns:** finite value set needing dropdown UX → a `CodeList` entity + Association, NOT a `String enum` (enums don't render dropdowns in Fiori Elements V4). Annotate `@Common: { Text, TextArrangement: #TextOnly, ValueListWithFixedValues }`, reference the FK (`xxx_code`) in UI, hide raw codes via `@UI.Hidden`, name the field `xxxType` not `xxxName`
- **Association ValueHelp** (two parts): (1) target entity's `ID` field gets `@Common: { Text: name, TextArrangement: #TextOnly }` so dropdowns show names not UUIDs; (2) the **association** (not the auto-generated FK) gets `@Common: { Text: assoc.name, TextArrangement: #TextOnly, ValueList: {…} }`. `ValueListWithFixedValues` if <25 rows. ValueList `DisplayOnly` columns must match the target's ListReport
- **Annotations over code:** reach for a CAP built-in before writing a handler — `@assert.unique` (**entity level**: `@assert.unique.slug: [slug]`; the field-level form fires nothing), `@assert.range`, `@assert.format`, `@assert.enum`, `@assert.integrity` (`'DB'` or `'RT'` — the default is `false` and `true` is rejected), `@readonly`, `@mandatory`, `@flow.status` + `@from`/`@to` for state machines. **~~`@assert: (case when … then …)` for cross-field~~ does not exist at the pinned `@sap/cds` 9.8.4** — `@assert.constraint` has zero occurrences in the compiler and a boolean `@assert:` silently never fires, so **cross-field rules need a handler** (measured 2026-08-15; Project Tracker D-171). Error keys emitted are `ASSERT_MANDATORY` (not `ASSERT_NOT_NULL`, which is a bare `not null` column), `ASSERT_RANGE`, `ASSERT_FORMAT`, `ASSERT_ENUM`, `ASSERT_DATA_TYPE`, `ASSERT_ARRAY` — there is **no `ASSERT_UNIQUE`**, since that annotation compiles to a DB unique index. Only hand-write handlers for rules with no annotation equivalent

### TypeScript (backend — srv/ and db/)

> `app/` is TypeScript too — see **SAPUI5** for its (different) tooling. These rules are backend-specific.

- `strict: true` (all sub-flags). No `any`, ever. Entity imports from `#cds-models/com/lifeos/{module}` (the planner: `#cds-models/com/financialplanner`). Handler registration passes entity references, not strings
- **Every code file is imports + one class** — no top-level functions, arrow consts, loose consts or statements; a process entry goes in a `static {}` block. Exempt: `types.ts`, `constants.ts`, `*.d.ts`, `*.config.ts`, tests, and only two UI5 shapes — `app/**/ext/*.ts` action handlers and `formatter.ts` may `export default {…}`. `no-restricted-syntax`
- **A code file holds ≤300 lines** (blank and comment lines not counted); past that it holds more than one job — split it by job, not by line count. Tests, `types.ts` and `constants.ts` are exempt. `max-lines`
- **Never the `function` keyword** — class methods, or arrows inside them. Tests included. `no-restricted-syntax`
- **Named types → `{domain}/types.ts`.** No named `interface`/`type` beside a class — exported or file-private. Anonymous inline shapes are exempt. `lint:domain-types`
- **Constants → grouped `as const` objects in a `constants.ts`**, imported by namespace (`ALERTS.TYPE.STALE_DATA`), never beside a class. Cross-module/generic → `shared/constants.ts`; domain-scoped → `{domain}/constants.ts`. `lint:grouped-constants` fires at ≥3 loose literals. Frontend variant — any SCREAMING_SNAKE object/array-literal map lives in the app's `constants.ts`, never beside a formatter/controller; scalar one-offs and camelCase subjects (`formatter`, `navConfig`) stay put. `lint:frontend-constants`
- **Identifier length ≥3 letters** (only `i` and `id` exempt; object keys exempt — CAP's `ID`, external payload keys). `id-length`
- **Method names = verb + object** (`_fetchAccounts` not `_fetch`). Exempt: framework lifecycle names (`init`, `onInit`, `render`) and interface methods named for the class itself (`DedupService.evaluate`)
- **Method ordering**: visibility (public → `_`private at bottom) → importance → alphabetical
- **No divider comments anywhere** (`// ---`, `/* === */`, `// ─── X ───`); order the code instead. CSS and `.properties` are exempt. `lint:comment-length`
- **CDS models live in `db/{domain}/` folders** (`schema.cds` per domain, shared aspects and enums in `db/common/`); nothing sits at the `db/` root. `lint:filenames`
- **JSDoc** documents every `@param` and `@returns`, types omitted (the signature is the source of truth). `eslint-plugin-jsdoc`
- **Comment prose: inline `//` ≤3 lines, JSDoc ≤5** (`@param`/`@returns`/tags and delimiters exempt). A long description is the tell it's restating _what_ — cut to the _why_. `lint:comment-length`

### Handler Pattern — 4 Files (+ Mapper when translating shapes)

| Layer       | File                     | Does                                          | Calls                          |
| ----------- | ------------------------ | --------------------------------------------- | ------------------------------ |
| Facade      | `{Domain}Facade.ts`      | Handler registration + `wrapHandler`          | Service                        |
| Service     | `{Domain}Service.ts`     | Business logic, orchestration                 | Validator, DataService, Mapper |
| DataService | `{Domain}DataService.ts` | All CDS SELECT/INSERT/UPDATE/DELETE queries   | Nothing                        |
| Validator   | `{Domain}Validator.ts`   | Input validation, `req.error()` accumulation  | Nothing                        |
| Mapper      | `{Domain}Mapper.ts`      | Pure shape translation (payload→row, row→DTO) | Nothing                        |

- **Facades** are pure wiring: NO `if`/`for`/`while`, `try`/`catch`, CQL, or data access. `lint:facades` (`baseFacade.ts` exempt — it _implements_ `wrapHandler`). Each handler is a private `_handle{Action}{Entity}` one-liner delegating to the Service. `wrapHandler` takes a function reference: `this.wrapHandler(this._handleXxx, 'event', 'Entity', 'error.i18n.key')`
- **Services** hold logic but NO direct CQL — all DB access via DataService. **DataService** is pure data access (no logic, no `req.error()`/`req.reject()`). CQL statements are directly awaitable — never `cds.run()`
- **Mapper — the judgment call:** any method that's a lone `return {…}` building an object by reading fields off a _foreign_ source shape (external payload → insert row, row → DTO, row → engine candidate) belongs in a stateless `{Domain}Mapper.ts` (static, no deps), not inline in the Service. Add the file only when such mapping exists. Boundary: a **scalar** converter (epoch→ISO) is a _utility_, not a mapper; assembling an insert payload from locally-computed values (not translating a foreign shape) may stay in the Service. `lint:mapper-methods` (flags `return {≥4 mapped fields}` in any `*Service.ts`)
- Private methods: `_` prefix, bottom of class

### Error Handling

- `req.error({ code, message, target, status: 400 })` — Validator, accumulates
- `req.reject(status, message)` — Service/Facade, fatal (404/409/500/502)
- Always i18n keys via `MessagingUtility` — never hardcoded strings

### Logging

- `Logger` class wrapping `cds.log()`, structured JSON. Correlation ID from `req.id`. Dual output: `logs/app.log` + `logs/error.log`
- Never log secrets or decrypted fields (the planner's card numbers, CVV, access URLs). `_redact()` before any DEBUG-level `req.data` logging

### i18n — Three Tiers

| Tier             | File                                     | Key Format       |
| ---------------- | ---------------------------------------- | ---------------- |
| CDS labels       | `srv/_i18n/i18n.properties`              | `PascalCase`     |
| Runtime messages | `srv/_i18n/messages.properties`          | `camelCase.dots` |
| UI5 app messages | `app/{name}/webapp/i18n/i18n.properties` | `camelCase`      |

### SAPUI5 (app/ — TypeScript, transpiled to AMD)

Authored in TypeScript, transpiled to classic `sap.ui.define` AMD at serve/build by `ui5-tooling-transpile` (Babel) via `cds-plugin-ui5`. Runtime UI5 loads from the CDN pinned in `app/index.html`. Mechanics: memory `reference_ui5_typescript_toolchain` (Life OS memory folder, outside the repo).

- **`@namespace` JSDoc is MANDATORY on every UI5 class** (`@namespace com.financialplanner.shell.controller` on `class App`) — without it the transpiler emits a native ES class UI5 can't instantiate. Object-literal modules (formatters, config maps) don't need it
- **Per-app tooling:** every UI5 app folder needs its own `package.json` (name + `ui5-tooling-transpile` in `devDependencies` and `ui5.dependencies`), `ui5.yaml` (transpile task+middleware + `customConfiguration.cds-plugin-ui5.mountPath` pinned to the `index.html` resourceRoot), and `tsconfig.json` (activates TS mode). Shared library `app/shared/` is served at `/shared`
- **ES-module + ES-class syntax** (`import Controller from "sap/ui/core/mvc/Controller"; export default class Foo extends Controller`), `super.init()` not `Base.prototype.init.apply(…)`. **XML views only.** All freestyle controllers extend `BaseController.ts`; extensions are `{ViewType}Ext.controller.ts`; annotations are entity-based files in `app/{name}/annotations/`
- **No code lives outside a class in a controller/extension.** Two distinct FE surfaces: (1) a _lifecycle_ extension is a `ControllerExtension` with `static overrides`, registered under `sap.ui5.extends.extensions.sap.ui.controllerExtensions` and `export default class` (mirror the planner's `ObjectPageExt.controller.ts`) and is **wiring, like a Facade** — no `if`/`for`/`while`/`switch`/`try` in it; each hook delegates to a plain logic class QUnit can test, because a `ControllerExtension` cannot be unit-tested in isolation (`Standards (Documents)/research/README.md` R4); (2) a _custom-action handler_ follows SAP's documented shape — a **plain object module** of handlers (`export default { onSplit(this: ExtensionAPI) {…} }`), manifest `press` is dotted `module.method`, FE binds each to the page ExtensionAPI. Name it by role, not `Ext` (e.g. `TransactionsListActions.ts`), and keep it thin: it delegates to **logic classes** (`CategorizationActions.ts`, `SplitActions.ts`, with the pure split rules in `SplitTerms.ts`) that hold every operation, the split state, and the shared helpers. The handler needs no view — the ExtensionAPI supplies `getSelectedContexts()`, `getModel()` (default + `"i18n"`), and `loadFragment()`; never scan the control registry. Cross-cutting behaviour goes through a shared helper class — `DialogManager` for dialogs (constructed from a Controller _or_ an ExtensionAPI; `open(name, handler)`/`openWithModel(name, model, data, handler)` route fragment buttons to the logic class), `Messaging` for messages, `formatter.toNumber` for coercion — never re-hand-rolled. `lint:frontend-controller-shape` governs `*.controller.ts` (must `export default class`) and every `.ts` directly in an `ext/` folder (no free functions/module state; the SAP object surface is allowed), and fails control flow in any `ControllerExtension`
- **Custom controls** use `@ui5/ts-interface-generator` — author the class, run the generator, paste the constructor-overload block into `<Control>.gen.d.ts` (lint-ignored)
- **FE building blocks in freestyle views:** `sap.fe.macros` valid attributes (`key`, `metaPath`, `contextPath`) trip the `iljapostnovs.ui5plugin` `TagAttributeLinter`. Exempt the whole view by adding its FQ class to `ui5.ui5linter.xmlClassExceptions` in the module's `package.json` (editor-only, not the npm `lint` suite); file is exempted wholesale, so keep such views macros-focused. Reload the VS Code window after
- **No default attributes:** `visible="true"`/`enabled="true"` are always redundant, and `layout="ResponsiveGridLayout"` is the `SimpleForm` default (`lint:default-attrs`). Control-specific defaults differ — `SimpleForm` `editable` and `Panel` `expanded` default to `false`, so setting those `true` is required. In a manifest, never `horizontalAlign` an annotation-backed (`DataField…::`) column — FE aligns it by Edm type; custom columns may (`lint:default-attrs`)
- **Annotation UX (Fiori Elements):**
  - Combine related fields into one column via `@Common: { Text, TextArrangement: #TextLast }` (shortName + name → "AMEX (American Express)")
  - Every `LineItem` entry needs `![@HTML5.CssDefaults]: {width: 'X%'}`; widths total 100%
  - Every ListReport entity needs `SelectionFields` — filter order matches column order, hidden column = hidden filter
  - `SelectionFields`, `LineItem`, `FieldGroup` reference the **FK** (`issuer_ID`), never the nav path — `@Common.Text` handles display; nav paths in `LineItem` duplicate the Settings column picker. Adapt Filters and Settings columns show the same fields
  - Technical fields (`ID`, `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`) always `@UI.Hidden`
  - Every entity needs `PresentationVariant` with `SortOrder` ascending on the first LineItem column and `Visualizations: ['@UI.LineItem']`
- **Use the base class, not the chain it wraps:** a controller calls `this.getModel()`/`this.setModel()`/`this.getRouter()`, never `this.getView().getModel()` or `this.getOwnerComponent().getRouter()` — `BaseController` and FE `PageController` both provide them. Logic two bases share goes in an `app/shared/util/` class (`Navigation`), not copied into each. `no-restricted-syntax` on `app/**/*.controller.ts`
- **Model over byId:** UI state (visibility, selectedKey, enabled) via JSON model + XML binding, not imperative `byId().setVisible()`. `byId` only for structural DOM ops (`addContent`, routers)
- **Shared helpers, not scattered API calls:** dialogs and imperative messaging go through the **Life OS shared UI5 library** (`Shared/app/`, namespace `com.lifeos.shared`, served at `/lifeos-shared` from each module's `lifeos-shared` devDependency) — `DialogManager` owns fragment loading (`open`, `openWithModel`, `close`) and reaching a dialog's model from an event (`readModel`); `Messaging` takes a Controller or an ExtensionAPI as-is (`new Messaging(this)` / `new Messaging(api)`, never a `{ getView }` stand-in) and its methods take i18n keys; `I18n.getText` is the one bundle lookup. Never import `MessageToast`/`MessageBox`/`MessagePopover` or `sap/ui/core/Fragment`, call `loadFragment`, or walk the tree for `"sap.m.Dialog"`. Module-specific helpers (`util/formatter`) stay in the module's `app/shared/`. `MessageStrip` in XML is fine. `lint:ui-helpers`
- **OData calls live in the model layer, never the view:** controllers and FE extensions (`controller/`, `ext/`) are V+C — they never fire a backend call. Every OData op goes in a per-app `model/{App}Service.ts` (plain class), built in `onInit` from the OData model and exposed as intent-named methods (`claimSetupToken(token, name)`, `syncNow(context)`). Covers `bindContext`/`bindList`, `.invoke()`, `.callFunction()`/`.submitBatch()`, `new ODataModel()`, V2 `read`/`create`/`update`/`remove`. JSON (UI-state) `getModel()` stays in the controller. Reference: the planner's `app/connection-manager/webapp/model/ConnectionService.ts`. `lint:frontend-data-access`
- **No Hungarian notation** (the type is in the signature) — plain names (`name`, `model`, `items`). Identifiers ≥3 letters (`id-length`; only `i`/`id` exempt)
- **Event handlers** match `^on.*?{ControlName}.*?{EventName}$` — the control class plus the capitalised event (`onButtonSyncNowPress`, `onSwitchActiveChange`). The plugin's meaning-first handler pattern is switched off (`eventNamingPattern: ""` in `Standards (Technical + Linting)/ui5plugin.json`). `lint:event-handlers`
- **Control IDs** match the ui5plugin rule `^id{Meaning}.*?{ClassName}$` — `{Meaning}` comes from the tag's first `content`/`items`/`value`/`text`/`number` attribute: an `{i18n>key}`'s PascalCased text, a binding path's last segment, or a literal (`text="{i18n>pageTitle}"` = "SimpleFIN Connection Manager" → `idSimpleFINConnectionManagerTitle`). `lint:control-ids`
- Private members `_` prefix at bottom. Keep imports lean (a class with many imports is a refactor smell)

### Encryption

- A module that stores secrets encrypts them AES-256-GCM through one `EncryptionUtility.ts` (`encrypt(plaintext)` / `decrypt(stored)`); no raw `crypto` calls outside it. The key lives in the module's gitignored `.env`. Which fields are encrypted is a module decision — see the module's `CLAUDE.md` §Encryption (Project Tracker encrypts nothing)

## Test Rules

- **TDD:** Red-Green-Refactor for Validators, Services, Utilities, ENH engines, and the UI5 unit tier (QUnit on logic classes, `model/` services, formatters, controls). OPA5 journeys and E2E specs are written after the page renders — a journey cannot go red for the right reason before its stable IDs exist (Financial Planner D-330, Project Tracker D-264)
- **Framework:** Jest + ts-jest (backend); QUnit 2 + OPA5 via `ui5-test-runner` 5.14.2 (frontend, inside `npm test`); Playwright (e2e, sprint boundary). Evidence: `Standards (Documents)/research/`
- **UI5 is a build gate, not a learning exercise** (2026-11-04): every app in every module is tested with enforced thresholds. The leg is `npm run test:ui5`, chained after Jest as `posttest`. `Standards (Technical + Linting)/scripts/runUi5Gate.ts` runs `ui5-test-runner` from the module's `ui5-test-runner.json` against a runner-spawned `cds-serve`, then checks each `--row "<glob>:<lines>:<branches>"`. Coverage comes from a per-app `ui5-test.yaml` (`ui5.yaml` + transpile `coverage`). `scanUi5Coverage.cjs` counts files no test loads. Executed and proven to fail on a missed threshold (Financial Planner D-331). A module's leg lands with its first `app/` source
- **UI5 unit tier:** `*.qunit.ts`, one logic class at a time — formatters, `app/shared/util/`, custom controls, `model/{App}Service.ts`, freestyle controller logic, FE logic classes. No backend. Never FE/UI5 framework behaviour
- **UI5 journey tier:** OPA5 against `cds-serve` in the `[development]` profile (in-memory SQLite). `sap.fe.test` page objects for ListReport/ObjectPage; **plain OPA5 page objects for FPM custom pages** (no `sap.fe.test` object exists) and freestyle. Every FE app gets **≥1 contract journey** — its annotation-declared columns, filters, actions and extensions render as declared (contract, like `@assert.range`); FE's own sorting, paging, drafts and variants are the framework and never asserted. A module launches its journeys through its own shell; a module that does not own the shell starts its component directly, so no gate boots another module
- **UI5 test layout** (`lint:test-structure`): per app, `app/<app>/webapp/test/` (Test Starter; `app/<app>/test/` for an app with no `webapp/`). `testsuite.qunit.ts` sits at its root, `*.qunit.ts` specs under `unit/` or `integration/`, page objects in `integration/pages/`, fixtures in `data/`, builders in `support/`. Data never lives in `support/`. Shared page objects go in `app/shared/test/`. The test-data and one-line-JSDoc rules apply to every `*.qunit.ts` and `*.e2e.ts` (`lint:test-data`). QUnit globals come from `/// <reference types="qunit" />` atop each spec. The runtime is QUnit **2.3.2**, so `assert.rejects` does not exist, though the newer `@sapui5/types` offer it (Financial Planner D-334)
- **Browser FUTs:** a FUT observable under SQLite also gets a journey (no FUT ID in its title — `lint:tracking-ids`); a FUT that depends on Postgres or crosses modules gets a **Playwright e2e** spec under `test/e2e/<area>/{data,support,tests}/*.e2e.ts`, run at the sprint checkpoint against Postgres and `serveOneOrigin.mjs`. `/functional-test` still runs the story's FUTs and probes
- **Unit tests:** No DB, mocked CDS. Validators fully tested (pure). Services tested with CDS mocked + real Validator
- **Integration tests:** `cds.test()` + SQLite, one file per CDS service. Never test CAP CRUD/draft machinery or `@readonly` enforcement. DO test annotation-based constraints (`@assert.unique` — **entity level**; `@mandatory`; `@assert.range`) as contract documentation, plus custom handler logic. ~~cross-field `@assert`~~ — **that annotation does not exist at the pinned `@sap/cds` 9.8.4 and fires nothing** (Project Tracker D-171), so a cross-field rule is a **handler** and is tested as logic, never asserted as a contract. There is also no `ASSERT_UNIQUE` key — `@assert.unique` compiles to a DB unique index, so assert on the rejection, not on a CAP code
- **Test tree — `{test-type}/{module}/{data,support,tests}`** (`lint:test-structure`): every test file lives in one of three role folders under its module — `data/` (fixtures + factories), `support/` (mocks/harness/seed _builders_ — functions only), `tests/` (the `*.test.ts` specs). Modules mirror `srv/modules/` (the ingestion domain is named **`ingestion`**, not `integration`, to avoid colliding with the integration test type). Cross-cutting fixtures/builders shared across modules _or_ across the unit↔integration boundary live in top-level **`test/shared/{data,support}`**. **Data never lives in `support/`** — an exported object/array fixture in a `support/` file is a violation; move it to the sibling `data/` folder
- **Test data:** hybrid factories + named constants (UPPER_SNAKE_CASE) in a `data/` folder. Semantic names, no real card numbers
- **Readable test files** (`lint:test-data`; `data/` + `support/` folders exempt): a `*.test.ts` is imports + arrange-act-assert, nothing else. Every payload and UUID is a named constant from a `data/` folder (never inline, never re-declared when a canonical constant exists); builders (`buildXxxMocks`, `seedXxx`, HTTP stubs) live in `support/`. Assertions may hold inline expected values
- **No CQL in specs** (`lint:test-cql`): a `*.test.ts` never issues DB access directly — every `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`UPSERT` (and `cds.run`/`cds.ql`) lives in a named `support/` helper (`seedXxx`, `readXxxById`, `mapXxxToYyy`) the spec calls. Query/seed helpers return typed row shapes so the AAA body stays free of inline CQL and row-type annotations
- **Functional Test evidence — `integration/scenarios/`** (TEST_STRATEGY.md §6.4): a story that ships **no UI** still runs methodology stage 4. "No browser" is not "cannot be executed" — it executes every FUT here, at that story's outermost caller-facing surface (an MCP tool call, a service action, a CLI entry point), **one spec per FUT with the FUT identifier in the title**. The identifiers live in the sibling `data/` folder because `lint:tracking-ids` bans them everywhere else under `test/`. This tier **knowingly re-asserts** what the unit and integration tiers cover — the exception exists because the "outermost tier, once" rule assumed a browser tier was there to be outermost. Proven on Project Tracker `INT-001` only (D-238); shape settled, vocabulary provisional
- **One-line JSDoc per test** (`lint:test-data`): every `it`/`test` gets a `/** … */` one-liner stating the **why** (the rule it protects, what breaks) — not a paraphrase of the title
- **Coverage targets:** Validators/Utilities 100%/100%, Services 90%/85%, Overall 85%/80%. Facades excluded (zero logic by design). **UI5, a separate gate (no merge with Jest):** `app/shared/util/**` incl. `formatter.ts` 100%/100%, `Shared/app/**` (the Life OS UI5 helpers, gated through each consuming module's `--row "../Shared/app/**:100:100"`) 100%/100%, `app/**` overall 85%/80%; thin `ext/` handler modules, `ControllerExtension`s and `*.gen.d.ts` excluded — journeys prove them, as integration proves Facades

## Git Workflow

- **Branch:** `sprint/W{wave}-S{sprint}` off `main`
- **Commits:** `type(scope): description` — Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). FRICEW IDs in body, `Co-Authored-By` on agent commits
- **Merge:** `--no-ff` at sprint checkpoint. **Tags:** `v{wave}.{sprint}` annotated, `v1.0.0` at go-live

## Frontend Validation

- **Playwright MCP** (`.mcp.json` at the Life OS root) validates all frontend work — after UI changes, navigate, screenshot, and verify rendering before marking done
- `browser_evaluate` to inspect DOM/CSS variables/computed styles; `browser_snapshot` + `browser_click` for interaction
- Local dev server: `npx cds watch` (Postgres per the `cds` block in `package.json`) at `http://localhost:4004`. Shell app: `http://localhost:4004/index.html` (Financial Planner; Project Tracker has no UI until SPEC-04)

## Do NOT

- Add features beyond the functional spec
- Skip TDD — write failing tests before implementation
- Hardcode user-facing strings — always i18n keys. In CDS annotations use `'{i18n>Key}'` for all TypeName, TypeNamePlural, Label, and Facet Label values
- Put logic in Facades — pure wiring
- Use `any`; log secrets or decrypted data; use `!important` in CSS overrides
- Duplicate information already in design docs — reference it
- Comment the _what_ — comment the _why_ (rationale, gotchas, invariants); inline ≤3 lines, JSDoc ≤5 (`.ts`/`.js`/`.cds`, `lint:comment-length`)
- Explain CAP framework behaviour in a comment, not even one clause — state the project reason only; CAP gotchas go in `.claude/agent-memory/implementer/cap_runtime_gotchas.md`
- Use FRICEW IDs (FRM-xxx, RPT-xxx) in source code — semantic names only; FRICEW IDs belong in design docs and commit bodies
- Commit `.env`, `logs/`, `node_modules/`, `gen/`
