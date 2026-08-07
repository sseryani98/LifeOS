---
name: generate-information-architecture
description: Run the Information Architecture stage for a Life OS module — scout the UI-bearing specs and the shell as it actually is on disk via subagents, settle page decomposition, build technology, navigation and shell placement with Sandro one question at a time, execute or re-own any risk assigned to this stage, then hand an IA record to the ia-writer agent that writes design/INFORMATION_ARCHITECTURE.md. Use whenever Sandro wants to run the IA stage for a module, decide how its screens compose and connect, or says "run information architecture", "generate the IA", "how do these pages fit together", "where does this screen live", "Fiori Elements or freestyle"; or when Design System, Theme or a build is blocked because nobody has decided how the module's surfaces decompose into pages and how a user reaches them.
---

The Workshops stage settles **what each surface holds**. This stage settles **how those surfaces
become pages, how a user reaches each one, and what they are built with.** It runs sixth because
every spec that carries UI hands layout and interaction here explicitly — and before Design System
and Theme, because those style what this stage names.

A module's specs can all be Approved and its UI still be unbuildable: nobody has said whether the
four Reports are one route or four, whether the Form is a dialog or a page, or which app the whole
thing lives in. That gap is this stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is
`design/INFORMATION_ARCHITECTURE.md`. Financial Planner is the **worked example throughout — never
the target**. If you find yourself typing a module name into a path, stop; you have broken the thing
that makes this skill serve the next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; Project
  Tracker's is `design/DECISIONS_LOG.md`. Resolve the module's actual log; never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

## What this stage owns, and what it does not

| Owned here                                                                     | Not here                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Page and **route** decomposition — what is a route, what is in-page disclosure | The **content** of each surface: sections, fields, ordering, empty states (Workshops, already settled) |
| **Build technology per object** — Fiori Elements or freestyle                  | Controls, density, spacing, chart conventions (Design System)                                          |
| Navigation: entries, landing page, cross-page links, deep links                | Colour, typography, radius, the CSS contract (Theme)                                                   |
| Entry points and the discoverability audit                                     | Entities and attributes (Data Model)                                                                   |
| **Where the module's UI sits in the shared shell, and which origin serves it** | The serving stack itself (Tech Stack)                                                                  |

**The build-technology ruling is this stage's, and it is the one people expect elsewhere.** Fiori
Elements versus freestyle is not a styling choice: it decides whether an entity is draft-enabled,
whether the annotation-UX rules in the shared standards bind at all, and whether a surface is
described by CDS annotations or by an XML view. Design System styles what exists; it cannot decide
what exists. Rule it here, per object, with the reason.

**Shell placement is this stage's too, and it is not optional.** Root `CLAUDE.md` makes one shared
UI5 shell across modules non-negotiable, and a shared shell needs one HTTP **origin**, which is not
the same as one CAP process. Where the module's page is reached from, and which origin serves it, is
an IA answer — say it even when the answer is "unchanged, one origin, one shell".

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                               | Reads                                                                                                                                                          | Breaks if                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/ux-test` → `ux-tester`               | `design/INFORMATION_ARCHITECTURE.md` for nav structure, landing page, cross-page links, where a page sits in the journey (`.claude/agents/ux-tester.md:24-25`) | The document is missing — the agent stops rather than reviews — or names pages that do not exist |
| Design System                          | The page and route inventory it is styling                                                                                                                     | A surface is unnamed, so nothing specifies its density or layout                                 |
| Data Model                             | Draft enablement, which follows from the Fiori Elements ruling                                                                                                 | The ruling is deferred, leaving a draft filter written against an undecided model                |
| Build (`build-briefer`, `implementer`) | Which app folder, which route, which technology per object                                                                                                     | An object has a spec and no page                                                                 |
| Tech Stack                             | The origin and serving constraint this stage records                                                                                                           | An origin assumption reaches build unexecuted                                                    |

## The document standard

This section is the template. `ia-writer` reads it verbatim — do not paraphrase it into the record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/INFORMATION_ARCHITECTURE.md`) carries ten sections built
around a sitemap, cross-page navigation and entry points — concepts that assume **many** pages. A
module with one page has different content and the same questions.

