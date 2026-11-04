# Harness Backlog

Improvements to the agentic setup itself — agents, skills, workflows, hooks, linters — as
opposed to module features. Cross-module by nature, so it lives here.

**Logged:** 2026-11-02 · **Owner:** Sandro · Every item is **Open** until Sandro picks an option.
Options below are candidates, not decisions. Anything marked _verify_ is an unconfirmed
assumption about Claude Code / SAP tooling and must be checked against docs before building.

| ID   | Item                                         | Status |
| ---- | -------------------------------------------- | ------ |
| H-01 | Combat entropy                               | Open   |
| H-02 | Keep documentation in sync with code         | Open   |
| H-03 | Stay current with CAP / UI5 releases         | Open   |
| H-04 | Domain-expert roles/agents to chat with      | Open   |
| H-05 | doc-writer dry run: theme brief ambiguities     | Open   |

---

## H-01 Combat entropy

**Problem.** Fast agent output accumulates drift: one-off patterns, stale memory, sprawl.

**Already in place.** 21 shared architectural linters; `/human-review-loop` (turns each review
finding into a durable prevention); `/code-quality` + `/test-quality` workflows;
`cap-annotation-hunter`; per-agent `.claude/agent-memory/`.

**Done 2026-11-04, item 4 of the same review.** `lint:harness` (`scripts/lintAgentPrompts.ts`) runs first in the root `npm run lint`: canonical agent memory block, no machine paths, linter counts equal the files on disk.

**Done 2026-11-04 (option A).** `scripts/installHooks.mjs` registers `lintOnEditHook.mjs` as a `PostToolUse` hook on Write|Edit. For the edited file's kind it runs ESLint plus the custom linters that can judge that file (srv/mcp, app and test `.ts`; `.cds`; app `.xml`; `.properties`; `CLAUDE.md`), in parallel from the owning module, filtered to lines naming the file, never `--fix`, never blocking. Measured: `.ts` about 3 s with `eslint_d` (root devDependency) keeping ESLint's type-aware program warm (7.9 s per save cold, 1.9 s warm; the eight tsx linters run in parallel alongside), `.xml` and `.cds` 2 to 3 s. After a change to `eslint.config.mjs` run `npx eslint_d restart`, or the daemon keeps judging by the old rules. **Rejected: a Stop-time full `npm run lint`.** The chain is 31 s in Project Tracker and already runs at the gate and at commit; a third run per assistant turn is a tax, not a guard. **Next optimisation, unverified:** `asyncRewake: true` on the hook, so a clean edit costs nothing and a dirty one wakes the agent. Check it fires on PostToolUse before relying on it. The three user-level hooks that were firing here belonged to Enbridge (`cds build --for hana` on every `db/*.cds` edit, ESLint from a root with no config) and now live in that project's `settings.local.json`.

**Observed gaps.** No Claude Code hooks are configured in `.claude/settings.json`. That file's
`permissions.allow` holds 79 entries, many one-off (exact curl URLs, single commit messages,
old Financial-Planner paths) — itself an example of entropy. Agent-memory files have no
review/expiry step.

**Options.**
- **A. Hooks** — run the relevant linter on each edited file, and the full `npm run lint` at
  session stop, so drift is caught in-loop rather than at review. _verify_ hook events and
  blocking behaviour in current Claude Code docs.
- **B. Scheduled entropy sweep** — a weekly task running `cap-annotation-hunter`, `/pm-update`
  and the quality workflows read-only, producing one report for Sandro to triage.
- **C. Entropy metrics** — track a few numbers over time (lint-disable count, allow-list size,
  agent-memory size, files over N lines) and flag when they grow.

## H-02 Keep documentation in sync with changing code

**Already in place.** `/refresh-docs` (staleness sweep, fixes facts not meaning);
`lint:doc-claims` (every "enforced by" claim must name a real mechanism); `/pm-update`.

**Observed gap.** These run when invoked; nothing forces them at story close.

**Options.**
- **A. Gate it** — `build.js` runs `/refresh-docs` + `lint:doc-claims` as a story-close step.
- **B. Change-coupling check** — a linter/hook that flags a diff touching `db/` or `srv/` with
  no matching change under `design/` (warn, not fail).
- **C. Generate instead of maintain** — derive fact tables (entities, services, verb lists)
  from code (e.g. CDS compile output) so fewer facts are hand-written at all.

## H-03 Stay current with CAP / UI5 changes

