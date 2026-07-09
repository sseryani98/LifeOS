# Financial Planner — Build Phase

## What This Is

Personal financial management system for a Canadian credit card churner. TypeScript + SAP CAP + SAPUI5 + PostgreSQL. Single user, local deployment.

## Current Sprint

<!-- Updated each sprint -->

**Sprint:** W1-S2 — Ingestion Pipeline
**Branch:** sprint/W1-S2
**Goal:** Transactions flow from SimpleFIN and CSV into the system. Connection health visible.
**Stories:** ENH-008, INT-001, INT-002, FRM-003, FRM-010

## Architecture

- **Backend:** CAP with @cap-js/postgres — 4 CDS services (Transaction, Churning, Budget, Admin)
- **Frontend:** SAPUI5 1.136.16 in **TypeScript** (transpiled to AMD via `ui5-tooling-transpile` + `cds-plugin-ui5`) — Fiori Elements for CRUD (8 apps), Freestyle for dashboards/wizards (14 apps)
- **API:** OData V4 auto-generated from CDS
- **Theme:** sap_horizon + custom overrides in `app/shared/css/theme-overrides.css`
- **Background jobs:** node-cron inside CAP process via `cds.spawn()`

## Folder Structure

```

db/                          CDS entity models (9 domain folders)
  enums.cds                  All enum types
  common/                    Shared aspects
  reference/schema.cds       16 reference entities
  cards/schema.cds           7 card entities
  transactions/schema.cds    5 transaction entities
  points/schema.cds          2 points entities
  budget/schema.cds          4 budget entities
  financial/schema.cds       2 financial entities
  integration/schema.cds     2 integration entities
  alerts/schema.cds          1 alert entity
  seed/                      CSV seed data (CNV-002, CNV-003)
srv/
  {service-name}.cds         CDS service definitions (4 services)
  {service-name}.ts          Service entry points
  _i18n/
    i18n.properties          CDS field labels (PascalCase keys)
    messages.properties      Runtime messages (camelCase.dots keys)
  modules/
    shared/                  baseFacade, baseService, logger, messagingUtility, constants
    {domain}/                Per-domain: {domain}Facade.ts, {domain}Service.ts, {domain}DataService.ts, {domain}Validator.ts (+ {domain}Mapper.ts when translating shapes)
    ingestion/               SimpleFIN, CSV, Scheduling, Dedup services (the ingestion domain)
  util/                      encryptionUtility, dateTimeUtility, currencyUtility
app/
  shared/                    BaseController.ts, controls/, util/formatter.ts, css/theme-overrides.css (transpiled UI5 lib, served at /shared)
  {app-name}/                One folder per UI app (23 total)
    package.json ui5.yaml tsconfig.json   per-app UI5 tooling (transpile config)
    webapp/                  manifest.json, Component.ts, i18n/, ext/ or views/
    annotations/             Entity-based CDS annotation files (Fiori Elements apps only)
test/
  shared/{data,support}/     Cross-cutting fixtures + builders (used across modules or test types)
  unit/{module}/             Per-module unit area, each split into:
    data/                    Fixtures + factories used only by this module's unit tests
    support/                 Mocks/harness builders (buildXxxMocks) — functions, never fixtures
    tests/                   The *.test.ts specs
  integration/{module}/      Same data/support/tests split, per CDS service / domain
  integration/scenarios/     FUT multi-step scenario tests
                             ({module}: ingestion=CSV/SimpleFIN/Scheduling/Dedup, shared=utilities, admin, …)
project/
  SPRINT_BOARD.md            Current sprint status
  DEFECT_LOG.md              Running defect log
  sprints/                   Sprint checkpoint reports

```

## Coding Patterns

> Full rationale and examples for the standards below live in [TECHNICAL_STANDARDS.md](design/TECHNICAL_STANDARDS.md). This file carries the trigger + carve-outs + lint gate; lint-enforced rules name their `lint:*` script so you aim right on the first pass rather than round-tripping through a lint failure.

### CDS

