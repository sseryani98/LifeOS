---
name: ui5-test-lint-gotchas
description: Which shared linters and tsconfig settings bite UI5 test files under app/**/test/ (until the owed app/**/test ESLint block lands), and the cheap legitimate dodges
metadata:
  type: reference
---

Measured 2026-11-04 on Financial Planner `app/transactions/webapp/test/` (the first UI5 test tree in the repo).

- **ESLint class-only (`no-restricted-syntax`) fires on every QUnit file** — `QUnit.module(...)` calls, module consts,
  `export default {…} satisfies SuiteConfiguration` in `testsuite.qunit.ts`. Unfixable from the test side; the
  `app/**/test/**` block is owed (FP TEST_STRATEGY §9.9/§9.10). Report it; do not contort tests into `static {}` blocks.
- **`lint:frontend-controller-shape` scans every `.ts` directly in any `ext/` folder** — a test mirror at
  `test/unit/ext/X.qunit.ts` fails it ("free function", "no default export"). Put unit tests flat in `test/unit/`.
- **`lint:frontend-constants` scans `app/**/test/`** — SCREAMING_SNAKE maps in `test/data/foo.ts` fail; name the data
  file `test/data/constants.ts` (also exempt from class-only).
- **`lint:domain-types` scans `app/**/test/`** — fake-shape interfaces go in `test/support/types.ts`.
- **`@typescript-eslint/naming-convention`** flags `{ beforeEach: …, afterEach: … }` hook objects (method-name verb
  list). Use nested modules: `QUnit.module("X", hooks => { hooks.beforeEach(…); QUnit.test(…) })`.
- **`no-magic-numbers`** fires on inline expected numbers — put them in `test/data/constants.ts`.
- **App `tsconfig.json` has `types: ["@sapui5/types"]`**, which hides QUnit globals (`TS2708 Cannot use namespace
  'QUnit'`). Add `/// <reference types="qunit" />` atop each `*.qunit.ts`; `@types/qunit` is at the root.
- **No `@types/sinon`**, and `sap/ui/thirdparty/sinon` is untyped in `@sapui5/types`. Stub by patching the
  collaborator's `prototype` and restoring in `afterEach` — works because non-UI5 plain classes keep methods on the prototype.
- `tsc -p app/<app>/tsconfig.json --noEmit` type-checks the test tree (its `include` is `webapp/**/*.ts`) — the one
  static proof available when no runner exists.
