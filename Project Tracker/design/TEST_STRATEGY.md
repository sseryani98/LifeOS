# Test Strategy

**Document ID:** TST-001
**Version:** 1.1
**Date:** 2026-08-15
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-15 | Sandro & Claude | **v1.1 — amended at the Project Planning stage.** §17.2's linter candidate is **answered rather than left open**: no new linter, and the `setupFiles` lever gets an in-module guard in story `SPEC-01`'s definition of done instead (BP-001 §11, D-208). No threshold, tier, folder or count changes.                                                                    |
| 2026-08-15 | Sandro          | **Status → Approved.** All twelve Phase 5 coverage checks met; the approval gate at step 0 of Phase 6 was answered before the stage closed — the **third** stage running, after `DM-001` and `TS-001`.                                                                                                                                                                   |
| 2026-08-15 | Sandro & Claude | Initial creation from the Test Strategy stage. Settles the **4** questions the design documents defer here by name across **2** files. Records D-186 through D-197. **The harness question is EXECUTED** — `cds.test` **can** load a TypeScript service implementation, reversing the exemplar's stated belief. Classifies all **180** Functional Unit Tests onto tiers. |

**The document ID is `TST-001`, not `TS-002`.** `TS-001` is this module's **Tech Stack**
([TECH_STACK.md](TECH_STACK.md)). Financial Planner numbers its Test Strategy `TS-003`; that is that
module's sequence and not this one's.

---

## 2. Summary

| Area                   | Standard                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runner**             | Jest + ts-jest, declared at the repo root. One `jest.config.ts` per module                                                                                      |
| **Harness loading**    | **`cds.test` loads the `.ts` service impl** — one `setupFiles` entry setting `CDS_TYPESCRIPT` (D-187). Measured; the exemplar believes it cannot                |
| **The failure mode**   | Omitting the lever is a **silent pass**, not an error — the handler never registers and the test asserts CAP's generic CRUD instead (D-187)                     |
| **Tiers**              | **4** under Jest — Unit, Integration (**two** entry points), Protocol, Script — plus the browser and one-time verification outside it (D-188)                   |
| **The write path**     | The eleven verbs test as **plain functions** over the served service. Only the **transport** needs the MCP SDK (D-189)                                          |
| **Assertable surface** | **4** constraints assert as contract, **6** must be exercised as logic, **1** is unassertable under the test profile (D-190)                                    |
| **Test profile**       | in-memory SQLite (TS-001 §10). Blind spot: `assert_integrity: 'DB'`'s `23503` and Postgres types (D-191)                                                        |
| **Test data**          | Inherited wholesale — factories + named constants in `data/`, never inline (D-192)                                                                              |
| **File structure**     | Inherited wholesale — `{unit\|integration}/{module}/{data,support,tests}` + `test/shared/` (D-192)                                                              |
| **Coverage**           | Numbers **inherited**, layers **re-mapped**: Validators 100/100, Services + verbs + scripts 90/85, Overall 85/80, Facades excluded (D-193)                      |
| **Utilities**          | **None** — this module encrypts nothing and schedules nothing, so the exemplar's 100/100 Utilities band has no target here (D-193)                              |
| **FUT contract**       | All **180** FUTs classified: **59** script, **59** verb, **41** OData, **10** browser, **7** one-time, **4** protocol (D-194)                                   |
| **Frontend**           | **No in-repo suite.** `/functional-test` and `/ux-test` are the tier (D-195)                                                                                    |
| **Recording a run**    | Destination **and** transition. The `posttest` hook **cannot record a failing run**, so both gate sites call it explicitly (D-196)                              |
| **Enforcement**        | **3** live test `lint:*` scripts (of **5** enforced rules). Coverage mapping, tier boundaries, the FUT contract and the lever are enforced by **nothing** (§17) |
| **Deliverable**        | The document only. **No test, no script, no config** — `test/` stays empty until Build (D-186)                                                                  |
| **Amendments caused**  | **6** — 5 applied in-session, **1 raised and owed** (§18)                                                                                                       |
| **Risks**              | **None assigned** — register checked, not assumed. R7's drill gains a tier without changing owner (D-197)                                                       |
| **Open items**         | **None.** All five closed at Data Model; `PSV-001` §8 carries no sixth row (§20)                                                                                |

---

## 3. Test Tooling & Configuration

### 3.1 The runner

| Tool           | Where declared              | Purpose                                                                    |
| -------------- | --------------------------- | -------------------------------------------------------------------------- |
| **Jest**       | root `package.json` (`^29`) | Runner, assertions, mocking                                                |
| **ts-jest**    | root `package.json` (`^29`) | Transforms `.ts` — including files CAP `require`s at runtime (§4)          |
| **`cds.test`** | `@sap/cds` **9.8.4**        | Boots the CAP server in-process with SQLite and hands back a bound `axios` |

All three are **repo-root** declarations, not this module's — the root `CLAUDE.md` forbids a module
declaring shared tooling. A `jest.config.ts` is module-local; the runner behind it is not.

**`@sap/cds` 9.8.4 is load-bearing here specifically.** 9.9.x `await`s `cds.plugins` inside
`bin/serve.js`, a dynamic import Jest's CJS VM rejects without `--experimental-vm-modules`, which
red-lines **every** `cds.test` suite in the repo (D-34). **This stage does not raise the pin and
nothing here may raise it as a side effect.**

### 3.2 `jest.config.ts` — the settings, each with its reason

Written by the first test story (D-186); this table is the specification.

| Setting                      | Value                                                                                       | Why                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `preset`                     | `ts-jest`                                                                                   | Inherited                                                                       |
| `testEnvironment`            | `node`                                                                                      | No DOM — §15 rules out an in-repo frontend suite                                |
| `roots`                      | `['<rootDir>/test']`                                                                        | Inherited                                                                       |
| `testMatch`                  | `['**/*.test.ts']`                                                                          | Inherited                                                                       |
| **`setupFiles`**             | **`['<rootDir>/test/setEnv.ts']`**                                                          | **The harness lever — §4. Not optional, and its absence is silent**             |
| `testTimeout`                | `30000`                                                                                     | `cds.test` cold starts exceed Jest's 5s default under coverage                  |
| `moduleNameMapper`           | `{ '^(\\.{1,2}/.*)\\.js$': '$1' }`                                                          | **Load-bearing.** `module: Node16` makes TS source import a sibling as `./x.js` |
| `coverageDirectory`          | `coverage/`                                                                                 | Inherited                                                                       |
| `coveragePathIgnorePatterns` | `['/node_modules/', '/@cds-models/', '/gen/', 'Facade\\.ts$', 'mcp/server\\.ts$', '/app/']` | §13.2                                                                           |
| `coverageThreshold`          | §13.1                                                                                       | Jest enforces the numbers at run time                                           |

The last two rows of the middle block are the ones the exemplar's own document omits: its §3.3 table
lists neither `testTimeout` nor `moduleNameMapper`, both of which are present in
`Financial Planner/jest.config.ts` and both of which this module needs (§18).

