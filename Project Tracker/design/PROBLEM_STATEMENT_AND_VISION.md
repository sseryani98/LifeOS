# Problem Statement & Vision

**Document ID:** PSV-001
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                        |
| ---------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Ideate interview. Records D-01 through D-18 and OI-01 through OI-05.                                                                                                     |
| 2026-07-26 | Sandro & Claude | §2 corrected during the Scope stage: the defect log holds four defects (one Open), not none; 11 of 12 stories are Done, not 12. Both errors were found by scouting the repo against this document. |

---

## 2. Problem Statement

### Who

Sandro — an SAP consultant building Life OS solo, on the side. He is the product owner and the
only human in the loop. The day-to-day _writers_ of project state are the Claude Code agents: a
story passes through ~9 methodology stages, most run by skills and subagents that read and update
project state as they go. But Project Tracker is **Sandro's tool** — the agents are instruments
writing into it, not users (D-04). Cadence is aspirationally daily.

Scale today:

| Dimension         | Today                                                                                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modules in build  | One — Financial Planner: 3 sprints, 12 stories (11 Done, CNV-001 in Backlog), 21 specs, ~313 design decisions over ~5 months (design phase 2026-02-12→02-20, builds February→July 2026) |
| Modules starting  | One — Project Tracker                                                                                                                                                                   |
| Modules planned   | Five-plus                                                                                                                                                                               |
| Where state lives | Markdown — sprint board, defect log (four defects, one still Open), sprint checkpoints (one exists), test reports (five exist)                                                          |

### Core Problem

Project state only pays off when it is consistent and connected — and every system so far has made
Sandro the integrity mechanism. The Notion systems died because maintaining data integrity, and the
links needed to pull valuable insights, cost more than the insights were worth. The markdown system
that replaced them has the same defect in a new shape: state lives in four unconstrained artifact
types (sprint board, defect log, checkpoints, test reports) that any agent can write anything into;
nothing structural keeps them consistent with each other or with git; reconciliation is a manual
after-the-fact audit (`/pm-update`). The work of staying trustworthy is still paid by the user, not
the system.

### Vision

Project Tracker is the Life OS module that **owns project state**. What today lives in markdown
lives in a database with constraints; the agent fleet reads and writes it only through intent-level
verbs that enforce the methodology, so consistency is structural — nobody maintains it, it simply
holds. Sandro opens one view and gets what markdown never gave for free: the next action, each
story's exact position in its methodology chain, and honest, calculated project health. The
registers — defects, decisions, activity, test runs — accumulate as queryable history instead of
prose to reconcile. And as the second real CAP module on the shared stack, it proves which Life OS
conventions are genuinely shared rather than planner-specific.

### The Question It Answers

> What is the true state of my project, and what should happen next?

The loaded terms:

- **true** — trustworthy without a reconciliation pass; right because constraints made drift
  impossible, not because someone recently audited it
- **state** — not just story status: position in the methodology chain, the registers (defects,
  decisions, activity, test runs), and calculated health
- **next** — the next action comes from the methodology, not from Sandro's memory
- **my project** — Sandro's view; agents write, but the question is asked and answered for him

---

## 3. Problems to Solve

Module-wide and ranked. Downstream documents cite these positionally — "Problem 1" / "P1".

| #      | Problem                                              | Priority                                        | Why it ranks here                                                                                                                                                                                                                                                                        |
| ------ | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1** | State integrity is manual                            | **Critical — the foundation**                   | Every tracking system Sandro has run — Notion, now markdown — makes him the integrity mechanism. Consistency and the links that make data insightful exist only while he pays for them, so every system eventually decays. Module-wide; the markdown drift is just the current instance. |
| **P2** | Sandro's project universe is fragmented              | High — the reason to exist beyond a dev-tracker | Projects span areas of life — the Life OS build, work engagements, personal systems — and have no single home. Each gets its own ad-hoc tracking, or none, and nothing sees across them.                                                                                                 |
| **P3** | Process is invisible                                 | High — daily payoff                             | Work follows repeatable methodologies — the 9-stage sprint chain today, other processes for other project kinds — but position-in-process is recorded nowhere and enforced only by convention or memory.                                                                                 |
| **P4** | Every return to a project starts with reconstruction | High — daily payoff                             | "Where was I, what's next" is rebuilt from memory and stale continuity docs each time — costliest exactly when cadence is irregular. Live example from the Ideate session: `PLAN.md` still said cutover comes before FRM-001; the board shows FRM-001 Done.                              |
| **P5** | History is prose, not data                           | Medium — the long game                          | Decisions, defects, activity and outcomes accumulate as text. The insights the links were supposed to buy in Notion still cannot be pulled.                                                                                                                                              |

