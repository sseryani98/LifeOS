# Project Tracker — Scaffold

## What This Is

The project state of record for Life OS. It owns what `SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint
checkpoints and test reports hold today (D-01), and the agent fleet writes into it through an
in-process MCP verb layer rather than editing markdown (D-05). TypeScript + SAP CAP + SAPUI5 +
PostgreSQL — the same stack every Life OS module runs.

Sandro is the user. The agents are instruments writing into it, not users (D-04).

## Status

**Build is under way. `S-00 Module Bootstrap` (2026-08-16) and `SPEC-01 MCP Intent-Verb Layer`
(2026-08-16) are done; `SPEC-02` is next.** The module now has a CDS model, one CAP service, a read
projection and an MCP verb server. It still has **no UI** — `app/` is empty by design and
`SPEC-04` fills it.

What this means concretely:

- **`npm run build` compiles a real model.** `db/schema.cds` declares the **25 persisted entities**
  the entity contract names, plus two read views that persist nothing. A green build here now means
  something.
- **The schema is deployed.** `cds deploy` ran clean against Postgres into the empty schema and left
  **27 base tables** — this module's 25, plus CAP's own `cds_model` and `cds_outbox_messages`. Code-list
  referential integrity is **live and measured**: an unseeded code is rejected with Postgres `23503`
  (D-229). **The store is empty of data** — the methodology library and the migrated workspace are
  `SPEC-02`'s and `SPEC-03`'s.
- **`npm test` is green over `90` tests in `16` suites**, across four tiers: unit, integration (both
  entry points), protocol and script. Coverage carries the global band plus **three** per-layer bands
  — Validators 100/100, Services 90/85, verbs 90/85. `./scripts/**/*.ts` still has none, and lands
  with `SPEC-09` (D-215, D-224).
- **`npm run lint` checks real code now.** Twenty-one linters over `srv/`, `mcp/`, `scripts/` and the
  test tree. `mcp/` was invisible to four of them until `SPEC-01` added it (D-225).
- **The verb server runs as its own process.** `npm run install-mcp` writes the gitignored
  registration; the server declares its caller through `PROJECT_TRACKER_ACTOR` (D-223) and every log
  line goes to stderr, because stdout carries JSON-RPC frames and nothing else (D-228).

`PLAN.md` is the continuity document — read it first for where the module sits in the methodology.
`design/DECISIONS_LOG.md` carries every `D-nn` cited below.

## Standards

**The shared Life OS standards are in [Financial Planner/CLAUDE.md](../Financial%20Planner/CLAUDE.md)
and they apply here in full** — CDS conventions, the Facade/Service/DataService/Validator/Mapper
handler pattern, TypeScript rules, i18n tiers, SAPUI5 rules, test rules, git workflow. They are
written in the planner's vocabulary because the planner was the only module when they were written;
substitute this module's namespace and domain.

Nothing in that file is restated here. This file carries only what is true of Project Tracker and
false or unknown of Financial Planner.

## Architecture

| Element           | This module                                                                                  | Source                      |
| ----------------- | -------------------------------------------------------------------------------------------- | --------------------------- |
| **CDS namespace** | `com.lifeos.projecttracker`                                                                  | D-03                        |
| **CDS model**     | Its own, not composed with Financial Planner's                                               | D-29                        |
| **Database**      | Its own Postgres database, `project_tracker`                                                 | D-29                        |
| **Access layer**  | A bespoke in-process MCP server exposing intent verbs — no CRUD, no raw SQL, no escape hatch | D-05, amended D-28          |
| **Frontend**      | SAPUI5 in TypeScript, transpiled to AMD (`cds-plugin-ui5` + `ui5-tooling-transpile`)         | Financial Planner precedent |
| **Shell**         | One shared UI5 shell across modules — non-negotiable                                         | D-30                        |
| **Hierarchy**     | sprint = Initiative, story = Milestone, methodology stage = Task, workflow step = Subtask    | D-08                        |

**What this module deliberately does not inherit from Financial Planner:** its CDS model, its
database, its Postgres binding, its `node-cron` background jobs, and its `ENCRYPTION_KEY`. D-29 makes
that separation structural — a Node process runs exactly one CAP project, so two models is the simple
case, and composing them would have dragged all four into this module's process. **This module
encrypts nothing and schedules nothing.**

Slice 1 is catalogued as 22 FRICEW objects in `design/BUSINESS_ARCHITECTURE.md` and serves Financial
Planner only (D-11).

## Folder Structure

Every source folder is empty. The stage that fills each one is named, because a folder tree that
looks populated when it is not is the thing most likely to mislead the next agent here.

```text
../                          Life OS monorepo root — `npm install` runs HERE
  package.json               Shared devDeps + the pinned CAP runtime (see Carve-outs)
  Standards (Technical + Linting)/
    eslint.config.mjs        The shared rules — this module's eslint.config.mjs re-exports them
    tsconfig.base.json       Shared compilerOptions — this module's tsconfig.json extends it
    scripts/                 The 21 shared linters, called by path from the lint:* block
