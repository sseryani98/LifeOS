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
- **ESLint `app/**/test/**` block** (FP D-334): class-only, `no-magic-numbers`, `jsdoc/require-jsdoc` and
  `max-lines-per-function` are off; the `function` keyword ban stays. Top-level `QUnit.module`/`test` and module consts are fine.
- **Layout is linted** (`lint:test-structure`): `testsuite.qunit.ts` at the tree root only; `*.qunit.ts` under `unit/` or
  `integration/`; every other `.ts` under `data/`, `support/` or `integration/pages/`. A stray helper at the root fails.
- **`lint:test-data` scans every `*.qunit.ts`** (not `testsuite.qunit.ts`): each `QUnit.test`/`opaTest` needs a leading
  `/** why */`, and no raw UUID or weight-≥5 literal outside an assertion (`deepEqual`/`strictEqual`/`propEqual` count as assertions).
- **`lint:frontend-controller-shape` scans every `.ts` directly in any `ext/` folder** — a test mirror at
  `test/unit/ext/X.qunit.ts` fails it. Put unit tests flat in `test/unit/`.
- **`lint:frontend-constants` scans `app/**/test/`** — SCREAMING_SNAKE maps must sit in `test/data/constants.ts`.
- **`lint:domain-types` scans `app/**/test/`** — fake-shape interfaces go in `test/support/types.ts`.
- **`@typescript-eslint/naming-convention`** flags `{ beforeEach: …, afterEach: … }` hook objects (method-name verb
  list). Use nested modules: `QUnit.module("X", hooks => { hooks.beforeEach(…); QUnit.test(…) })`.
- **QUnit globals:** `/// <reference types="qunit" />` atop each `*.qunit.ts` (ruled per file, FP D-334 — the app
  `tsconfig.json` keeps `types: ["@sapui5/types"]` so production source cannot see them).
- **No `@types/sinon`**, and `sap/ui/thirdparty/sinon` is untyped. Stub by patching the collaborator's `prototype`
  and restoring in `afterEach` — works because plain classes keep methods on the prototype.
- **Running it:** `npm run test:ui5` from the module (spawns its own `cds-serve` on port 4104; ~15 s). Manual run:
  serve with `PORT=<free> npx cds-serve` and open
  `/<mountPath>/test/Test.qunit.html?testsuite=test-resources/<ns/path>/testsuite.qunit&test=unit/unitTests`.
  A manual run is reported as manual. A port-4004 server may already be Sandro's — never kill it.
- **Prove a backfill red** by mutating a copy kept in the scratchpad, never `/tmp` (Git Bash `/tmp` ≠ the scratchpad
  path); restore and re-run green before returning.