---

## 4. What "Solved" Looks Like

**The routine.** Sandro sits down (aspirationally daily) and opens the project view. It answers
"what's next" in seconds: the task queue names the next stage of the next story — no re-reading a
continuity doc, no reconstructing from git. During a build session, the agents advance state through
the MCP verbs as work completes; when the session ends, the state is already current. There is no PM
pass, because there is nothing to reconcile.

**Falsifiable checks.**

| #   | Check                                                                                                                                                                                         | Answers |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | CNV-001 — the first story after cutover — runs its entire 9-stage chain with zero markdown state writes; every handoff is an MCP verb call.                                                   | P1, P3  |
| 2   | "Did Code Quality run on this story?" is answerable by query, with a timestamp — for any story, forever.                                                                                      | P3, P5  |
| 3   | Returning after a week away costs minutes, not a session: the view alone is enough to resume.                                                                                                 | P4      |
| 4   | A `PLAN.md`-style continuity document is never written again for tracked work — the FRM-001 staleness caught during the interview is the class of error that becomes structurally impossible. | P1, P4  |
| 5   | Questions against history — "which stories had defects", "what did we decide about X and why" — are queries, not greps.                                                                       | P5      |
| 6   | When a second project (beyond Financial Planner) onboards in a later slice, it requires no new tracking system — an Area, an Initiative and a methodology, in the same store.                 | P2      |

---

## 5. Design Decisions

All decisions are documented with full context, options considered and rationale in:
**[DECISIONS_LOG.md](DECISIONS_LOG.md)** — D-01 through D-18.

The decisions that most shape the system:

| ID   | Decision                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| D-01 | Project Tracker **owns** project state — not a read-only mirror, not a PM overlay. Blueprint §7 is superseded.       |
| D-02 | A real CAP module now; the v1 HTML dashboard generator is deleted, not evolved.                                      |
| D-03 | Namespace `com.lifeos.projecttracker` — closes the root `CLAUDE.md` "undecided" item.                                |
| D-04 | Project Tracker is Sandro's tool; agents are instruments writing into it, not users.                                 |
| D-05 | Access is a bespoke in-process MCP server over CAP exposing intent-level verbs, with no CRUD escape hatch.           |
| D-08 | Hierarchy: sprint = Initiative, story = Milestone, methodology stage = Task, workflow step = Subtask.                |
| D-11 | v1 serves Financial Planner only.                                                                                    |
| D-12 | Migration covers project state only; `design/*.md` stays markdown and git remains system of record for work product. |
| D-13 | Cutover lands before CNV-001.                                                                                        |

---

## 6. Scope

Slice 1:

1. **Hierarchy entities** — Area, Engagement, Workspace, Initiative, Milestone, Task, Subtask (D-08)
2. **Methodology + MethodologyStep** — the library, and per-story instantiation
3. **The four registers** — Defect, Decision, Activity log, TestRun (D-10)
4. **The Financial Planner migration, and only it** (D-11, D-12) — W1-S1/S2 as completed Initiatives,
   W1-S3 fully modelled with the live chain (D-15)
5. **The MCP access layer** (intent verbs) and rewiring the eight-file tooling surface onto it
   (D-05, D-06; surface measured in `PLAN.md` §6)
6. **The project view** — next action + task queue · methodology chain per story · workspace header
   with status, Current Focus and calculated health · the three registers

---

## 7. Out of Scope

### 7.1 Deferred — a later slice

