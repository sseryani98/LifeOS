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

---

## H-01 Combat entropy

**Problem.** Fast agent output accumulates drift: one-off patterns, stale memory, sprawl.

**Already in place.** 21 shared architectural linters; `/human-review-loop` (turns each review
finding into a durable prevention); `/code-quality` + `/test-quality` workflows;
`cap-annotation-hunter`; per-agent `.claude/agent-memory/`.

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

## H-04 Domain-expert roles/agents to chat with

**Already in place.** 21 agents, nearly all _stage workers_ (writers, testers, reviewers).
Two skills already behave like domain critics: `mcp-surface-critic`, `cap-annotation-hunter`.

**Open question for Sandro.** Which domains? (e.g. CAP backend, UI5/Fiori, testing,
Financial Planner business rules, Project Tracker/MCP.)

**Options.**
- **A. Expert skills** — modelled on `mcp-surface-critic`: load into the main chat, so you
  converse with it directly; curated reading list + the D-nn rulings it must respect.
- **B. Expert subagents** — `.claude/agents/<domain>-expert.md` with their own agent-memory.
  _verify_ whether a subagent can be chatted with directly or only delegated to.
- **C. Hybrid** — a thin skill you chat with, backed by a subagent for deep reading.
