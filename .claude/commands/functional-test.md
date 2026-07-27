---
description: Run a story's Functional Unit Tests against the built UI in a real browser and report a pass/fail matrix. Verifies only — never fixes.
argument: FRICEW story ID (e.g. FRM-001). Omit to take the story most recently marked Build Done, Awaiting Review.
---

Your job is **resolution and rendering**. The `functional-tester` agent does the testing — you do
not read the spec, you do not drive the browser, and you do not fix what it finds.

This is methodology stage 4 of the Sprint Build chain, after `/code-quality` and `/test-quality`.
It answers a narrower question than smoke: *does each Functional Unit Test in the spec actually
pass against the running app?*

## 1. Resolve the story

| `$ARGUMENTS` | Do |
| --- | --- |
| A FRICEW ID (`FRM-001`, `ENH-003`) | Use it |
| Empty | Take the story currently **Build Done, Awaiting Review** |
| Anything else | Resolve it against the story backlog. One match, use it; otherwise ask |

Stop rather than run if:

- **The story has no spec.** The FUTs live in `SPEC-nn §8`; with no spec there is nothing to
  verify. Say so and recommend `/workshop`.
- **The spec has no `§8 Functional Unit Tests` section, or none `Covers:` this story.** That is a
  real gap in the spec, not a reason to invent checks. Report it and stop.
- **The build gate is not green.** Functional testing a red build measures the gate, not the story.

One story per invocation.

## 2. Confirm before spending

State the shape: the story, the module, how many FUTs `Covers` it, and that a browser session runs.
Get a yes.

## 3. Invoke

Spawn the `functional-tester` agent with the story ID and the module directory. It classifies each
FUT as UI-exercisable or backend-only, drives the UI-exercisable ones, and returns a matrix.

## 4. Render the result, then stop

Lead with the tally — passed / failed / blocked / out-of-UI-scope — then the matrix, one row per
FUT: `FUT id | Covers | verdict | observation`.

Three things deserve calling out rather than being left in a table row:

- **Any `fail`** — quote the expected-vs-observed mismatch, and name the single one a human should
  look at first.
- **Any `blocked`** — a blocked FUT is neither a pass nor a fail. Say what blocked it; a
  precondition that cannot be set up through the UI is a finding about the story, not a skip.
- **A high `out-of-UI-scope` count** — if most of a story's FUTs are backend-only, the spec wrote
  Jest-tier assertions as functional tests. Worth saying once; it is a spec-quality signal.

## 5. Then stop

**Fix nothing.** The agent is read-only against the tree by design and so are you here. A failing
FUT goes to Sandro, who decides whether it is a defect in the build or a defect in the spec — those
route to completely different places and the distinction is his to make.

If everything passed, say the stage is complete and name the next one: **UX Test** (`/ux-test`,
`FRM-*` stories only), then **Human Review**. Do not invoke either.
