---
name: generate-design-system
description: Run the Design System stage for a Life OS module — scout the UI-bearing specs and the exemplar design system as it actually is on disk via subagents, settle theme, density, build technology, page layout, controls, semantic roles, status indicators and state conventions with Sandro one question at a time, draw the boundary with the Theme stage, then hand a design record to the design-system-writer agent that writes design/DESIGN_SYSTEM.md. Use whenever Sandro wants to run the Design System stage for a module, decide what its surfaces are built with or how they look, or says "run design system", "generate the design system", "Fiori Elements or freestyle", "what controls do we use", "what does health look like on screen", "compact or cozy"; or when Theme, Data Model or a build is blocked because nothing specifies a module's density, layout, controls, colour roles or empty states.
---

The Information Architecture stage settles **how surfaces become pages and how a user reaches each
one**. This stage settles **what each page is built with and what it looks like**. It runs seventh —
after IA, because it styles what IA names, and before Theme, because Theme resolves the roles this
document declares into concrete values.

A module's IA can be complete and its UI still be unbuildable: nobody has said whether a surface is
an annotation-described Fiori Elements page or a hand-written XML view, what renders a status, what
a table does with no rows, or what "at risk" is supposed to mean in colour. That gap is this stage's
deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/DESIGN_SYSTEM.md`.
Financial Planner is the **worked example throughout — never the target**. If you find yourself
typing a module name into a path, stop; you have broken the thing that makes this skill serve the
next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

**IDs are module-local too.** `DS-001` in one module is not `DS-001` in another, and neither is
`RPT-001` or `FRM-001`. When this document cites another module's artifact, qualify it with that
module's name.

## What this stage owns, and what it does not

| Owned here                                                                                        | Not here                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Build technology per object** — Fiori Elements (template or FPM) or freestyle, and what it buys | Routes, deep links, nav entries, landing, reachability (Information Architecture, already settled)           |
| Theme family and density                                                                          | The **concrete palette** — hex values, brand accent, border radius, the CSS contract (Theme)                 |
| Page layout — regions, grid, ordering, responsive behaviour within a page                         | The **content** of each surface: sections, fields, ordering, empty-state _text_ (Workshops, already settled) |
| Which control renders which surface element, and the table/list standards                         | Entities and attributes (Data Model) — though **draft enablement follows from the ruling here**              |
| **Semantic roles** — the module's own domain vocabulary mapped to semantic states                 | The serving stack, the origin, the proxy (Tech Stack)                                                        |
| Status indicators — component, state, icon per value                                              |                                                                                                              |
| Chart conventions, or a stated "none"                                                             |                                                                                                              |
| Empty, loading and error **conventions**                                                          |                                                                                                              |

**The build-technology ruling is this stage's when IA deferred it, and it is not a styling choice.**
It decides whether an entity is draft-enabled, whether the annotation-UX rules in the shared
standards bind at all, and whether a build persona writes CDS annotations or an XML view. Rule it per
object, with the reason and the consequence. If IA already ruled it, say so and do not re-open it.

**Draft enablement is a consequence you must state explicitly.** Fiori Elements **templates**
(ListReport / ObjectPage) push toward drafts for an editable object page. Fiori Elements **FPM** — a
custom page hosted by the FE runtime — does **not** require them: verify this against the exemplar
module's own FPM app rather than asserting it. Data Model is the consumer that breaks if this stage
leaves it open, so the answer is `drafts on` or `drafts off`, never silence.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                               | Reads                                                                                                                                                        | Breaks if                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `/ux-test` → `ux-tester`               | `design/DESIGN_SYSTEM.md` for density, layout grid, chart conventions, status indicators and the semantic colour roles (`.Codex/agents/ux-tester.md:19-20`) | The document is missing — the agent stops rather than reviews — or names a rule with no observable rendering |
| Theme                                  | The semantic roles it resolves into concrete values                                                                                                          | A role is unnamed, so Theme invents a colour for a state nobody declared                                     |
| Data Model                             | **Draft enablement**, which follows from the build-technology ruling                                                                                         | The ruling is deferred, leaving a draft filter written against an undecided model                            |
| Build (`build-briefer`, `implementer`) | Which technology per object, which control per element, which state convention                                                                               | An object has a page and no technology, or a status with no component                                        |
| Workshops (later specs)                | The status and state vocabulary already declared                                                                                                             | A later spec invents a second vocabulary for the same domain                                                 |

## The document standard

This section is the template. `design-system-writer` reads it verbatim — do not paraphrase it into
the record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/DESIGN_SYSTEM.md`) carries ten sections built around a
side-nav, a dashboard grid and a chart library — concepts that assume **many pages and a chart-heavy
domain**. A module with one page and no chart has different content and the same questions.

