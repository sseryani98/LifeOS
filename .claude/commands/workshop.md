---
description: Run a functional spec workshop for a FRICEW spec group
argument: Spec name, number, or FRICEW ID (e.g., "1", "Ingestion Pipeline", "INT-001")
---

You are running a functional spec workshop for the Financial Planner project. Follow the methodology defined in `design/DESIGN_WORKSHOP.md` exactly.

## Setup

1. Read `design/DESIGN_WORKSHOP.md` — load the full methodology: grouping map (§3), template (§4), workshop flow (§5), definition of done (§6), open item assignments (§7).
2. Resolve "$ARGUMENTS" to a spec from the grouping table in §3. Accept spec numbers (e.g., "1"), spec names (e.g., "Ingestion Pipeline"), or FRICEW IDs (e.g., "INT-001" resolves to Spec #1). Use the cross-reference table in §3.3 for FRICEW ID lookups.
3. Read these source documents for context:
   - `design/BUSINESS_ARCHITECTURE.md` — FRICEW object descriptions
   - `design/DATA_MODEL.md` — Entity definitions
   - `design/user-profile/DECISIONS_LOG.md` — All design decisions
   - `design/TECH_STACK.md` — CDS services, project structure, conventions
   - `design/PROBLEM_STATEMENT_AND_VISION.md` — Open items
   - `design/PROJECT_MANAGEMENT.md` — Sprint plan
4. Read any previously written specs in `design/specs/` for cross-references.
5. Check `design/actual-csvs/` for real data samples relevant to this spec.

## Execute Workshop (6 Phases)

### Phase 1: Pre-draft (Internal Only)

- Build a draft spec internally following the template in §4.
- Pre-populate all sections you can from existing docs (BA descriptions, DM entities, decisions, tech stack patterns).
- Mark gaps that need Sandro's input with `[WORKSHOP]` placeholders.
- **DO NOT dump the full pre-draft on Sandro.** This is preparation for the interview, not the deliverable.

### Phase 2: Draft Review (Conversational)

- **Start by confirming scope:** List the FRICEW objects covered by this spec, one line each with ID + name. Ask: "This is what we're covering — does the scope look right?"
- After scope confirmation, walk through the spec **topic by topic** in a conversational interview style.
- Present what you already know from existing docs and ask if it's accurate, then move to the gaps.
- **One question at a time.** Never present a wall of questions or a full document dump.

### Phase 3: Gap Interview

- Walk through each `[WORKSHOP]` placeholder **one question at a time**.
- Use the type-specific workshop questions from §5.2.
- For **every** spec, ask: "Does this feature generate any alerts?" (OI-06 resolution).
- Use real examples with Sandro's actual cards and data where possible — reference actual CSV samples if they exist in `design/actual-csvs/`.
- When Sandro asks "do you have any recommendations?" or "any suggestions?" — **be opinionated.** Present a clear recommendation with rationale, not a menu of options.
- When Sandro offers creative ideas (he will — he thinks creatively when prompted), capture them. If they belong to a different spec, log them as cross-spec notes rather than designing them here.
- **Keep going until you are confident you have no more questions.** Do not stop early. After clearing all `[WORKSHOP]` placeholders, think critically: are there edge cases, interactions, or ambiguities you haven't asked about? If yes, ask. Only move to Phase 4 when you can honestly say "I have no more questions."

### Phase 4: Business Rules Extraction

- Propose numbered business rules (BR-xx) based on the conversation.
- Present rules in **batches by topic** (e.g., "Here are the rules for SimpleFIN sync — do these look right?"). Sandro prefers reviewing related rules together, not one at a time.
- Every rule must be testable and unambiguous.

### Phase 5: Functional Unit Tests

- Draft FUT scenarios (FUT-xxx) based on business rules and edge cases.
- Each FUT has: Covers (FRICEW IDs), Preconditions, Steps, Expected Result.
- Cover happy path + key error/edge paths.
- Present to Sandro for validation.

### Phase 6: Spec Production

- **Before writing the spec file**, offer UX/QoL suggestions. Ask: "Before I write this up, I have some UX suggestions that could improve the experience — want to hear them?" Present as a numbered list with short descriptions. Sandro will pick what he likes.
- Summarize any DM-001 amendments needed and get explicit confirmation.
- Write the final spec to `design/specs/SPEC-{nn}-{NAME}.md` (see §9 for file naming).
- **The spec must be lean.** Follow the template structure exactly — no extra sections, no filler prose, no restating what's already in BA/DM/Decisions docs. Tables over paragraphs. Business rules as terse numbered assertions. FUTs as concrete step sequences. If a sentence doesn't help a build persona implement or a review persona validate, cut it.
- Log any new decisions in `design/user-profile/DECISIONS_LOG.md` with full context (Decision ID, Context, Options, Decision, Rationale).
- Flag any DM-001 amendments needed (new attributes, relationship changes).
- If any OI-xx items are resolved, note this in the spec's Open Items section.
- Validate against the Definition of Done checklist (§6).
- Ask Sandro for explicit approval. When he approves, update the spec status from Draft to Approved.

## Rules

- Follow `CLAUDE.md` document status conventions (change history, status field).
- **Be conversational.** This is an interview, not a document review. One topic, one question at a time.
- **Be opinionated.** When asked for recommendations, give a clear recommendation with rationale — don't hedge or present balanced menus.
- Use real examples with Sandro's actual cards and transactions where possible.
- No `[WORKSHOP]` placeholders may remain in the final spec.
- Every business rule (BR-xx) must be testable.
- Every functional unit test (FUT-xxx) must reference at least one FRICEW object.
- If a build persona would need to ask a clarifying question, the spec isn't done.
- Sandro prefers explicit user actions over auto-magic behavior (e.g., entity creation through value helps, not auto-inferred).
- Capture cross-spec ideas when Sandro raises them — log as cross-spec notes, don't design them here.
- After approval, update MEMORY.md with new decisions and spec status.
