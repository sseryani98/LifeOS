---
name: generate-build-plan
description: Run the Project Planning stage for a Life OS module — turn an approved design set into the sequence that builds it. Settle what a story is, what must be true before story one, how stories group into sprints, what a boundary runs, what a story's definition of done is, what each story hands the next, what work is real but is not a story, and what must not happen inside a sprint. Scout the design docs' deferrals, the wave plan and spec grouping that already exist, the exemplar's build plan as its files actually are, and the module's decisions log via subagents, settle each fork with Sandro one question at a time, schedule or re-own every risk the register still carries, then hand a build record to the build-plan-writer agent that writes design/BUILD_PLAN.md. Use whenever Sandro wants to run the Project Planning stage for a module, plan its build, decide its story cut or sprint shape, or says "run project planning", "generate the build plan", "what are the stories", "how many sprints", "what is the definition of done", "what has to be true before we start building", "when do we do the cutover"; or when Build is blocked because nothing says which object is built first, what finishing one means, or who does the setup work every design document assigned to "the first build story".
---

The Test Strategy stage settles **what proves a module works**. This stage settles **the order in which
it gets built** — what a story is, what has to exist before the first one, how they group, what
finishing one means, what each hands the next, and what work is real but belongs to no story at all.
It runs last in Plan + Design, because every input it sequences must be settled before it can be
ordered, and immediately before Build, because Build reads nothing else.

A module can have twelve Approved specs, a proven model, a working stack, a measured test strategy —
and still be unbuildable in the way that matters: a dozen documents that each assign setup work to
"the first build story" with no story of that name; a wave plan in a Scope-phase document that no
build persona is told to read; a definition of done nobody can state because the tests it names live
at six different destinations; and a list of deferred changes that quietly collide with the sprint
they land in. That gap is this stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/BUILD_PLAN.md`.
Financial Planner is the **worked example throughout — never the target**. If you find yourself
typing a module name into a path, stop; you have broken the thing that makes this skill serve the
next module.

Three things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.
- **Story IDs.** `INT-001`, `CNV-001`, `ENH-001`, `FRM-001` and `RPT-001` exist on more than one
  module's board and mean different things. Every cross-module reference is written with the module
  name attached. A seeded `Defect D-001` is not decision `D-01`.

**One thing is deliberately not module-local: the build chain.** The `/build` workflow, its agents and
the gate are repo-wide and already exist. A module's plan schedules work through them; it does not
re-specify them, and it must not invent a parallel one.

## Step 0: the predecessor's status

**Read the module's `design/TEST_STRATEGY.md` header before anything else** — or, where a module ran
no Test Strategy stage, its last status-bearing design document. If it is not **Approved**, say so in
your first message and ask Sandro to approve it or to authorise running on an unapproved input. Do not
flip the status yourself and do not proceed silently.

This check exists because it failed three stages running — `IA-001`, then `DS-001`, then `TH-001`,
each discovered by the stage after it (D-159, D-169 in Project Tracker's log). Moving the gate to
step 0 of Phase 6 is what held at the fourth, fifth and sixth opportunities. **Keep it there. Four
data points is not a proof — if you find a failure anyway, say so plainly rather than quietly
approving: a fix that stopped working is itself a finding.**

**This stage has a second gate the others do not.** It is the last before Build, so it is the last
chance to notice an unapproved spec. **Count the specs, count the Approved ones, and state both
figures** before planning anything. A story built from a Draft spec is a story built from a document
nobody agreed to.

## What this stage owns, and what it does not

| Owned here                                                     | Not here                                           |
| -------------------------------------------------------------- | -------------------------------------------------- |
| **What a story is** — spec, object, or something else, and why | Which objects exist (Business Architecture)        |
| **What must be true before story one**, and who does each part | The configuration itself (Tech Stack)              |
| **Sprint grouping and what a boundary runs**                   | The wave plan and dependency order (Scope)         |
| **A story's definition of done**                               | What a test may assert (Test Strategy)             |
| **How each story's Functional Unit Tests reach named tests**   | The tier list and coverage targets (Test Strategy) |
| **Cross-story contracts** — what one story hands the next      | What each object does (Workshops)                  |
| **Work that is real and is not a story**                       | Writing a new linter (Standards, its own change)   |
| **What must not happen inside a sprint**, and when it may      | Whether to make those changes at all (Sandro's)    |
| **Where this module's own build progress is tracked**          | The tracking tool's design (Workshops)             |

**This stage sequences; it does not build.** It writes no source file, no schema, no test and no
config. Whether it writes anything at all beyond the document is asked explicitly in Phase 3 — and the
answer has been "the document only" at every stage that asked.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer          | Reads                          | Breaks if                                                  |
| ----------------- | ------------------------------ | ---------------------------------------------------------- |
| `/build`          | The story list and its order   | A story is started before the thing it depends on exists   |
| `build-briefer`   | The story-to-spec mapping      | A brief cannot resolve which spec a story is               |
| `test-author`     | The per-story test obligations | A story's tests are written twice, or not at all           |
| `gate-runner`     | The definition of done         | The gate passes a story that has not finished              |
| Whoever cuts over | The sprint boundary procedure  | A one-time verification is never recorded                  |
| Sandro            | The deferred-change docket     | A repo-wide change lands mid-sprint and red-lines a module |

## The document standard

This section is the template. `build-plan-writer` reads it verbatim — do not paraphrase it into the
record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/BUILD_PLAN.md`) is **2,616 lines, 104 headings and 7 numbered
sections** (measured; re-measure rather than trusting this line — most of those headings are inside a
prompt playbook and a verbatim CLAUDE.md draft). It also splits its answers across **two** documents:
the sprint plan, the personas, the checkpoint ceremony and the definition of done live in
`PROJECT_MANAGEMENT.md`, not in the build plan at all.

