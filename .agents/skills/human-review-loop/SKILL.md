---
name: human-review-loop
description: Process Sandro's end-of-build-cycle code review. For each finding — diagnose why the tooling failed to catch it, prescribe one durable prevention (ESLint rule, lint script, hook, memory, AGENTS.md), then fix the instance and sweep the codebase for the rest. Use when Sandro gives feedback on an uncommitted changeset, critiques agent-written code, or asks "why did lint not catch this", "why didn't eslint catch this", "prevent this from happening again", "add this to memory/AGENTS.md", "can we lint this". Also the Human Review stage of the Sprint Build chain — invoke it as `/human-review-loop` after `/functional-test` and `/ux-test`, once Sandro has read the diff and has findings.
---

## When this fires

Two entry points, and they are the same conversation from different directions.

1. **Ad hoc** — Sandro points at something wrong in an uncommitted changeset, in any of the wordings
   above. This is the common case and needs no ceremony.
2. **Sprint Build stage 6 — Human Review.** The chain is: `/build` → `/code-quality` →
   `/test-quality` → `/functional-test` → `/ux-test` (UI stories only) → **Human Review** →
   `/refresh-docs` → `/pm-update` → `/commit-diff`. Every prior stage is agent-run and stops without
   committing; this one is **manual and Sandro's**, because it is the only stage whose input is a
   human having read the diff.

**The stage is not skippable and it is not automatable.** If Sandro has read the diff and has no
findings, that is a complete Human Review — say so and move to `/refresh-docs`. What is not allowed
is an agent declaring the stage complete on its own behalf. Nothing downstream can tell the
difference between "reviewed, nothing found" and "never reviewed", which is exactly why the stage
has to be recorded rather than inferred.

Sandro reviews a finished changeset and points at what's wrong. Per finding, in this order —
**diagnose → prescribe → prove → fix → sweep**. The order is load-bearing: the mechanism gets
built while the violation is still on disk, which is the only reason Red is possible.

Paths are relative to `Life OS/`. The unit is **the module the changeset touches** — resolve it
rather than assuming; there is more than one module now. `{Module}/` below means that module.

## Search Map

Grep these before diagnosing. Where a rule *isn't* is the diagnosis.

| Layer | Path | Binds? |
|---|---|---|
| Terse pre-coding rules | `{Module}/AGENTS.md`, plus the shared standards in `Financial Planner/AGENTS.md` | No — prose |
| Rationale + examples | `Financial Planner/design/TECHNICAL_STANDARDS.md` | No — prose |
| Why + provenance | `~/.Codex/projects/c--Projects-Life-OS/memory/*.md` | No — prose |
| ESLint | `Standards (Technical + Linting)/eslint.config.mjs` — the shared rules; `{Module}/eslint.config.mjs` only re-exports them | Yes |
| Custom linters | `Standards (Technical + Linting)/scripts/lint*.ts` (21, shared by every module) | Yes |
| The chain | `{Module}/package.json` `lint` — `&&`-joined, **first failure hides the rest** | Yes |
| Agent process | `.Codex/settings.json` — **zero hooks today** | Yes |
| Commit gate | `.git/hooks/pre-commit` at the **repo root** — lint only, untracked. One git repo serves every module, so there is no per-module hook | Yes |

## Phase 1: Triage

1. Read every finding first. `<ide_selection>` is the locator — the selection is the evidence,
   the text is the rule. Rhetorical questions ("should classes not be PascalCase?") are findings.
2. Grep the Search Map per finding.
3. Emit **one** numbered table: `# | finding | diagnosis | phantom? | mechanisable? | proposed mechanism`.
   Merge findings sharing a root cause into one row — three "logic in facade" complaints are one
   lint script, not three.
4. **Present the table and stop.** Fix nothing in Phase 1. Sandro replies by index ("do #1 #2 #4").

## Phase 2: Per Finding

Work the confirmed rows, grouped by shared mechanism. Per group:

