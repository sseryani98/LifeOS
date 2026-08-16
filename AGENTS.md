# Life OS — Personal ERP

## What This Is

A personal ERP, built as a suite of modules over one shared stack. Single user, local
deployment, no cloud. Every module is the same kind of app — TypeScript + SAP CAP +
SAPUI5 + PostgreSQL, OData V4 between them — so the stack, standards, lint suite, and
test strategy are decided once here and inherited by every module.

## Modules

| Module                | Folder               | Status                                           |
| --------------------- | -------------------- | ------------------------------------------------ |
| **Financial Planner** | `Financial Planner/` | **Active** — in build, sprint W1-S3              |
| **Project Tracker**   | `Project Tracker/`   | **Active** — Plan phase; scaffolded, no code yet |
| Personal CRM          | —                    | Planned — relationship tracker                   |
| Investment Assistant  | —                    | Planned                                          |
| Wellness              | —                    | Planned — habits, journalling                    |

The list is open-ended. Two modules exist, and the second is a scaffold rather than a
build — so the conventions below are proven on one module and merely _survived contact_
with a second. Where Project Tracker has already falsified something, it is corrected in
place below rather than carved out in the module.

## Repo Layout

One git repo, one npm workspace. Modules are workspace packages — a module is a folder
with a `package.json` listed in the root `workspaces` array. The root holds modules and
standards, nothing else worth reading.

```text
Life OS/
  AGENTS.md                        This file
  Financial Planner/               Module (workspace package)
    AGENTS.md                      Module standards, architecture, current sprint
    package.json                   Module deps + cds config + lint:* wiring
    eslint.config.mjs              Re-export of the shared config
    tsconfig.json                  Extends the shared base
    design/                        Module design docs (specs, theme, data model)
  Project Tracker/                 Module (workspace package) — same four config files
    PLAN.md                        Continuity document — read first
    design/ research/              Plan-phase artifacts
  Standards (Documents)/           Written cross-module standards (empty — see its README)
  Standards (Technical + Linting)/ Executable standards
    eslint.config.mjs              The shared ESLint rules — single source for all modules
    tsconfig.base.json             Shared compilerOptions
    tsconfig.json                  Type-checks this folder's own scripts
    scripts/                       Shared lint suite (21 linters) + generateTestReport
```

`package.json`, `package-lock.json`, and `node_modules/` also sit at the root — npm
workspaces pins all three there and none can be relocated. They are hidden from the
editor via `.vscode/settings.json`, which is tracked so every clone gets the same view.
`.prettierrc.json` stays at the root too: Prettier discovers config by walking up from
the file it is formatting, so a module would never find it inside Standards.

## Shared vs Module

The split follows one test: would a second module answer this the same way?

| Decided once at root                       | Decided per module                       |
| ------------------------------------------ | ---------------------------------------- |
| Stack (CAP, SAPUI5, TypeScript, Postgres)  | Theme and design system                  |
| Coding standards + the lint suite          | Functional specs and business rules      |
| Test strategy, coverage targets, structure | Data model, CDS namespace, entities      |
| Git workflow and commit conventions        | Sprint plan and build waves              |
| Formatting, tsconfig base                  | Runtime deps, cds config, encrypted data |

## Standards

**The standards live in [Financial Planner/AGENTS.md](Financial%20Planner/AGENTS.md).**
They are cross-module in substance — CDS conventions, the Facade/Service/DataService/
Validator/Mapper handler pattern, i18n tiers, SAPUI5 rules, test rules — but they are
still written in the planner's vocabulary (`com.financialplanner`, card encryption,
churning domain). Read that file before writing code in any module — including Project
Tracker, which references it rather than restating it. They stay there until a second
module _in build_ separates the standard from the example; see §Still Undecided.

