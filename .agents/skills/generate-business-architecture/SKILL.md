---
name: generate-business-architecture
description: Produce a module's BUSINESS_ARCHITECTURE.md — the FRICEW catalogue that becomes its user-story backlog. Scout the upstream vision and source docs via a domain-scout subagent, settle the scope boundary with Sandro one question at a time, then hand a catalogue record to the ba-writer agent. Use whenever Sandro wants to run the Scope stage for a module, catalogue its FRICEW objects, or build its story backlog; says "generate the business architecture", "let's do the FRICEW catalogue", "scope the module", "what are the objects for Project Tracker"; or asks to amend, extend, or re-cut an existing BUSINESS_ARCHITECTURE.md — including cutting a first slice out of a large PRD.
---

The Scope stage turns a vision into a **backlog**. Every object you catalogue here becomes a user
story, a spec, a sprint row, and a commit trailer. Objects you miss get built ad hoc; objects you
invent get built for nothing. This is the highest-leverage half-day in the module.

The catalogue is not a design. One line per object is the standard — what it is, what it touches,
where it came from. The _how_ belongs to the Workshops stage, which reads this file to know what it
is workshopping.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path in this skill is
relative to `process.cwd()`, which is the module you are scoping. The artifact is
`design/BUSINESS_ARCHITECTURE.md`. Financial Planner is the **worked example throughout — never the
target**. If you find yourself typing a module name into a path, stop; you have broken the thing
that makes this skill serve the next module.

## What the catalogue is load-bearing for

Every rule below exists because something downstream reads this file. Know the consumers before you
bend a rule:

| Consumer                           | Reads                                                                 | Breaks if                                                               |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/workshop` (domain scout)         | Objects in scope for a spec: ID, name, description                    | An object has no ID, or its description is too thin to scope a workshop |
| `/pm-update` (check 3)             | Every board story ID must exist here                                  | An ID is renumbered, deleted, or minted outside the catalogue           |
| Project Tracker / dashboard        | Story list; `{PREFIX}-{NNN}`, PREFIX ∈ {FRM, INT, ENH, CNV, RPT, WFL} | A seventh prefix appears, or IDs aren't zero-padded to three digits     |
| Data Model stage                   | What entities must exist to back these objects                        | An object implies data nobody catalogued                                |
| Build Plan stage                   | The full object set and its build order                               | An object has no wave                                                   |
| Commits (`feat(scope): … FRM-001`) | The ID, forever                                                       | An ID is ever reused for a different object                             |

**IDs are permanent.** Once written they are cited in specs, commits, board rows, and defect
records. You may add, you may mark an object absorbed or dropped, you may never renumber or reuse.

## The catalogue standard

This section is the template. `ba-writer` reads it verbatim — do not paraphrase it into the record.

### Document shape

```
# Business Architecture — FRICEW Catalogue
Document ID: BA-001 · Version · Date · Status

1. Change History          table: Date | Author | Description
2. Summary                 table: Type | Count | ID range; total row
3. Scope Boundary          only when scope was cut — see below
4..n. One section per FRICEW type present, in dependency order
n+1. Build Plan            waves / layers / dependency chains
     Footer                one italic line: completeness + link upstream