> **Amended 2026-08-16 at `S-00`, by D-215, having run it.** Two corrections, both measured against
> the installed Jest rather than reasoned about.
>
> 1. **`coverageThreshold` lands one band at a time.** Jest classifies a threshold group only when a
>    **covered file matches it**; a group matching none is a hard error — `Jest: Coverage data for
<group> was not found.` — not a skip. So §13.1's four bands cannot all land while
>    `srv/modules/`, `mcp/verbs/` and `scripts/` are empty. `S-00` ships the **global** band; each
>    per-layer band lands with the story that creates the first file under its folder.
> 2. **`coveragePathIgnorePatterns` gains `/test/`.** Jest drops the specs but not their `data/` and
>    `support/` siblings, and a builder's timeout and error paths are not the subject of any coverage
>    claim. Measured at `S-00`: with the harness counted, global branch coverage was **66.66%**
>    against an 80% floor.

### 3.3 The `test` script — specified, not added (D-186)

```json
{
  "test": "jest --json --outputFile=coverage/test-results.json --coverage",
  "record-test-run": "tsx scripts/recordTestRun.ts"
}
```

**Neither is added by this stage**, and the reason is measured rather than assumed. The root
`npm test` is `npm run test --workspaces --if-present`, so an **absent** script is skipped while a
present one runs. Measured this session on the installed Jest:

| Invocation                    | Exit code |
| ----------------------------- | --------- |
| `jest` with no matching tests | **1**     |
| `jest --passWithNoTests`      | **0**     |

So a `test` script added today is safe **only** with `--passWithNoTests`, and what it would then buy
is a green gate over zero tests — the same meaningless green this module's
[CLAUDE.md](../CLAUDE.md) §Status already warns about for `cds build`. It is added **with the first
test**, without the flag, so an empty run is loud. The measurement is recorded here so nobody has to
rediscover it under pressure.

**There is no `posttest` script** — §16 explains why, and it is not an omission.

**The two scripts land in different stories — amended 2026-08-16 by D-213.** `test` lands at `S-00`,
with that story's one script-tier test, exactly as ruled. **`record-test-run` lands at `SPEC-09`**,
alongside the `scripts/recordTestRun.ts` it points at: declaring it earlier is a script that fails
with a module-resolution error for eight stories, and `BP-001` §10 already has the gate consuming it
"from `SPEC-09` onward". The block above stays the specification for both.

---

## 4. Harness & Implementation Loading (D-187)

[CLAUDE.md](../CLAUDE.md) §Loading a TypeScript Service Implementation states in terms that "**the
`cds.test` path is not settled: it belongs to Test Strategy (stage 11)**", and
[TS-001](TECH_STACK.md) §7.2 hands it here by name. This section is that ruling, and it **reverses
the belief the exemplar's own test suite carries in a comment**.

### 4.1 What was measured

A scratch CAP 9.8.4 project outside every module, deleted after the run: one `.cds` service, one
`.ts` implementation importing a sibling as `./types.js`, a `tsconfig.json` at `cds.root`, `module:
Node16`, and a `jest.config.js` with the `ts-jest` preset. The implementation carried an `on` handler,
a **`before CREATE` cross-field guard** — the exact shape D-171 pushed three of this module's
constraints into — and an `after READ` mutation. **Same tree, one variable: whether
`process.env.CDS_TYPESCRIPT` was set before `@sap/cds/lib/srv/factory.js` was first required.**

| Check                                               | Without the lever                           | With `setupFiles`                      |
| --------------------------------------------------- | ------------------------------------------- | -------------------------------------- |
| `GET /service/probe/ping()`                         | **501** — `Service "…" has no handler`      | **200** — `typescript-impl-loaded`     |
| CAP's own boot log                                  | the generic `app-service.js` fallback       | `impl: 'srv/probe-service.ts'`         |
| `before CREATE` cross-field guard on an invalid row | **not fired — the invalid row was written** | **409**, carrying its named key        |
| `after READ` mutation visible on the response       | **not applied**                             | applied                                |
| Jest result                                         | 3 failed, 1 passed                          | **4 passed**                           |
| `--coverage` over the `.ts` impl                    | not instrumented                            | **100% statements / branches / lines** |

**The cause is one line in the installed runtime.** `@sap/cds/lib/srv/factory.js:46`:

```js
const exts = process.env.CDS_TYPESCRIPT
  ? [".ts", ".js", ".mjs"]
  : [".js", ".mjs"];
```

It is a **module-load-time constant**, so the variable must be set before that file is first
required — which is exactly what a Jest `setupFiles` entry does and what a `beforeAll` cannot.

**No `tsx` loader is needed.** D-33 established two independent levers for a plain Node process;
under Jest the second one is already supplied, because CAP's `require` of the implementation goes
through Jest's module registry and ts-jest transforms it. The `moduleNameMapper` in §3.2 is what
resolves the `./types.js` specifier `module: Node16` produces. Both halves were exercised.

### 4.2 The ruling

| Where                   | Ruling                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **The lever's home**    | **`jest.config.ts` → `setupFiles: ['<rootDir>/test/setEnv.ts']`**, one line: `process.env.CDS_TYPESCRIPT = "true"` |
| **Not** per test file   | A per-file line works — measured, it also returns 200 — and is **forbidden**, for the reason below                 |
| **What may assume it**  | Every tier that boots `cds.test` (§5)                                                                              |
| **What sets it itself** | `mcp/server.ts` and `scripts/recordTestRun.ts`, which are not under Jest — TS-001 §7.2, unchanged                  |

### 4.3 Why the lever is a config entry and not a convention

**Because forgetting it produces a passing test.** The `ping()` case failed loudly with a 501. The
`before CREATE` case did not: the guard never registered, CAP wrote the invalid row, and the request
returned success. A suite that asserted "CAP accepts the row" would have been **green**, and a suite
asserting a business rule would have been red for a reason that looks like a bug in the rule.

That is the whole argument for §17's honesty: nothing mechanically checks this lever. A `setupFiles`
entry is one place a reviewer can look; a first line in each of N spec files is N places to forget.

### 4.4 What this changes upstream

`Financial Planner`'s integration suites carry the comment "**cds.test cannot load the TypeScript
service impl**" (`Financial Planner/test/integration/transaction/support/transaction.ts:144-145`) and
work around it by constructing and registering the production Facade by hand. **That workaround is
sound and this document does not ask that module to change it** — it is a mid-sprint runtime change in
another module. It is recorded because the belief, not the workaround, is what would have propagated
here: this module inherits the workaround **nowhere**, and its integration tier registers nothing by
hand.

---

## 5. Test Boundaries (D-188)

**Four tiers run under Jest. Two destinations are not Jest at all, and saying so is the point of the
table** — a FUT with no tier is a FUT nobody writes.