Rationale and worked examples sit under `Financial Planner/design/` —
TECHNICAL_STANDARDS.md, TEST_STRATEGY.md, TECH_STACK.md, VERSION_CONTROL.md are the
cross-module ones; THEME.md, DATA_MODEL.md, specs/ are planner-only. `Standards
(Documents)/` is where those four land once a second module earns the move.

## The Shared Lint Suite

`Standards (Technical + Linting)/scripts/` holds 21 architectural linters that no
off-the-shelf rule covers (facade purity, test structure, mapper placement, phantom
enforcement claims). They are shared because they encode standards, not planner
specifics. All 21 are wired into a module's `lint:*` block.

Every linter roots itself at `process.cwd()` and takes no arguments, which is what makes
one copy serve every module: an npm script runs with cwd set to its own module, so
`tsx "../Standards (Technical + Linting)/scripts/lintFacades.ts"` from a module lints
that module's tree. **A linter that hardcodes a path outside cwd, or a module name,
breaks this and belongs in the module.**

**A linter must also survive a folder that does not exist.** No module has every source
tree, and a scaffolded one has almost none. A missing scan root is skipped, never fatal —
crashing on it forces the next module to create empty folders to appease the suite, which
is the tail wagging the dog. Scaffolding Project Tracker found exactly this in
`lintNoTrackingIds.ts` (it scanned a `scripts/` folder only the planner has).

ESLint needs one extra hop. Flat-config `files` globs resolve against the config file
ESLint _loads_, not the one that authored the array — so a module's `eslint.config.mjs`
re-exports the shared config to root `srv/**` and `app/**` at the module.

## Adding a Module

Run `/scaffold-module` — it executes these six steps and reconciles this file afterward.

1. Create the folder and add it to `workspaces` in the root `package.json`.
2. `package.json` — module deps and cds config only. Copy the `lint:*` block from
   Financial Planner, then **audit it**: the 21 shared linters are module-relative, but
   the block also carries scripts that name a specific app folder (`lint:ui5` is
   `cd app/admin-master-data && ui5lint`). Those are planner text riding inside a block
   that is otherwise portable — drop or rewrite them. Keep
   `--no-error-on-unmatched-pattern` on the `eslint` leg; without it ESLint exits 2 on a
   source folder that has nothing in it yet.
3. `eslint.config.mjs` — re-export the shared config:
   `import base from "../Standards (Technical + Linting)/eslint.config.mjs";`
4. `tsconfig.json` — `"extends": "../Standards (Technical + Linting)/tsconfig.base.json"`.
5. `AGENTS.md` — module architecture, folder structure, and any carve-out from the
   shared standards. Do not restate the shared standards.
6. `.gitignore` — the root one does not cover CAP output. Each module needs its own for `gen/`,
   `@cds-models/`, `.cds-services.json`, `*.sqlite`, `coverage/` and the local Postgres
   artifacts named after its database. Without it the first `cds build` leaves generated
   files staged.
7. Run `npm install` from the root so the workspace links.

Then close out this file: the Modules table, §Undecided against the module's decisions
log, and any claim here the new module just disproved.

**Do not add a `test` script until the module has a test.** The root `npm test` runs
`--workspaces --if-present`; an absent script is skipped, while a present one with no
tests fails the whole repo.

### The CAP runtime is pinned, and that is now load-bearing

`@sap/cds` is pinned to an exact version at the root and in every module — not `^9`. With
two or more workspace packages npm hoists **one** CAP runtime for the entire repo, and
`@cap-js/cds-test` carries a `>=8.8` peer range that will happily pull a newer one, so a
floating range silently upgrades every module at once. That is not theoretical: 9.9.x
`await`s `cds.plugins` inside `bin/serve.js`, a dynamic import Jest's CJS VM rejects
without `--experimental-vm-modules`, which red-lines every `cds.test` suite in the repo.

Raise the pin as its own change, with the suite green before and after.