```

**Dependency order for the type sections — Interfaces, Conversions, Enhancements, Forms, Reports,
Workflows.** Data arrives, is seeded, is transformed, is entered, is displayed, is strung into
journeys. This is a default with a reason, not a law; a module whose centre of gravity sits
elsewhere may order differently, but say so in the doc. **A type with zero objects gets no section**
— record the zero in the Summary and move on. Inventing an Interface so the table looks complete is
the exact failure this stage should prevent.

### Anatomy of an entry

One row, five columns: `ID | Name | Wave | Description | Traces To`.

- **ID** — `{PREFIX}-{NNN}`, zero-padded, sequential within type, starting at 001 for a new module.
  The six prefixes are fixed by the story-ID convention (blueprint §7.3) and by `/pm-update`'s Type
  enum. **A seventh type is a decision for Sandro, not a judgment call for you** — it changes every
  downstream parser.
- **Name** — a short noun phrase, the name Sandro will say out loud in standup. Not a sentence.
- **Wave** — build order. `1→2` when an object is deliberately delivered in parts; then list which
  parts land in which wave, under the object or in the Build Plan.
- **Description** — one to four dense sentences: what it does, its defining behaviours, its
  cross-references to other objects **by ID**, and any explicit carve-out ("Redemptions excluded —
  per-program"). Carve-outs are the most valuable sentences in the file; they are the ones a build
  persona would otherwise get wrong. **Never restate the data model and never specify UI layout** —
  those are later stages, and duplicating them here guarantees drift.
- **Traces To** — the anchors that justify the object's existence. Use whatever stable handles the
  upstream artifacts actually have: vision-doc sections, decision IDs, open items, and other FRICEW
  IDs when one object exists to serve another. **An object with an empty Traces To is a candidate to
  cut** — it means nobody asked for it.

### Absorbed and dropped objects

An object that gets merged into another, or cut after being catalogued, **keeps its row**. Mark it
in place — `_(Absorbed by FRM-006.)_` — with the reason and the ID that took it over. Deleting the
row breaks every citation of that ID and makes the count history unexplainable.

## Why this delegates its reading

Source material at this stage is large and mostly _not_ catalogue content: a PRD is largely
rationale, background, future scope, and explicitly-undecided UX. Reading it in the main thread
spends the interview's context on prose you will throw away. **Send a `domain-scout`; get back a
classified candidate inventory.** Every candidate arrives with a `file:line`, a proposed
classification, and a reason — so when Sandro contradicts one, you read that one line then.

Fan out one scout per source cluster when the sources are genuinely separate (vision doc; PRD or
legacy spec; existing repo state). Spawn them **in one message** so they run concurrently.

The scout classifies; **it does not decide scope**. Scope is Sandro's, and it is Phase 2.

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/BUSINESS_ARCHITECTURE.md`
   already exists, this run is an **amendment**: read it yourself, in full, and treat every existing
   ID as frozen.
2. Locate the upstream artifact. The Scope stage's input is the Ideate stage's output —
   `design/PROBLEM_STATEMENT_AND_VISION.md`. Its structure (Problems to Solve, What "Solved" Looks
   Like, Design Decisions, Scope, Out of Scope, Open Items) is what "Traces To" points at.
3. Inventory secondary sources: a PRD, a legacy spec, research packs, a kickoff or handoff note, an
   existing decisions log. List them for Sandro and confirm the set before scouting — a source you
   scout that he considers superseded is wasted, and one you miss is a hole in the catalogue.
4. **If there is no vision artifact**, say so plainly. You can proceed from a PRD-shaped source, but
   tell Sandro the consequence up front: Traces To will anchor to section numbers rather than to
   problems and decisions, which is weaker provenance and harder to audit later. Ask whether to
   proceed or to run Ideate first. Do not silently substitute.

## Phase 1: Scout

Spawn `domain-scout` with: the module, the resolved source list, the upstream artifact's scope and
out-of-scope statements verbatim, and — if this is an amendment — the existing IDs and their names.

It returns a candidate inventory, each row classified:

| Class             | Meaning                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **In**            | A deliverable unit of behaviour, inside the stated scope                                           |
| **Deferred**      | Real, well-formed, explicitly outside this slice                                                   |
| **Not an object** | Background, rationale, a design principle, an already-decided-out item, or explicitly-undecided UX |
| **Not FRICEW**    | Real and in scope, but belongs to another stage — an entity, a theme choice, an IA decision        |
| **Uncertain**     | The scout cannot classify it from the sources alone                                                |

**Uncertain is the pile you spend Sandro's time on.** In, Deferred and Not-an-object you present for
confirmation in bulk; Uncertain you work one question at a time.