| Tier                    | Runner                            | Boots                             | Database          | May assert                                                                                | May **not**                                                  |
| ----------------------- | --------------------------------- | --------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Unit**                | Jest                              | nothing                           | **none — mocked** | One class, one method. Pure logic: resolver ordering, health banding, mapping, validation | Touch a database, boot a service, or assert an OData shape   |
| **Integration**         | Jest + `cds.test`                 | `TrackerService` + the model      | SQLite `:memory:` | Handlers, constraints, projections — through **either** entry point in §7                 | Assert anything whose mechanism is Postgres (§10)            |
| **Protocol**            | Jest + MCP SDK in-memory pair     | `mcp/server.ts`                   | SQLite `:memory:` | The tool list, JSON-RPC framing, the stdout guard, the `zod` input boundary               | Re-assert verb behaviour the integration tier already proves |
| **Script**              | Jest                              | a Node entry point, or none       | varies            | A script's observable effect: files written, exit codes, denials, rows recorded           | Assume a CAP server it did not start                         |
| _Browser_               | **`/functional-test`** — not Jest | the real servers behind the proxy | Postgres          | What is on screen (§15)                                                                   | Be counted in coverage, or gate `npm test`                   |
| _One-time verification_ | **a person, once**                | —                                 | —                 | That a cutover step happened (§14.3)                                                      | Be a re-runnable test at all                                 |

### 5.1 Boundary rules

| Rule                                                                                           | Rationale                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Never test CAP's generic CRUD, draft machinery, or `@readonly` enforcement**                 | Inherited verbatim from the shared standards. §4 makes it a live hazard rather than a slogan: without the lever that is all you test |
| Unit tests never touch a database                                                              | Inherited                                                                                                                            |
| Integration tests use SQLite, not Postgres                                                     | TS-001 §10 rules the `test` profile. The cost is §10, not a footnote                                                                 |
| **Every tier that boots `cds.test` inherits `setupFiles`; no spec file sets the lever itself** | §4.3                                                                                                                                 |
| The protocol tier asserts transport only                                                       | Its fixtures are JSON-RPC frames, not domain data. A verb rule asserted twice drifts in one of the two places                        |
| **No external API is mocked, because there is none**                                           | This module has no HTTP client, no scraper and no scheduler (TS-001 §6.1). A stated "none", not an omission                          |
| A FUT lands at the **outermost** tier that can observe it                                      | §14.1                                                                                                                                |

---

## 6. Unit Test Standards

Inherited from the shared standards, re-mapped to this module's layers. **Unit tests are driven by
business rules and the coverage targets, not by FUTs** (§14.1).

| Layer                   | What to test                                                      | What to mock                                                                   | Test file                     |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| **Validator**           | Every rule, positive and negative. 100% (§13)                     | Nothing. `req` is a plain object with an `error()` spy                         | `{domain}Validator.test.ts`   |
| **Service**             | Business logic, orchestration, computed values, state transitions | CQL, DataService, other Services. **Validator is not mocked** — real, for free | `{domain}Service.test.ts`     |
| **DataService**         | Query construction where it is conditional                        | `cds.ql` builders                                                              | `{domain}DataService.test.ts` |
| **Mapper**              | Every shape translation, both directions                          | Nothing — static, no dependencies                                              | `{domain}Mapper.test.ts`      |
| **Verb** (`mcp/verbs/`) | Input shaping, the guard precedence order, the response envelope  | The connected service                                                          | `{verb}.test.ts`              |
| **Facade**              | **Not unit tested.** Zero logic by design, `lint:facades`         | —                                                                              | —                             |

### 6.1 The engines that carry the weight

Three enhancement objects hold this module's densest logic and are the highest-value unit tests in it:

| Object      | Logic                                                                         | Spec         |
| ----------- | ----------------------------------------------------------------------------- | ------------ |
| **ENH-001** | Chain instantiation — which steps materialise for which `shipsUi` predicate   | SPEC-02 §3.2 |
| **ENH-002** | Next-action resolution — three tiers, then Initiative then Milestone position | SPEC-04 §3.1 |
| **ENH-003** | Calculated health — severity banding and worst-child-wins roll-up             | SPEC-05 §3.1 |

**No `Utilities` row exists, and that is a ruling.** The exemplar's 100/100 Utilities band covers
encryption, date-time and currency helpers. **This module encrypts nothing and schedules nothing**
([CLAUDE.md](../CLAUDE.md) §Architecture), and has no currency. If a utility appears later it takes
the Validator band; today the band has no target and §13 says so rather than leaving the row blank.

### 6.2 Private methods

Tested directly via bracket notation — `service["_resolveNextAction"](workspace)` — under the test
file's existing ESLint overrides (`dot-notation` off in `test/**/*.test.ts`). Inherited unchanged.

---

## 7. Integration Test Standards

**One tier, two entry points.** Both boot the same harness; they differ only in how the code under
test is reached. Keeping them one tier keeps one setup pattern and one seeding story.

### 7.1 Entry point A — the service function (the verb path)

The module's **entire write path** is eleven MCP verbs, and its transport is stdio with no port
(TS-001 §4, process 2). An HTTP request cannot reach them. **Measured this session:** a verb-shaped
async function — `await cds.connect.to(name)`, then `srv.tx({ user }, tx => tx.run(…))` — reaches the
real handlers inside a suite that `cds.test` has booted, with **no transport, no port and no MCP
SDK**. Both paths were exercised: the happy path wrote, and a handler rejection returned through the
verb's own envelope carrying its named key.

That is exactly SPEC-01 BR-06 and BR-07's mechanism (`srv.tx({ user })`, the calling agent's identity
reaching `createdBy`), so the tier tests the contract the spec states rather than a proxy for it.

```typescript
const cds = require("@sap/cds");
cds.test(__dirname + "/../../..", "--in-memory");

// in a support/ helper, never in the spec:
export async function completeStageAs(actor: string, story: string, step: string) { … }
```

### 7.2 Entry point B — OData over HTTP

For the read path and the two Forms: `ProjectView`, `TaskQueueItem`, and the shared create-handler on
`Initiative` / `Milestone` / `Workspace` (TS-001 §5).

| Shape                   | Example                                                               | Covers                                             |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| The one-call read       | `GET /service/trackerSvcs/ProjectView('financial-planner')?$expand=…` | DM-001 §11's navigation properties, SPEC-01 BR-22a |
| Virtuals filled on read | `health`, the four `nextAction*`, the six `gate*` scalars             | DM-001 §11.1's `after READ` handler                |
| Sort order              | `$orderby` against `@lifeos.sortKey`                                  | D-164, SPEC-07 BR-10                               |
| Handler rejections      | `POST` an invalid Initiative, expect **409** and its key              | D-79's shared create-handler; SPEC-06              |
| Contract constraints    | `@assert.unique`, `@mandatory` — §9                                   | Documentation of what the model guarantees         |

### 7.3 Isolation and seeding

One test file per **domain**, not per CDS service — this module has one service (TS-001 §5), so
per-service would put every integration test in one file. Files share seed data through a
`support/seedXxx` builder and do not depend on execution order. Mutations either use unique
identifiers or set up and tear down around themselves.