**Three of its seven sections do not transfer**, and knowing why is the point:

| Its section        | Why it does not transfer                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| §3 CLAUDE.md draft | A verbatim replacement `CLAUDE.md` pasted into a design document. A scaffolded module already has one, maintained in place |
| §4 Scaffold Prompt | Scaffold is now its own stage with its own skill. A module reaching this stage ran it long ago                             |
| §6 Prompt Playbook | 32 hand-written prompts, written before the repo had an agent fleet, a `/build` chain and per-story workflows on disk      |

So: **the questions are fixed, the section list is derived from the module, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight.

| #   | The question                                                                         | Section it becomes         | Exemplar's answer shape                                        |
| --- | ------------------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------- |
| 1   | What is the record of this document?                                                 | Change History             | Table — 2 rows                                                 |
| 2   | What did this stage settle?                                                          | Summary                    | **Absent** — it opens straight into contracts                  |
| 3   | **What is a story, and how many are there?**                                         | The Story List             | **Absent** — stories are assumed to be FRICEW objects          |
| 4   | **What must be true before story one, and who does each part?**                      | Story Zero & Prerequisites | **Absent** — a Scaffold Prompt stands in its place             |
| 5   | What is the build order, and which document owns it?                                 | Build Order                | Split — PM-001 §3 owns waves, BP-001 §7 restates them          |
| 6   | How do stories group into sprints, and what makes a boundary?                        | Sprint Plan                | PM-001 §3 — a wave/sprint table                                |
| 7   | **What runs ON a boundary?**                                                         | Checkpoint Procedure       | PM-001 §5 — a ten-persona meeting                              |
| 8   | What is a story's definition of done?                                                | Definition of Done         | PM-001 §7 + BP-001 §5.1 — two lists, in two documents          |
| 9   | **How does each story's Functional Unit Tests reach named tests?**                   | Per-Story Test Obligations | **Absent** — FUTs appear nowhere in either document            |
| 10  | What does each story hand the next?                                                  | Cross-Story Contracts      | §2 — produces / consumed-by / contract, per sprint pair        |
| 11  | **Which stories create a shared surface that later stories extend?**                 | (folded into 10)           | §2.3 sync point 6, discovered rather than designed             |
| 12  | **What work is real and is not a story?**                                            | Non-Story Work             | **Absent**                                                     |
| 13  | **What must not happen inside a sprint, and when may it?**                           | Deferred Change Docket     | **Absent**                                                     |
| 14  | **Where is this module's own build progress tracked?**                               | Progress Tracking          | PM-001 §6 — a markdown board and defect log                    |
| 15  | How is a story actually driven — what runs it?                                       | Build Chain & Invocation   | §6 — 32 hand-written prompts, superseded by the `/build` chain |
| 16  | **What is mechanically enforced, and what is enforced by nothing?**                  | Enforcement                | **Absent as a section** — checklists imply enforcement         |
| 17  | What does this stage change in an upstream or Approved document?                     | Amendments                 | **Absent**                                                     |
| 18  | **Which risks are assigned here, and which does this stage first make schedulable?** | Risks                      | **Absent**                                                     |
| 19  | **Which open item does this stage own, and what is its ruling?**                     | Open Items Resolved        | **Absent**                                                     |
| 20  | Which decisions did this stage take?                                                 | Decisions Reference        | **Absent** — decisions live only in the log                    |

