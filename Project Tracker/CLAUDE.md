# Project Tracker — Scaffold

## What This Is

The project state of record for Life OS. It owns what `SPRINT_BOARD.md`, `DEFECT_LOG.md`, sprint
checkpoints and test reports hold today (D-01), and the agent fleet writes into it through an
in-process MCP verb layer rather than editing markdown (D-05). TypeScript + SAP CAP + SAPUI5 +
PostgreSQL — the same stack every Life OS module runs.

Sandro is the user. The agents are instruments writing into it, not users (D-04).

## Status

**Scaffold complete. No module code exists.** The folder is wired into the npm workspace and every
config resolves, but `db/`, `srv/`, `app/` and `test/` are empty by design — Scaffold produces
structure, not behaviour, and no FRICEW object has been built.

What this means concretely:

- **`npm run build` (`cds build`) succeeds and produces nothing.** It emits an empty
  `gen/srv/srv/csn.json` because there is no CDS model to compile. Treat a green build here as
  meaningless until the first build story creates the schema. **The Data Model stage does not** —
  `design/DATA_MODEL.md` (DM-001) is the entity contract and D-160 keeps the CDS files out of Design,
  because a schema written there would be code no test, gate or story covers.
- **There is no `test` script.** Adding one now would red-line the repo-wide `npm test` for a module
  with no tests. The Test Strategy stage adds it with the first test.
- **`npm run lint` passes and checks almost nothing.** Twenty linters run and find zero files. That
  is the correct result for an empty tree, not a green signal about code quality.

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
PLAN.md                      Continuity document — where the module is, what happens next
PRD.md                       Full product design; slice 1 is a small fraction of it
design/                      PSV, BUSINESS_ARCHITECTURE, specs/, IA, DESIGN_SYSTEM, THEME, DATA_MODEL, DECISIONS_LOG
research/                    Six research docs + README.md (pack index, risk register, gate verdict)
dashboard/                   The v1 HTML generator. Deleted by CNV-005 at cutover (D-02) — not yet
db/                          (empty)  ← Build. DM-001 is the contract; D-160 keeps the CDS out of Design
srv/                         (empty)  ← Workshops, then Build
  _i18n/                     (empty)  ← first service
app/                         (empty)  ← Information Architecture / Design System / Theme, then Build
test/                        (empty)  ← Test Strategy stage
```

## Carve-outs

Where this module departs from what Financial Planner does, and why.

- **No UI5 linter script, and no `@ui5/linter` dependency.** The planner's is `cd
app/admin-master-data && ui5lint` — a named app folder sitting inside a block the root `CLAUDE.md`
  describes as already module-relative. There is no app to point it at yet. Both return with the
  first UI5 app.
- **No `test` / `posttest` script.** See Status. The root `npm test` runs `--workspaces --if-present`,
  so an absent script is skipped and a present-but-testless one fails the whole repo.
- **No `scripts/` folder — until `INT-004`.** The planner has one for its `ENCRYPTION_KEY` generator,
  and this module encrypts nothing. It gains one anyway at `INT-004` (`scripts/recordTestRun.ts`,
  SPEC-09, D-103): that script must `process.chdir` to this module's root before requiring `@sap/cds`,
  which hardcodes a module name, and the root `CLAUDE.md` says a script that names a module belongs in
  the module rather than in the shared linter folder.
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

| #          | Risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Grade        | What would settle it                                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~**R9**~~ | **Two CAP processes serving into one shell page — EXECUTED and CLOSED 2026-08-06** at the Information Architecture stage (D-140), the settling test being the one the register named. Its premise was wrong: cross-origin composition fails under `cds watch` **too**, not only under `NODE_ENV=production`, because CAP's CORS middleware never sends `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`) while UI5's V4 model always sends `X-CSRF-Token`, so the `$batch` preflight is rejected. Also measured: an absolute `http://` dataSource URI **crashes CAP at boot** (`@sap/cds-fiori/app/routes.js:68`). **Ruling: one origin behind a reverse proxy (D-141)**, which leaves every manifest's relative `/service/...` URI unchanged. `RPT-001`…`RPT-004`, `FRM-001` and `FRM-002` are no longer provisional on it. | **Verified** | Settled. The **reverse proxy itself is untested** and its execution belongs to the **Tech Stack** stage; credentialed cross-origin (real auth, cookies, CSRF round-trip) was not exercised and is not needed under one origin |
| **R1**     | The D-05 spike ran on in-memory SQLite. Postgres is unproven — **repo-wide**, not only here. **Attempted at the Data Model stage, 2026-08-15, and blocked on a credential (D-168):** a server is listening on 5432, `pg_hba.conf` is `scram-sha-256` on every line with no `trust` entry, and no credential exists anywhere reachable. The declared `"password": ""` never reaches the server — it is falsy, so the driver throws a type guard before the handshake                                                                                                                                                                                                                                                                                                                                                                     | Inferred     | Repeat the spike against `@cap-js/postgres`. **Owner: the Tech Stack stage** (D-168), deadline before `INT-001` is built. Needs the `postgres` credential, or a deliberate `pg_hba.conf` change                               |
| **R4**     | `cds deploy` keeps one `cds_model` snapshot per Postgres schema, with `schema_evolution: "auto"` on by driver default                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Inferred     | Largely dissolved by D-29's separate databases; confirm on first deploy                                                                                                                                                       |
| **R7**     | The `INT-007` CSV round-trip is untested — a row-count check passes while `createdAt`/`createdBy` history is destroyed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Unknown      | Export → drop → `cds deploy` → compare row counts **and** managed-field values                                                                                                                                                |

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

**The ruling is the Tech Stack stage's to make** (D-33 records the mechanism, not the choice). What
is settled is that a mechanism exists and which one works; `INT-001` and `INT-004` are unblocked.

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
