---
name: generate-test-strategy
description: Run the Test Strategy stage for a Life OS module — settle what a test may assert, which tier asserts it, where tests live, what runs them and what coverage means, measured against the harness actually installed rather than quoted from another module's document. Scout the design docs' deferrals, every spec's Functional Unit Test section, the exemplar's test strategy as its jest config and test tree actually are, and the module's decisions log via subagents, then execute the harness question — can this module's implementation be loaded by the runner at all — before ruling on it. Settle tooling, harness loading, the tier list, per-tier standards, the assertable surface, the test profile's blind spot, test data, file structure, coverage targets and their layer mapping, the FUT coverage contract, frontend testing, how a run is recorded and what is mechanically enforced with Sandro one question at a time, execute or re-own any risk assigned to this stage, then hand a test record to the test-strategy-writer agent that writes design/TEST_STRATEGY.md. Use whenever Sandro wants to run the Test Strategy stage for a module, decide how it is tested or what coverage means, or says "run test strategy", "generate the test strategy", "what are our coverage targets", "what tier tests this", "can cds.test load our service", "how do we test the MCP verbs", "where do test files go"; or when the Build Plan or a build is blocked because nothing specifies what a test must be.
---

The Tech Stack stage settles **what runs the module**. This stage settles **what proves it works** —
which tiers exist, what each may honestly assert, where tests live, what runs them, and what a
coverage number means once you say it. It runs eleventh, after Tech Stack, because what a harness can
exercise is a property of the stack it runs on, and before the Build Plan, because a story's
definition of done is a test.

A module can have twelve Approved specs, a proven model, a working stack and still be untestable in
the way that matters: a runner that cannot load the implementation, so the tier that was supposed to
test the business rules tests the framework instead; a coverage target inherited from a module with
different layers, so no gate can fairly enforce it; and a hundred Functional Unit Tests with no
stated path from a spec line to a test file. That gap is this stage's deliverable.

## Where this runs

**Root at the module directory, the way the shared linters do.** Every path below is relative to
`process.cwd()`, which is the module you are working. The artifact is `design/TEST_STRATEGY.md`.
Financial Planner is the **worked example throughout — never the target**. If you find yourself
typing a module name into a path, stop; you have broken the thing that makes this skill serve the
next module.

Two things are module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; a module
  scaffolded later may put its own at `design/DECISIONS_LOG.md`. Resolve the module's actual log;
  never assume either path.
- **The `D-nn` sequence.** Each module numbers from D-01. Never continue another module's sequence.

**IDs are module-local too.** `TS-001`, `DM-001`, `DS-001` and `TH-001` in one module are not the
same documents in another, and neither is `INT-001`, `CNV-001` or `FRM-001`. A seeded `Defect D-001`
is not decision `D-01`. When this document cites another module's artifact, qualify it with that
module's name.

**One thing is deliberately not module-local: the harness.** Jest, ts-jest and the shared test
linters are declared once at the repo root and serve every module. A jest config is module-local; the
runner behind it is not. Say which is which.

## Step 0: the predecessor's status

**Read the module's `design/TECH_STACK.md` header before anything else** — or, where a module ran no
Tech Stack stage, its last status-bearing design document. If it is not **Approved**, say so in your
first message and ask Sandro to approve it or to authorise running on an unapproved input. Do not
flip the status yourself and do not proceed silently.

