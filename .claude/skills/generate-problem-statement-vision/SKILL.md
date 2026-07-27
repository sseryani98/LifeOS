---
name: generate-problem-statement-vision
description: Run the Ideate stage for a Life OS module — scout whatever prior material already exists via subagents, map it against the Problem Statement & Vision template, interview Sandro one question at a time on the gaps only, settle scope and the in/out boundary, then hand an ideate record to the vision-writer agent that writes design/PROBLEM_STATEMENT_AND_VISION.md. Use whenever Sandro wants to start a new module, kick off the Plan phase, or says "let's ideate", "start the Project Tracker module", "write the problem statement", "run Ideate for X", "we need a vision doc"; or when a downstream stage (Scope, Business Architecture, a workshop) is blocked because the module has no problem statement to trace back to.
---

Ideate is **stage one of the Plan phase** and the first artifact a module ever gets. Everything
downstream — the FRICEW catalogue, the specs, the data model — traces back to it. Get the problem
wrong here and every later stage inherits the error.

This is an **interview**, not a document review. Sandro holds the problem; whatever prior material
exists holds part of the answer. Your job is to arrive knowing everything that material already
answers, so every question you spend on him is one only he can answer.

The methodology is `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` §3–§5.1 — it is the authority;
this skill is the harness that runs it. Unlike `/workshop`, there is no separate methodology doc for
this stage: the template and the question bank live here.

**Root at `process.cwd()`.** Resolve one module folder in Phase 0 and write only inside it. Never
hardcode a module name — Financial Planner is the worked example, not the target.

## What is different about this stage

- **Ideate runs before Scaffold.** The module has no `package.json`, no lint suite, no npm scripts,
  and possibly no `design/` folder. Depend on none of them; create `{module}/design/` if absent.
- **The module may not exist in the root `workspaces` array yet.** That is Scaffold's job. Do not
  edit root files here.
- **Prior material is common and lopsided.** A module often arrives with a PRD, a handoff note, or a
  blueprint section. That material is reliably *solution-space rich and problem-space poor* — it
  says what to build, rarely what breaks today, almost never what "solved" looks like. Treat that as
  a prior to verify, not a conclusion.
- **The artifact is amended, not finished, here.** On the planner, PSV-001 was written at Step 0 and
  amended by the domain validation, the aggregator spike, and the data model
  (`Financial Planner/design/PROBLEM_STATEMENT_AND_VISION.md` change history). It reached **Approved**
  only when the design phase closed. Write the Ideate-time version. Do not front-run later stages.

## Why this delegates its reading

Prior material runs to thousands of lines (the Project Tracker PRD alone is ~1,500), plus the
sibling module's artifact set and the repo standards. The interview is the long part of the session
and it needs the room. **The gap map is a byproduct of research; the interview is the deliverable.**
Never trade interview context for reading you could have delegated.

Scouts return citations, not just conclusions. When Sandro contradicts a finding — he will — read
that one `file:line` then.

## Phase 0: Resolve + Scout

1. Resolve the module. Accept a folder name ("Project Tracker") or a module name. If the folder
   exists, use it. If the argument is missing or matches nothing, list the top-level folders that
   are not Standards folders, `node_modules`, or dotfolders, and ask which one — don't guess. If the
   module is genuinely new and has no folder, confirm the folder name with Sandro before creating it.
2. Spawn these three `Explore` scouts **in one message** so they run concurrently.

| Scout | Reads | Returns (≤ ½ page, every claim cited `file:line`) |
|---|---|---|
| **prior-material** | Everything already inside `{module}/` — PRD, handoff or kickoff notes, drafts — plus any blueprint section naming this module | Section-by-section coverage of the §Template below: **settled / partial / empty**, with the citation. The decisions already made. Every contradiction *between* prior sources. Whether any source declares itself superseded, disposable, or unratified. |
| **precedent** | A sibling module's `design/PROBLEM_STATEMENT_AND_VISION.md` and `design/DESIGN_PHASE_TIMELINE.md`, if one exists | Doc conventions to match: ID scheme, status field, change-history shape, decisions-log path and D-nn numbering. Which sections carried real weight into later stages — and **which were that module's own answer rather than the template**. |
| **repo-constraints** | Root `CLAUDE.md` (esp. §Undecided and §Do NOT), `Standards (Documents)/`, `Standards (Technical + Linting)/` | Constraints binding this module. Which cross-module "undecided" questions this module may force a ruling on (namespace, cross-module data, shell). Anything the repo forbids that a naive vision would assume. |