**Every seeding query lives in a `support/` helper**, never in a spec — `lint:test-cql` enforces it.

---

## 8. The Protocol Tier

**Small, and separate, because four Functional Unit Tests cannot be reached any other way.**

`INT-001` exposes its verbs over MCP stdio. §7.1 tests what the verbs _do_; this tier tests what the
**server** does — the surface between a client and those functions.

| What it asserts                                             | Why no other tier can                                                                                  | FUT             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------- |
| The tool list is **exactly eleven**                         | The list exists only as the server's registered tools; a verb function knows nothing about it          | SPEC-01 FUT-001 |
| **stdout carries only JSON-RPC frames**                     | The failure is a log line landing inside the live frame stream, which only a real transport reproduces | SPEC-01 FUT-010 |
| An invalid FRICEW type is refused **at the boundary**       | `zod` rejects before the verb function is entered, so a direct call never exercises it                 | SPEC-01 FUT-014 |
| The amended `plan_sprint` signature carries both new inputs | It is a tool-schema assertion, not a behavioural one                                                   | SPEC-06 FUT-014 |

**Mechanism:** the MCP SDK's in-memory linked transport pair — a client and the server in one
process, no stdio pipe — driven from a Jest spec. `research/mcp-over-cap-in-process.md` §5 already ran
a real client against a real CAP service in one process and is graded `Verified`, so the shape is
proven; what this section adds is that it is a **tier with four named tests**, not a spike.

**The stdout guard is the one that earns the tier.** TS-001 §9.1 records the measurement: a single
`cds.log` line lands inside the JSON-RPC stream, the SDK's `ReadBuffer` reports a parse error **and
carries on**, so every call still completes. The corruption is invisible to any assertion that is not
reading the raw stream.

**The SDK is not installed yet** — `@modelcontextprotocol/sdk` is one of TS-001 §6's two new
dependencies and lands with `INT-001`. This tier's first test lands in the same story.

---

## 9. The Assertable Surface (D-190)

What a test may assert **as contract** — the model guarantees it, and the test documents the
guarantee — versus what it must **exercise as logic**, because a handler does it. Derived from
[DM-001](DATA_MODEL.md) §9, whose classification was executed against PostgreSQL 17.6.

**This section exists because the shared standards were wrong about the framework twice**, and a test
written against a wrong standard passes while asserting nothing.

| Constraint                                                | Mechanism                           | Test as                | Where                  |
| --------------------------------------------------------- | ----------------------------------- | ---------------------- | ---------------------- |
| `Workspace.slug` unique                                   | `@assert.unique` — **entity level** | **Contract**           | Integration (B)        |
| `Initiative.position` unique in Workspace                 | `@assert.unique` — entity level     | **Contract**           | Integration (B)        |
| `Milestone.position` unique in Initiative                 | `@assert.unique` — entity level     | **Contract**           | Integration (B)        |
| `@mandatory` fields (`branch`, `executedAt`, `decidedAt`) | `@mandatory` → `ASSERT_MANDATORY`   | **Contract**           | Integration (B)        |
| `Initiative.mergeCommit` + `tag` when Complete            | **handler**                         | **Logic**              | Unit + Integration (B) |
| `Defect` has a Milestone **or** an Initiative             | **handler**                         | **Logic**              | Unit + Integration (A) |
| `TestRun` has a Task **or** an Initiative                 | **handler**                         | **Logic**              | Unit + Integration (A) |
| `Initiative.name` unique in Workspace                     | **handler** — 409, named key        | **Logic**              | Integration (B)        |
| `Milestone.storyId` unique in Initiative                  | **handler** — 409, named key        | **Logic**              | Integration (B)        |
| Guard precedence (SPEC-02's 14 rejections)                | **handler**                         | **Logic**              | Unit + Integration (A) |
| Code-list referential integrity                           | **`assert_integrity: 'DB'`**        | **Unassertable** — §10 | —                      |

**Four assert as contract, six are exercised as logic, one cannot be asserted at all.**

### 9.1 Two annotations a test must never assert

| Annotation                          | Status at `@sap/cds` 9.8.4                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Cross-field `@assert: (expr)`**   | **Does not exist** (D-171). Zero occurrences in the compiler; it silently fires nothing          |
| **`@assert.unique` at field level** | **Fires nothing** (D-172). Only the entity-level form works, and there is no `ASSERT_UNIQUE` key |

A test asserting either would be green over an unenforced constraint, which is the defect this
section exists to prevent. **`@assert.unique` violations surface as the driver's own unique-index
error, not a CAP key** — so the assertion is on the rejection and its status, never on a
`ASSERT_UNIQUE` code that does not exist.

**This amends a shared standard, not only this document.** `Financial Planner/CLAUDE.md` §Test Rules
still instructs every module to "DO test annotation-based constraints (`@assert.unique`,
`@mandatory`, `@assert.range`, **cross-field `@assert`**) as contract documentation". The last of
those four is a test of an annotation that does not exist. Corrected in-session (§18), on D-156's
precedent — it is a live agent instruction rather than documentation. Its CDS bullet was corrected at
the Data Model stage; **this second occurrence in the same file was missed then**, which is itself the
argument for grepping a file rather than fixing the hit you found.

---

## 10. The Test Profile's Blind Spot (D-191)

[TS-001](TECH_STACK.md) §10 rules the `test` profile onto in-memory SQLite while the dev loop runs on
Postgres, and states in terms that the cost "**is Test Strategy's to carry**". This section carries
it.

| Unassertable under SQLite                               | Because                                                  | What covers it instead                                                   |
| ------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| **`assert_integrity: 'DB'` rejecting an unseeded code** | The mechanism is a Postgres foreign key emitting `23503` | **Nothing automated.** `cds deploy` to Postgres in the migration story   |
| Postgres-specific type behaviour                        | The engines differ                                       | DM-001 §15 already avoids the divergence — `LargeString`, not `array of` |
| `DEFERRABLE INITIALLY DEFERRED` constraint timing       | A Postgres constraint mode                               | `INT-007`'s round-trip drill, SPEC-11 FUT-009 (§14.2)                    |
| A deploy refusing a narrower model, or a `not null` add | `cds deploy` against a populated Postgres schema (D-175) | `CNV-002`/`CNV-003` ordering, asserted by the migration stories          |

**One constraint has no automated cover anywhere, and saying so is the honest answer.** Code-list
referential integrity is real in the dev loop and in production and is invisible to every suite. The
alternative — running the integration tier against Postgres — was rejected because it makes every
suite depend on a running server, a role and a credential (TS-001 §8), which trades a named blind spot
for an unnamed flakiness.

**The blind spot is bounded by design.** D-166 made `Actor` a code list and DM-001 seeds twelve code
lists at `CNV-002`; an unseeded code is therefore a **seed defect**, caught by the migration
reconciliation (`CNV-004`, SPEC-03 FUT-012) rather than by a unit of application logic. That is the
covering mechanism, and it is a load-time check rather than a test.