.gitignore                   CAP generated output, coverage, local Postgres artifacts
.cdsrc.json                  assert_integrity: 'DB' — without it code-list integrity is imaginary
.env                         GITIGNORED. The Postgres role's password, and nothing else
jest.config.ts               The runner config; setupFiles carries the CDS_TYPESCRIPT lever
PLAN.md                      Continuity document — where the module is, what happens next
PRD.md                       Full product design; slice 1 is a small fraction of it
design/                      PSV, BUSINESS_ARCHITECTURE, specs/, IA, DESIGN_SYSTEM, THEME, DATA_MODEL, TECH_STACK, TEST_STRATEGY, DECISIONS_LOG
research/                    Six research docs + README.md (pack index, risk register, gate verdict)
dashboard/                   The v1 HTML generator. Deleted by CNV-005 at cutover (D-02) — not yet
db/
  schema.cds                 The 25 persisted entities + the two read views. No story after SPEC-01 adds one (D-205)
srv/
  tracker-service.cds        TrackerService at /service/trackerSvcs — the only service (D-178)
  tracker-service.ts         Entry point; registers the facade
  _i18n/                     i18n.properties (labels) + messages.properties (runtime keys)
  modules/shared/            baseFacade, logger, messagingUtility, constants
  modules/tracker/           Facade / Service / DataService / Validator / Mapper + milestoneStatus
mcp/                         A SIBLING of srv/, not under it (D-44)
  server.ts                  Bootstrap, stdout guard, tool registration, transport. Excluded from coverage
  verbs/                     The eleven intent verbs + shared/. Never imports the MCP SDK (D-228)
scripts/
  installMcpServer.mjs       Writes the gitignored .mcp.json registration (D-224)
