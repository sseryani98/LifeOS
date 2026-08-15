---
name: generate-tech-stack
description: Run the Tech Stack stage for a Life OS module — settle the runtime, the serving topology and the configuration every prior stage deferred, measured against the toolchain actually installed rather than quoted from another module's document. Scout the design docs' deferrals, the installed runtime on disk, the exemplar stack as its config files actually are, and the module's decisions log via subagents, settle versions and pins, process topology, the CDS service split, libraries, the TypeScript-impl loader, the database binding and where its credential lives, runtime feature flags, profiles and run modes, the origin, the folder structure, the frontend toolchain and the local run story with Sandro one question at a time, execute or re-own any risk assigned to this stage, then hand a stack record to the tech-stack-writer agent that writes design/TECH_STACK.md. Use whenever Sandro wants to run the Tech Stack stage for a module, decide what it runs on or how it is served, or says "run tech stack", "generate the tech stack", "what versions are we on", "where does the password live", "how does the TypeScript service load", "one origin or two", "what starts the server"; or when Test Strategy, the Build Plan or a build is blocked because nothing specifies the processes, the profiles, the pins or the configuration a module runs under.
---

The Data Model stage settles **what the module stores**. This stage settles **what runs it** — the
processes, the versions, the bindings, the flags and the files that carry them. It runs tenth, after
Data Model, because a serving stack is chosen for a model that exists, and before Test Strategy,
because what a test harness can exercise is a property of the stack it runs on.

A module can have twelve Approved specs, a proven model and still be unrunnable: a service
implementation the runtime cannot load, a database binding with no credential, a flag the model needs
that no file carries, and a browser that cannot reach the service it reads from. That gap is this
stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/TECH_STACK.md`.
Financial Planner is the **worked example throughout — never the target**. If you find yourself
typing a module name into a path, stop; you have broken the thing that makes this skill serve the
next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

**IDs are module-local too.** `TS-001`, `DM-001`, `DS-001` and `TH-001` in one module are not the
same documents in another, and neither is `INT-001`, `CNV-001` or `FRM-001`. When this document cites
another module's artifact, qualify it with that module's name.

**One thing is deliberately not module-local: the installed toolchain.** An npm workspace hoists one
runtime for the whole repo, so a version measured in this module is a repo-wide fact and a version
*pinned* in this module may not be the version that loads. Measure both, and say which is which.

## Step 0: the predecessor's status

**Read the module's `design/DATA_MODEL.md` header before anything else** — or, where a module ran no
Data Model stage, its last status-bearing design document. If it is not **Approved**, say so in your
first message and ask Sandro to approve it or to authorise running on an unapproved input. Do not
flip the status yourself and do not proceed silently.

This check exists because it failed three stages running — `IA-001`, then `DS-001`, then `TH-001`,
each discovered by the stage after it (D-159, D-169 in Project Tracker's log). Moving the gate to
step 0 of Phase 6 is what finally held at the fourth opportunity. **Keep it there. If you find a
failure anyway, say so plainly: a fix that stopped working is itself a finding.**

## What this stage owns, and what it does not

| Owned here                                                                             | Not here                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Versions** — language, runtime, framework, UI toolkit — and **what pins each**       | Which entity stores what (Data Model)                                    |
| **Process topology** — which processes exist, what each serves, what they share        | What each verb or screen does (Workshops)                                |
| **The service split** — how many services, what each is named and mounted at           | Which control renders a field (Design System)                            |
| **Libraries**, each with the object that needs it                                      | Concrete colours and tokens (Theme)                                      |
| **How a service implementation is loaded**, and the file that wires it                 | The handler's implementation (Build)                                     |
| **The database binding**, and **where the credential lives** — file, mechanism, ignore | The schema itself (Data Model)                                           |
| **Runtime feature flags** the model requires, and which file carries each              | Why the model requires them (Data Model)                                 |
| **Profiles and run modes** — and what each therefore never exercises                   | Test structure, fixtures and coverage targets (Test Strategy)            |
| **The origin**, and whatever fronts it                                                 | Routes, links, shell placement (Information Architecture)                |
| **The folder structure**, and the local run story                                      | Build sequencing and story order (Build Plan)                            |

**This stage rules; it does not build.** Whether it also writes a config file is question 3's
sibling and is asked explicitly in Phase 3 — the exemplar never faced it, because its stack document
was written against a tree that already had the files.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                     | Reads                                                    | Breaks if                                                          |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Every build story            | Versions, folder structure, service names, libraries     | A file lands where no section put it                               |
| The access-layer story       | The loader ruling and the process topology               | The implementation cannot be loaded by the process that needs it   |
| The migration / seed stories | The binding, the profile, and what `deploy` runs against | The load runs against a different database than the one documented |
| Test Strategy                | Profiles, run modes, and what the dev loop exercises      | The harness asserts against a database production never uses       |
| The UI stories               | The origin, the frontend toolchain and the UI5 pin       | Two origins reappear and the read path stops working               |
| Whoever operates it          | The run story and where the secret lives                 | The credential is in the repo, or nowhere                          |

## The document standard

This section is the template. `tech-stack-writer` reads it verbatim — do not paraphrase it into the
record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/TECH_STACK.md`) is **387 lines and 15 headings — 10 numbered
sections under the title** (measured; re-measure rather than trusting this line). It was written
2026-02-13 for a module with 39 entities, four services, 23 UI apps, encryption and cron jobs — and
before that module had ever connected to its own database, before a second module existed to hoist a
shared runtime, and before any origin question could arise. **Its shape assumes one module, one
process and one origin.** A module that is not the first faces different questions and the same
method.

