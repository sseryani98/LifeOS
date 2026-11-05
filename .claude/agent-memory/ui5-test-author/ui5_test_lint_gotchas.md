---
name: ui5-test-lint-gotchas
description: Which shared linters, tsconfig settings and runtime limits bite UI5 test files under app/**/test/, and the cheap legitimate dodges
metadata:
  type: reference
---

Measured 2026-11-04 on Financial Planner `app/transactions/webapp/test/` (the first UI5 test tree in the repo);
updated the same day when Sprint 2 story 1 landed the `app/**/test/**` ESLint block and the gate.

- **QUnit runtime is 2.3.2** (UI5 1.136.16, `qunit: { version: 2 }`; `"edge"` also maps to 2). **No `assert.rejects`**
  (added in 2.5), yet `tsc` accepts it, because `@sapui5/types` resolves to 1.150 with `@types/qunit` 2.5.4. Three
  smoke-run tests type-checked and then failed in the browser. Assert a rejection as
  `const outcome = await promise.then(() => "resolved", () => "rejected"); assert.strictEqual(outcome, "rejected");`
  Same trap for **`assert.true`/`assert.false`** (added in 2.11): use `assert.strictEqual(x, true)`.
- **`assert.true`/`assert.false` do not exist either** (added in QUnit 2.11); `tsc` accepts them. Use `assert.ok`/`strictEqual`.
- **`lint:messaging` scans test trees too**, and its import regex matches `import type` as well. To stub MessageToast or
  MessageBox, take the loaded module with a sync probe: `sap.ui.require("sap/m/MessageBox") as MessageBoxShape` (shape in
  `support/types.ts`). It is loaded because `Messaging` imports it. Example: FP `app/shared/test/support/sharedFakes.ts`.
- **Navigation stubs:** patch `History.getInstance().getPreviousHash` and `window.history.go` as own properties, and
  restore with `Reflect.deleteProperty`. A real `history.go(-1)` would navigate the test page away.
- **Mutating source for a red with `perl -pi`:** the sources are CRLF, so a pattern ending in `\n` silently misses.
  Use `\r?\n`, and check `git diff` shows the mutation before the run.
- **`lint:frontend-constants` flags any SCREAMING_SNAKE object/array const inside a `*.qunit.ts`**, even a fake. Move
  data to `data/constants.ts`. Name a local fake object in camelCase.
- **ESLint `app/**/test/**` block** (FP D-334): class-only, `no-magic-numbers`, `jsdoc/require-jsdoc` and
  `max-lines-per-function` are off; the `function` keyword ban stays. Top-level `QUnit.module`/`test` and module consts are fine.
- **Layout is linted** (`lint:test-structure`): `testsuite.qunit.ts` at the tree root only; `*.qunit.ts` under `unit/` or
  `integration/`; every other `.ts` under `data/`, `support/` or `integration/pages/`. A stray helper at the root fails.
- **`lint:test-data` scans every `*.qunit.ts`** (not `testsuite.qunit.ts`): each `QUnit.test`/`opaTest` needs a leading
  `/** why */`, and no raw UUID or weight-≥5 literal outside an assertion (`deepEqual`/`strictEqual`/`propEqual` count as assertions).
- **`lint:frontend-controller-shape` scans every `.ts` directly in any `ext/` folder** — a test mirror at
  `test/unit/ext/X.qunit.ts` fails it. Put unit tests flat in `test/unit/`.
- **`lint:frontend-constants` scans `app/**/test/`** — SCREAMING_SNAKE maps must sit in `test/data/constants.ts`, even inside `test/data/` (a `PARSED_FILE_RESULT` map in `data/rows.ts` failed). A fixture
  built from factories cannot move there without an import cycle — make it a `buildXxx()` function in the factory file.
- **Async controller handlers (`void this._x()`)**: settle with `setTimeout(0)`; a `FileReader` load lands later than one
  tick — poll (`waitUntil`). Row-press events: `{ getSource: () => ({ getBindingContext: () => uiModel.createBindingContext("/rows/0") }) }`
  gives a real Context synchronously (FP `csv-import-wizard/.../support/wizardFakes.ts`). Native drop: `new DataTransfer()` +
  `items.add(new File(...))` + `new DragEvent("drop", { dataTransfer, cancelable: true })` works in the headless runner.
- **`lint:domain-types` scans `app/**/test/`** — fake-shape interfaces go in `test/support/types.ts`.
- **`@typescript-eslint/naming-convention`** flags `{ beforeEach: …, afterEach: … }` hook objects (method-name verb
  list). Use nested modules: `QUnit.module("X", hooks => { hooks.beforeEach(…); QUnit.test(…) })`.
  The same rule rejects fake API names that are not verb-first (`invoke` on a V4 operation fake, `settleX`): build the
  literal without it and assign `operation.invoke = () => …` afterwards (FP `transactions/.../support/odataModelFakes.ts`).
  `requestObject`, `execute` and `suggest…` fail it too. **Check a host-fixed source method name against the verb
  regex** (`Standards (Technical + Linting)/eslint.config.mjs`, `methodVerbRegex`) before writing tests to it — D-028's
  `suggestRecurringSplit` failed and was renamed `findRecurringSplitSuggestion` mid-task; the rule is rename, not extend.