So: **the questions are fixed, the section list is derived from the surface, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                   | Section it becomes            | Exemplar's answer shape                                                     |
| --- | ------------------------------------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------- |
| 1   | What is the record of this document?                                           | Change History                | Table                                                                       |
| 2   | What did this stage settle?                                                    | Summary                       | `Aspect \| Decision` table                                                  |
| 3   | What theme family and density does the module run, and why?                    | Theme & Density               | Prose + rationale                                                           |
| 4   | What is each surface built with, and what does that ruling buy?                | Build Technology              | Absent as a section — the exemplar carries it as one Summary row            |
| 5   | How is the page composed — regions, ordering, grid, responsive behaviour?      | Page Layout                   | Dashboard Layout + Page Layout Standards, both assuming many pages          |
| 6   | Which control renders each element of each surface?                            | Control Conventions           | Folded into Page Layout Standards                                           |
| 7   | What is the module's semantic vocabulary, and what role does each value carry? | Semantic Roles                | Color Semantics — a domain-to-token table                                   |
| 8   | How is each status rendered — component, state, icon?                          | Status Indicators             | `Domain \| Value \| Component \| State \| Icon` table                       |
| 9   | Does the module have charts, and what governs them?                            | Chart Conventions             | A substantial section — libraries, series colours, defaults, interactions   |
| 10  | What renders with no data, while loading, and on failure?                      | Empty, Loading & Error States | A sub-table of Page Layout Standards                                        |
| 11  | Where is the boundary with Theme, and what does that stage still own?          | Theme Boundary                | Absent — the exemplar's Theme ran **after** it and amended it retroactively |
| 12  | What does this stage change in an Approved spec?                               | Spec Amendments               | Absent                                                                      |
| 13  | Which decisions did this stage take?                                           | Decisions Reference           | `ID \| Title \| Summary` table                                              |

Questions 4, 11 and 12 are **not** sections in the exemplar and are not optional. The exemplar ruled
build technology without giving it a home, ran before its own Theme so it never drew the boundary,
and amended no spec because its specs came after it. Every module whose Workshops precede its Design
System faces all three.

**Navigation is not a question here.** The exemplar's §4 is navigation because its Design System ran
**before** its IA. Where IA runs first, navigation is already settled and this document cites it
rather than restating it.

### Rules that hold at any surface size

- **Every count is measured against the artifact, never carried from the exemplar.** The exemplar
  describes a many-screen module; nothing numeric in it transfers, and some of its own numbers no
  longer describe what is on disk. Re-measure before you cite.
- **A styling claim names the element and the rendering.** "An Open Defect of severity Critical
  renders `ObjectStatus` state `Error`" is a claim. "Defects are colour-coded" is not.
- **Never invent a domain value.** The vocabulary is the specs' and the data model's. If a status
  needs a rendering for a value no spec produces, that is a spec question, not an invention here.
- **A semantic role is a role, not a colour.** Name the state (`Success`, `Warning`, `Error`,
  `Information`, `None`); leave the hex to Theme. If this document names a hex value, the Theme
  stage has nothing left to do and the boundary in question 11 is false.
- **Every build-technology ruling states its draft consequence**, because Data Model reads it.
- **Amendments to Approved specs are listed, not applied silently.** The Spec Amendments section is
  the record; the edit itself is made in-session by the host.

## Why this delegates its reading

The inputs are large and mostly settled: the module's IA document, every UI-bearing spec, the
exemplar design system and theme, and the exemplar's UI sources as they exist on disk. Reading them
in the main thread spends the interview's context on content you will not re-litigate. **Send
scouts; get back findings with `file:line` citations.** When Sandro contradicts one — he will — read
that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count it reports rather than quoting one.