**Already in place.** `@sap/cds` pinned exactly (9.8.4) at root and per module — load-bearing
per root `CLAUDE.md`; UI5 tooling on caret ranges; Context7 MCP in the allow-list.

**Options.**
- **A. Release-watch task** — monthly scheduled task reading the official CAP and UI5 release
  notes, mapping each change against the codebase, writing an impact report. _verify_ the
  canonical release-note sources before wiring.
- **B. Canary upgrade** — a worktree that bumps the pin and runs the full suite, honouring
  "raise the pin as its own change, green before and after."
- **C. Upgrade skill** — `/cap-ui5-upgrade` combining A + B and recording the outcome as a D-nn.

## H-05 doc-writer dry-run findings (2026-11-04)

**Source.** `doc-writer`'s first run re-rendered Project Tracker's approved `THEME.md` into a scratch
folder. Fixed in the agent the same day: the brief heading level, same-module cross-stage IDs are
cited bare, and a record older than the file it measures is a gap. Still open, all in
`generate-theme`'s document standard and writer brief:

- Whether section names are fixed or only the questions are (the standard says "Override Strategy",
  the approved doc said "The CSS Contract").
- Question 11 for an inheriting module: an exhaustive property map versus the lean rule and D-154.
  "Cite, don't copy" needs to be an allowed answer.
- Contrast scope: do icons (3:1 non-text), inherited chrome and emphasized-button text on the accent
  count, or only text on status and link surfaces? The run found `#E76500` and `#F53232` on white
  near the 3:1 line and the Amber button text never checked.
- Status renderings: a gap trigger covers them but no record field carries them, and icon colour is
  unaddressed.
- Process decisions (D-158, D-159 change the skill, not the theme) have no home in the 15 questions.
- Date and Version on a fresh write of an existing document ID.
- Whether a re-render reuses existing decision IDs (Phase 6 says "logs the decisions").

**Also found:** the approved `THEME.md` is stale against `theme-overrides.css` since commit
`6abcd76` (2026-11-02). That is `/refresh-docs`' to re-measure, recorded in `PLAN.md` §8.

## H-04 Domain-expert roles/agents to chat with

**Already in place.** 11 agents, nearly all _stage workers_ (one `doc-writer` for every Plan and Design document, plus testers, reviewers and the build chain).
Two skills already behave like domain critics: `mcp-surface-critic`, `cap-annotation-hunter`.

**Open question for Sandro.** Which domains? (e.g. CAP backend, UI5/Fiori, testing,
Financial Planner business rules, Project Tracker/MCP.)

**Options.**
- **A. Expert skills** — modelled on `mcp-surface-critic`: load into the main chat, so you
  converse with it directly; curated reading list + the D-nn rulings it must respect.
- **B. Expert subagents** — `.claude/agents/<domain>-expert.md` with their own agent-memory.
  _verify_ whether a subagent can be chatted with directly or only delegated to.
- **C. Hybrid** — a thin skill you chat with, backed by a subagent for deep reading.

---

## Harness freeze — 2026-11-04 until `CNV-001` commits

> **Lifted the same day.** Sandro chose to apply the review's fixes first (one `doc-writer` agent replaced eleven stage writers on 2026-11-04). The friction log below stays in use for every run.

**Rule.** No edits under `.claude/agents/`, `.claude/workflows/`, `.claude/commands/` or
`.claude/skills/` until Financial Planner's `CNV-001` has gone through the full Sprint Build chain
to `/commit-diff`. The one exception is a bug that stops a run. Everything else goes in the log
below and is triaged once, as one batch, after the second run.

**Why.** On 2026-11-04 the chain had completed end to end once in its life (FRM-001) and reached Human Review once (SPEC-02) and
the harness had taken ten commits in three days, each one fixing something a run exposed. Its
remaining defects are only discoverable by running it, and every speculative edit is itself
untested JavaScript. Items 3 to 5 of the same review (one `doc-writer` agent, one source per rule
with a drift linter, the MCP cutover) take their scope from this log.

**Runs in scope.** `SPEC-02` (Project Tracker, mid-chain: Human Review done 2026-11-04, commit next), then `CNV-001`
(Financial Planner, build to commit).

### Friction log

One line per stage per run. What hurt, what was done by hand, what the agent got wrong.

| Date | Run | Stage | Friction | Done by hand? |
| ---- | --- | ----- | -------- | ------------- |
