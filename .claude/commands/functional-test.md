---
description: Run a story's Functional Unit Tests end-to-end against the running app — browser, OData or MCP verbs, on a throwaway Postgres database — probe for integrity, validation and bug findings, and report a pass/fail matrix. Verifies only — never fixes.
argument: Story ID as the module's BUILD_PLAN defines it (FRM-001, SPEC-02), optionally Module/ID. Omit to take the story most recently built and awaiting review.
---

Your job is **resolution and rendering**. The `functional-tester` agent does the testing — you do
not read the spec, you do not drive the app, and you do not fix what it finds.

This is methodology stage 4 of the Sprint Build chain, after `/code-quality` and `/test-quality`.
It answers what the green gate cannot: the gate ran Jest against the **test profile** (in-memory
SQLite, harness wiring). This asks *does each Functional Unit Test hold against the app as it really
runs* — real Postgres, real server, the interface a client actually calls — *and what breaks next to
it?* It is not limited to the UI: a FUT driven through an MCP verb or an OData call is tested through
that interface, not marked out of scope.

## 1. Resolve the story

Story IDs are module-defined (`design/BUILD_PLAN.md`); the same string can exist in two modules.

| `$ARGUMENTS` | Do |
| --- | --- |
| `<Module>/<ID>` | Use it |
| A bare ID | Match it against every module's BUILD_PLAN story list. One match, use it; more, ask |
| Empty | The story awaiting review: Build Done on a module's board, or — board-less module — built in the tree and not yet logged as Done in its progress record |
| Anything else | Resolve it against the story lists. One match, use it; otherwise ask |

Stop rather than run if:

- **The story has no spec.** The FUTs live in the spec's `Functional Unit Tests` section — found
  by heading text, not by number, because the template and the built specs disagree on it. With no
  spec there is nothing to verify. Say so and recommend `/workshop`.
- **The spec has no `Functional Unit Tests` section, or none `Covers:` this story.** That is a
  real gap in the spec, not a reason to invent checks. Report it and stop.
- **The build gate is not green.** Functional testing a red build measures the gate, not the story.
- **A `/build` run for this story is still in progress.** The tree is moving under you.

One story per invocation.

## 2. Confirm before spending

State the shape: the story, the module, how many FUTs it carries and which surfaces they run
through (browser / OData / verb / script), and that every write lands on a throwaway Postgres
database created and dropped for the run — never the module's configured one. Then proceed; the
stop conditions above are the only reasons to wait.

## 3. Invoke

Spawn the `functional-tester` agent with the story ID and the module directory. It creates the
scratch database, drives every FUT through its real interface, probes each for integrity,
validation and repeat-call defects, drops the database, and returns a matrix plus findings.

## 4. Render the result, then stop

Lead with the tally — passed / failed / blocked / internal-only, plus the findings count — then the
FUT matrix (`FUT id | Covers | surface | verdict | observation`), then the findings table.

Call these out rather than leaving them in a table row:

- **Any `fail`** — quote the expected-vs-observed mismatch, and name the single one a human should
  look at first.
- **Any finding** — a FUT can pass while a probe beside it fails. Group by kind (integrity /
  validation / repeat), each tied to its `BR-nn` where it has one.
- **Any `blocked`** — neither a pass nor a fail. Say what blocked it; a precondition only SQL could
  create is a finding about the story, not a skip.
- **Any `internal-only`** — a FUT with no external interface is a Jest-tier assertion written as a
  functional test. Worth saying once; it is a spec-quality signal.
- **The scratch database was not dropped** — say so with its name.

## 5. Then stop

**Fix nothing.** The agent is read-only against the tree by design and so are you here. A failing
FUT or a finding goes to Sandro, who decides whether it is a defect in the build or a defect in the
spec — those route to completely different places and the distinction is his to make.

If everything passed with no findings, say the stage is complete and name the next one: **UX Test**
(`/ux-test`, stories that ship UI only), then **Human Review**. Do not invoke either.