This check exists because it failed three stages running — `IA-001`, then `DS-001`, then `TH-001`,
each discovered by the stage after it (D-159, D-169 in Project Tracker's log). Moving the gate to
step 0 of Phase 6 is what held at the fourth and fifth opportunities. **Keep it there. Two data
points is not a proof — if you find a failure anyway, say so plainly rather than quietly approving:
a fix that stopped working is itself a finding.**

## What this stage owns, and what it does not

| Owned here                                                                         | Not here                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| **The runner and its configuration** — and what the config actually says on disk   | Which entity stores what (Data Model)             |
| **How the harness loads the implementation under test** — measured, not assumed    | How the _server_ loads it (Tech Stack)            |
| **The tier list** — what each touches, and what each may not                       | What each verb or screen does (Workshops)         |
| **What a test may assert as contract** versus what it must exercise as logic       | Which constraint is an annotation (Data Model)    |
| **What the test profile never exercises** — inherited from the stack, carried here | Which profile each run mode resolves (Tech Stack) |
| **Test data rules** and **the test file structure**                                | The fixtures themselves (Build)                   |
| **Coverage targets, and the layer each maps to**                                   | Whether a given file hits it (Build)              |
| **The FUT coverage contract** — how a spec line reaches a named test               | Story order and sprint shape (Build Plan)         |
| **How a test run is recorded**                                                     | The recorder's implementation (Build)             |
| **What is mechanically enforced, and what is not**                                 | Writing a new linter (Standards, its own change)  |

**This stage rules; it does not write tests.** Whether it also adds a `test` script is question 3's
sibling and is asked explicitly in Phase 3 — a module with no tests and a present `test` script can
red-line an entire workspace, and a module with tests and no script is untested silently.

## What the document is load-bearing for

Know the consumers before you bend a rule:

| Consumer                | Reads                                               | Breaks if                                                        |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| Every build story's TDD | Tier boundaries and per-layer unit rules            | A test is written at a tier that cannot reach the code           |
| `test-author`           | Test data rules, file structure, the FUT contract   | Fixtures land where a linter rejects them                        |
| `gate-runner`           | The runner, the script, and the coverage thresholds | The gate green-lights a module whose tests never loaded the impl |
| The Build Plan          | The FUT contract and per-wave expectations          | A story's definition of done cannot be stated                    |
| The access-layer story  | Which tier tests a non-HTTP transport               | The module's entire write path has no tier that reaches it       |
| Whoever reads a report  | How a run is recorded, and where                    | A failing run is not recorded at all                             |

## The document standard

This section is the template. `test-strategy-writer` reads it verbatim — do not paraphrase it into
the record.

### The document answers questions, not a fixed section list

The exemplar (`Financial Planner/design/TEST_STRATEGY.md`) is **647 lines, 55 headings and 13
numbered sections** (measured; re-measure rather than trusting this line — four of those headings are
template text inside a fenced code block, which is the kind of thing a heading count hides). It was
written 2026-02-13, **before** almost everything that now governs a test in this repo: against
`String enum` fields, a `project/` folder, a `posttest` hook later measured unable to record a
failing run, and a shared standard about CAP annotations that turned out to be wrong about the
framework twice. **Its shape assumes one transport, one runner that never loads the implementation,
and one module.**

So: **the questions are fixed, the section list is derived from the module, and a question with no
content is answered explicitly — "none, and here is why" — never dropped.** A stated "none" is a
ruling; a missing heading is indistinguishable from an oversight, and the next module cannot tell
whether the question was considered.

| #   | The question                                                                         | Section it becomes               | Exemplar's answer shape                                                         |
| --- | ------------------------------------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------- |
| 1   | What is the record of this document?                                                 | Change History                   | Table — 5 rows                                                                  |
| 2   | What did this stage settle?                                                          | Summary                          | `Area \| Standard` table, 8 rows                                                |
| 3   | What runs the tests, what configures them, and **what does the config say on disk**? | Test Tooling & Configuration     | **Half** — a config table that disagrees with the real `jest.config.ts`         |
| 4   | **How does the harness load the implementation under test?**                         | Harness & Implementation Loading | **Absent** — its suites carry a comment saying it cannot                        |
| 5   | Which tiers exist, what does each touch, and what may each not do?                   | Test Boundaries                  | Three-tier table + boundary rules                                               |
| 6   | What are the unit standards, per layer?                                              | Unit Test Standards              | Per-layer table — what to test, what to mock                                    |
| 7   | What are the integration standards?                                                  | Integration Test Standards       | Setup pattern + a per-service shape table                                       |
| 8   | **What tests a surface with no HTTP transport?**                                     | (a derived tier of its own)      | **Absent** — one transport, so the question never arose                         |
| 9   | **What may a test assert as contract, and what must it exercise as logic?**          | The Assertable Surface           | **Present and wrong** — names an annotation that does not exist                 |
| 10  | **What does the test profile never exercise?**                                       | The Test Profile's Blind Spot    | **Absent** — no profile section anywhere                                        |
| 11  | Where does test data come from, and what may never be inline?                        | Test Data Strategy               | Factories + named constants, with a canonical world                             |
| 12  | Where does every test file live?                                                     | Test File Structure              | The `data/support/tests` contract + a tree                                      |
| 13  | What are the coverage targets, **and which layer does each map to**?                 | Coverage Targets                 | **Half** — four targets, and a config block naming a folder that does not exist |
| 14  | **How does every Functional Unit Test reach a named test?**                          | The FUT Coverage Contract        | **Absent** — FUTs appear as four scenario rows                                  |
| 15  | What is tested in the browser, and by what?                                          | Frontend Testing                 | QUnit + OPA5, explicitly a learning exercise                                    |
| 16  | How is a test run recorded, and where?                                               | Recording a Test Run             | Markdown reports — an artifact a later object retires                           |
| 17  | **What is mechanically enforced, and what is enforced by nothing?**                  | Enforcement                      | **Absent as a section** — enforcement claims scattered in prose                 |
| 18  | What does this stage change in an upstream or Approved document?                     | Amendments                       | **Absent**                                                                      |
| 19  | **Which risks are assigned to this stage?**                                          | Risks Assigned to This Stage     | **Absent**                                                                      |
| 20  | **Which open item does this stage own, and what is its ruling?**                     | Open Items Resolved              | **Absent**                                                                      |
| 21  | Which decisions did this stage take?                                                 | Decisions Reference              | `ID \| Title \| Summary` table                                                  |

Questions 4, 8, 9, 10, 14, 17, 18, 19 and 20 are **not** sections in the exemplar, and 3 and 13 are
present but disagree with the files they describe. Every one of them exists because something the
exemplar could take for granted — one transport, a runner that was never asked to load anything, a
set of layers that matched its own, an annotation the framework was believed to have — stopped being
true. **A module that is not the first in its repo faces all of them.**

### Rules that hold at any module size

- **Execute the harness question before ruling on it.** Whether the runner can load this module's
  implementation is measurable in an afternoon and decides the whole tier design. A tier that cannot
  reach the code tests the framework instead — which the shared standards forbid by name. Run it in a
  scratch project outside the module, with the module's own `tsconfig`, `module` setting and import
  idiom, and delete the scratch afterwards.
- **A silent pass is worse than a failure, and must be named.** Where a missing lever, a missing flag
  or a wrong profile turns a real-logic assertion into a framework assertion **that still passes**,
  say so in the section and put the lever somewhere it cannot be forgotten per file.
- **Read the runner's config on disk; never quote it from a document.** The exemplar's own coverage
  section names a source folder that does not exist in its repo. A config block in a strategy
  document is a claim; the config file is the evidence.
- **Every coverage target names the layer it maps to.** A number with no mapping is a number no gate
  can fairly enforce. Where a module has layers the exemplar lacks, they get rows; where it lacks
  layers the exemplar has, the absence is stated, not silently dropped.
- **Classify every assertion as contract or logic, and check the mechanism.** A test asserting an
  annotation's behaviour is documenting a contract; a test asserting a handler's behaviour is
  exercising logic. **Grep the runtime before inheriting a sentence about either** — a shared standard
  has been wrong about which annotations exist.
- **Name what the test profile cannot assert.** Where the tests resolve a different database, a
  different transport or a different auth kind than the real one, the constraints whose mechanism is
  the missing thing are unassertable. That list is this section's whole point.
- **Every spec's Functional Unit Tests are an input, and the contract between them and the test tree
  is this document's.** Count them. State the count. Then state how a FUT reaches a file.
- **Do not specify what nothing tests — and do not require a test for what no spec specifies.** The
  principle cuts both ways at this stage.
- **Never invent a threshold, a folder or a tool.** If the strategy needs something the design
  documents never asked for, that is an amendment raised with Sandro, not an addition made here.
- **Amendments to Approved documents are listed, not applied silently.** The Amendments section is the
  record; the edit itself is made in-session by the host.
- **State enforcement honestly.** Name the `lint:*` scripts that really run, then name what nothing
  checks. `lint:doc-claims` fails any `CLAUDE.md` line claiming enforcement without naming a live
  script or rule id, and the same honesty is owed by this document.

## Why this delegates its reading

The inputs are large, numerous and mostly settled: every design document's deferral sentences, every
spec's Functional Unit Test section, the exemplar's strategy _and its jest config and test tree_, the
decisions log and the risk register. Reading them in the main thread spends the interview's context
on content you will not re-litigate. **Send scouts; get back findings with `file:line` citations.**
When Sandro contradicts one — he will — read that one line then.

Spawn the scouts **in one message** so they run concurrently. Tell each to report what is **absent**
as explicitly as what is present, and to re-measure every count it reports rather than quoting one.

| Scout         | Reads                                                                                                     | Returns (≤ ½ page, every claim cited `file:line` or as a command's output)                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **deferrals** | **Every** design document in the module, its `CLAUDE.md`, and every spec's cross-reference section        | Every sentence that defers a decision to **this stage by name**, quoted with `file:line`; and every stage-owned question stated without an owner                           |
| **futs**      | **Every** spec's Functional Unit Test section and business-rule section                                   | The **measured** FUT count and business-rule count per spec; every FUT whose subject is not reachable over HTTP; and every FUT that names a browser, a transport or a file |
| **precedent** | The exemplar's strategy document **and its jest config, test tree and test-related npm scripts, on disk** | The document's shape, and **every place the document and the files disagree** — the files win. Never carry a threshold, a path or a count from the document                |
| **decisions** | The module's decisions log, its plan, its stack document and its research register                        | Decisions binding this stage (ID + one-line ruling), the next free `D-nn`, **risks assigned to it by ID with what would settle each**, and every open item this stage owns |

## Phase 0: Resolve inputs

1. Confirm the module — cwd, and that `design/` exists. If `design/TEST_STRATEGY.md` already exists,
   this run is an **amendment**: read it yourself, in full, before anything else.
2. **Run Step 0** above on the predecessor document.
3. **Grep the module's own documents for this stage by name yourself.** Delegating the reading is
   fine; the deferral list is this stage's core input and you own it. Count the deferrals and state
   the count before scouting. **Do not carry a list from a handoff prompt or from `PLAN.md`** — those
   are summaries, and replacing a summary with a measured list is this stage's first job.
4. **Count the Functional Unit Tests and business rules yourself**, per spec and in total, and state
   the figures before anyone reasons from them.
5. Read the module's Tech Stack for the profile it rules and what it says the tests never exercise,
   and its Data Model for which constraints are annotations and which are handlers. Those two decide
   what a test may honestly assert.
6. Read the exemplar's strategy document yourself, **and its jest config and test tree**. Where they
   disagree, the files win and the disagreement is a finding.

## Phase 1: Scout

Spawn the four scouts above with the module, the deferral count, the FUT count, and — on an
amendment — the existing document's decisions and their IDs.

## Phase 2: Surface confirmation

Open by listing **the decisions this stage inherits** — one line each, each citing the document that
handed it down — and ask whether that is the whole surface. Then walk the stage **question by
question**, in the standard's order. Present what the design documents already answer and ask if it
is accurate before moving to the gaps. **One question at a time.** A wall of questions gets one
answer to the last one.

## Phase 3: Strategy interview

Work these in order. Each is a genuine fork for most modules; skip one only when the scouts show it
already ruled, and say so rather than staying silent.

1. **The harness question — execute it first.** Can the runner load this module's implementation? Do
   not ask it; measure it. Report the failure mode as precisely as the success: whether a missing
   lever fails loudly or **passes silently** is the finding that shapes every tier below.
2. **The deliverable boundary.** Document only, or document plus the scripts and configs it rules
   for? Ground it in what the module has: whether any test exists, what the repo-wide `npm test`
   does with a present-but-testless script, and what the module's own `CLAUDE.md` already claims.
3. **The runner and its configuration.** Every setting, and where it lives. Read the exemplar's
   config file rather than its documented config.
4. **The tier list.** What tiers exist, and what each one touches. A module whose write path is not
   HTTP has a tier the exemplar does not, whether or not anyone has said so.
5. **Per-tier standards.** Unit: what to test, what to mock, per layer. Integration: the setup
   pattern and the per-service shape. Any further tier: the same two questions.
6. **The assertable surface.** Which constraints are contract (assert the annotation) and which are
   logic (exercise the handler). **Check the runtime, not the standard.**
7. **The test profile's blind spot.** What the stack's test profile makes unassertable, and what
   happens to those constraints instead.
8. **Test data and file structure.** Inherit, amend, or carve out — and say which, with the linter
   that enforces it named.
9. **Coverage targets, and the layer mapping.** Inherit or re-derive; then map every target to a
   real folder in _this_ module's tree.
10. **The FUT coverage contract.** How a spec's FUT becomes a named test, at which tier, and what
    happens to a FUT no tier can reach.
11. **Frontend testing.** What the browser stages already cover, and whether an in-repo frontend
    suite adds anything the module's own principle would allow.
12. **Recording a run.** Where a result goes, what records it, and — measured — whether the recording
    hook can record a **failing** run at all.
13. **Don't stop early.** After the forks clear, ask what `test-author` would still have to guess and
    what `gate-runner` would have to assume. That is the bar.

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
checked the register rather than assumed it — the check itself is the deliverable when the answer is
"none assigned".

**Do not settle a risk as a side effect.** A pinned-runtime risk in particular is its own change, run
with the suite green either side; this stage may name it and must not raise it.

## Phase 5: Coverage check

Before writing, prove the document against its inputs. Show Sandro the result; each failure is a
question, not a silent fix.

- Every sentence in any design document that defers a decision to this stage by name has a ruling here.
- The harness question was **executed**, and both the success and the failure mode are recorded.
- Every tier names what it touches and what it may not.
- Every layer in this module's source tree maps to a tier and a coverage target, or is stated excluded.
- Every coverage target names a folder that exists in this module's destination tree.
- Every constraint in the Data Model is classified assertable-as-contract or exercise-as-logic.
- Everything the test profile cannot assert is listed, with what covers it instead.
- Every spec's FUT count is measured, totalled, and given a path to a named test.
- Every test-file rule names the linter that enforces it, or is stated unenforced.
- Every question in the standard has a section, including those answered "none".
- Every risk assigned to this stage is executed or re-owned, or the absence is stated.
- Every open item this stage owns has a ruling.

## Phase 6: Production (delegated to test-strategy-writer)

**The approval gate comes first in this list because it was skipped three stages running.** Read it
before you read the rest.

0. **The approval gate.** When the document exists, show Sandro the path and the Summary and ask for
   explicit approval. On approval, flip Draft → Approved and add the Change History row. **Do not
   report the stage closed without an answer to that question.** An unapproved artifact is owed work,
   and the next stage should not be the thing that discovers it.
1. Assemble the **test record** — the handoff artifact. It contains: the module, its decisions-log
   path and the next free `D-nn`; the deliverable-boundary ruling; the harness measurement with its
   exact success and failure modes; the runner and every configuration setting with its file; the tier
   list with what each touches; the per-tier standards; the assertable surface with each constraint
   classified; the test profile's blind spot and what covers it instead; the test data rules; the file
   structure with its linters; every coverage target with its layer mapping; the FUT contract with the
   measured counts; the frontend ruling; the run-recording ruling; the enforcement inventory naming
   live scripts and stating what nothing checks; the risk outcomes; the open items resolved; the
   amendments this stage causes; the coverage-check result; and every decision taken (context,
   options, ruling, rationale, consequences). **It must be complete — the writer cannot ask Sandro
   anything.**
2. Invoke `test-strategy-writer` with that record. It reads this skill's **document standard** section
   itself, writes `design/TEST_STRATEGY.md` at status **Draft**, logs the decisions in the module's log
   at the path the record names, and returns its validation check.
3. If it returns a **gap** instead of a file, the interview left a hole. Ask Sandro that one question,
   add the answer to the record, re-invoke. Do not fill the hole yourself.
4. **Read the produced file yourself before showing it.** The writer's own check is not evidence. In
   order of yield at the last three stages: re-measure every count against the table it summarises;
   **re-open every `file:line` you cite** — stage 10 found two of its own citations wrong this way;
   check every question in the standard has a section, including those answered "none"; and check
   every risk named as assigned here is executed, re-owned or stated absent.
5. Apply the amendments in-session rather than leaving them owed, and show the list.
6. **Check the encoding survived the write.** Run `git diff | grep 'â€'` before committing. A
   PowerShell `Add-Content -Encoding utf8` append to a UTF-8 markdown file double-encodes every
   em-dash, and a bash heredoc has failed on markdown punctuation too. What works: write the block to
   a scratch file with the Write tool, then `cat scratch >> target`; or a `.py` file doing explicit
   `io.open(..., encoding='utf-8')`. Then run `npx --no-install prettier --write` on every markdown
   file touched — without it the editor reports MD060 table-alignment warnings on every table written.
7. Name the next stage — the Build Plan — and stop. Do not start it.

**One mechanical note that has cost five stages a delegation.** Claude Code resolves its agent
registry at session start, so a `test-strategy-writer` authored in this session is **not invocable in
it**. If the agent is new, write the document in the main thread against this same standard and say
that is what happened; do not report a delegation that did not occur.

## The exemplar's answers, which are not the standard

Carry the mechanics forward; do not carry these.

| The exemplar's answer                                                          | Status                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "The runner cannot load the TypeScript service implementation"                 | **Superseded by measurement.** It can, given one lever set before the resolver loads. Measure it for your module rather than inheriting the belief.         |
| A coverage config block naming a source folder that does not exist in its repo | **The reason question 13 asks for a layer mapping.** Read the config file; map every target to a real folder.                                               |
| "DO test annotation-based constraints … cross-field `@assert`"                 | **Wrong at the pinned runtime.** Grep the compiler before inheriting any sentence about annotations. An assertion about a non-existent annotation is a lie. |
| A `posttest` hook as the recording mechanism                                   | **Measured unable to record a failing run** — npm skips a `post` script when the main script exits non-zero. Call the recorder explicitly at each gate.     |
| Markdown test reports under a `project/` folder                                | **Retired** where a module owns project state. Say whether your document describes the destination, the transition, or both.                                |
| A frontend suite framed as a learning exercise                                 | Fine as an answer, **not** as an inheritance. A module with one page and browser stages in its build chain may answer "none" — with the reason.             |
| Per-wave test expectations restating the wave plan                             | Useful only where waves differ in test _character_. Otherwise it is the Business Architecture restated, and it drifts.                                      |
| Every count and threshold restated in a Summary                                | **Re-measure each against the thing it summarises.** A threshold in a Summary is a claim, not evidence for the threshold in the body.                       |

What **is** the standard: the twenty-one questions, a stated "none" over a dropped heading, the
harness question executed rather than inherited, every coverage target mapped to a real folder, every
constraint classified contract-or-logic against the runtime, the test profile's blind spot named,
every FUT given a path to a file, enforcement stated honestly against live `lint:*` scripts, risks
executed rather than described, and a decisions table that makes every ruling citable by ID.

## Rules

- **Sandro decides; you propose.** Give a recommendation with rationale, then take his answer.
- **Nothing is decided silently.** Every question in the standard ends in a written answer, including
  the ones answered "none".
- **Never re-open a Workshops, Information Architecture, Design System, Theme, Data Model or Tech
  Stack decision.** If a testability constraint makes a settled ruling impossible, that is an
  amendment raised with Sandro — not a quiet override.
- **A design document's deferral is an input to this document, not a reference to it.** A sentence
  saying "the Test Strategy stage rules this" is a requirement to satisfy, not documentation to cite
  back.
- **Do not specify what nothing tests, and do not require a test for what no spec specifies.**
- Log decisions into the module's own log, continuing that module's `D-nn` sequence.
- Follow the module's document status and Change History conventions.
- **This stage is partly enforced and mostly not.** Where a repo carries shared test linters, they
  enforce the file structure, the data rules and the CQL boundary — name them. **Nothing mechanically
  validates a coverage target, a tier boundary, the FUT mapping or the harness lever.** Say that
  plainly rather than implying enforcement that does not exist.