So: **the questions are fixed, the section list is derived from the stack, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                        | Section it becomes           | Exemplar's answer shape                                          |
| --- | ----------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| 1   | What is the record of this document?                                                | Change History               | Table — 6 rows                                                   |
| 2   | What did this stage settle?                                                         | Summary                      | `Layer \| Choice` table, 7 rows                                  |
| 3   | What versions run, and **what pins each**?                                          | Language & Runtime           | **Half** — 4 versions, no pin mechanism, one already stale       |
| 4   | **Which processes exist, what does each serve, and what do they share?**            | Process Topology             | **Absent** — one ASCII layer stack, a single process assumed     |
| 5   | How many services, what is each named, and where is each mounted?                   | Service Split                | Table — 4 services with paths and the objects they serve         |
| 6   | Which libraries, for which object — and what the exemplar carries that is not owed? | Key Libraries                | Table — 8 rows, plus a "What Drops" table against Enbridge       |
| 7   | **How is a service implementation loaded, and which file wires it?**                | Implementation Loading       | **Absent** — never asked; it only ever ran under `cds watch`     |
| 8   | **What is the database binding, and where does its credential live?**               | Database Binding & Secrets   | **Absent** — declares an empty password and has never connected  |
| 9   | **Which runtime flags does the model require, and which file carries each?**        | Runtime Configuration        | **Absent as a question** — a config file exists, undocumented    |
| 10  | **Which profile does each run mode resolve, and what is therefore never run?**      | Profiles & Run Modes         | **Absent** — the development profile is not mentioned at all     |
| 11  | **What origin serves the UI, and what fronts it?**                                  | Origin & Serving             | **Absent** — one module, so one origin by accident               |
| 12  | What is the folder structure?                                                       | Project Structure            | A 165-line tree — the document's largest section by far          |
| 13  | What is the frontend toolchain, and what pins the UI toolkit version?               | Frontend Toolchain           | **Absent as a section** — one row inside §3                      |
| 14  | How is it deployed, started and developed against locally?                          | Deployment & Local Run       | Table — 4 rows                                                   |
| 15  | What does this stage change in an upstream or Approved document?                    | Amendments                   | **Absent** — carried in Change History cells                     |
| 16  | **Which risks are assigned to this stage?**                                         | Risks Assigned to This Stage | **Absent**                                                       |
| 17  | **Which open item does this stage own, and what is its ruling?**                    | Open Items Resolved          | **Absent**                                                       |
| 18  | Which decisions did this stage take?                                                | Decisions Reference          | `ID \| Title \| Summary` table                                   |

Questions 4, 7, 8, 9, 10, 11, 16 and 17 are **not** sections in the exemplar and are not optional.
Every one of them exists because something the exemplar could take for granted — one process, one
origin, one runtime copy, a database it never actually reached — stopped being true. **A module that
is not the first in its repo faces all eight.**

