# Life OS — Personal ERP

## What This Is

A personal ERP, built as a suite of modules over one shared stack. Single user, local
deployment, no cloud. Every module is the same kind of app — TypeScript + SAP CAP +
SAPUI5 + PostgreSQL, OData V4 between them — so the stack, standards, lint suite, and
test strategy are decided once here and inherited by every module.

## Modules

| Module                | Folder               | Status                                |
| --------------------- | -------------------- | ------------------------------------- |
| **Financial Planner** | `Financial Planner/` | **Active** — the only module in build |
| Personal CRM          | —                    | Planned — relationship tracker        |
| Project Tracker       | —                    | Planned                               |
| Investment Assistant  | —                    | Planned                               |
| Wellness              | —                    | Planned — habits, journalling         |

The list is open-ended. Financial Planner is the only module that exists; treat every
convention below as proven on exactly one module, and expect a second module to expose
what is genuinely shared versus what only ever fit the planner.

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
  Standards (Documents)/           Written cross-module standards (empty — see its README)
  Standards (Technical + Linting)/ Executable standards
    eslint.config.mjs              The shared ESLint rules — single source for all modules
    tsconfig.base.json             Shared compilerOptions
    tsconfig.json                  Type-checks this folder's own scripts
    scripts/                       Shared lint suite (20 linters) + generateTestReport
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

**The standards live in [Financial Planner/CLAUDE.md](Financial%20Planner/CLAUDE.md).**
They are cross-module in substance — CDS conventions, the Facade/Service/DataService/
Validator/Mapper handler pattern, i18n tiers, SAPUI5 rules, test rules — but they are
still written in the planner's vocabulary (`com.financialplanner`, card encryption,
churning domain). They stay there until a second module separates the standard from the
example. Read that file before writing code in any module.

Rationale and worked examples sit under `Financial Planner/design/` —
TECHNICAL_STANDARDS.md, TEST_STRATEGY.md, TECH_STACK.md, VERSION_CONTROL.md are the
cross-module ones; THEME.md, DATA_MODEL.md, specs/ are planner-only. `Standards
(Documents)/` is where those four land once a second module earns the move.

## The Shared Lint Suite

`Standards (Technical + Linting)/scripts/` holds 20 architectural linters that no
off-the-shelf rule covers (facade purity, test structure, mapper placement, phantom
enforcement claims). They are shared because they encode standards, not planner
specifics.

Every linter roots itself at `process.cwd()` and takes no arguments, which is what makes
one copy serve every module: an npm script runs with cwd set to its own module, so
`tsx "../Standards (Technical + Linting)/scripts/lintFacades.ts"` from a module lints
that module's tree. **A linter that hardcodes a path outside cwd, or a module name,
breaks this and belongs in the module.**

ESLint needs one extra hop. Flat-config `files` globs resolve against the config file
ESLint *loads*, not the one that authored the array — so a module's `eslint.config.mjs`
re-exports the shared config to root `srv/**` and `app/**` at the module.

## Adding a Module

1. Create the folder and add it to `workspaces` in the root `package.json`.
2. `package.json` — module deps and cds config only. Copy the `lint:*` block from
   Financial Planner verbatim; the paths are already module-relative.
3. `eslint.config.mjs` — re-export the shared config:
   `import base from "../Standards (Technical + Linting)/eslint.config.mjs";`
4. `tsconfig.json` — `"extends": "../Standards (Technical + Linting)/tsconfig.base.json"`.
5. `CLAUDE.md` — module architecture, folder structure, and any carve-out from the
   shared standards. Do not restate the shared standards.
6. Run `npm install` from the root so the workspace links.

## Undecided

Do not invent an answer to these — ask.

- **CDS namespace.** The planner uses `com.financialplanner`. Whether later modules
  become `com.lifeos.{module}`, and whether the planner gets renamed, is not decided.
- **Cross-module data.** Nothing is shared between modules yet. Whether they read each
  other's entities, share a database, or stay isolated is open.
- **Shell.** Each module has its own UI5 shell today. Whether Life OS gets one shell
  over all modules is open.

## Conventions

- **Memory** at `.claude/projects/c--Projects-Life-OS/memory/` is Life-OS-wide — the
  standards it records apply to every module, not just the planner.
- **Playwright MCP** (`.mcp.json`, root) validates frontend work in every module.
- **Commits** are Conventional Commits. Scope by module when a change is module-local.

## Do NOT

- Duplicate the shared standards into a module's CLAUDE.md — reference them.
- Add a module-specific path or name to a shared linter — it serves every module.
- Declare shared tooling (eslint, tsx, typescript, jest) in a module's `package.json` —
  it belongs at the root, where every module inherits one version.
- Put anything at the repo root that is not a module or a Standards folder. If npm does
  not pin it there, it belongs inside one of them.
- Generalize from the planner alone. One module is not a pattern.