| Cluster               | Items                                                                             | Promotes when…                                                                                            |
| --------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Capture & knowledge   | meetings, agenda items, ideas, notes, resources, Apple Notes capture, search      | slice 1 has made Project Tracker the daily entry point and capture friction is the loudest remaining pain |
| Planning & scheduling | work blocks, weekly/monthly planning, calendar sync                               | the next-action queue is trusted — planning, not tracking, is the bottleneck                              |
| Breadth               | non-software projects, personal systems, non-Life-OS work (e.g. work engagements) | a real second project needs a home — the P2 ambition's first real test                                    |
| Requirements & risks  | requirements and risks registers                                                  | a tracked project actually carries formal requirements/risks                                              |
| Gamification          | streaks, scoring                                                                  | motivation, not mechanics, is the constraint                                                              |

### 7.2 Not a goal — never

- **Multi-user / collaboration / sharing** — Life OS is single-user by constitution
- **Cloud or SaaS deployment** — local only, per the root constraint
- **Becoming a product** — it serves Sandro; generality beyond his projects is a non-goal
- **Replacing git for code or design docs** — `design/*.md` stays markdown (D-12); git stays the
  system of record for work product, Project Tracker owns state _about_ work
- **Live note-taking / being an editor** — Project Tracker tracks and links knowledge (later slices)
  but is not a writing surface

---

## 8. Open Items

| #     | Item                                                                                                                                                                                                                                                                                                                                             | Status                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| OI-01 | **What replaces git's durability for project state?** Backup mechanism, frequency, retention and location; whether a versioned representation exists at all (periodic CDS/CSV export? seed files as the checked-in form? backups only?); whether a restore is ever tested. This durability loss is a regression the migration itself introduces. | Open — **must settle before cutover**                      |
| OI-02 | **What is the cross-module architecture?** One CAP service or one per module; shared database or isolated; one shell or many. Project Tracker forces all three root-level "undecided" items.                                                                                                                                                     | Open — blocks Design (data model / tech stack), not Ideate |
| OI-03 | **How are the three invocation-less methodology stages triggered?** `functional-tester` and `ux-tester` have no slash command; `/human-review-loop` has no defined trigger. Until settled, the project view can name a next stage that cannot be run.                                                                                            | Open — settle before or during Scaffold                    |
| OI-04 | **What does "calculated health" actually compute?** Inputs, thresholds and the meaning of each state.                                                                                                                                                                                                                                            | Open — settle at Design workshops                          |
| OI-05 | **How generic must Methodology/MethodologyStep be in v1?** Slice 1 instantiates only the sprint-build chain (D-11), but P2 is the module's wider ambition.                                                                                                                                                                                       | Open — settle at Data Model                                |

**Forward notes** — captured for later stages, not decided here:

- ~~Verb list sketched in `PLAN.md` §6; Design decides the full set.~~ **Settled by D-40 at the
  `SPEC-01` workshop — eleven verbs**, four of them added because a catalogued object otherwise had
  no legal write path.
- ~~TestRun record shape~~ — settled in `SPEC-01` §3.1, mapped field-by-field from the Jest JSON
  `generateTestReport.ts` already holds. Health-calculation inputs remain open (OI-04, `SPEC-05`).
- `METHODOLOGY_BLUEPRINT.md` §5.1 wording fix ("interviewer" → "scouts") when the blueprint is next revised.
- ~~The Sprint Build methodology chain to model is `PLAN.md` §5~~ — **settled in `SPEC-02` §3.1**,
  which is now the authoritative seed: 9 stage steps, Sprint Build carrying **7** subtasks, with slug
  codes, kinds, predicates and drivers. Corrected twice against `.claude/` along the way — from 6
  subtasks to 7 by **D-38** (`build.js` declares a `Handoff` phase, the board write `INT-002`
  rewires), and from `FRM-*` to the **`shipsUi`** predicate by **D-47**, because slice 1's four
  Reports all ship pages and a prefix rule would have omitted UX Test from the whole project view.

---

_This document is the single source of truth for the Project Tracker module. Every later design decision, FRICEW object, and implementation choice must trace back to a problem, decision, or open item stated here._