Questions 2, 3, 4, 9, 12, 13, 16, 17, 18, 19 and 20 are **not** sections in either exemplar
document. Every one exists because something the exemplar could take for granted — that a story is an
object, that a scaffold prompt is setup, that a human reads a board, that a plan is written by the
same person who executes it — stopped being true. **A module that is not the first in its repo faces
all of them.**

### Rules that hold at any module size

- **Do not restate the wave plan.** If a Scope-phase document already carries the waves, the critical
  path, the fan-in and the fan-out, **cite it and say you are not restating it**. Two orderings in two
  documents drift, and this repo has done exactly that before. Name which document owns the order.
- **Derive the story cut from the test contract, not from taste.** Wherever the Test Strategy
  attributes Functional Unit Tests — per spec, per object, per service — that granularity is already
  the story granularity, because a definition of done has to be stateable without re-cutting the FUTs.
  A cut that forces re-attribution is re-opening a settled decision.
- **Grep for "the first build story" and count what lands on it.** Every prior stage that deferred
  work used that phrase for a story that does not exist. Collect them all, in one table, with
  `file:line`. Then decide whether they are one story, and whether it is story zero or story one. **The
  count itself is a finding.**
- **A story's definition of done names its tests by ID, not by count.** A count cannot be checked. And
  where a spec's tests land at a destination that is not the test runner — a browser, a person, a
  one-time verification — say what "done" means for those, or the story cannot be finished at all.
- **A sprint boundary must run something, or it is decoration.** State what fires on it. Where nothing
  does, say so and drop the boundary rather than keeping a ceremony with no effect.
- **Schedule the risks nobody could schedule before.** This stage is often the first that can put a
  risk's settling drill on a calendar, because the drill needs a built thing. Scheduling is not owning
  — record which it is. And a risk whose settling change **cannot** run inside any sprint in the plan
  belongs on the deferred docket with the reason, not in a footnote.
- **Collect every deferred change in the repo into one docket, with its unblocking event.** Amendments
  raised and owed by earlier stages, pinned-dependency raises, cross-module renames, documentation
  sweeps. They tend to share one unblocking event; finding that out is worth the section on its own.
- **Never invent a story, a sprint, a ceremony or a gate.** If the plan needs something the design
  documents never asked for, that is an amendment raised with Sandro, not an addition made here.
