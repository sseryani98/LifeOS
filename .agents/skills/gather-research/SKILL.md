---
name: gather-research
description: Run the Research stage for a Life OS module — frame the open questions into a topic brief, fan out one research-scout per topic in parallel, reconcile their findings, and produce the module's `research/` pack plus a gate verdict the Design phase can consume. Use whenever Sandro wants something researched, validated, or compared before a design decision is locked in; says "research X", "look into Y", "is Z viable", "can we actually do this", "compare A and B", "validate the approach before we commit"; or when a Plan/Design stage is blocked because an assumption underneath it has never been checked against real documentation. Also use to re-run research that has gone stale.
---

Research is the stage that stops the Design phase from building on an assumption nobody checked. It
ends in a **pack** — one document per topic under `{module}/research/` — and a **gate verdict** that
says what the module may now safely design around, and what it may not.

The stage is fan-out by nature: many sources, most of them irrelevant, all of them long. That is the
canonical case for context isolation (`METHODOLOGY_BLUEPRINT.md` §3.2). **One `research-scout` per
topic runs in parallel and returns citations and a verdict, not raw pages.**

Paths are relative to the module you resolve in Phase 0. The methodology is
`Standards (Documents)/METHODOLOGY_BLUEPRINT.md` §4–5.1 — it is the authority; this skill is the
harness that runs it.

## Resolve the module first — never hardcode one

This skill serves every module. Financial Planner is the worked example, not the target.

1. Take the module from the argument if given.
2. Otherwise use the module folder containing `process.cwd()`.
3. Otherwise list the folders in the root `package.json` `workspaces` array and **ask**. Do not
   guess, and do not default to the planner.

Everything you read and write lives under that module, plus the shared standards. A research pack
never lands at the repo root — `AGENTS.md` §Do NOT is explicit that only modules and Standards
folders live there.

## Reuse before inventing

`METHODOLOGY_BLUEPRINT.md:118` says "the existing `deep-research` skill can seed this." **It does not
exist in this repo** — there are four skills (`workshop`, `pm-update`, `refresh-docs`,
`human-review-loop`) and one agent (`spec-writer`), and `/gather-research` is listed as **New** at
`:108`. So check for it at runtime: if a `deep-research` skill or command is present, hand the
per-topic search loop to it and keep this skill as the framing, reconciliation, and gate harness.
If it is absent — the state today — `research-scout` owns the search loop and you note the absence
rather than pretending the blueprint's claim held.

Likewise, do not invent ledgers. Decisions go to the module's existing `DECISIONS_LOG.md`; open items
go where the module already tracks them.

## The three research modes

FP's two exemplars are both vendor comparisons feeding a build-vs-integrate call. **One module is not
a pattern.** A topic's mode decides its verdict vocabulary and its closing section — nothing else
about the shape changes.

| Mode | The question | Verdict vocabulary | Closes with |
| --- | --- | --- | --- |
| **Compare** | "Which of these should we use?" | Recommended · Viable alternative · Rejected | Recommendation, the fallback, and what would reverse it |
| **Validate** | "Does this approach work at all?" | Viable · Viable with caveats · **Unproven** · **Not viable** | The verdict, its caveats, and the fallback if it falls short of Viable |
| **Ground** | "What must we know about X before designing?" | — none — | Implications for design. **No recommendation.** |

Two rules that follow from the table:

- **Unproven is not Not-viable.** "No one has documented this pattern" is a distinct and common
  outcome — it means the approach may work fine but carries unshared risk. Collapsing it into either
  neighbour is the most damaging thing a research doc can do. It is the expected verdict for
  questions like *"can an MCP server call CAP in-process via `cds.connect.to()` against Postgres?"* —
  a pattern that is neither documented nor forbidden.
- **Ground mode has no recommendation and you must not manufacture one.** Domain research
  (`churning-in-canada.md` is the precedent) exists to make the Workshops stage smarter, not to pick
  a winner. A recommendation bolted onto grounding is a design decision smuggled past the interview.

## Phase 0: Frame the brief

Research is expensive and unfixable once launched — a badly scoped scout burns a full parallel wave.
Frame before you spend.

1. **Read what the module already answers, yourself.** The Problem Statement & Vision, the Business
   Architecture or PRD, any kickoff note, and — critically — the existing `research/` docs. A topic
   the module already researched is not a topic; it is a staleness question.
2. **Check on-disk before assuming the web.** For any question about a dependency the repo already
   has, the highest-authority source is `node_modules/` — the package's own source and typings beat
   every blog post about it. Note which topics have an on-disk answer path.