## Phase 2: Scope boundary

Scoping is usually **subtractive** — a large source doc and a deliberately narrow first slice. Treat
the boundary as the deliverable of this phase, not a preamble to the real work.

1. **State the boundary back before applying it.** One paragraph: what this catalogue covers, from
   which source, cut by which stated slice. Get agreement on the sentence before you argue about
   individual objects.
2. **Present the three confident piles as counts plus one line each**, and ask what is misfiled.
   Scope errors are cheap now and expensive after forty descriptions are written.
3. **Work the Uncertain pile one question at a time.** Ground each question in the source: "§17
   describes XP and levels — the slice list doesn't mention it, and it only applies to persistent
   personal systems, which are a later slice. Out?" Concrete beats hypothetical.
4. **Watch for the slice list under-specifying itself.** A slice that says "the three registers"
   against a source that defines five register types is an ambiguity, not a detail — resolve it
   explicitly rather than picking three.
5. **Deferred scope becomes a section, not a silence.** Everything classed Deferred goes into §3
   Scope Boundary as a table: `Item | Source anchor | Why deferred | Where it goes`. This is the
   whole point — a deferred item that is written down is a later slice; a deferred item that is
   dropped silently is a hole nobody finds until the build.
6. If the upstream vision artifact already carries an Out of Scope section, **reference it rather
   than copying it**, and record in §3 only what _this stage_ cut that the vision doc did not.

When Sandro asks for a recommendation, give one with rationale — not a balanced menu. He is asking
because he wants your judgment.

## Phase 3: Object interview

Now shape the In pile into objects. Present proposals **in batches by type** so he reviews related
objects together and answers by index; ask genuine questions one at a time.

Work these, in order:

1. **Granularity.** Is this one object or three? The test is the unit of build and review: an object
   should be workshoppable in one sitting and demonstrable in one story. Split what has two
   independent consumers; merge what can never be built apart.
2. **Type assignment**, and the hard cases — these recur in every module:
   - A **derived computation** (a score, a projection, a health calculation, a progress engine) is
     an **Enhancement**, not the Report that displays it. If you catalogue only the Report, nobody
     ever specs the arithmetic.
   - A **programmatic access layer** — an API surface, an MCP verb set, a sync client — is an
     **Interface**, whether the caller is external or one of Sandro's own agents.
   - A **one-time load, migration, seed, or decommission** is a **Conversion**.
   - A **template library plus its per-instance behaviour** is usually two objects: the maintenance
     surface (Form) and the instantiation/state machine (Workflow).
   - A **record written by a machine rather than a human** is still an object — catalogue it under
     the thing that writes it, and say in the description that no user-facing entry surface exists.
   - **Entities are not FRICEW objects.** They go to the Data Model stage. But ask the follow-up:
     what creates and maintains this data? That answer usually _is_ an object — a seed Conversion or
     a maintenance Form.
3. **Names.** Sandro's vocabulary, not the source doc's. If he calls it the Churnboard, it is the
   Churnboard.
4. **Carve-outs.** For each object, ask what it explicitly does _not_ do. This is where the
   catalogue earns its keep, and it is the question most often skipped.
5. **Don't stop early.** After the pile clears, ask what the module needs that no source document
   thought to state — reference-data maintenance, the initial load, the recurring session that ties
   the surfaces together. These are habitually absent from PRDs and habitually needed.

## Phase 4: Phasing and dependencies

The Scope stage owns build order; the exemplar carries it as the catalogue's last section.

1. Derive dependencies from the descriptions — X consumes Y, Y seeds Z. Present the chains and ask
   what you have backwards.
2. Group into **waves**: each wave is a _testable increment_, a coherent thing that works end to
   end, not a calendar phase. Name each wave for what it makes possible.
3. **A small slice may be one wave.** Do not manufacture four. Keep the Wave column regardless —
   downstream ordering depends on it.