- **State enforcement honestly.** This stage has the least mechanical backing of any: nothing validates
  a story cut, a sprint boundary or a definition of done. Name the parts that _are_ enforced — the gate
  commands and the live `lint:*` scripts — and then name the rest as unenforced. `lint:doc-claims`
  fails any `CLAUDE.md` line claiming enforcement without naming a live script or rule id, and the same
  honesty is owed by this document.

## Why this delegates its reading

The inputs are large, numerous and mostly settled: the wave plan and spec grouping, every design
document's deferral sentences, every spec's Functional Unit Test section, the exemplar's build plan
_and its sibling project-management document_, the decisions log and the risk register. Reading them
in the main thread spends the interview's context on content you will not re-litigate. **Send scouts;
get back findings with `file:line` citations.** When Sandro contradicts one — he will — read that one
line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent** as
explicitly as what is present, and to re-measure every count it reports rather than quoting one.

| Scout         | Reads                                                                                             | Returns (≤ ½ page, every claim cited `file:line` or as a command's output)                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **deferrals** | Every design document in the module, its `CLAUDE.md`, `PLAN.md`, and the decisions log            | Every sentence deferring to **this stage by name**; and **every occurrence of "the first build story" or its synonyms**, with what each assigns                      |
| **sequence**  | The Business Architecture's wave plan and spec grouping, and every spec's cross-reference section | The waves, the critical path, the fan-in/fan-out, the grouping table — and any place two documents state an order differently                                        |
| **precedent** | The exemplar's build plan **and its project-management sibling**, on disk                         | Both documents' real shape and line counts, which sections are artifacts the target module already has, and every place the documents disagree with the repo         |
| **decisions** | The module's decisions log, its plan, its test strategy and its research register                 | Decisions binding this stage (ID + one-line ruling), the next free `D-nn`, **every live risk with its owner and settling test**, and every amendment raised-and-owed |

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/BUILD_PLAN.md` already exists, this
   run is an **amendment**: read it yourself, in full, before anything else.
2. **Run Step 0** above on the predecessor document, **and count the specs and their statuses.**
3. **Grep the module's own documents for this stage by name yourself, and for "the first build
   story".** Delegating the reading is fine; these two lists are this stage's core input and you own
   them. State both counts before scouting. **Do not carry a list from a handoff prompt or from
   `PLAN.md`** — those are summaries, and replacing a summary with a measured list is this stage's
   first job. Say which items are genuinely handed down and which are the stage's own standing
   questions.
4. **Count the Functional Unit Tests per spec yourself** and check the figures against the Test
   Strategy's own contract table. If they disagree, the specs win and the disagreement is a finding.
5. Read the wave plan and the spec grouping yourself. They may already be the build order.
6. Read the exemplar's build plan **and its project-management sibling** yourself, and note which of
   their sections are artifacts your module already has or does differently.

## Phase 1: Scout

Spawn the four scouts above with the module, the deferral count, the "first build story" count, the
spec/FUT figures, and — on an amendment — the existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing **the decisions this stage inherits** — one line each, each citing the document that
handed it down — and ask whether that is the whole surface. Then walk the stage **question by
question**, in the standard's order. Present what the design documents already answer and ask if it is
accurate before moving to the gaps. **One question at a time.** A wall of questions gets one answer to
the last one.

## Phase 3: Planning interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **What is a story?** Spec, object, or something else. Ground it in where the Test Strategy
   attributes its FUTs, and in how large the biggest and smallest candidates are.
2. **The deliverable boundary.** Document only, or document plus something? Ground it in what every
   prior stage in this module shipped.
3. **Story zero.** Take the "first build story" table into this question. Is it one story or several,
   and is it a story at all or a human prerequisite? A story that adds a test runner with no test in it
   fails its own gate — check that before ruling.
4. **Build order.** Whether the existing wave plan already is it, and what this document then says
   instead of restating it.
5. **Sprint grouping, and what a boundary runs.** A boundary that fires nothing is a ceremony.
6. **The definition of done.** Baseline gate plus per-story test obligations. Handle the tests that are
   not runner tests explicitly.
7. **Cross-story contracts.** In particular: which story creates a shared surface — an app shell, a
   schema, a folder, a shared artifact — that later stories extend rather than create.
8. **Non-story work.** Things that must happen and belong to no story.
9. **The deferred change docket.** Every raised-and-owed amendment and every pinned-dependency raise,
   with its unblocking event.
10. **Progress tracking.** Where this module's own build is recorded. "Nowhere, and here is the record
    instead" is a legitimate answer and a common one.
11. **Don't stop early.** After the forks clear, ask what `build-briefer` would still have to guess and
    what `gate-runner` would have to assume on the first story. That is the bar.

When Sandro asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
rationale. Not a balanced menu. He is asking because he wants your judgment.

## Phase 4: Risks

The decisions scout returns every live risk with its owner. For each one, take exactly one position and
record which:

- **Execute it** — where the settling test is runnable now, in a scratch location outside the module's
  source tree, deleted afterwards. Report what happened, including a null result, and change the grade.
- **Schedule it** — where the settling test needs a built thing this plan creates. Name the story, the
  sprint and the FUT that runs it. **Scheduling is not owning**; say whose it stays.
- **Dock it** — where the settling change cannot run inside any sprint in this plan. Name the
  unblocking event and put it on the deferred docket.
- **Re-own it explicitly**, with the owner, the deadline, and why this stage was the wrong shape.

**Deferring silently is not one of the options.** If no risk is assigned here, **state that**, having
checked the register rather than assumed it — the check itself is the deliverable when the answer is
"none assigned". A pinned-runtime risk in particular is its own change, run with the suite green either
side; this stage may schedule it and must not raise it.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every sentence in any design document that defers to this stage by name has a ruling here.
- Every occurrence of "the first build story" resolves to exactly one named story or one named human
  prerequisite.
- Every FRICEW object appears in exactly one story, and every story maps to at least one object or is
  stated as a non-object story with its reason.
- Every story has a definition of done that names its tests.
- Every Functional Unit Test in every spec is claimed by exactly one story, and the totals match the
  Test Strategy's contract table.
- Every story that depends on a shared surface names the story that creates it.
- Every sprint boundary states what runs on it, or is dropped.
- Every live risk is executed, scheduled, docked or re-owned.
- Every raised-and-owed amendment in the repo appears on the docket with its unblocking event.
- Every question in the standard has a section, including those answered "none".
- No story, sprint, ceremony or gate appears that no design document, decision or measurement required.

## Phase 6: Production (delegated to build-plan-writer)

**The approval gate comes first in this list because it was skipped three stages running.** Read it
before you read the rest.

0. **The approval gate.** When the document exists, show Sandro the path and the Summary and ask for
   explicit approval. On approval, flip Draft → Approved and add the Change History row. **Do not
   report the stage closed without an answer to that question.** An unapproved artifact is owed work,
   and Build should not be the thing that discovers it.
1. Assemble the **build record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the deliverable-boundary ruling; the story definition with its
   reason; the full story list with each story's objects, spec and wave; story zero with every
   prerequisite and its owner; the build-order ruling and which document owns the order; the sprint
   grouping and what each boundary runs; the definition of done; per-story test obligations with
   measured FUT counts and tier destinations; cross-story contracts; the non-story work; the deferred
   change docket with each item's unblocking event; the build-chain ruling; the progress-tracking
   ruling; the enforcement inventory naming live scripts and stating what nothing checks; the risk
   outcomes; the open items resolved; the amendments this stage causes; the coverage-check result; and
   every decision taken (context, options, ruling, rationale, consequences). **It must be complete —
   the writer cannot ask Sandro anything.**
2. Invoke `build-plan-writer` with that record. It reads this skill's **document standard** section
   itself, writes `design/BUILD_PLAN.md` at status **Draft**, logs the decisions in the module's log at
   the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one question,
   add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence. In
   order of yield at the last three stages: **re-open every `file:line` you cite, at the end, after
   your own edits** — stage 11 found three of its own citations wrong this way and stage 10 found two;
   re-measure every count against the table it summarises; check every question in the standard has a
   section, including those answered "none"; and check every risk is executed, scheduled, docked or
   re-owned.
5. Apply the amendments in-session rather than leaving them owed, and show the list.
6. **Check the encoding survived the write.** Run `git diff | grep 'â€'` before committing. A
   PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file double-encodes every
   em-dash; a bash heredoc has failed on markdown punctuation; and an inline `python3 -c` or
   `python - <<'PY'` **fails the moment it prints a non-ASCII character**. What works: write the block
   to a scratch file with the Write tool, then `cat scratch >> target`; or a heredoc doing explicit
   `io.open(..., encoding='utf-8')` **that prints ASCII only**. Then run
   `npx --no-install prettier --write` on every markdown file touched — without it the editor reports
   MD060 table-alignment warnings on every table written.
7. Name the next stage — Build — and stop. Do not start it.

**One mechanical note that has cost six stages a delegation.** Claude Code resolves its agent registry
at session start, so a `build-plan-writer` authored in this session is **not invocable in it**. If the
agent is new, write the document in the main thread against this same standard and say that is what
happened; do not report a delegation that did not occur.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                    | Status                                                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| A verbatim `CLAUDE.md` replacement inside the build plan | **Superseded.** A scaffolded module has a maintained `CLAUDE.md`; a copy in a design document is a second source that drifts                |
| A Scaffold Prompt                                        | **Superseded by the Scaffold stage.** A module reaching Project Planning ran it, with its own skill and its own record                      |
| A 32-prompt Prompt Playbook                              | **Superseded by the `/build` chain.** Written before the repo had agents and workflows on disk. Plan the stories; the chain drives them     |
| Stories that are FRICEW objects by assumption            | **Ask the question.** Where the Test Strategy attributes FUTs per spec, a per-object cut re-cuts the FUTs and re-opens a settled decision   |
| Ten personas and a four-phase checkpoint meeting         | Fine as an answer, **not** as an inheritance. A module whose reviewers are agents with slash commands answers "none" — with the reason      |
| Definition of done split across two documents            | **One place.** Two lists in two documents is how a criterion goes missing from the one anybody actually opens                               |
| A sprint plan restating the wave plan                    | **Cite the wave plan.** Restating it produces two orderings that drift, which this repo has already done                                    |
| Per-sprint checklists of prose assertions                | Useful only where they name a test, a command or a measured figure. "UI matches design system" is not checkable and reads as though it were |

What **is** the standard: the twenty questions, a stated "none" over a dropped heading, a story cut
derived from the test contract, "the first build story" resolved to a named story, every FUT claimed by
exactly one story, every boundary running something, every deferred change docketed with its unblocking
event, enforcement stated honestly against live `lint:*` scripts, risks scheduled rather than described,
and a decisions table that makes every ruling citable by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops, IA, Design System, Theme, Data Model, Tech Stack or Test Strategy
  decision.** If a sequencing constraint makes a settled ruling impossible, that is an amendment raised
  with Sandro — not a quiet override. In particular: a spec grouping that already declares itself the
  build order is not re-cut here.
- **A design document's deferral is an input to this document, not a reference to it.** A sentence
  saying "the Build Plan orders this" is a requirement to satisfy, not documentation to cite back.
- **Do not plan what nothing specifies, and do not leave unplanned what every document assumed.**
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has the least enforcement of any.** Nothing mechanically validates a story cut, a sprint
  boundary, a cross-story contract or a definition of done. The gate commands and the shared `lint:*`
  suite enforce parts of the DoD and nothing else. **Say that plainly rather than implying enforcement
  that does not exist.**
