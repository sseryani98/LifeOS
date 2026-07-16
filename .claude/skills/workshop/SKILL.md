---
name: workshop
description: Run a functional spec workshop for a Financial Planner FRICEW spec group — scout the design docs via subagents, interview Sandro one question at a time, extract business rules and functional unit tests, then write SPEC-nn. Use whenever Sandro wants to spec, design, or workshop a feature; says "let's spec out X", "workshop the goals module", "run a workshop on INT-001", "I want to design the budget pipeline"; names a spec by number, name, or FRICEW ID; or asks to amend, re-open, or extend an existing spec in Financial Planner/design/specs/. Also use when a build is blocked because a spec is missing, thin, or ambiguous and the fix is a design conversation rather than code.
---

A spec workshop is an **interview**, not a document review. Sandro holds the domain knowledge; the
design docs hold everything already decided. Your job is to arrive knowing everything the docs
already answer, so every question you spend on Sandro is one only he can answer.

Paths are relative to `Life OS/`. The methodology is
`Financial Planner/design/DESIGN_WORKSHOP.md` — it is the authority; this skill is the harness that
runs it.

## Why this delegates its reading

The sources total ~19,400 lines: the six design docs (~4,500), the ten existing specs (~14,000),
and the CSV samples (~1,000). The interview is the long part of the session and it needs the room —
so the reading happens in subagents and only their findings come back. **The pre-draft is a
byproduct of research; the interview is the deliverable.** Never trade interview context for
reading you could have delegated.

Scouts return citations, not just conclusions. When Sandro contradicts a finding — he will — read
that one `file:line` then. Pull specifics on demand instead of pre-loading 14,000 lines against the
chance he might.

## Phase 0: Resolve + Scout

1. Read `Financial Planner/design/DESIGN_WORKSHOP.md` in full, yourself. You need §4 (template),
   §5.2 (type-specific questions), §6 (definition of done), and §9 (file naming) verbatim — a
   summary of a template is useless for filling one in.
2. Resolve the argument to a spec via the §3 grouping table. Accept a number ("1"), a name
   ("Ingestion Pipeline"), or a FRICEW ID ("INT-001" → Spec #1, via the §3.3 cross-reference). If
   the argument is missing or matches nothing, show the §3 table and ask which one — don't guess.
3. Spawn these three `Explore` scouts **in one message** so they run concurrently. Give each the
   resolved spec number, name, and its FRICEW IDs.

| Scout | Reads | Returns (≤ ½ page, every claim cited `file:line`) |
|---|---|---|
| **domain** | `BUSINESS_ARCHITECTURE.md`, `DATA_MODEL.md` | Each FRICEW object in scope: ID, name, description. Entities/attributes backing them. Gaps where an object has no entity. |
| **decisions** | `user-profile/DECISIONS_LOG.md`, `PROBLEM_STATEMENT_AND_VISION.md`, `PROJECT_MANAGEMENT.md` | Decisions binding this spec (ID + one-line ruling). Open items (OI-xx) this spec could resolve. Sprint position. |
| **precedent** | `specs/*.md`, `TECH_STACK.md`, `actual-csvs/` | Which existing specs touch this one and how (cross-refs, shared entities, contradictions). Patterns already established — don't re-litigate them. Real CSV samples usable as interview examples. |

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

- For **every** spec, ask: "Does this feature generate any alerts?" (resolves OI-06).
- Ground questions in Sandro's real cards and the actual CSV samples the precedent scout found.
  Concrete beats hypothetical — he answers "what happens to this Cobalt refund" far better than
  "how should refunds behave".
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

## Phase 6: Spec Production

1. **Before writing**, offer UX/QoL suggestions: "I have some UX suggestions before I write this
   up — want to hear them?" Numbered list, short descriptions. He'll pick.
2. Summarize any DM-001 amendments (new attributes, relationship changes) and get explicit
   confirmation.
3. Write `Financial Planner/design/specs/SPEC-{nn}-{NAME}.md` per §9.
4. Log new decisions in `user-profile/DECISIONS_LOG.md` — Decision ID, Context, Options, Decision,
   Rationale.
5. Note any OI-xx resolved in the spec's Open Items section.
6. Validate against the §6 Definition of Done.
7. Ask for explicit approval. On approval, flip status Draft → Approved and update `MEMORY.md`.

**The spec must be lean.** Follow the template exactly — no extra sections, no filler, no restating
BA/DM/Decisions. Tables over paragraphs. Rules as terse numbered assertions. FUTs as concrete
steps. If a sentence doesn't help a build persona implement or a review persona validate, cut it.

## Rules

- **No `[WORKSHOP]` placeholder survives into the final spec.** It marks an unasked question, and
  shipping one means the interview didn't finish.
- Every BR-xx is testable; every FUT-xxx references at least one FRICEW object.
- **If a build persona would need a clarifying question, the spec isn't done.** That's the bar.
- Sandro prefers explicit user actions over auto-magic — entity creation through value helps, not
  auto-inference. Design toward the explicit option unless he says otherwise.
- Follow `CLAUDE.md` document status conventions (change history, status field).
- Cross-spec ideas get logged, not designed.
