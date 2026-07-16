# Standards (Documents)

Cross-module design documentation — the written standards every Life OS module follows.

**This folder is intentionally empty.** The standards exist, but they currently live in
[Financial Planner/design/](../Financial%20Planner/design/) because they were written for
the planner and still speak its vocabulary (FRICEW IDs, sprint waves, card entities).

Promote a document here once a second module proves which parts are the standard and
which were only ever the example. Moving them earlier would mean guessing — and a
standard invented for modules that do not exist yet is worse than one that is honestly
scoped to the module that does.

## Expected to move here

| Document                | Why it qualifies                                    |
| ----------------------- | --------------------------------------------------- |
| TECHNICAL_STANDARDS.md  | CDS/TypeScript/UI5 conventions — stack-level         |
| TEST_STRATEGY.md        | Test pyramid, coverage targets, test tree layout     |
| TECH_STACK.md           | The stack itself, identical for every module         |
| VERSION_CONTROL.md      | Branching, commits, tagging                          |

## Expected to stay per-module

Theme, functional specs, data model, business architecture — anything a second module
would answer differently.

## Related

Executable standards (ESLint rules, the lint suite, shared tsconfig) live next door in
[Standards (Technical + Linting)](<../Standards (Technical + Linting)>).