app/                         (empty)  ← SPEC-04 builds the one FPM page
test/                        setEnv.ts (the lever) + {unit,integration,protocol,script,shared}/ — TST-001 §12
```

## Carve-outs

Where this module departs from what Financial Planner does, and why.

- **No UI5 linter script, and no `@ui5/linter` dependency.** The planner's is `cd
app/admin-master-data && ui5lint` — a named app folder sitting inside a block the root `CLAUDE.md`
  describes as already module-relative. There is no app to point it at yet. Both return with the
  first UI5 app.
- **A `test` script but no `posttest`, and no `record-test-run` yet.** `posttest` cannot record a
  failing run — npm skips a `post` script when the main one exits non-zero (D-107, D-196) — so both
  gate call sites will invoke `record-test-run` explicitly instead, from `SPEC-09`, which is also when
  the `scripts/recordTestRun.ts` it points at exists (D-213).
- **`scripts/` exists, and holds one `.mjs`.** ~~No `scripts/` folder until `INT-004`.~~ **Amended at
  `SPEC-01` (D-224):** BR-29 requires a tracked installer for the server registration, it names this
  module in every line, and D-103 puts such a script in the module rather than in the shared linter
  folder. It is `.mjs` deliberately — that keeps it out of `tsc`'s program and out of
  `./scripts/**/*.ts`, the coverage band `SPEC-09` owns. `scripts/recordTestRun.ts` still arrives at
  `INT-004` (D-213).
- **`@sap/cds` is pinned to `9.8.4`, not `^9`** — at the root and in both modules. With two workspace
  packages npm hoists one CAP runtime for the whole repo, so a floating range upgrades every module
  at once, silently. 9.9.x `await`s `cds.plugins` in `bin/serve.js`, a dynamic import Jest's CJS VM
  rejects without `--experimental-vm-modules`; it red-lines every `cds.test` suite in the repo. Raise
  the pin deliberately, with the suite green.
- **`eslint` runs with `--no-error-on-unmatched-pattern`.** ESLint exits 2 when a passed directory
  contains nothing lintable, which is the normal state of a scaffolded module. The flag makes an
  empty tree inert; a file with a real violation still exits 1.

## Open Risks

Carried from `research/README.md` §5 at the grade the research gave them. A risk graded `Inferred`
has not been executed — do not design as though it holds.

| #          | Risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Grade        | What would settle it                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**R9**~~ | **Two CAP processes serving into one shell page — EXECUTED and CLOSED 2026-08-06** at the Information Architecture stage (D-140), the settling test being the one the register named. Its premise was wrong: cross-origin composition fails under `cds watch` **too**, not only under `NODE_ENV=production`, because CAP's CORS middleware never sends `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`) while UI5's V4 model always sends `X-CSRF-Token`, so the `$batch` preflight is rejected. Also measured: an absolute `http://` dataSource URI **crashes CAP at boot** (`@sap/cds-fiori/app/routes.js:68`). **Ruling: one origin behind a reverse proxy (D-141)**, which leaves every manifest's relative `/service/...` URI unchanged. `RPT-001`…`RPT-004`, `FRM-001` and `FRM-002` are no longer provisional on it.                                  | **Verified** | Settled, **residual closed 2026-08-15 at Tech Stack (D-184)**: the reverse proxy is now **executed** — a 31-line zero-dependency `node:http` proxy carried the `$batch` POST **and** an OData write in a real browser under `NODE_ENV=production`, with zero CORS headers and zero preflights. Credentialed cross-origin remains unexercised and is not needed under one origin                 |
| ~~**R1**~~ | **The D-05 spike ran on in-memory SQLite — EXECUTED and CLOSED 2026-08-15** at the Data Model stage (D-170), the settling test being the one the register named. A model mirroring DM-001's shapes deployed with `cds deploy` to a real `project_tracker` database on **PostgreSQL 17.6** via `@cap-js/postgres`, driven by a 20-check suite: **20/20 pass** — `cds.app === undefined`, all three handler phases, a 409 named key, managed fields, `cuid`, transaction rollback, navigation properties and `ORDER BY`. **The first CDS model any Life OS module has deployed to Postgres.** The verdict did not move, but **four constraint mechanisms changed**: cross-field `@assert` does not exist (D-171), `@mandatory` emits `ASSERT_MANDATORY` (D-172), `assert_integrity` must be `'DB'` (D-173), and a projected entity needs `@cds.redirection.target` (D-174) | **Verified** | Settled. `SPEC-01` … `SPEC-09`, `SPEC-11` and `SPEC-12` are no longer provisional on it. Residual **closed 2026-08-15 at Tech Stack (D-181)**: a dedicated non-superuser `project_tracker` role, with the password reaching CAP as `CDS_REQUIRES_DB_CREDENTIALS_PASSWORD` from a gitignored `.env`. `"password": ""` is removed rather than filled — it throws client-side before the handshake |
| **R4**     | `cds deploy` keeps one `cds_model` snapshot per Postgres schema, with `schema_evolution: "auto"` on by driver default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Inferred     | Largely dissolved by D-29's separate databases; confirm on first deploy                                                                                                                                                                                                                                                                                                                         |
| **R7**     | The `INT-007` CSV round-trip is untested — a row-count check passes while `createdAt`/`createdBy` history is destroyed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Unknown      | Export → drop → `cds deploy` → compare row counts **and** managed-field values                                                                                                                                                                                                                                                                                                                  |
| **R11**    | **The `cds` command is a globally-installed, unpinned `@sap/cds-dk@9.7.2`** that appears in no file in this repo and is a patch line behind the pinned `@sap/cds@9.8.4`. Minted at Tech Stack (D-185) because D-180 makes `npm start` depend on it — `cds-serve` cannot load a TypeScript service impl and `cds serve` can, and the difference is code that lives only in the global CLI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Verified** | Add `@sap/cds-dk` as a **pinned root devDependency**. **Owner: whoever next raises the `@sap/cds` pin** — same change, and `cds-dk` depends on `@sap/cds`, so D-34's suite-green-either-side rule binds it                                                                                                                                                                                      |