So: **the questions are fixed, the section list is derived from the surface, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                      | Section it becomes         | Exemplar's answer shape                                   |
| --- | --------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------- |
| 1   | What is the record of this document?                                              | Change History             | Table                                                     |
| 2   | What did this stage settle?                                                       | Summary                    | `Aspect \| Outcome` table                                 |
| 3   | Which objects ship UI, and onto what surface does each land?                      | Surface Inventory          | The exemplar folds this into its sitemap                  |
| 4   | What is a route, and what is in-page disclosure?                                  | Page & Route Decomposition | Sitemap validation                                        |
| 5   | Fiori Elements or freestyle, per object, and why?                                 | Build Technology           | Absent — the exemplar inherited it from its Design System |
| 6   | How is each surface reached — nav, landing, deep link, contextual link?           | Navigation & Entry Points  | Cross-Page Navigation + Entry Points                      |
| 7   | Where does the module's UI live in the shared shell, and which origin serves it?  | Shell Placement & Origin   | Absent — one module, one origin, never asked              |
| 8   | Is every surface reachable, and by how many paths?                                | Discoverability Audit      | Reachability table                                        |
| 9   | What journeys does the vision doc's falsifiable checks measure, and do they work? | Task Flow Mapping          | Per-journey step tables                                   |
| 10  | What does this stage change in an Approved spec?                                  | Spec Amendments            | `Spec \| Amendment \| Decision` table                     |
| 11  | Which decisions did this stage take?                                              | Decisions Reference        | `ID \| Title \| Summary` table                            |

Questions 5 and 7 are **not** in the exemplar and are not optional. The planner never faced them —
it had one origin and a Design System that predated its IA. Every module after the first faces both.

### Rules that hold at any surface size

- **Every count is measured against the artifact, never carried from the exemplar.** The exemplar
  describes a 23-app module; nothing numeric in it transfers.
- **A navigation claim names both ends and the trigger.** "RPT-002 → RPT-003 on story-ID click" is a
  claim. "The pages are linked" is not.
- **A drill-down target must already be addressable.** Specs state the values a navigation target
  needs; if a target's addressing value does not exist in a spec, that is a spec amendment, not an
  invention here.
- **Wave-gating is a UX ruling, not a build note.** Say whether an unbuilt surface is hidden,
  disabled, or absent from the document's scope.
- **Amendments to Approved specs are listed, not applied silently.** §10 is the record; the edit
  itself is made in-session by the host.

## Why this delegates its reading

The inputs are large and mostly settled: every UI-bearing spec in full, the exemplar, the module's
research pack, and the shell as it exists on disk. Reading them in the main thread spends the
interview's context on content you will not re-litigate. **Send scouts; get back findings with
`file:line` citations.** When Sandro contradicts one — he will — read that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count it reports rather than quoting one.

| Scout         | Reads                                                                                                                                                                           | Returns (≤ ½ page, every claim cited `file:line`)                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **surface**   | Every spec in `design/specs/` that carries a Form, Report or Workflow — §3 and §7 — plus `design/BUSINESS_ARCHITECTURE.md`'s Forms/Reports/Workflows sections                   | One row per UI-bearing object: sections it holds, the addressing values its drill-down states, its stated empty states, and **every sentence that defers a decision to this stage, quoted**                  |
| **precedent** | The exemplar IA, the module's research pack, and the shell/app sources as they are **on disk**                                                                                  | The shell mechanism as actually implemented — files, counts, mount paths, resource roots — re-measured; and which exemplar answers are the planner's alone                                                   |
| **decisions** | The module's decisions log, `design/PROBLEM_STATEMENT_AND_VISION.md`, and whatever holds its plan (`PLAN.md` on Project Tracker, `design/PROJECT_MANAGEMENT.md` on the planner) | Decisions binding this stage (ID + one-line ruling), open items it could resolve, **risks assigned to it by ID with what would settle each**, and the vision doc's falsifiable checks that measure a journey |