3. **Build the topic table.** One row per topic:

   `topic | mode | the question | the decision/stage it feeds | prior assumption to test | kill criteria | spike?`

   - **The decision it feeds** is mandatory. A topic that feeds no downstream artifact is curiosity,
     not research — cut it or say why it stays.
   - **Prior assumption to test** is what Sandro currently believes. The exemplars grade these
     explicitly ("Your assumptions about refresh cadence are correct… the data schema is
     significantly more limited than you may expect"), and stating them up front is what makes that
     possible.
   - **Kill criteria** — the evidence that would sink the approach — must be written *before* the
     search. A scout that defines success at the end grades its own homework.
   - **spike?** — whether the scout is authorized to run a throwaway executable spike (see below).

4. **Present the table and get approval before fanning out.** Scope errors are cheap now and
   expensive after six scouts have run. This is the only gate before the spend.

## Phase 1: Fan out

Spawn every scout for the wave **in one message** so they run concurrently. Scoping rules:

- **One topic = one question, one mode, one consuming decision.** A topic feeding two decisions is
  two topics.
- **A comparison of N options is N scouts, one per option — not one scout comparing.** This is what
  the planner actually did: `plaid-research.md` and `simplefin-research.md` are separate,
  self-contained docs, each aware of the other. Tell each scout the sibling options exist and may be
  referenced; the comparison itself is yours in Phase 2.
- **Split by source family, not by sub-question.** Two scouts over the same corpus duplicate work;
  two scouts over different corpora do not.
- **Six per wave, maximum.** Reconciliation cost grows faster than scout count. Beyond six, run a
  second wave seeded by the first — later topics are usually better questions anyway.

Give each scout: the module path, its row from the topic table verbatim, the sibling topics by name,
and the module conventions it must match. Tell it to report what is **absent** as explicitly as what
is present.

## Phase 2: Reconcile

Scouts return a **findings card**, not prose. Reason over the cards:

1. **Coverage** — every topic in the brief has a card; every card answers its stated question. A card
   that drifted off its question goes back, re-scoped.
2. **Contradictions** — two scouts disagreeing is a finding, not a defect. Resolve by evidence tier
   (Verified over Documented over Reported over Inferred), then by recency. If it cannot be resolved,
   it survives into the gate as an open risk. Only now do you open the specific doc at the specific
   `file:line` — pull detail on demand instead of pre-loading it against the chance you might.
3. **Cross-topic effects** — a finding in one topic that changes another topic's answer. The cards
   flag these so you can catch them without reading the docs.
4. **Assumption ledger** — every prior assumption from the brief, marked `holds` / `refuted` /
   `unknown`. Refuted assumptions are the highest-value output of the whole stage.

## Phase 3: The pack

Each scout writes its own document — `{module}/research/{topic-slug}.md`, kebab-case, named for the
subject not the mode. That is deliberate: a research doc's value lives in the detail behind the
citations, and a host who only holds ½-page summaries cannot write it without re-reading everything
the isolation existed to avoid.

You write one file: **`{module}/research/README.md`** — the pack index and the gate.

| Section | Contents |
| --- | --- |
| Gate verdict | **GO** · **GO WITH CAVEATS** · **NO GO** · **BLOCKED — unresolved**, in one sentence |
| The pack | One row per doc: topic, mode, verdict, confidence, the stage it feeds |
| What changed | Assumptions refuted, in one line each |
| Open risks | Contradictions and unknowns that survived reconciliation, each with what would settle it |
| Decays | Findings with a shelf life, and the fact that dates them |

`GO WITH CAVEATS` is the planner's actual gate outcome and it is the normal one. A gate that always
returns GO is not a gate.

## Phase 4: Hand off

1. **Log decisions** the research settles in the module's `DECISIONS_LOG.md` — Context, Options,
   Decision, Rationale — using the module's next free `D-nnn`. Research decisions are the ones the
   planner's timeline records as `D-30` through `D-34`.
2. **Close and raise open items.** A research pack usually closes one and raises two.
3. **Name the consumers.** State which downstream stage each doc feeds — Data Model, Tech Stack,
   Workshops — so the Design phase knows what to read and when it is reading something stale.
4. **Status is Draft.** Approval is Sandro's to give in the main thread; you do not flip Draft →
   Approved and you do not update `MEMORY.md`.

## Report

Lead with the **gate verdict in one sentence**, then the pack table, then the refuted assumptions,
then the open risks as questions for Sandro. Close with the second-wave topics the first wave
surfaced, if any.

## Rules

- **A negative finding is a successful research outcome.** `Not viable` and `Unproven` are wins — the
  stage exists precisely to find them before the Design phase builds on top. Never send a scout back
  to "look again more positively," and never soften a verdict during reconciliation. If a scout
  returns `Not viable`, the correct next move is to research the **fallback** as a new topic.
- **No claim without a tier and a source.** See the evidence tiers in the `research-scout` agent —
  Verified, Documented, Reported, Inferred, Unknown. An unsourced sentence in a research doc is
  worse than a missing one, because it will be trusted.
- **Every doc has a "What we could not establish" section.** A research doc without one is claiming
  omniscience. Absence of evidence is stated, with where it was searched, so nobody repeats the
  search.
- **Do not research what a workshop should ask.** If the answer lives in Sandro's head rather than in
  a source, it is an interview question — hand it to `/workshop`, do not spawn a scout at it.
- **Do not design here.** Research supplies the evidence and the verdict; the Design stages make the
  call. A recommendation is a bounded exception in Compare and Validate mode; an architecture is not.
- **Date everything that decays.** Vendor pricing, API surfaces, regulatory timelines, and "no one
  has done this yet" all go stale. Undated, they become traps.
- Follow the module's existing document conventions — status field and Change History where the
  module's other artifacts have them. Match the module; do not import the planner's.
