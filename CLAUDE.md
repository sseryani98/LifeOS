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
| **Project Tracker**   | `Project Tracker/`   | **Active** — in build; story status in `Project Tracker/PLAN.md` |
| Personal CRM          | —                    | Planned — relationship tracker                   |
| Investment Assistant  | —                    | Planned                                          |
| Wellness              | —                    | Planned — habits, journalling                    |

The list is open-ended. Two modules exist, and the second is four stories into its build — so
the conventions below are proven on one module and have only just _survived contact_
with a second. Where Project Tracker has already falsified something, it is corrected in
place below rather than carved out in the module.

## Repo Layout

One git repo, one npm workspace. Modules are workspace packages — a module is a folder
with a `package.json` listed in the root `workspaces` array. The root holds modules and
standards, nothing else worth reading.

```text
Life OS/
  CLAUDE.md                        This file
  Financial Planner/               Module (workspace package)
    CLAUDE.md                      Module standards, architecture, current sprint
    package.json                   Module deps + cds config + lint:* wiring
    eslint.config.mjs              Re-export of the shared config
    tsconfig.json                  Extends the shared base
    design/                        Module design docs (specs, theme, data model)
  Project Tracker/                 Module (workspace package) — same four config files
    PLAN.md                        Continuity document — read first
    design/ research/              Plan-phase artifacts
  Shared/                          Shared library (workspace package `lifeos-shared`) — code every module runs
    app/                           UI5 helpers, `com.lifeos.shared`: DialogManager, Messaging, I18n
  Standards (Documents)/           Written cross-module standards — CODING_STANDARDS.md lives here
  Standards (Technical + Linting)/ Executable standards
    eslint.config.mjs              The shared ESLint rules — single source for all modules
    tsconfig.base.json             Shared compilerOptions
    tsconfig.json                  Type-checks this folder's own scripts
    scripts/                       Shared lint suite (23 linters) + generateTestReport
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

**The standards live in [Standards (Documents)/CODING_STANDARDS.md](Standards%20(Documents)/CODING_STANDARDS.md)**
— CDS conventions, the Facade/Service/DataService/Validator/Mapper handler pattern, i18n
tiers, SAPUI5 rules, test rules, git workflow, the shared Do NOT list. The import below
loads it into every session, so it is in context before the first line of code is written.
A module's `CLAUDE.md` carries only what is true of that module: architecture, folder
structure, carve-outs. A carve-out there beats the shared rule.

@Standards\ (Documents)/CODING_STANDARDS.md

The file moved out of `Financial Planner/CLAUDE.md` on 2026-11-04, once Project Tracker was
in build. Its examples are still the planner's; its rules are not. Rationale and worked
examples sit under `Financial Planner/design/` — TECHNICAL_STANDARDS.md, TEST_STRATEGY.md,
TECH_STACK.md, VERSION_CONTROL.md are the cross-module ones and follow the same path when a
second module forces the vocabulary apart; THEME.md, DATA_MODEL.md, specs/ are planner-only.

## The Shared Lint Suite

`Standards (Technical + Linting)/scripts/` holds 23 architectural linters that no
off-the-shelf rule covers (facade purity, test structure, mapper placement, phantom
enforcement claims). They are shared because they encode standards, not planner
specifics. All 23 are wired into a module's `lint:*` block.

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

**Every `.ts` file is linted.** A module's ESLint leg is `eslint .`, never a folder list,
and the shared config ends in a catch-all that fails any `.ts` no `files:` glob covers.
ESLint skips an uncovered file inside a passed folder _silently_ — that is how `mcp/` went
unlinted from `SPEC-01` to 2026-10-30. A new source folder needs a `files:` glob and a
catch-all `ignores` entry, or `no-restricted-syntax` fails the build.

**The harness is linted too.** `npm run lint:harness` at the root runs `lintAgentPrompts.ts`, which
roots at the repo rather than a module: every `.claude/agents/*.md` must carry the memory block in
`Standards (Technical + Linting)/agentMemoryBlock.md` verbatim (`--write` restamps all of them), no
harness file may name a drive-letter path, every prose count of the linters must equal the
`lint*.ts` files on disk, and every `` `path.md` §Heading `` citation must name a heading that file
has. That last rule is what lets the build brief carry `layers` (`cap`, `ui5`) and every agent read
only the standards sections for the layers a story ships — the layer → section map in
`.claude/workflows/build.js` is checked against the headings, so a renamed section fails the build
rather than sending an agent to read the whole file. Rules about the codebase live in CLAUDE.md files only; an agent file is role,
prohibitions and memory, and a workflow prompt carries run-specific context plus a pointer.

## Adding a Module

Run `/scaffold-module` — it executes these seven steps and reconciles this file afterward.

1. Create the folder and add it to `workspaces` in the root `package.json`.
2. `package.json` — module deps and cds config only. Copy the `lint:*` block from
   Financial Planner, then **audit it**: the 23 shared linters are module-relative, but
   the block also carries scripts that name a specific app folder (`lint:ui5` is
   `cd app/admin-master-data && ui5lint`). Those are planner text riding inside a block
   that is otherwise portable — drop or rewrite them. The `eslint` leg is `eslint .`, which
   an empty scaffold passes without the old `--no-error-on-unmatched-pattern` flag.
3. `eslint.config.mjs` — re-export the shared config:
   `import base from "../Standards (Technical + Linting)/eslint.config.mjs";`
4. `tsconfig.json` — `"extends": "../Standards (Technical + Linting)/tsconfig.base.json"`.
5. `CLAUDE.md` — module architecture, folder structure, and any carve-out from the
   shared standards. Do not restate the shared standards.
6. `.gitignore` — the root one does not cover CAP output. Each module needs its own for `gen/`,
   `@cds-models/`, `.cds-services.json`, `*.sqlite`, `coverage/` and the local Postgres
   artifacts named after its database. Without it the first `cds build` leaves generated
   files staged.
7. Run `npm install` from the root so the workspace links.

When a module gains its first UI5 source, it also gains its **UI5 test leg** (Financial Planner
D-331 is the worked example): a `ui5-test-runner.json` at the module root on a module-own port, a
`ui5-test.yaml` beside each app's `ui5.yaml`, a `test:ui5` script calling
`Standards (Technical + Linting)/scripts/runUi5Gate.ts`, chained from `posttest`, and the
`coverage-ui5/`, `report-ui5/` and `.nyc_output-ui5/` gitignore lines. Not before: a gate over zero
files is a meaningless green.

When a module gains its first UI5 app, add it to the root `package.json` under
`ui5.ui5parser.proxyWorkspaces`. Without that entry the VSCode ui5plugin parses the repo
root as JavaScript, so TypeScript handlers show as "not found". The plugin's rules are
cross-module: they live in `Standards (Technical + Linting)/ui5plugin.json`, never in a
module's `package.json`.

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

`ui5-tooling-transpile` is pinned exactly for the same reason (Financial Planner D-332). At 3.13.1
and below, its `coverage` option instruments nothing under `cds-plugin-ui5`, with no warning.
Moving the pin can silently zero the UI5 coverage gate. After a move, re-run a deliberately failing
threshold.

One related trap: `@cap-js/cds-types` creates `node_modules/@types/sap__cds` from a
`postinstall` keyed on `INIT_CWD`. An incremental `npm install` that does not re-fetch
that package leaves the symlink missing, and every module's `tsc` fails with
`TS2688: Cannot find type definition file for 'sap__cds'`. Re-run its postinstall from the
root rather than editing any `tsconfig.json`.

## Build Order

Across modules, until Project Tracker's cutover: **`PT-W1` → `PT-W2` → `PT-W3` (cutover) → Financial
Planner's `CNV-001`** (Project Tracker D-13, D-202), all inside the planner's open `sprint/W1-S3`.
Read position from `Project Tracker/PLAN.md` §1, not the planner's board. Delete this section at
cutover, when `next_action` answers for every module.

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

  A shared shell needs one HTTP **origin**, which is not the same as one CAP process — and
  D-29 gives every module its own process. **Settled: one origin behind a reverse proxy**
  (D-141, executed D-184). Cross-origin composition fails under `cds watch` too, not only in
  production — CAP's CORS middleware never sends `Access-Control-Allow-Headers`, so UI5's
  `$batch` preflight is rejected — and an absolute `http://` dataSource URI crashes CAP at
  boot. The proxy is `Standards (Technical + Linting)/scripts/serveOneOrigin.mjs`; every
  manifest keeps its relative `/service/...` URI. Detail: `Project Tracker/CLAUDE.md` §Open Risks.

## Still Undecided

Nothing at the moment. The last item — where the shared standards live — closed 2026-11-04
with the move to `Standards (Documents)/CODING_STANDARDS.md`. When something lands here, do
not invent an answer — ask.

## Conventions

- **Memory** at `.claude/projects/c--Projects-Life-OS/memory/` is Life-OS-wide — the
  standards it records apply to every module, not just the planner.
- **Playwright MCP** (`.mcp.json`, root) validates frontend work in every module. **That file is
  gitignored** (`.gitignore:13`), so it is machine-local, not a repo artifact — a fresh clone has no
  MCP servers registered. Any server or hook the repo depends on therefore ships as a **tracked installer
  script** under `Standards (Technical + Linting)/scripts/` rather than as a committed config; see
  Project Tracker D-32 (the `INT-006` hook) and D-44 (the `INT-001` verb server). Run `node "Standards (Technical + Linting)/scripts/installHooks.mjs"` once per clone; it registers the per-edit linter hook. Run `installUi5PluginConfig.mjs` from the same folder too; it points the VSCode ui5plugin at the shared `ui5plugin.json`, which the plugin accepts only as an absolute path.
- **Defect sweep** — `/defect-sweep <Module>/<Story>` runs the bounded test-fix loop: functional
  and UX testers in parallel, Medium-and-worse findings fixed test-first, one commit per round, stop
  when a round raises nothing Medium+ or after five rounds. Behaviour the spec leaves open is logged
  "needs Sandro", never defaulted. `/defect-sweep --pick` is the scheduled mode: it rotates through
  Done stories by `.claude/defect-sweep/ledger.md`. Run
  `node "Standards (Technical + Linting)/scripts/installDefectSweepTask.mjs"` once to schedule it
  every Wednesday 23:00 (Windows Task Scheduler; `--uninstall` removes it). It needs a clean tree,
  a sprint branch and local Postgres up, and stops otherwise. Rules: `.claude/skills/defect-sweep/SKILL.md`.
- **Commits** are Conventional Commits. Scope by module when a change is module-local.

## Do NOT

- Duplicate the shared standards into a module's CLAUDE.md — reference them.
- Add a module-specific path or name to a shared linter — it serves every module.
- Declare shared tooling (eslint, tsx, typescript, jest) in a module's `package.json` —
  it belongs at the root, where every module inherits one version.
- Put anything at the repo root that is not a module, `Shared/` or a Standards folder. If npm
  does not pin it there, it belongs inside one of them. `Shared/` holds runtime code more than one
  module runs (UI5 helpers today, CAP later); a module consumes it as the `lifeos-shared`
  devDependency, which cds-plugin-ui5 serves at `/lifeos-shared`.
- Generalize from the planner alone. One module is not a pattern.