---

## 11. Test Data Strategy (D-192)

**Inherited wholesale.** Nothing about this module's data argues for a different rule, and the three
linters that enforce it already run here.

| Rule                                             | Detail                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Hybrid factories + named constants               | Factories keep data DRY; `UPPER_SNAKE_CASE` constants keep specs readable                      |
| **Nothing is constructed inline**                | Every payload and UUID is an imported constant from a `data/` folder. `lint:test-data`         |
| The only inline exception                        | A single field override when the test is _about_ that value; the base object is still imported |
| Builders live in `support/`, fixtures in `data/` | An exported object or array in `support/` is a violation. `lint:test-structure`                |
| **No CQL in a spec**                             | Every `SELECT`/`INSERT`/`UPDATE`/`DELETE` lives in a named `support/` helper. `lint:test-cql`  |
| One-line JSDoc per `it`                          | States the **why** — the rule protected — not the title restated. `lint:test-data`             |

### 11.1 The canonical test world

This module's canonical world is **the migrated Financial Planner workspace**, because the module
exists to hold it and `CNV-002`'s load is already specified row by row (SPEC-03 §3.1). Seeding it in
tests reuses a shape three Approved specs already fix, rather than inventing a parallel fiction:

| Seed set    | Contents                                                                 | Source          |
| ----------- | ------------------------------------------------------------------------ | --------------- |
| Hierarchy   | One Area → Engagement → Workspace `financial-planner`                    | SPEC-03 BR-01…  |
| Initiatives | Three — two Complete with their real git facts, one Active               | SPEC-03 §3.1    |
| Milestones  | Twelve, `shipsUi` set on all twelve, exactly one in Backlog with a chain | SPEC-03 FUT-002 |
| Methodology | Nine stages, seven subtasks                                              | SPEC-02 FUT-001 |
| Registers   | Four Defects, five Decisions, two Activity rows, one TestRun             | SPEC-03 §3.2    |
| Code lists  | All twelve, fully seeded                                                 | DM-001 §7       |

**No sensitive-data rules are needed, and that is a stated "none".** This module holds sprint state.
It has no card numbers, no credentials and no encrypted fields — the exemplar's §7.3 has no analogue
here.

---

## 12. Test File Structure (D-192)

**Inherited wholesale**, and already enforced: `lint:test-structure` runs in this module's `lint`
block today and passes over the empty tree (measured this session — "Scanning 0 test file(s)", exit
0), which is D-36's missing-folder rule working as intended.

| Role folder | Holds                                                     | Rule                                                |
| ----------- | --------------------------------------------------------- | --------------------------------------------------- |
| `data/`     | Fixtures + factories — `UPPER_SNAKE_CASE`, plain objects  | Data lives here, nowhere else                       |
| `support/`  | Mocks, harness wiring, `seedXxx`, CQL helpers — functions | An exported fixture here is a violation             |
| `tests/`    | The `*.test.ts` specs — imports + arrange-act-assert      | A spec outside `tests/`/`scenarios/` is a violation |

**`{module}` mirrors `srv/modules/` and `mcp/verbs/`.** The destination tree:

```text
test/
  setEnv.ts                        ← the CDS_TYPESCRIPT lever (§4.2). Not a spec, not a fixture
  shared/
    data/                          Cross-cutting fixtures — the canonical world (§11.1)
    support/                       Cross-cutting builders + seeders
  unit/
    {domain}/{data,support,tests}/ Validators, Services, DataServices, Mappers
    verbs/{data,support,tests}/    The eleven verbs' own logic
  integration/
    {domain}/{data,support,tests}/ Entry point A and B (§7)
    scenarios/                     Multi-step FUT workflows
  protocol/{data,support,tests}/   §8 — the MCP transport
  script/{data,support,tests}/     §5 — recordTestRun, the hook, the linter, the exporter
```

**Two folders are new against the exemplar and neither breaks the linter's contract**, because
`lint:test-structure` keys on the `{data,support,tests}` split beneath a test-type folder, not on a
closed list of test types. `protocol/` and `script/` are test types this module has and that module
does not.

**`test/setEnv.ts` sits at the root of `test/`, not inside a role folder.** It is neither fixture, nor
builder, nor spec. ~~If `lint:test-structure` rejects it when the first test lands, the fix is the
linter's carve-out for a Jest setup file — a Standards change with a story behind it — not a worse
home for the lever.~~

**Discharged 2026-08-16 at `S-00`, by D-212.** It **did** reject it, measured rather than assumed, and
the carve-out was applied: a file directly at the root of `test/` whose basename is one of four
runner-lifecycle names (`setEnv.ts`, `globalSetup.ts`, `globalTeardown.ts`, `setupAfterEnv.ts`) is
exempt. Root only, and an allowlist rather than a blanket exemption, so the folder does not become a
drawer.

---

## 13. Coverage Targets (D-193)

**The numbers are inherited; the layer mapping is re-derived.** A target with no mapping to a folder
that exists is a number no gate can fairly enforce — and the exemplar demonstrates the failure mode.

### 13.1 Enforced thresholds

| Band                           | Line | Branch | This module's folders                                                      |
| ------------------------------ | ---- | ------ | -------------------------------------------------------------------------- |
| **Validators**                 | 100% | 100%   | `./srv/modules/**/*Validator.ts`                                           |
| **Services + verbs + scripts** | 90%  | 85%    | `./srv/modules/**/*Service.ts`, `./mcp/verbs/**/*.ts`, `./scripts/**/*.ts` |
| **Utilities**                  | 100% | 100%   | **None — this module has no utility layer** (§6.1)                         |
| **Overall**                    | 85%  | 80%    | Global                                                                     |

**Three mapping notes, each a consequence rather than a choice.**

1. **`*Service.ts` also matches `*DataService.ts`**, so DataServices carry 90/85. That is correct for
   this module — a DataService here is CQL the integration tier drives hard — and it is stated because
   it is a glob's side effect rather than a decision anyone made.
2. **`mcp/verbs/**` takes the Services band, not a new one.** The verbs are this module's largest logic
   surface and they are Services in everything but folder. Giving them their own number would be
   inventing a threshold this stage has no evidence base to set.
3. **Mappers take no dedicated band** and fall under Overall. The exemplar sets none either; a Mapper
   is pure and static and will run near 100 without a threshold demanding it.

**Integration and protocol tests count toward these numbers**, which is a change in kind rather than
degree: §4.1 measured the `.ts` implementation instrumented at 100% from OData calls alone. In the
exemplar, where the service entry point never loads, integration tests contribute far less.

### 13.2 Excluded from coverage

