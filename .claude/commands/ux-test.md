---
description: Review a story's built pages against the Design System, Theme and Information Architecture in a real browser — contrast, theme adherence, wording, page-to-page consistency. Reports only, never fixes.
argument: FRICEW story ID (e.g. FRM-001). Omit to take the story most recently marked Build Done, Awaiting Review.
---

Your job is **resolution and rendering**. The `ux-tester` agent does the reviewing — you do not
open the browser and you do not fix what it finds.

This is methodology stage 5 of the Sprint Build chain, and it is **conditional**: it runs for
stories that ship UI, which in practice means `FRM-*` and any `RPT-*` with a page. It answers a
different question from `/functional-test` — not *does it work* but *does it look and read like the
rest of the product*.

## 1. Resolve the story, and check it has UI

| `$ARGUMENTS` | Do |
| --- | --- |
| A FRICEW ID | Use it |
| Empty | Take the story currently **Build Done, Awaiting Review** |
| Anything else | Resolve it against the story backlog. One match, use it; otherwise ask |

**If the story ships no UI, say so and stop.** An `ENH` or `CNV` story has no pages, and running
this against one produces a review of somebody else's screens. That is not a failure of the story —
say the stage is not applicable and move on.

Stop rather than run if the module has no Design System, Theme, or Information Architecture
document. Those are the standard being reviewed against; without them the agent has only its own
taste, which is not a standard. Name which is missing.

## 2. Confirm before spending

State the story, the pages it adds or changes, which reference documents will be used, and that a
browser session runs. Get a yes.

## 3. Invoke

Spawn the `ux-tester` agent with the story ID, the module directory, and the paths to the Design
System, Theme and Information Architecture documents.

## 4. Render the result, then stop

Lead with whether anything found is **blocking** — a contrast failure, an unreadable state, a
control that violates the theme — versus **cosmetic**. Then the findings, each as: what was
observed, which document it contradicts, and where.

Two distinctions to preserve rather than flatten:

- **A violation of a written standard** is a defect. Cite the document and the line.
- **A reviewer's preference** is a suggestion, and must be labelled one. The Design System is the
  authority here, not the agent's judgment, and blurring the two turns every review into a
  negotiation.

If the agent found a gap in the standard itself — a case the Design System does not cover — say so.
That is a finding worth more than the individual page, and it goes to the Design System document
rather than into the story.

## 5. Then stop

**Fix nothing.** Findings go to Sandro. Name the next stage — **Human Review** — and stop.