### Rules that hold at any stack size

- **Measure the installed toolchain this session; never quote a version from a document.** `node -v`,
  `npm -v`, the CAP CLI's own version report, and the resolved path of every runtime package. A
  version in a Tech Stack document is a claim; the installed tree is the evidence. The exemplar's
  own §3 has been wrong about its runtime.
- **A version without a pin is a float, and the float is the finding.** For every version, name what
  holds it — an exact dependency, a lockfile, a CDN URL, a `minUI5Version`. Where **nothing** holds
  it, say so; an unpinned global tool that participates in the build is a shared, silent lever.
- **Distinguish declared from resolved.** In a workspace, what a module declares and what its process
  loads can differ. Report both and say which one runs.
- **A secret ruling names three things: the file, the mechanism, and the ignore rule.** "It lives in
  `.env`" is not a ruling until the ignore line protecting it is verified to exist. Check it; a
  missing ignore rule is a finding this stage fixes rather than notes.
- **A flag ruling names the file.** "The module sets X" is unimplementable until a section says which
  file carries it — and the house precedent may already be a *different* file than the one the
  upstream decision guessed. Check the exemplar's config files on disk before repeating its document.
- **Name what each run mode never exercises.** Where a development profile resolves a different
  database, a different transport or a different auth kind than the real one, the gap is the point of
  the section. Test Strategy and every migration story read it.
- **Do not specify what nothing runs.** A library, a process, a flag or a service this module never
  starts is specification without a test — the same principle the module applies one level up. Where
  the module's own log states this, cite it.
- **Never invent a version, a library or a path.** If the stack needs something the design documents
  never asked for, that is an amendment raised with Sandro, not an addition made here.
- **Amendments to Approved documents are listed, not applied silently.** The Amendments section is the
  record; the edit itself is made in-session by the host.

## Why this delegates its reading

The inputs are large, numerous and mostly settled: every design document's deferral sentences, the
installed dependency tree, the exemplar's stack document *and its config files*, the decisions log and
the risk register. Reading them in the main thread spends the interview's context on content you will
not re-litigate. **Send scouts; get back findings with `file:line` citations.** When Sandro
contradicts one — he will — read that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count and every version it reports rather
than quoting one.