Tell each scout to report what is **absent** as explicitly as what is present. A missing answer is a
question for Sandro; an answer already on disk is one you must not waste his time on.

## Phase 1: Gap Map (internal)

Assemble the scouts' findings into a coverage table over the §Template — one row per section:
`section | settled / partial / empty | source (file:line) | what is still missing`.

Pre-populate everything the prior material answers. Mark the rest `[IDEATE]`.

**Show Sandro the table, not the content.** Ten status rows, no prose. He needs the chance to say
"you've misread the PRD" before you build a whole interview on it. This diverges from `/workshop`,
which hides its pre-draft — justified because there the docs are ratified and here the prior
material usually is not. **Never dump the pre-draft itself**; that turns him into a proofreader.

## Phase 2: Confirm the Settled + Rule on Contradictions

1. State what you read as **already decided**, as a terse list, and ask only whether any line is
   wrong. Do not re-elicit these. Re-asking a settled question is the main way this stage wastes his
   time.
2. Put every contradiction the prior-material scout found to him **as a ruling, one at a time**:
   source A says X, source B says Y, here is which I'd keep and why. Never resolve one silently —
   a contradiction between a PRD and a later note is usually a real reversal of a stated principle,
   and it is exactly the kind of thing only he can settle.
3. Establish source precedence explicitly: which prior document wins where they overlap, and whether
   any is superseded or unratified. Record it — the writer needs it.

## Phase 3: Gap Interview

Work each `[IDEATE]` placeholder in template order, **one question at a time**. A wall of questions
gets one answer to the last one.

| Section | Ask for |
|---|---|
| **Who** | The user, their context, and the concrete scale facts that size the system — counts, volumes, cadence, how long this has been going on. |
| **Core Problem** | What breaks **today**, in the present tense. What was tried before and why it was abandoned. The cost of not building it. |
| **Vision** | You draft this from his answers; he validates. One paragraph, steady state, scoped to what is actually being built. |
| **The Question It Answers** | The single guiding question, then unpack every loaded word in it. |
| **Problems to Solve** | Invert the prior material's feature list into problems. Get them **ranked**, each with a priority and a one-line why. Which one is the foundation the others rest on? |
| **What "Solved" Looks Like** | A concrete depiction of steady state — the routine day or week, specific enough to be falsifiable. Not adjectives. |
| **Scope / Out of Scope** | Phase 4. |
| **Open Items** | You propose; he confirms. |

- **Ground questions in his real situation.** Concrete beats hypothetical — he answers "what happens
  when the sprint board and git disagree" far better than "how should state be reconciled".
- **When he asks for a recommendation — give one**, with rationale. Not a balanced menu. He's asking
  because he wants your judgment; a menu hands the work back to him.
- He thinks creatively when prompted and will raise ideas belonging to later stages — a data model,
  a screen, a tech choice. Capture them as forward notes. Don't design them here. **Ideate is
  problem-space.** Solution detail that arrives now belongs to Scope, Data Model, or Tech Stack, and
  putting it here front-runs a stage that has its own tooling.
- **Don't stop early.** After the placeholders clear, ask what you haven't probed. Move on only when
  you honestly have no more questions.

## Phase 4: Scope and the Boundary

The highest-value output of this stage and the hardest, so it gets its own phase.

1. Propose the **in-scope** list for the first slice, as a list he can strike lines from.
2. Then the boundary, split into two labelled groups — **prior material almost never separates
   these, and conflating them is a real defect**:
   - **Deferred** — a later slice will do it. Say which signal promotes it.
   - **Not a goal** — the system will never do it. This is the group prior material lacks entirely;
     you will have to elicit it.
3. Confirm the slice is small enough that the artifacts downstream of it stay short.

## Phase 5: Decisions and Open Items