4. Where an object is genuinely split across waves, use `1→2` and list the per-wave parts.
5. Above roughly twenty objects, add the dependency analysis the exemplar carries — longest path,
   widest fan-in — because that is where build order stops being obvious. Below that, skip it.

## Phase 5: Coverage check

Before writing, prove the catalogue against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every problem, pillar, or goal in the upstream vision artifact is served by at least one object.
  **An unserved problem is a missing object.**
- Every object traces to something. An empty Traces To is a candidate to cut.
- Every cross-reference names an ID that exists in this catalogue.
- Every Deferred item appears in §3.
- On an amendment: no existing ID changed meaning, no ID was reused, no row was deleted.
- IDs are contiguous within each type, zero-padded to three digits, prefix in the fixed six.

## Phase 6: Production (delegated to ba-writer)

The interview is done. The writing happens in an isolated **ba-writer** agent so producing a
forty-row document never competes for context with the conversation you just held.

1. Assemble the **catalogue record** — the handoff artifact. It contains: the module and artifact
   path; the confirmed scope boundary paragraph; the deferred table; every object with its final ID,
   name, type, wave, description and Traces To; the wave grouping and dependency notes; the
   coverage-check result; and, on an amendment, the frozen existing IDs. **It must be complete —
   the writer cannot ask Sandro anything.**
2. Invoke `ba-writer` with that record. It reads this skill's **Catalogue standard** section itself,
   writes `design/BUSINESS_ARCHITECTURE.md` at status **Draft**, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one
   question, add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **The approval gate.** Review the returned check. Show Sandro the path, the Summary counts, and
   the one-line boundary statement, and ask for explicit approval. On approval, flip Draft →
   Approved and add the Change History row. **Do not report the stage closed without an answer to
   that question** — an unapproved artifact is owed work, and the next stage should not be the thing
   that discovers it.
5. Name the next stage — Research, then Scaffold — and stop. Do not start it.

## Financial Planner's answers, which are not the standard

The exemplar is one module. Carry the mechanics forward; do not carry these:

| FP's answer                                                                        | Status                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 43 objects, six types all populated                                                | FP's shape. A slice may have twelve objects and four types.                                  |
| Four waves, named Core Pipeline / Churning Depth / Analytics / Market Intelligence | FP's phasing. Waves are derived per module.                                                  |
| All waves built before go-live                                                     | FP's release decision, logged as a decision there. Ask; don't assume.                        |
| Traces To pointing at `PSV Pillar n` and `D-nn`                                    | FP had a vision doc and a populated decisions log at Scope time. Use whatever anchors exist. |
| Dependency-chain analysis (longest path, widest fan-in)                            | Worth it at 43 objects; overhead at 12.                                                      |
| Prose-dense descriptions running four lines                                        | Density scales with the object, not with FP's habit.                                         |

What **is** the standard: the six prefixes, `{PREFIX}-{NNN}`, ID permanence, the five columns,
one row per object, absorbed-not-deleted, and the rule that everything traces to something.

## Rules

- **Sandro decides scope; you propose it.** Never quietly widen a slice because a source doc is
  eloquent about something, and never quietly narrow one to keep the catalogue tidy.
- **Nothing is dropped silently.** Every candidate the scout found ends up In, Deferred (written
  down), or classified out with a reason you can show.
- **No object without an ID; no ID without a description that could seed a workshop.**
- One line per object. If you are writing three paragraphs, you are doing the Workshops stage early.
- Log decisions taken during scoping into the module's decisions log if it has one; if it does not,
  return them in the record so `ba-writer` can seat them somewhere durable.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** `/pm-update` check 3 validates the board against the catalogue, but
  nothing validates the catalogue's own ID sequence, prefix enum, or trace completeness — Phase 5
  and `ba-writer`'s check are procedural, not mechanical. Say that plainly rather than implying
  enforcement that does not exist; a shared `lint:fricew-catalogue` in
  `Standards (Technical + Linting)/scripts/` is the obvious follow-up once a second module has
  proved the rules.