| Scout          | Reads                                                                                               | Returns (≤ ½ page, every claim cited `file:line` or as a command's output)                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **deferrals**  | **Every** design document in the module, every spec's cross-reference section, and its `CLAUDE.md`  | Every sentence that defers a decision to **this stage by name**, quoted with `file:line`; and every stage-owned question stated without an owner                                    |
| **runtime**    | The installed tree — every `package.json` in the repo, the lockfile, both modules' CAP config files | Declared vs **resolved** version for each runtime package, where each resolves from, what pins each, and every version participating in the build that **nothing** pins            |
| **precedent**  | The exemplar's stack document **and the config files it describes, on disk**                        | The document's shape, and **every place the document and the files disagree** — the files win. Never carry a version or a count from the document                                  |
| **decisions**  | The module's decisions log, its plan, its design docs, and its research register                    | Decisions binding this stage (ID + one-line ruling), the next free `D-nn`, **risks assigned to it by ID with what would settle each**, and every open item this stage owns         |

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/TECH_STACK.md` already exists, this
   run is an **amendment**: read it yourself, in full, before anything else.
2. **Run Step 0** above on the predecessor document.
3. **Measure the toolchain yourself, before scouting.** Node, npm, the CAP CLI's version report, and
   which paths each runtime package resolves from. State the figures before anyone reasons from them.
4. **Grep the module's own documents for this stage by name yourself.** Delegating the reading is
   fine; the deferral list is this stage's core input and you own it. Count the deferrals and state
   the count before scouting.
5. Read the module's Data Model, Design System and Information Architecture for anything they handed
   **down** by name — a flag with no file, a credential with no home, an origin with no mechanism. A
   question handed to this stage is not yours to re-frame.
6. Read the exemplar's stack document yourself, **and its config files**. Where they disagree, the
   files win and the disagreement is a finding.

## Phase 1: Scout

Spawn the four scouts above with the module, the deferral count, and — on an amendment — the existing
document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing **the decisions this stage inherits** — one line each, each citing the document that
handed it down — and ask whether that is the whole surface. **Do not carry a list from a handoff
prompt or from `PLAN.md`; those are summaries, and replacing a summary with a measured list is this
stage's first job.** Then walk the stage **question by question**, in the standard's order. Present
what the design documents already answer and ask if it is accurate before moving to the gaps. **One
question at a time.** A wall of questions gets one answer to the last one.

## Phase 3: Stack interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **The deliverable boundary.** Document only, or document plus the config files it rules for? Ground
   it in what the module has: whether a Test Strategy and a Build Plan exist yet, whether a gate
   covers the files, and what the module's own `CLAUDE.md` already claims. Config is not schema — a
   `.gitignore` line protecting a secret this stage rules for may be the one edit that is owed
   regardless, and saying so is part of the answer.
2. **Versions and pins.** Every version, and what holds it. The unpinned ones are the output.
3. **Process topology.** How many processes, what each serves, what they share, and what happens when
   two of them hold the same database at once. A module whose access layer and whose UI are served
   differently has more than one process whether or not anyone has said so.
4. **The service split.** How many services and what each is named. One is a fine answer; an unnamed
   one is not — every downstream bootstrap call names it.
5. **Libraries.** Each with the object that needs it. Then the reverse: what the exemplar carries that
   this module does not, stated so its absence reads as a ruling.
6. **Implementation loading.** The mechanism may already be verified upstream; the **ruling** — which
   levers, wired in which file, on which invocation paths — is this stage's. Enumerate the paths: a
   dev loop, a start script, a test harness and a standalone tool do not all read the same file.
7. **The database binding and the credential.** Where the secret lives, which role it authenticates,
   and the ignore rule protecting it. Check the ignore rule rather than assuming it.
8. **Runtime flags.** Each flag the model requires, and the file. Check the exemplar's file on disk —
   the house may already have a location, and an upstream decision that guessed a different one is
   corrected here.
9. **Profiles and run modes.** Which profile each mode resolves, and what is therefore never
   exercised. This is the section Test Strategy reads hardest.
10. **The origin.** What serves the UI and what fronts it. If a prior stage ruled an origin position
    and left the mechanism untested, that is a risk assigned here — see Phase 4.
11. **Folder structure**, and **the local run story** — the commands a person actually types.
12. **Don't stop early.** After the forks clear, ask what a build persona would still have to guess,
    and what someone starting the system from a clean clone would have to be told. That is the bar.

When Sandro asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
rationale. Not a balanced menu. He is asking because he wants your judgment.

## Phase 4: Risks assigned to this stage

The decisions scout returns any risk the module's register or decisions log **assigns to this stage**.
For each one, take one of exactly two positions and record which:

- **Execute it.** Run the settling test the register names, in a scratch location outside the module's
  source tree, and report what happened — including a null result. An executed risk changes its grade
  from `Inferred` to `Verified` and that grade goes in the document. Delete the scratch afterwards.
- **Re-own it explicitly**, with the owner, the deadline, and why executing here was the wrong shape.

**Deferring silently is not one of the options.** If no risk is assigned here, **state that**, having
checked the register rather than assumed it.

**This stage is the usual home for an untested mechanism**, because a mechanism is exactly what a
stack document rules for. A prior stage that ruled a *position* and could not test the *mechanism*
hands the execution here by name. Run it end to end, in a real client where the failure mode is a real
client's, and measure the specific request that failed before — not a proxy for it.

**A risk blocked on a credential, a service or a machine state is still executed as far as it goes.**
Measure the exact failure and record it — a precise blocked result is a finding, and it frequently
corrects the register's account of *why* the thing has never been done.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every sentence in any design document that defers a decision to this stage by name has a ruling here.
- Every version in the document was measured this session, and names what pins it.
- Every version that nothing pins is stated as unpinned.
- Every process is named, with what it serves and what it shares.
- Every service is named and mounted.
- Every library names the object that needs it.
- Every flag the model requires names the file that carries it.
- Every run mode names the profile it resolves and what it does not exercise.
- The credential ruling names a file, a mechanism and a verified ignore rule.
- Every question in the standard has a section, including those answered "none".
- Every risk assigned to this stage is executed or re-owned, or the absence is stated.
- Every open item this stage owns has a ruling.

## Phase 6: Production (delegated to tech-stack-writer)

**The approval gate comes first in this list because it was skipped three stages running.** Read it
before you read the rest.

0. **The approval gate.** When the document exists, show Sandro the path and the Summary and ask for
   explicit approval. On approval, flip Draft → Approved and add the Change History row. **Do not
   report the stage closed without an answer to that question.** An unapproved artifact is owed work,
   and the next stage should not be the thing that discovers it.
1. Assemble the **stack record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the deliverable-boundary ruling; every version with its pin and its
   measurement; the process topology; the service split; the libraries with their requiring object and
   the stated non-inheritances; the implementation-loading ruling with its wiring file and invocation
   paths; the database binding, the credential ruling and its ignore rule; every runtime flag with its
   file; the profiles and what each does not exercise; the origin ruling and whatever fronts it; the
   folder structure; the frontend toolchain and its pins; the run story; the risk outcomes; the open
   items resolved; the amendments this stage causes; the coverage-check result; and every decision
   taken (context, options, ruling, rationale, consequences). **It must be complete — the writer
   cannot ask Sandro anything.**
2. Invoke `tech-stack-writer` with that record. It reads this skill's **document standard** section
   itself, writes `design/TECH_STACK.md` at status **Draft**, logs the decisions in the module's log at
   the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one question,
   add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence.
   Check every version against what you measured, every path against the tree, and every claim against
   its own evidence.
5. Apply the amendments in-session rather than leaving them owed, and show the list.
6. **Check the encoding survived the write.** Run `git diff --stat` and grep for the mojibake sequence
   before committing. A PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file
   double-encodes every em-dash, and a bash heredoc has failed on markdown punctuation too. What
   works: write the block to a scratch file, then `cat scratch >> target`.
7. Name the next stage — Test Strategy — and stop. Do not start it.

**One mechanical note that has cost three stages a delegation.** Claude Code resolves its agent
registry at session start, so a `tech-stack-writer` authored in this session is **not invocable in
it**. If the agent is new, write the document in the main thread against this same standard and say
that is what happened; do not report a delegation that did not occur.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                             | Status                                                                                                                                        |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| A subagent-persona roster invented at design time                 | **Superseded.** The repo now has a real agent fleet and a build chain on disk. A persona list written here is drift the moment either changes. |
| An ASCII layer diagram standing in for the architecture           | Fine as decoration, **not** an answer to question 4. Layers are not processes; name the processes.                                             |
| Versions with no pin column                                       | **Superseded.** Every version names what holds it, or is stated unpinned.                                                                      |
| A 165-line folder tree as the document's centre of gravity        | The tree is useful and it is **not** the ruling. A module with an empty source tree states the *destination* structure and says so.            |
| A database section that never mentions a credential               | **The gap this stage exists to close.** A binding nobody has authenticated is a plan, not a stack.                                             |
| No profile section, so the dev loop's actual database is unstated | Each run mode names its profile and what it therefore never exercises.                                                                         |
| Every count and version restated in a Summary                     | **Re-measure each against the thing it summarises.** A version in a Summary is a claim, not evidence for the version in the body.              |

What **is** the standard: the eighteen questions, a stated "none" over a dropped heading, versions
measured this session with their pins named, processes enumerated rather than layered, a credential
ruling that names its ignore rule, flags that name their file, run modes that name what they do not
exercise, risks executed rather than described, and a decisions table that makes every ruling citable
by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops, Information Architecture, Design System, Theme or Data Model decision.**
  If a stack constraint makes a settled ruling impossible, that is an amendment raised with Sandro —
  not a quiet override.
- **A design document's deferral is an input to this document, not a reference to it.** A sentence
  saying "the Tech Stack stage rules this" is a requirement to satisfy, not documentation to cite back.
- **Do not specify what nothing runs.** Where a module's own principle says this, cite it.
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage has no linter.** Nothing mechanically validates a version, a pin, a process list or a
  credential ruling — Phase 5 and `tech-stack-writer`'s check are procedural. Say that plainly rather
  than implying enforcement that does not exist.
