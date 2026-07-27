---
name: workshop
description: Run a functional spec workshop for a Life OS module's FRICEW spec group — resolve the module, scout its design docs via subagents, interview Sandro one question at a time, extract business rules and functional unit tests, then hand a workshop record to the spec-writer agent that writes SPEC-nn. Use whenever Sandro wants to spec, design, or workshop a feature; says "let's spec out X", "workshop the goals module", "run a workshop on INT-001", "I want to design the budget pipeline"; names a spec by number, name, or FRICEW ID; or asks to amend, re-open, or extend an existing spec in a module's design/specs/. Also use when a build is blocked because a spec is missing, thin, or ambiguous and the fix is a design conversation rather than code.
---

A spec workshop is an **interview**, not a document review. Sandro holds the domain knowledge; the
design docs hold everything already decided. Your job is to arrive knowing everything the docs
already answer, so every question you spend on Sandro is one only he can answer.

## Resolve the module first — never hardcode one

This skill serves every module. Financial Planner is the worked example, not the target.

1. Take the module from the argument if given.
2. Otherwise use the module folder containing `process.cwd()`.
3. Otherwise list the folders in the root `package.json` `workspaces` array and **ask**. Do not
   guess, and do not default to the planner.

Every path below is relative to the module you resolved, unless it names another. Three things are
module-local and must not be flattened into one answer:

- **The decisions log.** Financial Planner's is `design/user-profile/DECISIONS_LOG.md`; Project
  Tracker's is `design/DECISIONS_LOG.md` — D-17 in `Project Tracker/design/DECISIONS_LOG.md` rules
  that `user-profile/` was a planner naming accident and is not inherited. Resolve the module's
  actual log; never assume either path.
- **The `D-nn` sequence.** Each module numbers its own decisions from D-01. Never continue another
  module's sequence.
- **Spec numbering.** `SPEC-nn` is module-local. A module's first spec is `01`, however far the
  planner's sequence has run.

## The methodology is shared; its file still lives in the planner

`Financial Planner/design/DESIGN_WORKSHOP.md` is the authority for **every** module — this skill is
the harness that runs it. §4 (template), §5.2 (question bank), §6 (definition of done) and §9 (file
naming) are cross-module in substance, written in the planner's vocabulary because the planner was
the only module when they were written. That is the same arrangement as the shared standards in
`Financial Planner/CLAUDE.md`: root `CLAUDE.md` §Still Undecided keeps it in place until a second
module reaches **build**. Read it where it is, treat it as shared, and do not move it.

What in it is *not* shared: §3 (the planner's 21-spec grouping), §7 (its OI-01…OI-08), §8 (its spec
ordering) and §10 are Financial Planner's own answers. Another module supplies its own — see Phase 0.

## Why this delegates its reading

On the planner the sources total ~19,400 lines: the six design docs (~4,500), the existing specs
(~14,000), and the CSV samples (~1,000). A younger module has less, but the shape holds. The
interview is the long part of the session and it needs the room — so the reading happens in
subagents and only their findings come back. **The pre-draft is a byproduct of research; the
interview is the deliverable.** Never trade interview context for reading you could have delegated.

Scouts return citations, not just conclusions. When Sandro contradicts a finding — he will — read
that one `file:line` then. Pull specifics on demand instead of pre-loading 14,000 lines against the
chance he might.

## Phase 0: Resolve + Scout

1. Read `Financial Planner/design/DESIGN_WORKSHOP.md` in full, yourself. You need §4 (template),
   §5.2 (type-specific questions), §6 (definition of done), and §9 (file naming) verbatim — a
   summary of a template is useless for filling one in.