One related trap: `@cap-js/cds-types` creates `node_modules/@types/sap__cds` from a
`postinstall` keyed on `INIT_CWD`. An incremental `npm install` that does not re-fetch
that package leaves the symlink missing, and every module's `tsc` fails with
`TS2688: Cannot find type definition file for 'sap__cds'`. Re-run its postinstall from the
root rather than editing any `tsconfig.json`.

## Cross-Module Rulings

All three items this section held as undecided are now settled. They were open only
because one module cannot answer them; Project Tracker forced each one. Rationale is in
`Project Tracker/design/DECISIONS_LOG.md` at the cited `D-nn`.

- **CDS namespace — `com.lifeos.{module}`.** Project Tracker is
  `com.lifeos.projecttracker` (D-03). Financial Planner still declares
  `com.financialplanner`; its rename is **deferred, not cancelled** (D-16) — 65 files and
  192 occurrences, which is not a thing to run mid-sprint. New modules take the convention.
- **Cross-module data — isolated.** Each module gets **its own CDS model and its own
  Postgres database** (D-29). A Node process runs exactly one CAP project by construction,
  so separate models is the simple case, not the hard one; composing them would drag one
  module's Postgres binding, cron jobs and `ENCRYPTION_KEY` into another's process. Nothing
  reads across modules today. When something must, it goes over HTTP like any other remote
  system — not through a shared database.
- **Shell — one shared UI5 shell** across all modules (D-30). Non-negotiable. Financial
  Planner already runs the pattern for one module: a hand-built `sap.tnt.ToolPage` at
  `app/shell` hosting four apps as components.

  **The unfinished part is real and belongs to whoever builds the second module's UI.** A
  shared shell needs one HTTP **origin**, which is not the same as one CAP process — and
  D-29 gives every module its own process. OData data-source URIs in the app manifests are
  absolute server-root paths, so they resolve against whatever origin serves the shell
  page, not against the app's mount path. Cross-origin composition would probably work
  under `cds watch` (CAP defaults `cors: !production`) and stop working the moment
  `NODE_ENV=production` is set. **This has never been executed** — it is risk **R9** in
  `Project Tracker/research/README.md`, graded `Inferred`. Settle it with a second server
  on another port, one resource root, both components in one host page, before building
  cross-module shell navigation.

## Still Undecided

Do not invent an answer to these — ask.

- **Where the shared standards live.** They are still inside
  `Financial Planner/AGENTS.md`, written in the planner's vocabulary, and Project Tracker
  now references them from outside. That is the arrangement the §Standards section already
  describes as temporary. A second module in _build_ — not just scaffolded — is what should
  trigger the move to `Standards (Documents)/`.

## Conventions

- **Memory** at `.Codex/projects/c--Projects-Life-OS/memory/` is Life-OS-wide — the
  standards it records apply to every module, not just the planner.
- **Playwright MCP** (`.mcp.json`, root) validates frontend work in every module. **That file is
  gitignored** (`.gitignore:13`), so it is machine-local, not a repo artifact — a fresh clone has no
  MCP servers registered. Any server the repo depends on therefore ships as a **tracked installer
  script** under `Standards (Technical + Linting)/scripts/` rather than as a committed config; see
  Project Tracker D-32 (the `INT-006` hook) and D-44 (the `INT-001` verb server).
- **Commits** are Conventional Commits. Scope by module when a change is module-local.

## Do NOT

- Duplicate the shared standards into a module's AGENTS.md — reference them.
- Add a module-specific path or name to a shared linter — it serves every module.
- Declare shared tooling (eslint, tsx, typescript, jest) in a module's `package.json` —
  it belongs at the root, where every module inherits one version.
- Put anything at the repo root that is not a module or a Standards folder. If npm does
  not pin it there, it belongs inside one of them.
- Generalize from the planner alone. One module is not a pattern.

## Imported Claude Cowork project instructions

- Prefer concise answers over long, wordy ones
- Prefer cooperative experience instead of going for the solution directly
- Please validate any assumptions with a question to me/a web search
