---
name: generate-data-model
description: Run the Data Model stage for a Life OS module — turn the requirements its specs placed on the model into one entity contract, resolving every attribute, relationship, code list, constraint, sort key and read projection. Scout the specs' Data Model sections, the exemplar model as it actually is on disk and the module's decisions log via subagents, settle the deliverable boundary, the entity surface, the code lists, the constraints, drafts, sort keys and the read path with Sandro one question at a time, execute or re-own any risk assigned to this stage, then hand a model record to the data-model-writer agent that writes design/DATA_MODEL.md. Use whenever Sandro wants to run the Data Model stage for a module, decide its entities and attributes, or says "run data model", "generate the data model", "what entities do we need", "what does the schema look like", "is that a code list or an enum", "settle the sort key"; or when Tech Stack, Test Strategy, the Build Plan or a build is blocked because a module's specs describe attributes no document has ever consolidated.
---

The Workshops stage settles **what each object does**. Every spec's §2 states what that object needs
from the model, and no spec ever sees the others'. This stage settles **the one model all of them
were writing against**. It runs ninth — after the three UI stages, because nothing in the model turns
on a colour, and before Tech Stack, because the serving stack is chosen for a model that exists.

A module's specs can all be Approved and its model still unbuildable: twelve documents each naming
`Milestone.status` and no two agreeing on whether it is stored, derived, or derived-how. That gap is
this stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/DATA_MODEL.md`.
Financial Planner is the **worked example throughout — never the target**. If you find yourself
typing a module name into a path, stop; you have broken the thing that makes this skill serve the
next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

**IDs are module-local too.** `DM-001`, `DS-001` and `TH-001` in one module are not `DM-001`,
`DS-001` and `TH-001` in another, and neither is `INT-001`, `CNV-001` or `FRM-001`. When this
document cites another module's artifact, qualify it with that module's name. Watch for a module
whose **seeded data** carries IDs in the same shape as its decisions log — a `Defect D-001` is not
decision `D-01`.

## Step 0: the predecessor's status

**Read the module's `design/THEME.md` header before anything else** — or, where a module ran no Theme
stage, its last status-bearing design document. If it is not **Approved**, say so in your first
message and ask Sandro to approve it or to authorise running on an unapproved input. Do not flip the
status yourself and do not proceed silently.

This check exists because it failed three times in a row — `IA-001`, then `DS-001`, then `TH-001`,
each discovered by the stage after it. D-159 added the gate and the third failure happened anyway,
which is why the gate now also appears at the **top** of Phase 6 rather than as step 6 of 8. If you
find a fourth, say so plainly: a fix that did not work is itself a finding.

## What this stage owns, and what it does not

| Owned here                                                                        | Not here                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **The entity surface** — every entity, attribute, type, nullability and default   | What each object does with them (Workshops)                      |
| **Relationships** — cardinality, optionality, self-references, hub entities       | Which control renders a field (Design System)                    |
| **Code lists** — which exist, their values, and the casing rule for a `code`      | What each value looks like on screen (Theme)                     |
| **Constraints** — which are annotations, which need a handler, and why            | The handler's implementation (Build)                             |
| **Draft enablement**, or the stated inheritance of a ruling that settled it       | Routes, links, shell placement (Information Architecture)        |
| **Deterministic sort keys**, and the mechanism that declares them                 | Test fixtures and coverage targets (Test Strategy)               |
| **The read projection** backing any UI read path, and the CAP construct behind it | The serving stack, origin, proxy, TypeScript loader (Tech Stack) |
| **Computed-at-runtime values**, stated as a ruling that no column exists          | The algorithm that computes them (Workshops)                     |
| Whether this stage ships CDS files or only the document                           | Build sequencing and story order (Build Plan)                    |

**This stage specifies; whether it also builds is question 3.** Answer it deliberately — the
exemplar never faced it, because its model was written during design and its `db/` filled at Build.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                        | Reads                                                               | Breaks if                                                            |
| ------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Every build story               | The entity, its attributes, types, nullability and constraints      | An attribute exists in a spec's §2 and in no section here            |
| The migration / seed stories    | Code-list values and their exact casing                             | A seeded literal disagrees with a FUT that froze it                  |
| A state exporter, if one exists | The sort key per entity and the code-list inventory                 | The key is a convention nobody can read from the model               |
| Fiori Elements / the read path  | The projection, its navigation properties, and its virtual elements | The payload is an opaque result a macro cannot bind                  |
| Tech Stack                      | The database ruling and whatever this stage measured standing it up | The binding was never attempted and the risk is inherited unexecuted |
| Test Strategy                   | Which constraints are annotation-enforced                           | Annotation contracts and custom logic are indistinguishable          |

## The document standard

This section is the template. `data-model-writer` reads it verbatim — do not paraphrase it into the
record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/DATA_MODEL.md`) carries ten sections built around a module
with dozens of entities in four classifications, `String enum` fields, no read projection, no
exporter and no risk routing — concepts that assume **a large model written before the standards
that now govern one**. A smaller module, or one whose specs placed named requirements on this stage,
has different content and the same questions.