1. **Why the tooling missed it** — one sentence naming the layer that should have caught it.
2. **Prescribe** — one mechanism, with rationale. Never a menu. Ask for carve-outs *now*: every
   rule has them, and they arrive on the next turn anyway ("minimum 3 letters" → "i and id are
   valid exceptions"). A rule mechanised before its carve-outs collides.
3. **Red** — run the check against the *unfixed* violation. It must exit 1 and name the exact
   file. A check that never failed is not known to work.
4. **Green** — fix the instance. Re-run. Exit 0.
5. **Sweep** — scan the whole codebase for the same class. Report candidates vs true offenders
   and justify each exemption. Principled exemption beats mass-renaming.
6. **Wire + regress** — add to the chain, then run the **full** `npm run lint`. A new
   codebase-wide check almost always lights up existing files. Do not declare victory on Green.
7. **Document** — see Where It Lands.

## Diagnosis

Classify on the **first failure in the chain that should have caught it**.

| Diagnosis | Meaning | Action |
|---|---|---|
| **No rule existed** | Never articulated anywhere | Author at the right layer |
| **Prose-only** | Written down, nothing enforces it | Build the mechanism, update the prose to name it |
| **Coverage gap** | Check exists, doesn't reach this code | Widen it |
| **Never ran** | Check correct, nothing triggered it | Wire a trigger |
| **Rule wrong / collided** | Exists but is wrong or fights another rule | Refine |

Two flags, not classes:

- **phantom** — the prose *claims* a mechanism that doesn't exist (`AGENTS.md:107` credits
  ESLint for the Facade rule; no such rule exists). Escalation is non-negotiable: make the claim
  true or delete it. You cannot leave a lie in AGENTS.md.
- **mechanisable** — feeds the prescription, not the diagnosis. "No rule existed AND it's taste"
  is a valid pair.

**Coverage gap has three sub-types — check each by name:**
1. **Glob gap** — the file matches *no* config block (`app/**/*.js` never matched `.ts`).
2. **Rule-set shadowing** — a `files:` block defines its own `rules:` and omits the rule.
3. **Regex/AST gap** — the linter's pattern misses a form (`export default class`).

## Prescription

Route by the **nature of the finding**, not by climbing a ladder.

| Finding is… | Mechanism |
|---|---|
| Behavioural defect | Jest test |
| Pattern / convention | ESLint or custom linter — sub-order below |
| Agent process ("didn't run tests", "claimed done unverified") | **Codex hook** — the only cure for *Never ran*; lint can never catch these |
| Judgment / taste | Memory file. No lint. |
| One-off | Fix only. No artifact. |

Inside *pattern*, in cost order:

1. **Turn on a rule that already exists** — built-in, `@typescript-eslint`, or an installed
   plugin. Nearly free. Add it to **every** matching `files:` block or you've built a shadowing gap.
2. **Widen an existing `scripts/lintX.ts`.** Check this before writing #19.
3. **New `scripts/lintX.ts`** — copy the shape of `scripts/lintFilenames.ts`.

Never author a new ESLint *plugin rule*. No plugin scaffold exists; a custom script has 18
precedents and is ~5× cheaper.

## Where It Lands

| Nature | DEFECT_LOG | Mechanism | Memory | AGENTS.md |
|---|---|---|---|---|
| Behavioural defect | Row + root cause | Jest test | — | — |
| Pattern / convention | — | ESLint or `lintX.ts` | Yes | One line **naming the script** |
| Agent process | — | Hook | Yes | — (the hook enforces it) |
| Judgment / taste | — | — | Yes | Only if must-know before coding |
| One-off | — | — | — | — |

Memory files **are** the review log — they quote the complaint, link siblings with
`[[wiki-links]]`, and name the enforcing script. Do not invent a second ledger.

Memory schema — match the existing files exactly: frontmatter `name` / `description` /
`metadata: {node_type: memory, type: feedback, originSessionId}`; body = the rule, then
**Why:** (quote Sandro verbatim + name the tooling failure), then **How to apply:** (guidance +
the exact enforcing rule/config/globs + the gap that let it through). Add the one-line
`MEMORY.md` index entry in the same turn. When a rule escalates, **amend** its existing file
(`**Now mechanically enforced (added YYYY-MM-DD):**`) — never create a second file.

## Rules

- **"No mechanism" is a valid outcome.** Say it out loud with the reason. Do not manufacture a
  lint to look productive.
- **If the rule needs an allowlist on day one, it's taste** — memory, not lint. A mechanism must
  be expressible without knowing the file it came from.
- **If a finding rests on a misreading, say so before fixing.** Don't fix a non-problem.
  Pushback is wanted.
- **Prose has no Red.** An unprovable rule is an unenforceable one — that is why the FRICEW-ID
  rule was re-violated ~80× before it was linted. This is the entire argument for mechanising.
- **Check "widen an existing linter" before writing a new one.** The chain is 18 long and
  `&&`-joined; at 30 it is slow and hides failures.
- **A AGENTS.md line is one terse trigger naming its `lint:*` script** — that's the file's own
  philosophy (line 75): aim right on the first pass instead of round-tripping through a lint
  failure. Never restate what TECHNICAL_STANDARDS.md already explains.
- **Batch the prescriptions, sequence the fixes.** Sandro reviews related rules together and
  answers by index.