| Excluded            | Why                                                                                |
| ------------------- | ---------------------------------------------------------------------------------- |
| `*Facade.ts`        | Zero logic by design, `lint:facades`. Wiring is proven by the integration tier     |
| **`mcp/server.ts`** | Bootstrap wiring — the same class as a Facade. §8's protocol tier proves it        |
| **`app/**`**        | §15 rules out an in-repo frontend suite; a folder with no tests would drag Overall |
| `db/**`             | CDS, not TypeScript. Declarative and compiled                                      |
| `@cds-models/`      | Generated by CAP                                                                   |
| `gen/`              | Build output                                                                       |
| `node_modules/`     | Dependencies                                                                       |

### 13.3 The exemplar's coverage section is wrong about its own repo

Read on disk this session. `Financial Planner/design/TEST_STRATEGY.md` §8.3 prints a
`coverageThreshold` block that does not match `Financial Planner/jest.config.ts`:

| Documented in §8.3                | Actually in `jest.config.ts`                                  | Effect                                        |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `'./srv/modules/**/Validator.ts'` | `'./srv/modules/**/*Validator.ts'`                            | The documented glob matches **no file**       |
| `'./srv/util/**/*.ts'`            | Three files pinned individually under `./srv/modules/shared/` | **`srv/util/` does not exist in that repo**   |
| _(no Services entry)_             | `'./srv/modules/**/*Service.ts'` at 90/85                     | The one threshold its own §8.1 table promises |

The config is right and the document is wrong — the third design document in this module's Design
phase found wrong about its own repo, after the exemplar's Theme (D-156) and its Data Model. **Raised,
not fixed** (§18): it is another module's design document and belongs to a `/refresh-docs` sweep.

This is why question 13 of the standard asks for a **layer mapping** and not a number.

---

## 14. The FUT Coverage Contract (D-194)

The twelve specs carry **180 Functional Unit Tests** across **366 business rules** — measured this
session, per spec: 16, 18, 12, 16, 14, 15, 18, 12, 13, 16, 15, 15. That set is this stage's largest
input, and until now no document has said how one of them becomes a file.

### 14.1 The rule

> **A FUT names an observable outcome, so it is written at the outermost tier that can observe it —
> once. Unit tests are driven by business rules and the coverage targets, not by FUTs.**

Three consequences, each deliberate:

- **A FUT is never written twice.** A rule proven at the integration tier is not re-asserted at the
  protocol tier, and a rendering proven in the browser is not re-asserted over OData.
- **The 366 business rules are the unit tier's input**, which is why §13's thresholds are meaningful
  at all: a 90% Service target is unreachable from 180 outcome-level tests.
- **A FUT no tier can observe is not a test**, and §14.3 names those explicitly rather than letting
  them rot as untraceable coverage.

### 14.2 All 180, classified

| Spec                              | FUTs    | Unit | Verb (A) | OData (B) | Protocol | Script | Browser | One-time |
| --------------------------------- | ------- | ---- | -------- | --------- | -------- | ------ | ------- | -------- |
| SPEC-01 — INT-001                 | 16      | —    | 13       | —         | **3**    | —      | —       | —        |
| SPEC-02 — CNV-001/ENH-001/WFL-001 | 18      | —    | 18       | —         | —        | —      | —       | —        |
| SPEC-03 — CNV-002/003/004         | 12      | —    | 12       | —         | —        | —      | —       | —        |
| SPEC-04 — ENH-002/RPT-002         | 16      | —    | 10       | 6         | —        | —      | —       | —        |
| SPEC-05 — ENH-003/RPT-001/FRM-001 | 14      | —    | —        | 13        | —        | —      | 1       | —        |
| SPEC-06 — FRM-002                 | 15      | —    | —        | 13        | **1**    | —      | 1       | —        |
| SPEC-07 — RPT-003/RPT-004         | 18      | —    | 1        | 9         | —        | —      | **8**   | —        |
| SPEC-08 — INT-002/003/005         | 12      | —    | 3        | —         | —        | **8**  | —       | 1        |
| SPEC-09 — INT-004                 | 13      | —    | —        | —         | —        | **13** | —       | —        |
| SPEC-10 — INT-006                 | 16      | —    | —        | —         | —        | **16** | —       | —        |
| SPEC-11 — INT-007                 | 15      | —    | —        | —         | —        | **15** | —       | —        |
| SPEC-12 — CNV-005                 | 15      | —    | 2        | —         | —        | **7**  | —       | **6**    |
| **Total**                         | **180** | —    | **59**   | **41**    | **4**    | **59** | **10**  | **7**    |

**Two findings the table makes unavoidable.**

**The largest single destination is the script tier — 59 of 180 — and the exemplar has no such tier
at all.** `INT-004`, `INT-006`, `INT-007` and `CNV-005` are Node entry points, a `PreToolUse` hook and
a linter; none of them is reachable from an OData request. A strategy inherited unchanged would have
left a third of this module's specified behaviour with nowhere to go.

**Only 41 of 180 are OData integration tests.** The exemplar's "one test file per CDS service" shape
covers under a quarter of this module's outcome surface. It is inherited (§7.2) and it is not the
centre of gravity anyone would guess from reading it.

**`Unit` is empty by construction, not by neglect** — §14.1's rule. Unit tests exist and are numerous;
they are simply not what a FUT maps to.

### 14.3 The seventeen that are not Jest tests

| Class                     | Count | What runs them                                    | Examples                                                                                |
| ------------------------- | ----- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Browser**               | 10    | `/functional-test` per story, in a real browser   | SPEC-07 FUT-001 "renders eight Tasks and six nested Subtasks"; FUT-013's expansion      |
| **One-time verification** | 7     | A person, once, at cutover — recorded, not re-run | SPEC-12 FUT-007 "The dashboard is gone"; FUT-008 "`Financial Planner/project/` is gone" |

**Neither class is a gap.** The browser ten are covered by a stage the build chain already runs and
`PLAN.md` §5 already lists (`/functional-test` → `functional-tester`); putting them in Jest as well
would be the double-assertion §14.1 forbids. The one-time seven assert that a **deletion happened** —
a property that is true forever after `CNV-005` runs and that a permanent test would re-assert every
day for no information. `CNV-005`'s own procedure records them.

**Where a one-time verification has a durable equivalent, the durable one is a test.** SPEC-12 FUT-005
("nothing writes test reports") and FUT-010 ("the dead ignore rule is gone") are permanent invariants
and are classified **script** — `lintNoMarkdownState` is what re-asserts them. The seven left in the
one-time column are the ones with no such equivalent.

### 14.4 R7's drill has a tier, and still has its owner

**SPEC-11 FUT-007** — the `INT-007` CSV round-trip, export → drop → `cds deploy` → compare row counts
**and managed-field values** — is the settling test `research/README.md` §5 names for **R7**. This
stage gives it a **tier and a home** (`test/script/`), which it did not have. It does **not** take
ownership: D-121 assigns R7 and R4 to `INT-007`'s own build, because the drill needs a real Postgres,
a built exporter and loaded data, and none of the three exists. **§19 records that as a check, not a
transfer.**

---

## 15. Frontend Testing (D-195)