- **Never `prettier --write` the test tree, not even your own edited files** — the committed specs are not
  Prettier-clean (HEAD `TransactionActions.qunit.ts` fails `--check`), so a write reformats lines you did not author.
  `npm run lint` does not run Prettier; leave formatting by hand.
- **QUnit globals:** `/// <reference types="qunit" />` atop each `*.qunit.ts` (ruled per file, FP D-334 — the app
  `tsconfig.json` keeps `types: ["@sapui5/types"]` so production source cannot see them).
- **No `@types/sinon`**, and `sap/ui/thirdparty/sinon` is untyped. Stub by patching the collaborator's `prototype`
  and restoring in `afterEach` — works because plain classes keep methods on the prototype.
- **Running it:** `npm run test:ui5` from the module (spawns its own `cds-serve` on port 4104; ~15 s). Manual run:
  serve with `PORT=<free> npx cds-serve` and open
  `/<mountPath>/test/Test.qunit.html?testsuite=test-resources/<ns/path>/testsuite.qunit&test=unit/unitTests`.
  A manual run is reported as manual. A port-4004 server may already be Sandro's — never kill it.
  **The gate can hang after it finishes** (FP 2026-11-04, test-quality run with parallel authors): runner logs
  `Terminating start command` / `ERROR: The process "NNNN" not found`, `cds-serve` stays on 4104, npm never exits;
  `taskkill` is refused by the permission classifier. Never pipe it through `tail` (you see nothing until exit) —
  read `report-ui5/output.txt` (summary table) and `report-ui5/job.js` (per-test `result`) instead. `report-ui5/` is
  shared: check the run timestamp in `output.txt` before claiming it is yours.
- **Parallel authors collide on the gate** (test-quality run, 2026-11-04): every `npm run test:ui5` binds 4104 and writes
  `report-ui5/`, so a concurrent run fails `EADDRINUSE` or `BROWSER FAILED ... stderr.txt ENOENT` — not your tests. Never
  kill the other run. Isolated run: background `PORT=<free> CDS_PLUGIN_UI5_MODULES='{"<app>":{"configFile":"ui5-test.yaml"},"shared":{...}}' node ../node_modules/@sap/cds/bin/serve.js`
  from the module, then a scratch-dir `ui5-test-runner.json` (`url`, `browser: "$/playwright.js"`, `ci`, `reportDir`)
  and `node <root>/node_modules/ui5-test-runner/index.js --no-npm-install` with that dir as cwd. Report it as manual.
  **Parallel authors (test-quality workflow) share port 4104 and the tree**: your run gets `EADDRINUSE`, then tests the
  other run's server, and its exit code reflects their in-flight reds — read the per-suite table, not the exit. Never
  mutate tree source then; prove reds by running scratch copies of the class (type imports stripped) under `tsx` with the fakes' logic.
- **Prove a backfill red** by mutating a copy kept in the scratchpad, never `/tmp` (Git Bash `/tmp` ≠ the scratchpad
  path); restore and re-run green before returning.
- **`lint:tracking-ids` bans decision/defect ids (`D-014`), `§` and SPEC/BR/FUT ids in every `app/**/test` file, JSDoc
  included** — state the rule in prose ("Deep-link restore: …") and put the ID traces in the report.
- **`lint:grouped-constants` counts `data/constants.ts` too** — ≥3 loose scalar consts fail; group them in one `as const` object.
- **Controller unit harness** (FP shell `App.qunit.ts`, 2026-11-04): `new App(undefined as unknown as string)` (a string
  name triggers the legacy registry lookup; an FE `PageController` subclass constructs the same way), then `Object.assign` `getView`/`getOwnerComponent`; assign `byId` by member
  assignment (`naming-convention` rejects a `byId` object-literal key). Stub static `HashChanger.getInstance` to capture
  listeners. A never-rendered `ComponentContainer` never loads its app — drive it with `container.fireComponentCreated({component})`.
  `Component.create({ name, manifest: true })` boots a whole UIComponent fine under the Test Starter. `.call()` is banned
  (`no-restricted-syntax`); call `Proto.prototype.method()` when the method ignores `this`.
- **FE `PageController` subclass `onInit`** (FP `connection-manager/.../support/connectionFakes.ts`): the *instance's*
  `onInit` is chained with FE controller-extension hooks (`InternalRouting.onInit` → `getAppComponent` → "reading 'isA'"
  on a fake view). Stub `PageController.prototype.onInit` (what `super.onInit()` reaches), then
  `Object.assign(controller, { onInit: MyCtrl.prototype.onInit }); controller.onInit()`. Other handlers run fine as-is.
- **`this`-bound formatter without `.call()`:** `Object.assign(fakeControl, { fmt: formatter.fmt }).fmt(value)`.
- **A red QUnit test shows no diff in the gate** (FP shell, 2026-11-04): `test:ui5` prints the failing test name then
  `undefined`, and `report-ui5/` keeps no assertion detail. To quote actual vs expected for a sourceBug, open the
  Test Starter page by hand (a manual run) or reason it from the source; do not hunt the report folder.
