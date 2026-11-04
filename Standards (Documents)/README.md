# Standards (Documents)

Cross-module design documentation — the written standards every Life OS module follows.

| Document                                     | What it is                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| [CODING_STANDARDS.md](CODING_STANDARDS.md)   | The coding, test and git rules every module builds to. Imported by root `CLAUDE.md` |
| [METHODOLOGY_BLUEPRINT.md](METHODOLOGY_BLUEPRINT.md) | The stage methodology the harness runs                                |
| [HARNESS_BACKLOG.md](HARNESS_BACKLOG.md)     | Open harness work                                                           |
| [research/](research/README.md)              | Module-agnostic research packs — currently UI5 testing as a build gate      |

`CODING_STANDARDS.md` moved here from `Financial Planner/CLAUDE.md` on 2026-11-04, once a second
module (Project Tracker) was in build and had proved which parts were the standard and which were
only ever the planner's example. Its examples are still the planner's; its rules are not.

## Expected to move here

The rationale documents behind the standards still sit under
[Financial Planner/design/](../Financial%20Planner/design/) and still speak the planner's vocabulary.
Each follows the same path once a second module forces the standard apart from the example.

| Document               | Why it qualifies                                 |
| ---------------------- | ------------------------------------------------ |
| TECHNICAL_STANDARDS.md | Rationale and worked examples for CODING_STANDARDS |
| TEST_STRATEGY.md       | Test pyramid, coverage targets, test tree layout |
| TECH_STACK.md          | The stack itself, identical for every module     |
| VERSION_CONTROL.md     | Branching, commits, tagging                      |

## Expected to stay per-module

Theme, functional specs, data model, business architecture — anything a second module
would answer differently.

## Related

Executable standards (ESLint rules, the lint suite, shared tsconfig) live next door in
[Standards (Technical + Linting)](<../Standards (Technical + Linting)>).
