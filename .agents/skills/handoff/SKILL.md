---
name: handoff
description: Write the prompt that starts the next session in a fresh context window. Compresses everything the current session learned — settled rulings, owed amendments, expected forks, re-verification warnings, pre-approved housekeeping — into one self-contained block Sandro pastes into a new chat. Use whenever Sandro says "handoff", "give me a prompt for a fresh context", "write the next prompt", "I'll take this to a new window", "what do I paste next", or asks to wrap up a session so the next one resumes cleanly. Also use proactively at the natural end of a stage — a spec approved, a story committed, a workflow closed — when the next unit of work is clear and the current window is long.
---

The prompt you write is the only thing the next session gets. It has no memory of this one.

Everything you learned here that is not written into a repo file dies when this window closes.
Recovering it costs the next session a full re-derivation — and on this repo that is exactly how
drift enters, because a re-derivation under time pressure guesses rather than re-reads.

**The deliverable is one fenced block Sandro pastes. Nothing above it but a sentence.**

## Non-negotiable: gather state before you write

Never write the prompt from what you remember. This repo's own history is the argument: `PLAN.md`
§5 drifted three times, `BA-001` drifted twice against itself, and a session found checkpoint
metrics misquoted across three documents. Your memory of this session is the same class of source.

Run these and use the results, not your recollection:

1. `git -C <repo> log --oneline -3` and `git status -sb` — the real HEAD, and whether the branch is
   in sync. Name the SHA in the prompt.
2. `git status --short` — anything uncommitted is state the next session inherits and must be told
   about explicitly.
3. Grep the continuity document and any status field you are about to assert. If you are about to
   write "SPEC-03 is Approved", read the line that says so.
4. Re-read the section of the tracker that names what comes next. Do not paraphrase it from memory.

If a number appears in the prompt — a count of specs, rules, objects, files — you read it this turn
or you do not write it.

## What goes in the block

Model it on the shape Sandro's own prompts use, because they work. Not every section applies to
every handoff; drop what is empty rather than padding it.

| # | Section | What it carries |
|---|---|---|
| 1 | **The task, in one line** | The unit of work, plus any prerequisite that must clear first ("Run X. Clear Y's owed amendment first.") |
| 2 | **Context** | Where the work sits, what is already settled and where that ruling lives, branch + SHA + sync state, anything uncommitted |
| 3 | **Read first** | The continuity doc, then a list of specific files **with the sections that matter**. `design/FOO.md — §6 and §11` beats `design/FOO.md` |
| 4 | **Step 0** | Owed amendments, corrections carried forward, anything the last session recorded but did not apply. State exactly what changes and whether it needs re-approval |
| 5 | **The work itself** | Scope, named objects/IDs, why they are grouped as they are |
| 6 | **Re-verify warning** | Name the specific past drifts as evidence. "Assume this pattern holds" |
| 7 | **Settled — do not re-litigate** | Rulings the next session would otherwise reopen, each with its decision ID. This is the section that saves the most time |
| 8 | **Expected real forks** | The genuine open questions, each stated as a question with its consequence — *not* pre-answered. Say "work them, don't assume" |
| 9 | **Risks going live** | Any risk this unit is the first to carry, with its grade and what would settle it |
| 10 | **Constraints** | Logged decisions that bound the work — carve-outs, pins, ownership boundaries, hazards like ID collisions |
| 11 | **Review your own output** | If an agent produces the artifact, say so, and name the specific checks that caught real defects before |
| 12 | **Out of scope** | What the next session must not drift into |
| 13 | **Housekeeping** | Pre-approved decisions — which agent to use, whether to apply corrections in-session, whether to commit and push |

## The two sections that carry the most weight

**§7 settled and §8 forks are the whole point.** A prompt that omits §7 gets a session that
re-argues decisions already logged. A prompt that pre-answers §8 gets a session that rubber-stamps
your guess instead of doing the work.

Write §8 as *questions with stakes*, never as answers:

> **What `next_action` returns for a Done Milestone whose Recommended stage is still open — the
> stage, or nothing?** Note the consequence either way: a Recommended stage nothing surfaces is a
> stage that never runs, and D-56(5) already spent a `description` per step so bare slugs wouldn't
> render.

That gives the next session the stakes and leaves it the ruling. Compare the failure mode:

> Decide what `next_action` returns for a Done Milestone. It should return the stage.

## Rules

- **Self-contained.** No "as we discussed", no "the file you have open", no pronouns pointing at
  this window. The next session sees the block and nothing else.
- **Every ID resolves.** `D-67`, `BR-14a`, `R9`, `FUT-010` — each must be findable in a repo file.
  If it only exists in this conversation, either write it to a file first or spell it out inline.
- **Qualify IDs that collide across modules.** Financial Planner and Project Tracker share story IDs
  (`CNV-001`, `INT-001`, `ENH-001`, `FRM-001`, …). Always attach the module name.
- **Absolute paths or repo-relative, consistently.** The next session may open in a different cwd.
- **Say what is uncommitted.** A clean tree is worth one line; a dirty one is worth a list.
- **Do not summarize this session's narrative.** The next session does not need to know what you
  did, only what is true now and what remains.
- **Length follows the work.** A one-story handoff is short. A stage handoff with five owed
  amendments is long, and padding it out or cutting it down both cost the next session.

## Before you emit

Read the block back and ask: *if this were the first thing I ever saw, could I start?* Specifically —

- Does every file path exist?
- Does every count come from something read this turn?
- Is any fork pre-answered that should have been left open?
- Is anything asserted as settled that is actually still owed?
- Would the next session need to ask a clarifying question before it could begin? If yes, the
  prompt is not done — that is the same bar the specs are held to.

Then emit it. One sentence of your own, then the block.