2. Resolve the argument to a spec **inside the module you resolved**.
   - **The module has a grouping table** (the planner's is DESIGN_WORKSHOP §3): use it. Accept a
     number ("1"), a name ("Ingestion Pipeline"), or a FRICEW ID ("INT-001" → Spec #1, via the §3.3
     cross-reference). If the argument is missing or matches nothing, show that table and ask which
     one — don't guess.
   - **It has none** — the normal state before a module's first spec, since §3 is the planner's
     answer and is not inherited: resolve the argument against the module's
     `design/BUSINESS_ARCHITECTURE.md` instead. Propose which FRICEW objects belong in this one spec
     using §3's *principle* (objects that cannot be designed without each other group together; a
     leaf that only reads another's output stands alone), and get Sandro's agreement on the grouping
     before you interview. Number it from the module's own `design/specs/` sequence — `01` when the
     folder is empty or absent.
3. Spawn these three `Explore` scouts **in one message** so they run concurrently. Give each the
   resolved module, the spec number, name, and its FRICEW IDs. Paths below are module-relative; a
   scout reports a doc that does not exist rather than reaching into a sibling module for it.

| Scout | Reads | Returns (≤ ½ page, every claim cited `file:line`) |
|---|---|---|
| **domain** | `design/BUSINESS_ARCHITECTURE.md`, the module's data model (`design/DATA_MODEL.md` where one exists) | Each FRICEW object in scope: ID, name, description. Entities/attributes backing them. Gaps where an object has no entity. |
| **decisions** | the module's decisions log (resolved above), `design/PROBLEM_STATEMENT_AND_VISION.md`, and whatever holds its plan (`design/PROJECT_MANAGEMENT.md` on the planner, `PLAN.md` on Project Tracker) | Decisions binding this spec (ID + one-line ruling). Open items (OI-xx) this spec could resolve. Sprint or stage position. |
| **precedent** | `design/specs/*.md`, `design/TECH_STACK.md` or the shared one, the module's research pack and sample-data folder if it has them (`design/actual-csvs/` on the planner) | Which existing specs touch this one and how (cross-refs, shared entities, contradictions). Patterns already established — don't re-litigate them. Real samples usable as interview examples. |

Tell each scout to report what is **absent** as explicitly as what is present. A missing decision is
a question for Sandro; a decision already made is one you must not waste his time on.

## Phase 1: Pre-draft (internal only)

Assemble the scouts' findings into a draft spec following the §4 template. Pre-populate everything
the docs answer. Mark the rest `[WORKSHOP]`.

**Do not show Sandro the pre-draft.** It is your interview prep. Dumping it makes him proofread a
document instead of thinking, which is the opposite of what he's here for.

## Phase 2: Scope Confirmation

Open by listing the FRICEW objects in scope — one line each, ID + name — and ask whether the scope
looks right. Scope errors are cheap now and expensive after the interview.

Then walk the spec **topic by topic**. Present what you already know and ask if it's accurate before
moving to gaps. **One question at a time.** A wall of questions gets one answer to the last one.

## Phase 3: Gap Interview

Work each `[WORKSHOP]` placeholder, one question at a time, using the §5.2 questions for the spec's
type.

- For **every** spec, ask: "Does this feature generate any alerts?" — on the planner this is what
  resolves OI-06. Work the module's own open items the same way: the decisions scout named which
  OI-xx this spec could close.
- Ground questions in the module's real data — on the planner, Sandro's actual cards and the CSV
  samples the precedent scout found. Concrete beats hypothetical: he answers "what happens to this
  Cobalt refund" far better than "how should refunds behave".
- When he asks for a recommendation — "any suggestions?", "what do you think?" — **give one**, with
  rationale. Not a balanced menu. He's asking because he wants your judgment; a menu hands the work
  back to him.
- He thinks creatively when prompted and will raise ideas belonging to other specs. Capture them as
  cross-spec notes. Don't design them here — that's how a workshop sprawls.
- **Don't stop early.** After the placeholders clear, ask yourself what edge cases, interactions,
  and ambiguities you haven't probed. Move on only when you can honestly say you have no more
  questions. A build persona hitting a hole later costs far more than one more question now.

## Phase 4: Business Rules

Propose numbered rules (BR-xx) from the conversation, presented **in batches by topic** ("here are
the rules for SimpleFIN sync") — Sandro reviews related rules together and answers by index. Every
rule must be testable and unambiguous.

## Phase 5: Functional Unit Tests

Draft FUT-xxx scenarios from the rules and edge cases. Each has: Covers (FRICEW IDs),
Preconditions, Steps, Expected Result. Cover the happy path plus the key error and edge paths.
Present for validation.

## Phase 6: Spec Production (delegated to spec-writer)

The interview is done; the writing happens in an isolated **spec-writer** agent so producing the
document never competes for context with the conversation you just held.

1. **Before handing off**, offer UX/QoL suggestions: "I have some UX suggestions before I write this
   up — want to hear them?" Numbered list, short descriptions. He'll pick.
2. Summarize any data-model amendments (new attributes, relationship changes) and get explicit
   confirmation. The planner's data model is DM-001; cite whatever ID the module's own model carries.
3. Assemble the **workshop record** — the handoff artifact. It contains: the **resolved module
   folder and its decisions-log path**, plus the next free `D-nn` in that module's sequence; the
   resolved spec number, name, and FRICEW IDs; the confirmed scope; the approved BR-xx; the FUT-xxx
   (Covers, Preconditions, Steps, Expected Result); the decisions taken (context, options, ruling,
   rationale); the confirmed data-model amendments; the UX picks; and any cross-spec notes. It must
   be complete — the writer cannot ask Sandro anything.
4. Invoke the **spec-writer** agent with that record. It reads the §4 template / §6 DoD / §9 naming
   itself, writes `{module}/design/specs/SPEC-{nn}-{NAME}.md`, logs decisions in the module's
   decisions log at the path the record names, records resolved OIs, and returns its
   Definition-of-Done check — all at status **Draft**.
5. If spec-writer returns a **gap** instead of a file, the interview left a hole. Ask Sandro that
   one question, add his answer to the record, and re-invoke. Do not fill the hole yourself.
6. Review the returned DoD check against §6. Show Sandro the spec path and the one-line summary and
   ask for explicit approval. On approval, flip status Draft → Approved and update `MEMORY.md`.

**The spec must be lean** — the writer enforces this, and it is still the bar: template exactly, no
filler, no restating BA/DM/Decisions, tables over paragraphs, every sentence earning its place by
helping a build persona implement or a review persona validate.

## Rules

- **No `[WORKSHOP]` placeholder survives into the final spec.** It marks an unasked question, and
  shipping one means the interview didn't finish.
- Every BR-xx is testable; every FUT-xxx references at least one FRICEW object.
- **If a build persona would need a clarifying question, the spec isn't done.** That's the bar.
- Sandro prefers explicit user actions over auto-magic — entity creation through value helps, not
  auto-inference. Design toward the explicit option unless he says otherwise.
- Follow `CLAUDE.md` document status conventions (change history, status field).
- Cross-spec ideas get logged, not designed.