**None. No QUnit, no OPA5, no in-repo frontend suite — and that is a ruling with a reason, not an
omission.**

| The exemplar                                                   | This module                                                             |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 23 UI apps, 14 of them freestyle with hand-written controllers | **One** page, Fiori Elements FPM, **drafts OFF** (IA-001 §4, DS-001 §4) |
| Frontend tests explicitly "a learning exercise", no thresholds | The learning was done there; repeating it here buys nothing             |
| Written before `/functional-test` and `/ux-test` existed       | Both run per story in the build chain (`PLAN.md` §5, stages 4 and 5)    |

Near-zero hand-written controller logic means a QUnit suite would test Fiori Elements — the framework
— which §5.1 forbids by name. And the ten browser-tier FUTs (§14.3) already have a stage that runs
them in a real browser against the real servers, which is a stronger assertion than OPA5 against
mocks.

**What this costs, stated:** there is no regression net on the UI between stories other than a human
running the chain. Accepted, because the surface is one page and D-22 rules against specifying what
nothing tests.

`app/**` is therefore **excluded from coverage** (§13.2) rather than counted at zero.

---

## 16. Recording a Test Run (D-196)

This document describes **both the destination and the transition**, because during Build they
coexist — a document describing only the end state leaves the whole build period unspecified.

### 16.1 The destination

`record_test_run` writes a **`TestRun` row** (SPEC-09, `INT-004`; DM-001 §4). No markdown artifact
exists. `RPT-001`'s gate tile reads the most recent row (SPEC-05 BR-24, DM-001 §11.1).

### 16.2 The transition

| Stage                    | What records a run                                                         |
| ------------------------ | -------------------------------------------------------------------------- |
| Now → `INT-004` is built | `Standards (Technical + Linting)/scripts/generateTestReport.ts` — markdown |
| `INT-004` → cutover      | `Project Tracker/scripts/recordTestRun.ts` — a `TestRun` row               |
| After `CNV-005`          | The markdown path is deleted and `lintNoMarkdownState` forbids it          |

The script **moves into this module** (D-103): it `process.chdir`s to the module root before requiring
`@sap/cds`, which hardcodes a module name, and the root `CLAUDE.md` forbids that in the shared linter
folder. This module has no `scripts/` folder until then ([CLAUDE.md](../CLAUDE.md) §Carve-outs).

### 16.3 The `posttest` hook cannot record a failing run

**Measured at the SPEC-09 workshop on npm 10.9.3 (D-107): npm skips a `post` script when the main
script exits non-zero.** So a `posttest` hook records only passing runs, and `TestRun.failed > 0` —
which `SPEC-05` BR-10 depends on — is unreachable on the ongoing path.

**Consequence, and it is why §3.3 declares no `posttest`:** both gate call sites invoke
`npm run record-test-run` **explicitly**, after the test command, whatever its exit code. Safety comes
from **idempotence** (SPEC-09 FUT-013 — recording twice writes one row), not from a conditional.

**The exemplar's §12 is retired, not adapted.** Its rolling five markdown files under
`project/test-reports/` are among the artifacts `CNV-005` deletes, and SPEC-12 FUT-009 records that
those five are **untracked and gitignored**, so their deletion is the one irreversible part of the
decommission.

---

## 17. Enforcement

**Three linters really run. Everything else in this document is enforced by nothing, and saying which
is which is this section's whole job.**

### 17.1 Enforced

| Rule                                                    | Script                     | Status                                                                   |
| ------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------ |
| The `{data,support,tests}` contract (§12)               | `lint:test-structure`      | **Live** — runs in this module's 21-linter block, green on an empty tree |
| Imports + AAA, no inline payloads, one-line JSDoc (§11) | `lint:test-data`           | **Live**                                                                 |
| No CQL in a spec (§11)                                  | `lint:test-cql`            | **Live**                                                                 |
| The coverage **numbers** (§13.1)                        | `jest` `coverageThreshold` | Live once a `test` script exists                                         |
| Facades hold zero logic (§6, §13.2)                     | `lint:facades`             | **Live**                                                                 |

All five are already wired; three were verified running against this module's empty `test/` tree this
session, which is D-36's rule holding.

### 17.2 Enforced by nothing

| Rule                                                      | Consequence if broken                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| **The `setupFiles` lever (§4)**                           | **A silent pass** — the sharpest unenforced rule in this document |
| Every coverage target maps to a folder that exists (§13)  | The exemplar's own §8.3, unnoticed for six months                 |
| Tier boundaries (§5) — a test written at the wrong tier   | Duplication, or an assertion about the framework                  |
| The FUT contract (§14) — a FUT with no test               | Specified behaviour nobody built                                  |
| The assertable surface (§9) — asserting a dead annotation | A green test over an unenforced constraint                        |

**No linter is proposed here.** A shared linter asserting the lever would be a Standards change with
no story owning it, which is the thing D-22 rules against one level up. It is named as a candidate for
whoever writes the Build Plan, not specified as work.

**Answered 2026-08-15 by [BP-001](BUILD_PLAN.md) §11 (D-208): still no linter, and the lever gets an
in-module guard instead.** Story `SPEC-01`'s definition of done carries one assertion, in
`test/integration/`, that `CDS_TYPESCRIPT` is set at test time. `SPEC-01` is the earliest story that
can carry it, because it is the first with a `.ts` service implementation for the harness to load.
The other four rules in this table stay enforced by nothing and are re-listed as such in `BP-001` §15.2.

---

## 18. Amendments

**Six. Five applied in-session; one raised and owed.**

| #   | Target                                                                 | Change                                                                                                                                                                                                                                                                                                              | Status                |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | **`Financial Planner/CLAUDE.md`** §Test Rules                          | "cross-field `@assert`" struck from the list of annotation constraints a test should assert — the annotation does not exist at the pinned runtime (D-171). A **live agent instruction**, fixed on D-156's precedent. Its CDS bullet was corrected at Data Model; this second occurrence in the same file was missed | **Applied**           |
| 2   | [CLAUDE.md](../CLAUDE.md) §Loading a TypeScript Service Implementation | "The `cds.test` path is **not** settled" is superseded — it is settled here, and the answer reverses the assumption behind the sentence (D-187)                                                                                                                                                                     | **Applied**           |
| 3   | [CLAUDE.md](../CLAUDE.md) §Status                                      | The `test`-script line gains the measured mechanism: `jest` exits 1 with no tests and 0 with `--passWithNoTests`, so the hazard has a name and a workaround (D-186)                                                                                                                                                 | **Applied**           |
| 4   | [CLAUDE.md](../CLAUDE.md) §Folder Structure                            | `test/ (empty) ← Test Strategy stage` corrected — the structure is ruled here (§12); the folder is filled at Build (D-186), the same distinction D-160 drew for `db/`                                                                                                                                               | **Applied**           |
| 5   | [research/README.md](../research/README.md) §7                         | Gains a **Test Strategy row**, which it has never had. **Fifth occurrence** of the defect D-135 named — §7 is written when a document is created and not maintained when a consumer is added — and the second time the consuming stage fixed its own row                                                            | **Applied**           |
| 6   | **`Financial Planner/design/TEST_STRATEGY.md`** §8.3 and §3.3          | Three coverage-config discrepancies against its own `jest.config.ts` (§13.3), plus two settings its §3.3 omits. Another module's design document, D-12 markdown, belonging to a `/refresh-docs` sweep — the same class as the two Theme-stage items still owed                                                      | **Raised — Sandro's** |