So: **the questions are fixed, the section list is derived from the surface, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                     | Section it becomes             | Exemplar's answer shape                                          |
| --- | -------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| 1   | What is the record of this document?                                             | Change History                 | Table — 13 rows, mostly spec amendments                          |
| 2   | What did this stage settle?                                                      | Summary + Entity Index         | Classification counts + a numbered index with key decisions      |
| 3   | **Does this stage ship CDS files, or only the document?**                        | Deliverable Boundary           | **Absent** — never asked; its `db/` filled at Build              |
| 4   | What is every entity, with every attribute, type, nullability and note?          | One section per classification | `Attribute \| Type \| Required \| Notes` tables                  |
| 5   | What are the relationships — cardinality, optionality, self-references, hubs?    | Relationships                  | Sub-sections per cluster + ASCII diagrams + a hub table          |
| 6   | **Which code lists exist, with their values and the casing rule for a `code`?**  | Code Lists                     | **Answers a different question** — §9 lists `String enum` values |
| 7   | What is computed at runtime and stored nowhere?                                  | Computed at Runtime            | `Computed Value \| Source Data \| Computed By` table             |
| 8   | **Which constraint is an annotation, and which needs a handler — and why?**      | Constraints                    | **Absent** — scattered through Notes cells                       |
| 9   | **Is any entity draft-enabled?**                                                 | Draft Enablement               | **Absent** — never stated either way                             |
| 10  | **What is each entity's deterministic sort key, and what declares it?**          | Sort Keys                      | **Absent**                                                       |
| 11  | **What backs a UI read path, and which CAP construct supplies its collections?** | The Read Projection            | **Absent** — one CDS view, no projection contract                |
| 12  | **Which entities need a domain timestamp beside CAP's managed one?**             | Managed vs Domain Time         | **Absent**                                                       |
| 13  | What does this stage change in an upstream or Approved document?                 | Amendments                     | **Absent as a section** — carried in Change History rows         |
| 14  | **Which risks are assigned to this stage?**                                      | Risks Assigned to This Stage   | **Absent**                                                       |
| 15  | **Which open item does this stage own, and what is its ruling?**                 | Open Items Resolved            | Prose — "OI-08 resolved" in one Change History cell              |
| 16  | Which decisions did this stage take?                                             | Decisions Reference            | `ID \| Title \| Summary` table                                   |

Questions 3, 6, 8, 9, 10, 11, 12 and 14 are **not** sections in the exemplar and are not optional. It
was written before code lists replaced enums, before any module had a read projection or an exporter,
and before risk registers were routed by stage. **A module whose specs place named requirements on
this stage faces all eight.**

### Rules that hold at any model size

- **Derive the entity surface from the specs' own sections, this session.** Every spec states what it
  needs from the model in one place. Read that section in **every** spec — the stage's first job is to
  replace a summary with a measured list. A spec that states it needs **nothing** is a data point, not
  a gap; record it.
- **Do not double-count.** Later specs routinely say "everything else is already required by the
  earlier ones". Consolidate to one row per attribute and cite every spec that requires it.
- **An attribute claim names the spec that required it.** "`Initiative.position` — Integer, not null,
  unique within Workspace (SPEC-03 §2 am. 12, SPEC-04 §2 am. 1)" is a claim. "Initiatives are
  ordered" is not.
- **A stated "no column" is a ruling and belongs in the document.** Where a spec says a value is
  computed and never persisted, or that an attribute deliberately does not exist, say so under the
  entity — an omission and a decision look identical in a table.
- **Never invent an attribute a spec did not ask for.** If the model needs one the specs do not carry,
  that is an amendment raised with Sandro, not an addition made here.
- **Code lists, not `String enum`,** for any finite vocabulary — the shared standards say so, and the
  exemplar predates the rule. Reference the standards; do not restate them.
- **Casing is frozen by whatever already froze it.** A value asserted by a FUT or written into a seed
  in an Approved spec cannot be renamed here for consistency. Settle the _rule_, record where reality
  diverges from it, and say why renaming was refused.