- Propose numbered **decisions** (D-nn) from the conversation — context, options considered, ruling,
  rationale — presented **in batches by topic**. He reviews related decisions together and answers
  by index. Use the sibling module's numbering scheme if this module has no decisions log yet;
  otherwise continue the module's own sequence.
- Propose **open items** (OI-nn): every question you left unresolved, each phrased as the decision it
  raises and when it must be settled. A question you noticed and dropped is the failure mode here.
  Anything the repo lists as cross-module undecided that this module now forces belongs on this list.

## Phase 6: Production (delegated to vision-writer)

The interview is done; the writing happens in an isolated **vision-writer** agent so producing the
document never competes for context with the conversation you just held.

1. Assemble the **ideate record** — the handoff artifact. It carries: the resolved module folder and
   name; the source precedence ruling; every confirmed section answer; the ranked problems with
   priorities; the in-scope list; the deferred list and the not-a-goal list, kept separate; the
   approved D-nn; the OI-nn; the doc conventions the precedent scout returned; and any forward notes
   for later stages. It must be complete — **the writer cannot ask Sandro anything.**
2. Invoke **vision-writer** with that record. It writes
   `{module}/design/PROBLEM_STATEMENT_AND_VISION.md` at status **Draft**, seeds or appends the
   module's decisions log, and returns its Definition-of-Done check.
3. If vision-writer returns a **gap** instead of a file, the interview left a hole. Ask Sandro that
   one question, add his answer to the record, and re-invoke. Do not fill the hole yourself.
4. Review the returned DoD check. Show Sandro the file path and a one-line summary and ask for
   explicit approval **to proceed to the Scope stage**. The status field stays `Draft` — this
   document is amended by every later Plan and Design stage and only reaches `Approved` when the
   design phase closes.
5. **Then clean up the scratch input.** If a prior source declared itself disposable — a kickoff or
   handoff note written to warm-start this conversation — offer to delete it, but only after you
   have verified that every decision it carried is now in the artifact or the decisions log. Deleting
   it while it still holds the only record of a ruling is data loss. Never delete a PRD, a blueprint,
   or anything that did not declare itself scratch.
6. Name the next stage — Scope / Business Architecture — and its tooling. Do not run it unasked.

## The Template

Ten sections, in this order:

`Who` · `Core Problem` · `Vision` · `The Question It Answers` · `Problems to Solve` ·
`What "Solved" Looks Like` · `Design Decisions` · `Scope` · `Out of Scope` · `Open Items`

Plus the module's doc header (ID, version, date, status) and a Change History table, per the
conventions the precedent scout returns.

**A module may add one domain-inventory section** — the planner's "Current Card Landscape" is the
example — when there is a concrete real-world inventory that sizes the system and every later stage
will need. That was the planner's answer, not the template. **Do not add it by default, and do not
carry the planner's "Conversion Scope" section forward**: data conversion is a Scope-stage concern
and it only ever fit a module migrating years of existing records.

## Rules

- **No `[IDEATE]` placeholder survives into the artifact.** It marks an unasked question, and
  shipping one means the interview didn't finish.
- **Ideate is problem-space.** No entities, no screens, no framework choices. If a sentence
  describes *how* rather than *what problem* or *what solved looks like*, it belongs to a later
  stage. The exception is a solution constraint Sandro has genuinely already ruled on — record it as
  a decision, not as design.
- **Deferred is not out of scope.** Label the two groups separately or the boundary is untrustworthy.
- **Every problem is ranked.** An unranked problem list cannot drive the wave plan the Scope stage
  builds from it.
- **One module is not a pattern.** Where a sibling module's PSV made a choice, ask whether it was
  the template or that module's answer. The precedent scout is instructed to flag the difference;
  respect its answer.
- **This artifact is the traceability root.** Close it with the convention the precedent scout
  returns — every later design decision and FRICEW object must trace back to a problem stated here.
  If a later stage cannot trace to it, this document is incomplete.
- Sandro wants cooperative, non-rushed, assumption-validating interaction. Validate every assumption
  you are carrying before you build on it, and say out loud which ones you are carrying.
- You write only inside `{module}/`. You never touch root files, `Standards (…)/`, or another
  module — Scaffold owns the root wiring.