**R2 is settled** — see below. **R3 and R8 are dissolved by D-29** (separate roots were the shared-
database hazard; the exporter never runs over Financial Planner's card portfolio).

## Loading a TypeScript Service Implementation

This module is TypeScript, and CAP does not load a `.ts` service implementation by default. Verified
on this machine at `@sap/cds` 9.8.4 / Node 22.19.0, both levers are required and they are independent:

1. **`CDS_TYPESCRIPT=true`** — CAP's `_sibling()` resolver only adds `.ts` to its extension list when
   this is set (`lib/srv/factory.js:46`). Without it the impl is never found and the service dispatches
   nothing; a `tsx` loader alone does not help, because the resolver never offers the file.
2. **A transforming loader — `tsx`.** Node 22.19 strips types natively, but the shared
   `tsconfig.base.json` sets `module: Node16`, under which TypeScript source imports a sibling as
   `./types.js`. Node's strip-only mode does not rewrite that back to `./types.ts` and the import
   fails; `tsx` resolves it. Financial Planner's `srv/` uses `.js` specifiers throughout, so this is
   the repo's idiom, not an edge case. Strip-only mode additionally rejects TS `enum` and `namespace`.

With both, a service loads outside `cds watch` with `cds.app === undefined` and no HTTP server.
`tsx` is already a root devDependency, so this adds nothing to install.

~~**The ruling is the Tech Stack stage's to make** (D-33 records the mechanism, not the choice).~~
**Ruled 2026-08-15 — `design/TECH_STACK.md` §7, D-180 — and the ruling is that the CLI already does
this for you, except where it does not.** Measured in a scratch project: `@sap/cds-dk`'s
`_prepareTsIfNeeded` (`bin/cds.js`) loads `tsx/cjs` **and** sets `CDS_TYPESCRIPT` whenever the command
is `serve` — directly or through `watch` — and a `tsconfig.json` sits at `cds.root`. This module has
one, so `cds watch` and `cds serve` need no configuration at all.

**`cds-serve` is not `cds serve`, and the difference is silent.** `cds-serve` is `@sap/cds`'s own bin,
invoked directly, and never passes through that file — it sets neither lever. Measured on one tree:
`cds serve` resolved `srv/probe-service.ts` and answered **200**; `cds-serve` resolved the generic
`app-service.js` fallback and answered **501 `Service "X" has no handler`**. **`npm start` is
therefore `cds serve`, not `cds-serve`.**

**Set both levers explicitly in anything that is not a `cds` command** — `mcp/server.ts` and
`scripts/recordTestRun.ts`. Set `process.env.CDS_TYPESCRIPT` _before_ requiring `@sap/cds`, and run
under a `tsx` loader.

~~The `cds.test` path is **not** settled: it belongs to Test Strategy (stage 11).~~ **Settled
2026-08-15 — `design/TEST_STRATEGY.md` §4, D-187 — and it reverses the assumption behind the
sentence.** `cds.test` **can** load a `.ts` service implementation. It needs **one** lever, not two:
`process.env.CDS_TYPESCRIPT` set in a Jest **`setupFiles`** entry, because `factory.js:46`'s extension
list is a module-load-time constant. No `tsx` loader is needed — CAP's `require` of the impl goes
through Jest's registry and ts-jest transforms it; `moduleNameMapper` resolves the `./types.js`
specifier. **Never set it per spec file.** Measured: without the lever, an action returns 501 but a
`before CREATE` cross-field guard simply never registers and the invalid row is written — **a silent
pass, not an error**. Financial Planner's suites carry the opposite belief in a comment and register
the Facade by hand; this module inherits that workaround nowhere.

## Do NOT

Module-specific only — the shared Do NOT list applies here too and is not repeated.

- **Do not read or write Financial Planner's entities, database, or model.** D-29 separates them
  structurally, and nothing in slice 1 needs a cross-module read.
- **Do not add a CRUD or raw-SQL path into project state.** D-05 removes the escape hatch on purpose;
  the intent verbs are what enforce the methodology, and a bypass makes them advisory.
- **Do not enable the two cutover guards** — the `PreToolUse` hook and `lintNoMarkdownState` — before
  cutover. While markdown is still authoritative they hard-deny legitimate Financial Planner work
  (D-07).
- **Do not backfill history that was never recorded.** No stage detail for finished stories, no
  migrated test reports (D-15, D-24). Invented history in the register that exists to be trustworthy
  is the defect this module was built to fix.
- **Do not raise the `@sap/cds` pin as a side effect of an install.** See Carve-outs.