| Scout         | Reads                                                                                                                               | Returns (≤ ½ page, every claim cited `file:line`)                                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **surface**   | The module's `design/INFORMATION_ARCHITECTURE.md`, and every spec carrying a Form, Report or Workflow — §3 and §7                   | One row per UI-bearing object: the elements it renders, the domain vocabularies it displays, its stated empty states, and **every sentence deferring a decision to this stage, quoted**          |
| **precedent** | The exemplar design system and theme, and the exemplar module's UI sources **on disk** — manifests, views, an FPM app if one exists | The exemplar's own split between design system and theme; the FE/FPM/freestyle shapes actually in the tree, re-measured; and **which exemplar answers are that module's alone**                  |
| **decisions** | The module's decisions log, its vision doc, and whatever holds its plan                                                             | Decisions binding this stage (ID + one-line ruling), open items it could resolve, **risks assigned to it by ID with what would settle each**, and any prior ruling on vocabulary or health bands |

## Step 0: the predecessor's status

**Read the status of `design/INFORMATION_ARCHITECTURE.md` before anything else.** If it is not
**Approved**, say so in your first message and ask Sandro to approve it or to authorise running on an
unapproved input. Do not flip the status yourself and do not proceed silently — this stage styles
what that document names, so its status is this stage's status.