- **Prefer an annotation to a handler, and say which each constraint is.** Where a spec demands a
  named error key rather than a framework message, that forces a handler — record the reason beside
  the constraint so a build persona does not "simplify" it back into an annotation.
- **Amendments to Approved documents are listed, not applied silently.** The Amendments section is the
  record; the edit itself is made in-session by the host.

## Why this delegates its reading

The inputs are large, numerous and mostly settled: every spec's data section, the exemplar model, the
decisions log, the risk register. Reading them in the main thread spends the interview's context on
content you will not re-litigate. **Send scouts; get back findings with `file:line` citations.** When
Sandro contradicts one — he will — read that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count it reports rather than quoting one.

| Scout            | Reads                                                                            | Returns (≤ ½ page, every claim cited `file:line`)                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **requirements** | **Every** spec's Data Model section, in full                                     | One consolidated entity → attribute list with the requiring spec per attribute; every amendment; every spec that requires **nothing**; and every contradiction between two specs |
| **precedent**    | The exemplar's data model **and its `db/**/*.cds` on disk**                      | The document's shape, and **every place the document and the CDS files disagree** — the files win. Never carry a count from the document                                         |
| **decisions**    | The module's decisions log, its plan, its design docs, and its research register | Decisions binding this stage (ID + one-line ruling), the next free `D-nn`, **risks assigned to it by ID with what would settle each**, and every open item this stage owns       |

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/DATA_MODEL.md` already exists,
   this run is an **amendment**: read it yourself, in full, before anything else.
2. **Run Step 0** above on the predecessor document.
3. **Read every spec's Data Model section yourself.** Delegating the _reading_ is fine; the
   consolidated list is this stage's core output and you own it. Count the specs and count the ones
   requiring nothing, and state both before scouting.
4. Read the module's Design System and Information Architecture for anything they handed **down** by
   name — a read path, a draft ruling, a projection requirement. A question handed to this stage is
   not yours to re-frame.
5. Read the exemplar yourself, and read its CDS files. Where they disagree, the files win and the
   disagreement is a finding.

## Phase 1: Scout

Spawn the three scouts above with the module, the spec inventory, and — on an amendment — the
existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing the entities and their classification — one line each — and ask whether that is the
whole surface. Then walk the stage **question by question**, in the standard's order. Present what
the specs already answer and ask if it is accurate before moving to the gaps. **One question at a
time.** A wall of questions gets one answer to the last one.

## Phase 3: Model interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **The deliverable boundary.** Document only, or document plus CDS files? Ground it in what the
   module has: whether a Test Strategy and a Build Plan exist yet, whether a build gate would cover
   the files, and what the module's own `CLAUDE.md` already claims about who fills `db/`. If that
   claim and the ruling disagree, the claim is corrected in-session.
2. **The entity surface**, consolidated from the specs, with every attribute's type, nullability,
   default and requiring spec. This is the bulk of the work and it is transcription plus
   reconciliation, not invention.
3. **Contradictions between specs.** Two Approved specs disagreeing about one attribute is the
   highest-value thing this stage finds. Settle it — which may mean amending an Approved spec — and
   never paper over it with a form of words that is true of both readings.
4. **Code lists.** Which exist, their values, their `code` casing, and the rule. Check every value
   against the FUT or seed that froze it before proposing a rename.
5. **Constraints.** Per constraint: annotation or handler, and why. A spec demanding a named error
   key forces a handler; record that reason.
6. **Draft enablement**, or the inherited ruling that settled it.
7. **Sort keys.** Per entity, and — this is the real question — the _mechanism_ that declares them:
   an attribute, an annotation, or a convention. Only one of those is machine-readable.
8. **The read projection.** If any UI reads this model, name the CAP construct that supplies its
   collections, and check it against what the UI framework can actually bind.
9. **Managed versus domain time.** Any entity whose rows are loaded by a migration needs asking:
   does `createdAt` mean when it happened, or when it was loaded? Where they differ, a domain
   timestamp is a separate attribute.
10. **Don't stop early.** After the forks clear, ask what a build persona would still have to guess,
    and what a migration would have to invent. That is the bar.

When Sandro asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
rationale. Not a balanced menu. He is asking because he wants your judgment.

## Phase 4: Risks assigned to this stage

The decisions scout returns any risk the module's register or decisions log **assigns to this stage**.
For each one, take one of exactly two positions and record which:

- **Execute it.** Run the settling test the register names, in a scratch location outside the module's
  source tree, and report what happened — including a null result. An executed risk changes its grade
  from `Inferred` to `Verified` and that grade goes in the document.
- **Re-own it explicitly**, with the owner, the deadline, and why executing here was the wrong shape.

**Deferring silently is not one of the options.** If no risk is assigned here, **state that**, having
checked the register rather than assumed it.

**A risk blocked on a credential, a service or a machine state is still executed as far as it goes.**
Measure the exact failure and record it — a precise blocked result is a finding, and it frequently
corrects the register's account of _why_ the thing has never been done.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every entity named in any spec's data section appears in this document.
- Every attribute required by any spec appears on its entity, with the requiring spec cited.
- Every spec that stated it requires nothing is recorded as requiring nothing.
- Every contradiction the scouts found is settled, with the amendment named.
- Every code-list value traces to the FUT or seed that froze it.
- Every constraint is classified annotation or handler, with a reason.
- Every entity has a sort key, and the mechanism declaring it is named.
- Every question in the standard has a section, including those answered "none".
- Every risk assigned to this stage is executed or re-owned, or the absence is stated.
- Every open item this stage owns has a ruling.

## Phase 6: Production (delegated to data-model-writer)

**The approval gate comes first in this list because it has been skipped three stages running.** Read
it before you read the rest.

0. **The approval gate.** When the document exists, show Sandro the path and the Summary and ask for
   explicit approval. On approval, flip Draft → Approved and add the Change History row. **Do not
   report the stage closed without an answer to that question.** An unapproved artifact is owed work,
   and the next stage should not be the thing that discovers it.
1. Assemble the **model record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the deliverable-boundary ruling; the consolidated entity surface
   with every attribute, type, nullability and requiring spec; the relationships; the code lists with
   values and casing rule; the constraints classified; the draft ruling; the sort keys and their
   mechanism; the read projection; the managed-versus-domain-time ruling; the computed-not-stored
   list; the risk outcomes; the open items resolved; the amendments this stage causes; the
   coverage-check result; and every decision taken (context, options, ruling, rationale,
   consequences). **It must be complete — the writer cannot ask Sandro anything.**
2. Invoke `data-model-writer` with that record. It reads this skill's **document standard** section
   itself, writes `design/DATA_MODEL.md` at status **Draft**, logs the decisions in the module's log
   at the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one question,
   add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence.
   Check every count against the table it summarises, every attribute against the spec that required
   it, and every claim against its own evidence.
5. Apply the amendments in-session rather than leaving them owed, and show the list.
6. **Check the encoding survived the write.** Run `git diff --stat` and grep for the mojibake
   sequence before committing. A PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown
   file double-encodes every em-dash, and a bash heredoc has failed on markdown punctuation too. What
   works: write the block to a scratch file, then `cat scratch >> target`.
7. Name the next stage — Tech Stack — and stop. Do not start it.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                                  | Status                                                                                                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Four classifications — reference, master, transactional, cross-cutting | Derived from a large financial domain. Classify by what your module actually has; three groups or two is a fine answer.                |
| `String enum` fields in a §9 Enum Values table                         | **Superseded by the shared standards.** A finite vocabulary needing dropdown UX is a CodeList entity. Answer question 6, not this one. |
| `snake_case` attribute names                                           | **Superseded.** The shared standards say camelCase fields and PascalCase singular entities. The exemplar predates its own rule.        |
| A Change History carrying spec amendments                              | Fine — but amendments this stage _causes_ need their own section, not a Change History cell.                                           |
| No draft, sort-key, projection or risk section                         | Each is now a question. A module that genuinely has no answer states "none, because" — it does not drop the heading.                   |
| Every count restated in a Summary                                      | **Re-measure each against the table it summarises.** A count in a Summary is a claim, not evidence for the count in the body.          |

What **is** the standard: the sixteen questions, a stated "none" over a dropped heading, an entity
surface derived from the specs this session, every attribute citing the spec that required it,
contradictions settled rather than smoothed, constraints classified annotation-or-handler, and a
decisions table that makes every ruling citable by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops, Information Architecture, Design System or Theme decision.** If the
  model makes a settled ruling impossible, that is an amendment raised with Sandro — not a quiet
  override.
- **A spec's data section is an input to this document, not a reference to it.** Twelve of them are
  requirements to satisfy, not documentation to cite back.
- **Do not specify what nothing tests.** An attribute, a value or a constraint no spec exercises is
  specification without a test. Where a module's own principle says this, cite it.
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** Nothing mechanically validates an entity list, an attribute type or a
  sort key — Phase 5 and `data-model-writer`'s check are procedural. Say that plainly rather than
  implying enforcement that does not exist.