## Step 0: the predecessor's status

**Read the status of every document this stage consumes before anything else** — here, the
UI-bearing specs. If one is not **Approved**, say so in your first message and ask Sandro to approve
it or to authorise running on an unapproved input. Do not flip a status yourself and do not proceed
silently.

This check exists because it failed twice in a row: this stage and the Design System stage each
closed without asking for approval of their own output, and the following stage discovered it. See
the approval gate in Phase 6.

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/INFORMATION_ARCHITECTURE.md`
   already exists, this run is an **amendment**: read it yourself, in full, before anything else.
2. Read the exemplar yourself — `Financial Planner/design/INFORMATION_ARCHITECTURE.md`. You need its
   shape verbatim to know what you are keeping and what you are deriving away.
3. **Derive the UI surface from the catalogue, not from memory.** Every Form, every Report, every
   Workflow that renders. State the list and its count before scouting; a missed object is a page
   nobody specifies.
4. If the module has **no Approved specs for those objects**, say so plainly and ask whether to
   proceed. IA over a Draft spec is IA over a moving target.

## Phase 1: Scout

Spawn the three scouts above with the module, the resolved object list, and — on an amendment — the
existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing the UI-bearing objects — one line each, ID + name + what it contributes — and ask
whether the surface looks right. Surface errors are cheap now and expensive after the structure is
decided.

Then walk the stage **question by question**, in the standard's order. Present what the specs already
answer and ask if it is accurate before moving to the gaps. **One question at a time.** A wall of
questions gets one answer to the last one.

## Phase 3: Structure interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **Page and route decomposition.** "One page" is a composition statement, not a route count. Test
   it against the specs' own behaviour: a Report that renders **one** of many records, or a section
   that renders **only on expansion**, implies either a second route or an in-page disclosure. Decide
   which, per case, and say what the browser URL does.
2. **Build technology, per object.** Fiori Elements or freestyle. Ground it in what the object is:
   an annotation-described list over one entity is FE's case; a composed page assembling several
   payloads from one service call is freestyle's. Name the consequence you are buying — draft
   enablement, whether the annotation-UX rules bind, and what a build persona writes.
3. **Entry points and landing.** What is the first thing seen, and what does a returning user do
   first? Ground it in the vision doc's falsifiable checks — one of them usually measures exactly
   this.
4. **Navigation.** Nav entries, contextual links, deep links. For each link name source, target,
   trigger, and the addressing value it uses. A link whose addressing value no spec produces is a
   spec amendment.
5. **Where every write surface lives.** A Form used at a boundary — sprint close, onboarding, a
   monthly ritual — competes for the same real estate as the thing used daily. Decide deliberately
   rather than defaulting it onto the main page.
6. **Shell placement and origin.** Which shell, which nav group, which mount path, which origin. If
   the module is the second one in the shell, the origin question is live whether or not anyone has
   asked it.
7. **Wave-gating.** Hidden until built, visible but disabled, or out of the document's scope.
8. **Don't stop early.** After the forks clear, ask what a build persona would still have to guess.
   That is the bar.

When Sandro asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
rationale. Not a balanced menu. He is asking because he wants your judgment.

## Phase 4: Risks assigned to this stage

The decisions scout returns any risk the module's register or decisions log **assigns to this
stage**. For each one, take one of exactly two positions and record which:

- **Execute it.** Run the settling test the register names, in a scratch location outside the
  module's source tree, and report what happened — including a null result. An executed risk changes
  its grade from `Inferred` to `Verified` and that grade goes in the document.
- **Re-own it explicitly**, with the owner, the deadline, and why executing here was the wrong shape.

**Deferring silently is not one of the options.** A risk recorded with an owner and no execution is
the failure mode that assigning an owner was supposed to fix; a stage that inherits a risk and does
not mention it is indistinguishable from one that forgot.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every UI-bearing object in the catalogue appears in the surface inventory.
- Every surface is reachable by at least one named path. A surface reachable only one way is
  acceptable and is called out as such.
- Every navigation link's addressing value is produced by a spec, cited.
- Every spec sentence that deferred a decision here has an answer here.
- Every count in the document was measured this session.
- Every falsifiable check in the vision doc that measures a journey has a task flow.
- Every risk assigned to this stage is executed or re-owned.

## Phase 6: Production (delegated to ia-writer)

The interview is done. The writing happens in an isolated **ia-writer** agent so producing the
document never competes for context with the conversation you just held.

1. Assemble the **IA record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the confirmed surface inventory; the route decomposition; the
   build-technology ruling per object with its reason; entry points and the navigation map; shell
   placement and the origin position; the wave-gating ruling; the task flows; the risk outcomes; the
   spec amendments this stage causes; the coverage-check result; and every decision taken (context,
   options, ruling, rationale, consequences). **It must be complete — the writer cannot ask Sandro
   anything.**
2. Invoke `ia-writer` with that record. It reads this skill's **document standard** section itself,
   writes `design/INFORMATION_ARCHITECTURE.md` at status **Draft**, logs the decisions in the
   module's log at the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one
   question, add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence.
   Check every count against the artifact it describes, every cross-reference against a file, and
   every claim against its own evidence.
5. Apply the spec amendments in §10 in-session rather than leaving them owed, and show the list.
6. **The approval gate.** Show Sandro the path and the Summary, and ask for explicit approval. On
   approval, flip Draft → Approved and add the Change History row. **Do not report the stage closed
   without an answer to that question** — an unapproved artifact is owed work, and the next stage
   should not be the thing that discovers it.
7. **Check the encoding survived the write.** Run `git diff --stat` and grep for `â€` before
   committing. A PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file
   double-encodes every em-dash; append with `cat` or the Edit tool.
8. Name the next stage — Design System, then Theme — and stop. Do not start it.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The planner's answer                                    | Status                                                                                                                                                      |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23 side-nav entries across 5 groups                     | The planner's shape at design time. A slice may have one page and no nav group of its own.                                                                  |
| A landing page chosen from 23 candidates                | Derived per module. With one page the question is what it opens **on**, not which page.                                                                     |
| 30+ cross-page contextual links                         | Scales with page count. Two pages have few, and that is not a thinness to fix.                                                                              |
| Sitemap Validation as a section — "changes from DS-001" | The planner ran Design System **before** IA. Where IA runs first, there is no sitemap to validate against; §4 becomes decomposition rather than validation. |
| No Build Technology section                             | The planner inherited FE-vs-freestyle from its Design System. Every module after it rules here.                                                             |
| No Shell Placement section                              | One module, one origin, never asked.                                                                                                                        |
| Wave-gating: hidden until built                         | The planner's release decision. Ask; do not assume.                                                                                                         |

What **is** the standard: the eleven questions, a stated "none" over a dropped heading, counts
measured not carried, navigation claims naming both ends and the trigger, and a decisions table that
makes every ruling citable by ID.

## Rules

- **Sandro decides structure; you propose it.** Give a recommendation with rationale, then take his
  answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops decision.** Content and ordering are settled. If a spec's content makes
  a structure impossible, that is a spec amendment raised with Sandro — not a quiet override.
- **Never invent an addressing value.** If a navigation target needs an identifier no spec produces,
  say so and amend the spec.
- **Every count in the document is measured this session**, including counts about the shell, the
  app folders and the existing exemplar.
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** Nothing mechanically validates reachability, link targets or count
  accuracy — Phase 5 and `ia-writer`'s check are procedural. Say that plainly rather than implying
  enforcement that does not exist.