This check exists because it failed twice in a row: the Information Architecture stage and this one
each closed without asking for approval of their own output, and the following stage discovered it.
See the approval gate in Phase 6.

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/DESIGN_SYSTEM.md` already
   exists, this run is an **amendment**: read it yourself, in full, before anything else.
2. Read the exemplar yourself — `Financial Planner/design/DESIGN_SYSTEM.md` **and**
   `Financial Planner/design/THEME.md`. You need both to know where the boundary in question 11
   actually falls, rather than guessing it.
3. **Read the module's `design/INFORMATION_ARCHITECTURE.md` yourself, in full.** It is this stage's
   direct input: it names the surfaces, and it may have deferred build technology here with
   constraints attached. A constraint IA hands down is not yours to re-open.
4. **Derive the UI surface from the IA document, not from memory.** State the list and its count
   before scouting; a missed object is a surface nobody styles.
5. If the IA document is **Draft**, or if the UI-bearing specs are not Approved, say so plainly and
   ask whether to proceed. Design System over a moving structure is design over a moving target.

## Phase 1: Scout

Spawn the three scouts above with the module, the resolved object list, and — on an amendment — the
existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing the UI-bearing objects — one line each, ID + name + what it renders — and ask
whether the surface looks right. Surface errors are cheap now and expensive after the conventions
are decided.

Then walk the stage **question by question**, in the standard's order. Present what the specs and
the IA document already answer and ask if it is accurate before moving to the gaps. **One question
at a time.** A wall of questions gets one answer to the last one.

## Phase 3: Design interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **Build technology, per object.** Fiori Elements template, Fiori Elements FPM, or freestyle.
   Ground it in what the object _is_: an annotation-described list over one entity set is a
   template's case; a composed page assembling one payload is not. **Name the consequence you are
   buying** — draft enablement on or off, whether the annotation-UX rules bind, what a build persona
   writes, and what an FE page needs to bind to that the module may not currently expose. If the
   module's read path to its data has never been named anywhere, that is a finding, not a detail.
2. **Theme family and density.** Which SAP theme, light or dark, which density, and why. Ground
   density in how data-dense the surfaces actually are, not in preference.
3. **Page layout.** Regions, their order down the page, the grid, and what happens at a narrow
   viewport. One page still has a layout; "one page" is not a layout answer.
4. **Control conventions.** For each surface element, the control that renders it. Include the
   table/list standards the module needs and no more — a standard for a control the module never
   uses is specification without a test.
5. **Semantic roles.** The module's own domain vocabulary — every status, band and severity a
   surface displays — mapped to a semantic state. Where the module shares a shell with another,
   decide deliberately whether it inherits that module's mapping, defines its own over the same
   states, or defines its own states; two colour systems in one chrome is a real collision and so is
   one colour meaning two things.
6. **Status indicators.** Component, state and icon per value. This is question 5 made renderable.
7. **Charts.** Whether the module has any at all. If no spec specifies one, the answer is "none —
   because", not a section invented to match the exemplar.
8. **Empty, loading and error states.** Conventions, not text — the text is the specs'. Cover the
   states the specs say are reachable, and say which are unreachable and why.
9. **The Theme boundary.** What this document names in roles, what stage 8 resolves into values, and
   any new question a shared shell creates that the exemplar never faced.
10. **Don't stop early.** After the forks clear, ask what a build persona would still have to guess.
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

**Deferring silently is not one of the options.** If no risk is assigned here, **state that**, having
checked the register rather than assumed it — a stage that inherits nothing and does not say so is
indistinguishable from one that never looked.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every UI-bearing object in the IA document has a build-technology ruling with a reason.
- Every build-technology ruling states its draft consequence.
- Every domain value any surface displays has a semantic role and a rendering.
- Every element named in a spec's §3 has a control or is covered by a stated convention.
- Every spec sentence that deferred a decision here has an answer here.
- Every state the specs call reachable has a convention; every one called unreachable is stated as
  such.
- Every count in the document was measured this session.
- Every risk assigned to this stage is executed or re-owned, or the absence is stated.
- The Theme boundary names what stage 8 still owns, and this document names no concrete value.

## Phase 6: Production (delegated to design-system-writer)

The interview is done. The writing happens in an isolated **design-system-writer** agent so producing
the document never competes for context with the conversation you just held.

1. Assemble the **design record** — the handoff artifact. It contains: the module, its
   decisions-log path and the next free `D-nn`; the confirmed surface inventory; the
   build-technology ruling per object with reason and draft consequence; theme and density; the page
   layout; the control conventions; the semantic role map; the status-indicator map; the chart
   ruling; the state conventions; the Theme boundary; the risk outcomes; the spec amendments this
   stage causes; the coverage-check result; and every decision taken (context, options, ruling,
   rationale, consequences). **It must be complete — the writer cannot ask Sandro anything.**
2. Invoke `design-system-writer` with that record. It reads this skill's **document standard**
   section itself, writes `design/DESIGN_SYSTEM.md` at status **Draft**, logs the decisions in the
   module's log at the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one
   question, add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence.
   Check every count against the artifact it describes, every cross-reference against a file, and
   every claim against its own evidence.
5. Apply the spec amendments in-session rather than leaving them owed, and show the list.
6. **The approval gate.** Show Sandro the path and the Summary, and ask for explicit approval. On
   approval, flip Draft → Approved and add the Change History row. **Do not report the stage closed
   without an answer to that question** — an unapproved artifact is owed work, and the next stage
   should not be the thing that discovers it.
7. **Check the encoding survived the write.** Run `git diff --stat` and grep for `â€` before
   committing. A PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file
   double-encodes every em-dash; append with `cat` or the Edit tool.
8. Name the next stage — Theme — and stop. Do not start it.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                               | Status                                                                                                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Side navigation, 5 groups                                           | That module's shape at design time, and **its own numbers no longer describe what is on disk** — re-measure before citing anything from its navigation section. Navigation is IA's where IA runs first. |
| A 2-column `GridContainer` for 12 dashboards                        | Derived per module. One page has a layout, not a dashboard grid system.                                                                                                                                 |
| VizFrame primary, ApexCharts fallback, domain-mapped series colours | A chart-heavy domain's answer. A module with no chart answers question 9 "none — because".                                                                                                              |
| A churning/budget domain-to-token table                             | Vocabulary is per module. Reuse the **semantic states**, never the domain rows.                                                                                                                         |
| Fiori Elements for CRUD, freestyle for dashboards                   | That module's mix. Rule per object against what each object is.                                                                                                                                         |
| No Build Technology section                                         | It ruled the question and gave it no home. Give it one.                                                                                                                                                 |
| No Theme Boundary section                                           | Its Theme ran **after** it and amended §6 retroactively. Where Theme runs next, draw the boundary now.                                                                                                  |
| No Spec Amendments section                                          | Its specs came after it. Where Workshops precede this stage, amendments are real and must be recorded.                                                                                                  |
| Density: Compact                                                    | A ruling from data density, not a house default. Ask.                                                                                                                                                   |

What **is** the standard: the thirteen questions, a stated "none" over a dropped heading, counts
measured not carried, styling claims naming the element and the rendering, roles not hex values, and
a decisions table that makes every ruling citable by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops decision.** Content and ordering are settled. If a spec's content makes
  a design impossible, that is a spec amendment raised with Sandro — not a quiet override.
- **Never re-open an Information Architecture decision.** Routes, links and shell placement are
  settled. A constraint IA attached to a deferral binds this stage.
- **Never name a concrete colour, radius or CSS value.** That is Theme's, and naming one here leaves
  stage 8 with nothing and this document with a false boundary section.
- **Every count in the document is measured this session**, including counts about the exemplar.
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** Nothing mechanically validates a control choice, a role map or count
  accuracy — Phase 5 and `design-system-writer`'s check are procedural. Say that plainly rather than
  implying enforcement that does not exist.