**One thing deliberately not amended, and flagged rather than fixed.** [CLAUDE.md](../CLAUDE.md):31
says "Twenty linters run" while the module wires **21**. It is already on the open `/refresh-docs`
list; this document cites the measured 21 (§17.1) rather than the stale twenty, and the one-word fix
is left to that sweep rather than taken here.

---

## 19. Risks Assigned to This Stage

**None — and that is a check, not an assumption.** `research/README.md` §5's live rows were read this
session, and §7's routing table was read and found to have **no Test Strategy row at all** (§18,
amendment 5).

| Risk    | Disposition                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R4**  | Not this stage's — `INT-007`'s build (D-121). Not re-owned                                                                                                                           |
| **R7**  | Not this stage's — `INT-007`'s build (D-121). **This stage gives its drill a tier and a home** (§14.4, SPEC-11 FUT-007) and changes no owner                                         |
| **R10** | Not this stage's — `CNV-005` (D-119)                                                                                                                                                 |
| **R11** | Not this stage's — whoever next raises the `@sap/cds` pin (D-185). **Named here because it touches the harness:** a suite that shells out to `cds` inherits an unpinned global 9.7.2 |

**No risk is created here.** The harness measurement (§4) was an execution of an open _question_, not
of a registered risk — the question was handed down by D-180 and
[CLAUDE.md](../CLAUDE.md) §Loading a TypeScript Service Implementation, and no
`R-nn` row ever carried it. That it turned out to reverse an inherited belief is the argument for
executing questions the register never graded, not evidence that a row was missed.

**R11 is not settled here and must not be.** Adding `@sap/cds-dk` as a pinned root devDependency
collides with D-34 and is its own change, run with the suite green either side.

---

## 20. Open Items Resolved

**None — and that is measured, not assumed.** All five open items were closed before this stage
opened: OI-01 (D-31), OI-02 (D-29, D-30), OI-03 (D-35), OI-04 (D-70) and OI-05 (D-161), the last, at
Data Model. `PSV-001` §8 is the register and it carries no sixth row. **This stage opens none.**

---

## 21. Decisions Reference

| ID        | Title                                                                    | Summary                                                                                                                                                                                                                                                         |
| --------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-186** | The Test Strategy stage ships the document and nothing else              | No test, no `test` script, no `jest.config.ts`. D-160's reasoning one level on: a script added now is a green gate over zero tests. The exact script text and the measured `--passWithNoTests` escape are recorded so the first test story needs no discovery   |
| **D-187** | `cds.test` **can** load a TypeScript service implementation              | Measured: without the lever, 501 on an action **and a cross-field guard that silently accepted an invalid row**; with a `setupFiles` entry setting `CDS_TYPESCRIPT`, 4/4 green, 409 with its key, and the impl instrumented at 100%. No `tsx` needed under Jest |
| **D-188** | Four Jest tiers, plus two destinations that are not Jest                 | Unit, Integration (two entry points), Protocol, Script — plus the browser and one-time cutover verification. The exemplar's three-tier pyramid has no tier for 59 of this module's 180 FUTs                                                                     |
| **D-189** | The eleven verbs test as functions; only the transport needs the SDK     | Measured: `cds.connect.to` + `srv.tx({user})` reaches the real handlers under `cds.test` with no transport and no port — SPEC-01 BR-06/BR-07's own mechanism. Four FUTs need a real MCP client and get a thin protocol tier                                     |
| **D-190** | Four constraints assert as contract, six as logic, one not at all        | Derived from DM-001 §9, executed against Postgres 17.6. Two annotations a test must never assert: cross-field `@assert` (D-171) and field-level `@assert.unique` (D-172), and there is no `ASSERT_UNIQUE` key                                                   |
| **D-191** | The SQLite test profile's blind spot, and what covers each item          | `assert_integrity: 'DB'`'s `23503` has **no automated cover anywhere** — it is a seed defect caught by `CNV-004`'s reconciliation. Running the tier on Postgres was rejected: it trades a named blind spot for unnamed flakiness                                |
| **D-192** | Test data and file structure inherited wholesale; two new test types     | Nothing about this module's data argues for a different rule, and three linters already enforce it here. `protocol/` and `script/` join `unit/` and `integration/`; the linter keys on the role split, not a closed type list                                   |
| **D-193** | Coverage numbers inherited, layers re-mapped                             | Validators 100/100, Services + verbs + scripts 90/85, Overall 85/80, Facades and `mcp/server.ts` and `app/**` excluded. **No Utilities target** — this module has no utility layer. The exemplar's §8.3 was found wrong about its own repo in three ways        |
| **D-194** | A FUT is written at the outermost tier that can observe it, once         | Unit tests come from the 366 business rules, not from the 180 FUTs. All 180 classified: 59 script, 59 verb, 41 OData, 10 browser, 7 one-time, 4 protocol. The largest destination is a tier the exemplar does not have                                          |
| **D-195** | No in-repo frontend suite                                                | One FPM page with drafts OFF and near-zero controller logic; QUnit would test Fiori Elements, which the shared standards forbid. `/functional-test` and `/ux-test` run per story against the real servers. Cost stated: no UI regression net between stories    |
| **D-196** | Run recording describes the destination **and** the transition           | They coexist through Build. The `posttest` hook cannot record a failing run (D-107, npm 10.9.3), so both gate sites call `npm run record-test-run` explicitly and safety comes from idempotence. No `posttest` script is declared                               |
| **D-197** | No risk is assigned to this stage; R7's drill gains a tier, not an owner | §5's live rows and §7's routing table were read rather than assumed — §7 has no Test Strategy row at all, the fifth occurrence of D-135. SPEC-11 FUT-007 is R7's settling drill and is classified `script`; D-121's owner is unchanged                          |

---

_This document is the testing contract for Project Tracker — what a test may assert, which tier
asserts it, where it lives, what runs it, and what a coverage number means once you say it. It settles
the **4** questions the design documents defer to this stage by name across **2** files, and rules
nothing that [DM-001](DATA_MODEL.md), [TS-001](TECH_STACK.md), [DS-001](DESIGN_SYSTEM.md) or
[IA-001](INFORMATION_ARCHITECTURE.md) already settled. Decisions are logged in the
[Decisions Log](DECISIONS_LOG.md) at D-186 … D-197. **The harness question was executed, not
inherited**, and it reversed the belief this module would otherwise have carried. No test and no
script is written here; that is the first build story's (§3.3, §12)._