- **Entities:** PascalCase singular. **Fields:** camelCase. **FKs:** CAP auto-generated (`cardInstance_ID`). **Namespace:** `com.financialplanner`. One `schema.cds` per domain folder under `db/`
- **Code lists for dropdowns:** finite value set needing dropdown UX → a `CodeList` entity + Association, NOT a `String enum` (enums don't render dropdowns in Fiori Elements V4). Annotate `@Common: { Text, TextArrangement: #TextOnly, ValueListWithFixedValues }`, reference the FK (`xxx_code`) in UI, hide raw codes via `@UI.Hidden`, name the field `xxxType` not `xxxName`
- **Association ValueHelp** (two parts): (1) target entity's `ID` field gets `@Common: { Text: name, TextArrangement: #TextOnly }` so dropdowns show names not UUIDs; (2) the **association** (not the auto-generated FK) gets `@Common: { Text: assoc.name, TextArrangement: #TextOnly, ValueList: {…} }`. `ValueListWithFixedValues` if <25 rows. ValueList `DisplayOnly` columns must match the target's ListReport
- **Annotations over code:** reach for a CAP built-in before writing a handler — `@assert.unique`, `@assert.range`, `@assert.format`, `@readonly`, `@mandatory`, `@assert: (case when … then …)` for cross-field, `@flow.status` + `@from`/`@to` for state machines. Only hand-write handlers for rules with no annotation equivalent

### TypeScript (backend — srv/ and db/)

> `app/` is TypeScript too — see **SAPUI5** for its (different) tooling. These rules are backend-specific.

- `strict: true` (all sub-flags). No `any`, ever. Entity imports from `#cds-models/com/financialplanner`. Handler registration passes entity references, not strings
- **Named types → `{domain}/types.ts`.** A file that declares a class holds NO named `interface`/`type` beside it — exported or file-private, it moves to the domain's `types.ts`. In non-class modules, file-private types may stay local; exported types still belong in `types.ts`. Anonymous inline shapes are always exempt. `lint:domain-types`
- **Constants → grouped `as const` objects**, imported by namespace (`ALERTS.TYPE.STALE_DATA`), never a wall of loose `const`s. Placement: cross-module/generic → `shared/constants.ts`; domain-scoped → `{domain}/constants.ts`; private to one file → local `as const` at top. Derived single-use values (a `join()` path) may stay loose. `lint:grouped-constants` fires at ≥3 loose literals. Frontend variant — any SCREAMING_SNAKE object/array-literal map lives in the app's `constants.ts`, never beside a formatter/controller; scalar one-offs and camelCase subjects (`formatter`, `navConfig`) stay put. `lint:frontend-constants`
- **Identifier length ≥3 letters** (only `i` and `id` exempt; object keys exempt — CAP's `ID`, external payload keys). `id-length`
- **Method names = verb + object** (`_fetchAccounts` not `_fetch`). Exempt: framework lifecycle names (`init`, `onInit`, `render`) and interface methods named for the class itself (`DedupService.evaluate`)
- **Method ordering** (no section-divider comments): visibility (public → `_`private at bottom) → importance → alphabetical
- **JSDoc** documents every `@param` and `@returns`, types omitted (the signature is the source of truth). `eslint-plugin-jsdoc`
- **Comment prose ≤5 lines** (`@param`/`@returns`/tags and delimiters exempt). A long description is the tell it's restating *what* — cut to the *why*. `lint:comment-length`

### Handler Pattern — 4 Files (+ Mapper when translating shapes)

| Layer       | File                     | Does                                          | Calls                          |
| ----------- | ------------------------ | --------------------------------------------- | ------------------------------ |
| Facade      | `{Domain}Facade.ts`      | Handler registration + `wrapHandler`          | Service                        |
| Service     | `{Domain}Service.ts`     | Business logic, orchestration                 | Validator, DataService, Mapper |
| DataService | `{Domain}DataService.ts` | All CDS SELECT/INSERT/UPDATE/DELETE queries   | Nothing                        |
| Validator   | `{Domain}Validator.ts`   | Input validation, `req.error()` accumulation  | Nothing                        |
| Mapper      | `{Domain}Mapper.ts`      | Pure shape translation (payload→row, row→DTO) | Nothing                        |

- **Facades** are pure wiring: NO `if`/`for`/`while`, `try`/`catch`, CQL, or data access (ESLint). Each handler is a private `_handle{Action}{Entity}` one-liner delegating to the Service. `wrapHandler` takes a function reference: `this.wrapHandler(this._handleXxx, 'event', 'Entity', 'error.i18n.key')`
- **Services** hold logic but NO direct CQL — all DB access via DataService. **DataService** is pure data access (no logic, no `req.error()`/`req.reject()`). CQL statements are directly awaitable — never `cds.run()`
- **Mapper — the judgment call:** any method that's a lone `return {…}` building an object by reading fields off a *foreign* source shape (external payload → insert row, row → DTO, row → engine candidate) belongs in a stateless `{Domain}Mapper.ts` (static, no deps), not inline in the Service. Add the file only when such mapping exists. Boundary: a **scalar** converter (epoch→ISO) is a *utility*, not a mapper; assembling an insert payload from locally-computed values (not translating a foreign shape) may stay in the Service. `lint:mapper-methods` (flags `return {≥4 mapped fields}` in any `*Service.ts`)
- Private methods: `_` prefix, bottom of class

### Error Handling

- `req.error({ code, message, target, status: 400 })` — Validator, accumulates
- `req.reject(status, message)` — Service/Facade, fatal (404/409/500/502)
- Always i18n keys via `MessagingUtility` — never hardcoded strings

### Logging

- `Logger` class wrapping `cds.log()`, structured JSON. Correlation ID from `req.id`. Dual output: `logs/app.log` + `logs/error.log`
- Never log decrypted card numbers, CVV, access URLs. `_redact()` before any DEBUG-level `req.data` logging

### i18n — Three Tiers

| Tier             | File                                     | Key Format       |
| ---------------- | ---------------------------------------- | ---------------- |
| CDS labels       | `srv/_i18n/i18n.properties`              | `PascalCase`     |
| Runtime messages | `srv/_i18n/messages.properties`          | `camelCase.dots` |
| UI5 app messages | `app/{name}/webapp/i18n/i18n.properties` | `camelCase`      |

### SAPUI5 (app/ — TypeScript, transpiled to AMD)

Authored in TypeScript, transpiled to classic `sap.ui.define` AMD at serve/build by `ui5-tooling-transpile` (Babel) via `cds-plugin-ui5`. Runtime UI5 loads from the CDN pinned in `app/index.html`. Mechanics: [reference_ui5_typescript_toolchain](../../memory).

- **`@namespace` JSDoc is MANDATORY on every UI5 class** (`@namespace com.financialplanner.shell.controller` on `class App`) — without it the transpiler emits a native ES class UI5 can't instantiate. Object-literal modules (formatters, config maps) don't need it
- **Per-app tooling:** every UI5 app folder needs its own `package.json` (name + `ui5-tooling-transpile` in `devDependencies` and `ui5.dependencies`), `ui5.yaml` (transpile task+middleware + `customConfiguration.cds-plugin-ui5.mountPath` pinned to the `index.html` resourceRoot), and `tsconfig.json` (activates TS mode). Shared library `app/shared/` is served at `/shared`
- **ES-module + ES-class syntax** (`import Controller from "sap/ui/core/mvc/Controller"; export default class Foo extends Controller`), `super.init()` not `Base.prototype.init.apply(…)`. **XML views only.** All freestyle controllers extend `BaseController.ts`; extensions are `{ViewType}Ext.controller.ts`; annotations are entity-based files in `app/{name}/annotations/`
- **Custom controls** use `@ui5/ts-interface-generator` — author the class, run the generator, paste the constructor-overload block into `<Control>.gen.d.ts` (lint-ignored)
- **FE building blocks in freestyle views:** `sap.fe.macros` valid attributes (`key`, `metaPath`, `contextPath`) trip the `iljapostnovs.ui5plugin` `TagAttributeLinter`. Exempt the whole view by adding its FQ class to `ui5.ui5linter.xmlClassExceptions` in root `package.json` (editor-only, not the npm `lint` suite); file is exempted wholesale, so keep such views macros-focused. Reload the VS Code window after
- **No default attributes:** `visible="true"`/`enabled="true"` are always redundant (`lint:default-attrs`). Control-specific defaults differ — `SimpleForm` `editable` and `Panel` `expanded` default to `false`, so setting those `true` is required
- **Annotation UX (Fiori Elements):**
  - Combine related fields into one column via `@Common: { Text, TextArrangement: #TextLast }` (shortName + name → "AMEX (American Express)")
  - Every `LineItem` entry needs `![@HTML5.CssDefaults]: {width: 'X%'}`; widths total 100%
  - Every ListReport entity needs `SelectionFields` — filter order matches column order, hidden column = hidden filter
  - `SelectionFields`, `LineItem`, `FieldGroup` reference the **FK** (`issuer_ID`), never the nav path — `@Common.Text` handles display; nav paths in `LineItem` duplicate the Settings column picker. Adapt Filters and Settings columns show the same fields
  - Technical fields (`ID`, `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`) always `@UI.Hidden`
  - Every entity needs `PresentationVariant` with `SortOrder` ascending on the first LineItem column and `Visualizations: ['@UI.LineItem']`
- **Model over byId:** UI state (visibility, selectedKey, enabled) via JSON model + XML binding, not imperative `byId().setVisible()`. `byId` only for structural DOM ops (`addContent`, routers)
- **Shared helpers, not scattered API calls:** cross-cutting UI concerns go through an `app/shared/` helper held as a controller field — `DialogManager` (lazy dialogs), `util/formatter`, `Messaging` (all imperative messaging). Never import `MessageToast`/`MessageBox`/`MessagePopover`; declare `private readonly _messages = new Messaging(this)` and call `this._messages.showToast("i18nKey")`/`.showError`/`.showWarning`/`.showSuccess`/`.showConfirm` (methods take i18n keys). `MessageStrip` in XML is fine. `lint:messaging`
- **OData calls live in the model layer, never the view:** controllers and FE extensions (`controller/`, `ext/`) are V+C — they never fire a backend call. Every OData op goes in a per-app `model/{App}Service.ts` (plain class), built in `onInit` from the OData model and exposed as intent-named methods (`claimSetupToken(token, name)`, `syncNow(context)`). Covers `bindContext`/`bindList`, `.invoke()`, `.callFunction()`/`.submitBatch()`, `new ODataModel()`, V2 `read`/`create`/`update`/`remove`. JSON (UI-state) `getModel()` stays in the controller. Reference: `app/connection-manager/webapp/model/ConnectionService.ts`. `lint:frontend-data-access`
- **No Hungarian notation** (the type is in the signature) — plain names (`name`, `model`, `items`). Identifiers ≥3 letters (`id-length`; only `i`/`id` exempt)
- **Event handlers** match the ui5plugin shape `^on{Meaning}{ControlName}…{EventName}$` — `{ControlName}` is the control class, `{EventName}` the capitalised event (`onButtonSyncNowPress`, `onSwitchActiveChange`). The `{Meaning}` prefix is derived by the plugin from the control's first bound value and enforced in-editor; `lint:event-handlers` enforces the stable shape (control name present + capitalised event suffix) in CI
- **Control IDs** match `^id.*?<ClassName>$` — start with `id`, end with the control class (`idNavBackButton`, `idAccountsTable`). `lint:control-ids`
- Private members `_` prefix at bottom. Keep imports lean (a class with many imports is a refactor smell)

### Encryption

- AES-256-GCM via `EncryptionUtility.ts` — `encrypt(plaintext)` / `decrypt(stored)`
- 4 encrypted fields: `card_number_enc`, `cvv_enc`, `expiry_date_enc`, `access_url_enc`. Key in `.env` as `ENCRYPTION_KEY` (gitignored). No raw `crypto` calls outside `EncryptionUtility`

## Test Rules

- **TDD:** Red-Green-Refactor for Validators, Services, Utilities, ENH engines
- **Framework:** Jest + ts-jest (backend), QUnit + OPA5 (frontend)
- **Unit tests:** No DB, mocked CDS. Validators fully tested (pure). Services tested with CDS mocked + real Validator
- **Integration tests:** `cds.test()` + SQLite, one file per CDS service. Never test CAP CRUD/draft machinery or `@readonly` enforcement. DO test annotation-based constraints (`@assert.unique`, `@mandatory`, `@assert.range`, cross-field `@assert`) as contract documentation, plus custom handler logic
- **Test tree — `{test-type}/{module}/{data,support,tests}`** (`lint:test-structure`): every test file lives in one of three role folders under its module — `data/` (fixtures + factories), `support/` (mocks/harness/seed *builders* — functions only), `tests/` (the `*.test.ts` specs). Modules mirror `srv/modules/` (the ingestion domain is named **`ingestion`**, not `integration`, to avoid colliding with the integration test type). Cross-cutting fixtures/builders shared across modules *or* across the unit↔integration boundary live in top-level **`test/shared/{data,support}`**. **Data never lives in `support/`** — an exported object/array fixture in a `support/` file is a violation; move it to the sibling `data/` folder
- **Test data:** hybrid factories + named constants (UPPER_SNAKE_CASE) in a `data/` folder. Semantic names, no real card numbers
- **Readable test files** (`lint:test-data`; `data/` + `support/` folders exempt): a `*.test.ts` is imports + arrange-act-assert, nothing else. Every payload and UUID is a named constant from a `data/` folder (never inline, never re-declared when a canonical constant exists); builders (`buildXxxMocks`, `seedXxx`, HTTP stubs) live in `support/`. Assertions may hold inline expected values
- **No CQL in specs** (`lint:test-cql`): a `*.test.ts` never issues DB access directly — every `SELECT`/`INSERT`/`UPDATE`/`DELETE`/`UPSERT` (and `cds.run`/`cds.ql`) lives in a named `support/` helper (`seedXxx`, `readXxxById`, `mapXxxToYyy`) the spec calls. Query/seed helpers return typed row shapes so the AAA body stays free of inline CQL and row-type annotations
- **One-line JSDoc per test** (`lint:test-data`): every `it`/`test` gets a `/** … */` one-liner stating the **why** (the rule it protects, what breaks) — not a paraphrase of the title
- **Coverage targets:** Validators/Utilities 100%/100%, Services 90%/85%, Overall 85%/80%. Facades excluded (zero logic by design)

## Git Workflow

- **Branch:** `sprint/W{wave}-S{sprint}` off `main`
- **Commits:** `type(scope): description` — Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`). FRICEW IDs in body, `Co-Authored-By` on agent commits
- **Merge:** `--no-ff` at sprint checkpoint. **Tags:** `v{wave}.{sprint}` annotated, `v1.0.0` at go-live

## Design References

Look up details here — do not duplicate:

| Topic                      | Document                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| Entity definitions         | [DATA_MODEL.md](design/DATA_MODEL.md)                             |
| Functional specs           | [design/specs/SPEC-{nn}-\*.md](design/specs/)                     |
| Business rules             | Spec §5 (Business Rules) per FRICEW object                        |
| Wave plan & FRICEW catalog | [BUSINESS_ARCHITECTURE.md](design/BUSINESS_ARCHITECTURE.md)       |
| Sprint plan & personas     | [PROJECT_MANAGEMENT.md](design/PROJECT_MANAGEMENT.md)             |
| Full coding standards      | [TECHNICAL_STANDARDS.md](design/TECHNICAL_STANDARDS.md)           |
| Test strategy details      | [TEST_STRATEGY.md](design/TEST_STRATEGY.md)                       |
| Design system              | [DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)                       |
| Theme overrides            | [THEME.md](design/THEME.md)                                       |
| Navigation & IA            | [INFORMATION_ARCHITECTURE.md](design/INFORMATION_ARCHITECTURE.md) |
| Cross-sprint contracts     | [BUILD_PLAN.md](design/BUILD_PLAN.md) §2                          |
| All decisions              | [DECISIONS_LOG.md](design/user-profile/DECISIONS_LOG.md)          |

## Frontend Validation

- **Playwright MCP** (`.mcp.json`) validates all frontend work — after UI changes, navigate, screenshot, and verify rendering before marking done
- `browser_evaluate` to inspect DOM/CSS variables/computed styles; `browser_snapshot` + `browser_click` for interaction
- Local dev server: `npx cds serve all --in-memory` at `http://localhost:4004`. Shell app: `http://localhost:4004/index.html`

## Do NOT

- Add features beyond the functional spec
- Skip TDD — write failing tests before implementation
- Hardcode user-facing strings — always i18n keys. In CDS annotations use `'{i18n>Key}'` for all TypeName, TypeNamePlural, Label, and Facet Label values
- Put logic in Facades — pure wiring
- Use `any`; log decrypted sensitive data; use `!important` in CSS overrides
- Duplicate information already in design docs — reference it
- Comment the *what* — comment the *why* (rationale, gotchas, invariants); prose ≤5 lines
- Use FRICEW IDs (FRM-xxx, RPT-xxx) in source code — semantic names only; FRICEW IDs belong in design docs and commit bodies
- Commit `.env`, `logs/`, `node_modules/`, `gen/`
