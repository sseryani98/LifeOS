# SPEC-08 — Consumer Rewiring

**Spec ID:** SPEC-08
**FRICEW Objects:** INT-002 (Interface), INT-003 (Interface), INT-005 (Interface)
**Wave:** 3
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 … SPEC-07. **R9 is ruled OUT** (D-101) — the
first spec to rule it out rather than inherit it. **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-30 | Sandro & Claude | Initial creation from the SPEC-08 workshop. Records D-94 through D-101. **First Wave 3 spec**, and the first whose deliverable is edited agent instructions rather than a service, a screen or a load — so §3's rewiring table and §7's split of ten inspection FUTs to two behavioural are the precedent for SPEC-09 … SPEC-12 (D-95). SPEC-01's **tenth** amendment applied in-session: `log_defect` gains a `workspace` mode with `story` optional, plus **SPEC-01 BR-18a**, §5's `verb.defect.scopeRequired`, and a correction to SPEC-01 FUT-009, which called the verb with no scope (D-96). The gap it closes was named at the SPEC-03 workshop (`DECISIONS_LOG.md:389`) and routed around for the migration alone. **Provisional on R1 only** — R9 is ruled out (D-101), on D-82's own per-origin test. **SPEC-08 resolves no OI.** Four BA-001 corrections applied in-session, listed in §6.                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-07-30 | Sandro & Claude | Four defects fixed on Sandro's review, before approval; **D-102** records the two substantive ones. **The rewiring opened no chain.** Every retired-path reference sits at the story level — the board never recorded a stage, because D-15 and D-24 say the per-stage detail was never tracked — so converting the references alone converts only Handoff, and SPEC-02 BR-24 and SPEC-02 BR-25 would then **refuse that Handoff pair on its first call**. §3.1 gains a row, §4 gains **BR-11a** (`start_stage` plus one `complete_subtask` per phase) and **BR-11b** (`smoke` is conditional on the same `shipsUi` predicate that gates the phase), and FUT-003 and FUT-012 assert the whole sequence. **BR-04 required a qualified story ID with no mechanism** — `build.js` carries a bare `storyId` beside a `moduleDir` — so **BR-04a** states the form is carried from `next_action()` / `project_view`, never constructed from `moduleDir`, which is a folder name and not a workspace slug. Two smaller: §5 said INT-003 can provoke **no** rejection, but D-41 binds read verbs too, so `verb.identity.missing` reaches it; and BR-12 named three identities where five call sites exist, which makes **`build-briefer`** and **`pm-update`** new enumeration values (§2 amendment 3). |
| 2026-07-30 | Sandro & Claude | **Three rows and BR-13a … BR-13c added at the SPEC-09 workshop (D-107).** `posttest` does not fire when `npm test` exits non-zero — verified on npm 10.9.3 — so INT-004 on that hook alone could record only passing runs, and `build.js`'s phase-3 gate is deliberately red. Both gate call sites now invoke `npm run record-test-run` explicitly, and **`build.js:382`'s "a `posttest` report generator that always fires" is a false claim this spec corrects** rather than repoints. `test-quality.js`'s scoped path is excluded: `npx jest` is not an npm lifecycle and its coverage table is partial by design. **This is D-102's finding recurring** — an instruction the rewiring must _add_, which no retired-path reference named. **Two further rows and BR-14a** come from the same re-verification: the repo-root `CLAUDE.md` and `Financial Planner/CLAUDE.md:35` both describe the shared `scripts/` folder as holding `generateTestReport.ts`, which SPEC-09 moves. **Ten files now, not nine** — the root `CLAUDE.md` had appeared in no surface measurement ever, because like the other late finds it carries **no retired-path reference**. ~~The count of sixteen references is unchanged and still correct.~~ — falsified at the SPEC-10 workshop, see the row below. |
| 2026-08-04 | Sandro & Claude | **Amended at the SPEC-10 workshop.** **BR-02 now refers to the shared retired-artifact list** rather than enumerating four literals (**D-117**) — measured, those four cannot match `Financial Planner/CLAUDE.md:77`'s bare `sprints/` or `generateTestReport.ts:6`'s split path literal, so a rewiring could pass BR-02 with a retired path intact, and this spec used four different spellings across BR-02, FUT-001, FUT-006 and FUT-009. **The reference count is corrected from sixteen to 21** — sixteen was `PLAN.md` §6's eight-file measurement, including two references in a file SPEC-09 owns and excluding the eight D-23 added. **FUT-001's "under-reports by six files" is corrected to five, with the cause corrected too** (**D-116**): ripgrep applies `.gitignore:10`'s `.claude/*.md` at every depth while git does not, so a default `rg` walks 4 of 37 files under `.claude/`. **One row added to §3.1** — `build.js:379`'s "21 `lint:*` scripts", already false at 22 and made falser by [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-28, D-102's shape a third time. **§6's owed glob row is discharged** by SPEC-10 BR-17's six roots. Status stays **Approved**. |
| 2026-07-30 | Sandro & Claude | **BR-13 amended at the SPEC-09 workshop (D-107)**, discharging the one note this spec raised there. The instruction BR-13 deletes was only a **truncation fallback** — `test-quality.js:267` already made the jest console table primary — so the fallback is replaced by `coverage/coverage-summary.json` rather than removed, which is the file INT-004 itself reads and which `gate-runner`'s existing `Read` grant already covers. The `TestRun` is **not** readable at gate time: `posttest` fires after `npm test` exits. §3.1's `test-quality.js` row and §6's raised row updated with it. No FUT changes. |
| 2026-07-30 | Sandro          | **Status → Approved.** All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on **R1** for build; R9 stays ruled out (D-101). Unlike SPEC-01, no decision holds this spec in Draft — D-93's argument is that six workshops have amended SPEC-01 and more will; SPEC-08 has been amended once, by SPEC-09, and that amendment is applied above rather than owed (D-103).                                                                                                                                                     |

---

## 1. Overview

Three Interfaces objects sharing one question, per BA-001 §11 row 08: "One question asked three times:
which verb replaces which markdown write." Twenty-one references across ten files move off the four
retired markdown state artifacts and onto the MCP intent verbs — INT-002 rewires the build chain,
INT-003 retires `/pm-update`'s checks, and INT-005 lands Human Review's findings through `log_defect`.

This is the first spec whose deliverable is **edited agent instructions** rather than a service, a
screen or a load, so it also sets the §3 and §7 shape for SPEC-09 … SPEC-12, which have the same
problem (D-95). **It rewires; it enables no guard** (D-07).

**The count was wrong, and it was wrong in a way worth recording (D-117).** This spec said "sixteen
references across ten files" and asserted at its last amendment that "the count of sixteen references
is unchanged and still correct". Sixteen is `PLAN.md` §6's **eight-file** measurement, which reconciles
exactly — 3+2+2+1+1+4+1 across the build surface, **plus the two in `generateTestReport.ts`, a file
this spec does not own** (SPEC-09 BR-01) — and it predates D-23, which added `METHODOLOGY_BLUEPRINT.md`
(5) and `Financial Planner/CLAUDE.md` (3). Measured against these ten files on 2026-08-04 with the
[SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-03 token set: **21**. The repo-root `CLAUDE.md` contributes
zero retired-path references and is in scope on BR-14a's separate ground.

That count of retired-path references was never the whole surface anyway, and §3's tables carry more
rows than it, in two
directions. An edit that removes an instruction _depending_ on a retired path — a delegation phase, a
reconcile phase, a schema field — names no path itself. And the rewiring has to **add** writes that
never had a reference to convert: the board recorded a story's state and never a stage's, so opening
the chain is new instruction rather than a repoint (D-102, BR-11a).

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity         | Role in this spec                                                 | Attributes this spec requires                                                                                                              |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Milestone**  | INT-002's target; the backlog side of INT-003's surviving check 3 | `storyId`, `fricewType` — both already required by SPEC-01 §2 and read through `project_view`'s per-Milestone chain header (SPEC-07 BR-11) |
| **Task**       | The stage INT-002's rewired call sites start and complete         | `status`, addressed by slug `code` (SPEC-02 §3.1)                                                                                          |
| **Subtask**    | The seven Sprint Build steps `build.js`'s phases map onto         | addressed by slug `code` (SPEC-02 §3.1)                                                                                                    |
| **Defect**     | INT-005's write target                                            | `severity`, `title`, `description`, `references`, plus its nullable links to Milestone and Initiative (SPEC-03 BR-21, D-61)                |
| **Initiative** | The scope an INT-005 ad-hoc finding resolves to                   | `status`, `position` — read only to resolve the Active Initiative (SPEC-05 BR-20)                                                          |

**Everything above is already required by SPEC-01 … SPEC-07; the Data Model stage should not
double-count. Nothing this spec never reads or writes is declared here.**

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **No new attribute.** All three objects write through verbs that already exist or through one amended signature; no entity gains a field.                                                                                                                                                                                                                                                                                                                                                         |
| 2   | **A note, not an attribute.** The `Defect` → Initiative link is written for the first time by a verb here — the migration wrote it and no verb did (D-96). The Data Model stage must ensure the at-least-one-present constraint of SPEC-03 BR-21 is expressible on rows created **post-cutover**, not only on migrated ones.                                                                                                                                                                      |
| 3   | **The identity enumeration gains two values.** SPEC-02 §2 amendment 6 enumerates the caller identities. This spec names two the enumeration does not yet carry — **`build-briefer`** and **`pm-update`** (BR-12) — both agents, neither human. SPEC-01 §3.1's list is written open-ended (`implementer`, `test-author`, `gate-runner`, …), so this extends it rather than contradicting it, and SPEC-07 BR-30's split is unaffected: both fall in the machine half like every non-`sandro` value. |

---

## 3. Functional Description

**One precondition binds all three objects.** Every rewired consumer reaches the verbs as an **MCP
client through the Claude Code harness** (D-94), so the MCP server must be registered by D-44's
tracked installer script before any rewired instruction can execute. This is a stated precondition,
not a risk — D-44 already discharges the durability half. **It is not R6**, which names the _hook_
registration in `.claude/settings.json`, a different gitignored file owned by INT-006.

### 3.1 INT-002 — Build Chain Rewiring [Interface]

**No endpoint, no payload, no schedule and no retry logic** — all six files are **agent instructions**.
`build.js` and `test-quality.js` are Workflow scripts with **no filesystem and no Node API**, so their
four references are prose inside template literals handed to subagents: they instruct, they never
write (D-94).

| File                                | Line(s)                       | Currently instructs                                                                                                                | Instructs instead                                                                                                                                                                                                                                                                               | Verb                                           |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `.claude/workflows/build.js`        | 76                            | `BRIEF_SCHEMA.boardRow` — "The story's `SPRINT_BOARD.md` row, character-for-character"                                             | The field is **removed from the schema and from `required`**. Nothing downstream needs a row to move                                                                                                                                                                                            | — (deletion)                                   |
| `.claude/workflows/build.js`        | 248                           | The briefer's source list names `${moduleDir}/project/SPRINT_BOARD.md` — "the story's row, and whether its dependencies are Done"  | The briefer calls `project_view` for the story's chain and its dependencies                                                                                                                                                                                                                     | `project_view`                                 |
| `.claude/workflows/build.js`        | 734                           | The Handoff agent's prompt: move the row from Backlog to In Progress, set Status `Build Done, Awaiting Review`                     | The Handoff agent calls `complete_subtask` on `handoff`, then `complete_stage` on `sprint-build`                                                                                                                                                                                                | `complete_subtask`, `complete_stage`           |
| `.claude/workflows/build.js`        | 6-14, and each `phase()` call | The seven `phases[]` entries and their `phase()` markers are **workflow progress display only** — nothing records that a phase ran | The workflow opens by calling **`start_stage`** on `sprint-build`, and each phase that completes calls **`complete_subtask`** on its own slug — `brief`, `red`, `implement`, `gate`, `coverage`, `smoke`, `handoff` (SPEC-02 §3.1's seven steps, which `build.js:6-14` already maps 1:1 — D-38) | `start_stage`, `complete_subtask`              |
| `.claude/commands/build.md`         | 18                            | Empty `$ARGUMENTS` → read `SPRINT_BOARD.md`, take the first Backlog row                                                            | Empty `$ARGUMENTS` → `next_action()` in workspace mode, which selects the candidate story itself (SPEC-04 BR-09)                                                                                                                                                                                | `next_action`                                  |
| `.claude/commands/build.md`         | 19                            | Anything else → grep `SPRINT_BOARD.md`; one Backlog match wins                                                                     | Resolve against `project_view`'s Milestone list; one match wins, otherwise ask                                                                                                                                                                                                                  | `project_view`                                 |
| `.claude/agents/build-briefer.md`   | 35                            | Source table row: `Financial Planner/project/SPRINT_BOARD.md` — "the story's current row and table"                                | `project_view` — the story's chain, its `fricewType`, `shipsUi` and dependency state                                                                                                                                                                                                            | `project_view`                                 |
| `.claude/agents/build-briefer.md`   | 51                            | `boardRow` — the row character-for-character "so the Handoff phase can find and move it"                                           | The bullet is **deleted** with the schema field                                                                                                                                                                                                                                                 | — (deletion)                                   |
| `.claude/agents/implementer.md`     | 70                            | Handoff mode: move the row in `Financial Planner/project/SPRINT_BOARD.md`                                                          | Handoff mode: `complete_subtask(story, 'sprint-build', 'handoff')` then `complete_stage(story, 'sprint-build')`, under identity `implementer`                                                                                                                                                   | `complete_subtask`, `complete_stage`           |
| `.claude/workflows/test-quality.js` | 267                           | The gate agent's prompt: a `posttest` generator writes markdown under `project/test-reports/`; read the newest report there        | Coverage numbers come from the console table; when truncated, from `coverage/coverage-summary.json`. The markdown report is gone — INT-004 emits a `TestRun` instead (SPEC-09), which is **not** readable here (BR-13, D-107)                                                                                                                                                                         | — (deletion; the `TestRun` write is INT-004's) |
| `.claude/workflows/build.js`        | 370-374                       | The gate agent's command block runs `npm test`; **nothing records the run**                                                        | The block adds **`npm run record-test-run`** after `npm test`, run without regard to whether the suite passed, with the story and stage supplied in the environment (SPEC-09 BR-10)                                                                                                              | INT-004's script (SPEC-09)                     |
| `.claude/workflows/build.js`        | 382                           | "`npm test` has `--coverage` baked in and a `posttest` report generator that **always fires**"                                     | Corrected on both counts: npm skips a `post` script when the main script exits non-zero, and **phase 3's gate is deliberately red** (`runGate(…, expectRed)`), so it does not fire there. And it emits a `TestRun`, not a report                                                                | — (correction)                                 |
| `.claude/workflows/build.js`        | 379                           | "`npm run lint` is ESLint plus **21** `lint:*` scripts chained with `&&`"                                                            | The sentence keeps its point — the chain halts at the first failing linter — and **drops the number**. Measured 2026-08-04, Financial Planner's chain carries **22** legs, so the claim is already false before this spec, and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-28 makes it 23. **D-102's shape a third time** (after D-102 and `build.js:382`): a correction the rewiring must make that no retired-path reference names. Raised at the SPEC-10 workshop                                                                                | — (correction)                                 |
| `.claude/workflows/test-quality.js` | 240-241, 283                  | The gate agent runs `npm test` when unscoped and a scoped `npx jest` otherwise; **neither is recorded**                            | After a **full** run the workflow adds `npm run record-test-run`; after a **scoped** run it does not (BR-13b)                                                                                                                                                                                    | INT-004's script (SPEC-09)                     |
| `CLAUDE.md` (**repo root**)         | 48                            | The Standards tree entry reads "Shared lint suite (21 linters) **+ generateTestReport**"                                           | The entry names the lint suite alone — INT-004's script moves into Project Tracker (SPEC-09 BR-02)                                                                                                                                                                                               | — (documentation)                              |
| `Financial Planner/CLAUDE.md`       | 35                            | The folder tree reads "`scripts/` The shared lint scripts **+ generateTestReport.ts**, called by path"                             | Same — the shared folder holds lint scripts only. A **different line** from the `project/` block below                                                                                                                                                                                           | — (documentation)                              |
| `Financial Planner/CLAUDE.md`       | 74-77                         | Folder structure documents `project/` with `SPRINT_BOARD.md`, `DEFECT_LOG.md`, `sprints/`                                          | The `project/` block is removed; one line points at Project Tracker as the state of record                                                                                                                                                                                                      | — (documentation)                              |

**The last row carries no retired-path reference, and that is why it was nearly missed.** The board
recorded a story's state and never a stage's — D-15 and D-24 say the per-stage detail "was never
tracked" — so the six phases before Handoff had nothing to write and therefore no reference to
retire. Rewiring only the references would leave the chain **mid-flight**: SPEC-02 BR-24 rejects
`complete_subtask` while its parent Task is Not Started, and SPEC-02 BR-25 rejects it while an earlier
blocking Subtask is open, so a Handoff-only rewiring is refused by two guards on its first call. The
verbs are the first mechanism that can record a stage at all, which makes these writes new work rather
than a repoint. **This is D-40's no-legal-write-path analysis in its subtler form** — not a state no
verb can write, but a state no _instruction_ tells anyone to write.

**Identity.** Each call site declares its own identity (D-41, SPEC-01 BR-07) — the Handoff agent and
the Implementer as `implementer`, the briefer as `build-briefer`, the test-quality gate agent as
`gate-runner`, and the workflow's own `start_stage` and per-phase `complete_subtask` calls as
`implementer`, since it is the agent the workflow already runs them through. An undeclared identity is
**rejected, not defaulted** (SPEC-01 §5 row 3).

**Story addressing.** `build.js` today carries `storyId` as a bare FRICEW ID (`FRM-001`) alongside a
separate `moduleDir` (`Financial Planner`), and SPEC-01 BR-09 rejects a bare ID. The qualified form is
**not derived** from `moduleDir` — `Financial Planner` is a folder name, not a workspace slug.
`/build`'s resolution step already returns a story in qualified form, because `next_action()` and
`project_view` address stories as `{workspace-slug}/{story-id}` (SPEC-01 §3.1), so `storyId` carries
that value through unchanged and no slug is constructed anywhere.

**Rejection handling.** No consumer retries (D-46). A rejected verb surfaces its `remediation` string
to Sandro and stops the phase — `build.js` already returns a structured result rather than proceeding,
and a `wfl.stage.predecessorOpen` on `sprint-build` means the chain is genuinely not ready.

### 3.2 INT-003 — `/pm-update` Retirement [Interface]

**No endpoint, no payload, no schedule and no retry logic** — both files are instruction prose, and the
only verb involved is the read verb `project_view`.

**The skill is redesigned, not deleted** (D-97). SPEC-02 §3.1 seeds `pm-update` as a **Required** stage
at position 80 with driver `/pm-update`; D-52's precedence makes it a blocking predecessor of `commit`,
and D-56 (1) generates its remediation string from that seeded driver. Deleting the skill would make
`complete_stage('commit')` permanently unreachable on every story. BA-001's row title means the
**checks** retire.

| File                                             | Line(s) | Currently instructs                                                                                                                               | Instructs instead                                                                                                                                                                                                      | Verb              |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `.claude/skills/pm-update/SKILL.md`              | 6-9     | Preamble: "The PMO dashboard is only as honest as the markdown it reads"                                                                          | The store is the state of record; the skill audits only what the schema cannot enforce                                                                                                                                 | —                 |
| `.claude/skills/pm-update/SKILL.md`              | 13-15   | Artifacts under audit: `SPRINT_BOARD.md`, `DEFECT_LOG.md`, `sprints/*.md`                                                                         | One source — `project_view` — plus `git log` and `Financial Planner/design/BUSINESS_ARCHITECTURE.md`                                                                                                                   | `project_view`    |
| `.claude/skills/pm-update/SKILL.md`              | 19-25   | "Why this delegates its reading" — send a subagent to gather five sources into a snapshot                                                         | Deleted. `project_view` returns the whole view in one call (SPEC-01 BR-22), so there is nothing to delegate                                                                                                            | `project_view`    |
| `.claude/skills/pm-update/SKILL.md`              | 34-43   | Checks 1 (board vs git) and 3 (story coverage)                                                                                                    | **Both survive**, re-sourced: recorded state from `project_view`, the git side from `git log`, the catalogue side from BA-001                                                                                          | `project_view`    |
| `.claude/skills/pm-update/SKILL.md`              | 44-49   | Checks 4 (defect integrity) and 5 (checkpoint completeness)                                                                                       | **Deleted.** Both compare markdown artifacts against each other; the schema is now the audit                                                                                                                           | —                 |
| `.claude/skills/pm-update/SKILL.md`              | 50-51   | Check 6 enum hygiene, `Type ∈ {Form, Integration, …}`                                                                                             | **Deleted as a check**, and the value corrected wherever the skill still names a FRICEW type: `Integration` → **`Interface`** (D-09 as valued by D-60). Code-list membership is a CAP `ASSERT_ENUM`, not a skill's job | —                 |
| `.claude/skills/pm-update/SKILL.md`              | 53-63   | Phase 2 Reconcile — apply mechanical fixes with `Edit`                                                                                            | Deleted. Nothing is editable; the skill reports and Sandro acts through a verb or a Form                                                                                                                               | —                 |
| `.claude/skills/pm-update/SKILL.md`              | 69-70   | "Re-running the dashboard generator after a reconcile is the natural next step"                                                                   | Deleted — CNV-005 deletes that generator (D-02)                                                                                                                                                                        | —                 |
| `.claude/skills/pm-update/SKILL.md`              | 72      | "You edit only the tracking artifacts"                                                                                                            | "You edit nothing. You report."                                                                                                                                                                                        | —                 |
| `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` | 255-259 | §7.3 "Data sources (all existing markdown)" — five rows pointing at `project/SPRINT_BOARD.md` ×3, `project/sprints/*.md`, `project/DEFECT_LOG.md` | The rows are repointed at Project Tracker's Reports; §7 as a whole describes the v1 generator CNV-005 deletes, so the section is rewritten to name the module rather than the markdown                                 | — (documentation) |

**The two survivors, named precisely** (D-98): **git history versus recorded state**, and **the FRICEW
catalogue versus the actual story backlog**. Both cross a boundary the database does not own, which is
why they survive while checks 4, 5 and 6 do not.

Check 3 reads `Financial Planner/design/BUSINESS_ARCHITECTURE.md`, which is markdown D-12 deliberately
keeps. **That stays legal once `lintNoMarkdownState` is enabled**, because the linter matches **retired
paths**, not markdown-reading. The backlog side needs no SPEC-01 amendment: `project_view` returns each
Milestone's chain (D-85) and SPEC-07 BR-11 puts `storyId` and `fricewType` in the chain header.

**Three, not four.** `METHODOLOGY_BLUEPRINT.md`'s table points at **three** retired paths —
`project/test-reports/` appears nowhere in that file (BA-001 correction, §6).

### 3.3 INT-005 — Human Review → `log_defect` [Interface]

**No endpoint, no payload, no schedule and no retry logic** — the whole surface is **one table column
header**. `.claude/skills/human-review-loop/SKILL.md:122` reads
`| Nature | DEFECT_LOG | Mechanism | Memory | CLAUDE.md |`, and row 124 files a behavioural defect as
"Row + root cause".

| File                                        | Line(s) | Currently instructs                         | Instructs instead                                                                                                                               | Verb         |
| ------------------------------------------- | ------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `.claude/skills/human-review-loop/SKILL.md` | 122     | "Where It Lands" column header `DEFECT_LOG` | Column header becomes **`log_defect`**                                                                                                          | `log_defect` |
| `.claude/skills/human-review-loop/SKILL.md` | 124     | Behavioural defect → "Row + root cause"     | Behavioural defect → a `log_defect` call carrying `severity`, `title`, `description` and the root cause; `references` names the diagnosed layer | `log_defect` |

**Two modes** (D-96):

- **Chain mode** — the skill is running as Sprint Build stage 6 on a known story. It passes `story` as
  `{workspace-slug}/{story-id}`.
- **Ad-hoc mode** — Sandro points at an uncommitted changeset with no story in play (SKILL.md:10-11).
  It passes `workspace`, and the Defect links to that workspace's **Active Initiative**, resolved by
  SPEC-05 BR-20 (the Active Initiative with the highest `position`).

Ad-hoc mode is what the tenth SPEC-01 amendment exists for. That `log_defect` demands a story the
Sprint-scoped record never had was found at the SPEC-03 workshop (`DECISIONS_LOG.md:389`,
`SPEC-03:34`) and answered for the **migration only** — D-58 routed it through the CAP service layer,
which is correct for a one-time Conversion and silent about every caller after it (D-96).

**Identity — `sandro`** (D-99). `/human-review-loop` calls `log_defect` under identity **`sandro`**, on
SPEC-05 BR-34's precedent: FRM-001 writes as `sandro` unconditionally, and SPEC-02 FUT-011 step 3
already declares `sandro` as a caller identity to pass `wfl.stage.humanOnly`. The findings are Sandro's,
transcribed by a skill that presents its table and stops for his reply by index (SKILL.md:54). This
files them in RPT-004's **human** half (SPEC-07 BR-30). It does **not** weaken `wfl.stage.humanOnly`:
the skill still never calls `complete_stage('human-review')` on its own behalf (D-35), and that guard
was already honour-based by construction.

**Scope boundary.** INT-005 touches **only** the Defect landing. The skill's prevention-prescription
half — ESLint rule, custom linter, hook, memory file — is unchanged and writes no project state.

---

## 4. Business Rules

**Cross-cutting**

- **BR-01** Every rewired reference is an **agent instruction**; no consumer opens a file to write project state. `build.js` and `test-quality.js` have no filesystem and no Node API and instruct only.
- **BR-02** After rewiring, none of the ten files contains any token in `Standards (Technical + Linting)/retired-paths.json` ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-01, BR-03). **Amended at the SPEC-10 workshop (D-117):** this rule previously enumerated four literals — `SPRINT_BOARD`, `DEFECT_LOG`, `project/sprints/`, `project/test-reports/` — and those four are **provably incomplete against the ten files they are scoped to**. `Financial Planner/CLAUDE.md:77` reads `sprints/` bare beneath the `project/` header at `:74`, so a rewiring that deleted `:75-76` and left `:77` would pass this rule with the retired path intact; and `generateTestReport.ts:6` splits the path as `join(process.cwd(), "project", "test-reports")`, which no literal matches. The four spellings this spec used across BR-02, SPEC-08 FUT-001, SPEC-08 FUT-006 and SPEC-08 FUT-009 now resolve to the one shared list.
- **BR-03** Every rewired call site declares its own identity (D-41, SPEC-01 BR-07). An undeclared identity is **rejected, not defaulted**.
- **BR-04** Every story reference a rewired instruction emits is qualified `{workspace-slug}/{story-id}` (SPEC-01 BR-09, D-45). A bare ID is rejected.
- **BR-04a** The qualified form is **carried, not constructed**. `/build`'s resolution step takes it from `next_action()` or `project_view`, which already address stories that way (SPEC-01 §3.1), and `build.js`'s `storyId` passes it through. **It is never derived from `moduleDir`**, which is a folder name (`Financial Planner`) and not a workspace slug.
- **BR-05** No rewired consumer retries a rejected verb (D-46). It surfaces `remediation` and stops.
- **BR-06** SPEC-08 enables **neither** cutover guard (D-07). Enablement is INT-006's and lands at CNV-005.

**Build chain — INT-002**

- **BR-07** `BRIEF_SCHEMA` declares no `boardRow` field and `required` does not list it; `build-briefer.md`'s corresponding bullet is deleted with it.
- **BR-08** The briefer's story facts — chain, `fricewType`, `shipsUi`, dependency state — come from `project_view`. No instruction reads or parses a board.
- **BR-09** `/build` with empty `$ARGUMENTS` resolves the story through **`next_action()`** in workspace mode, which selects the candidate story itself (SPEC-04 BR-09). No board is read.
- **BR-10** `/build` with a non-empty argument resolves it against `project_view`'s Milestone list. One match wins; otherwise the command asks.
- **BR-11** Handoff calls **`complete_subtask` on `handoff` first, then `complete_stage` on `sprint-build`** — in that order, at both call sites (the Handoff agent's prompt and `implementer.md`'s Handoff mode). The reverse order would leave `handoff` open and turn SPEC-01 BR-11's subtask warning into the normal case.
- **BR-11a** The workflow calls **`start_stage` on `sprint-build`** before its first phase, and each completing phase calls **`complete_subtask`** on its own slug — `brief`, `red`, `implement`, `gate`, `coverage`, `smoke`, `handoff` (SPEC-02 §3.1). Without both, BR-11's Handoff pair is refused: SPEC-02 BR-24 rejects `complete_subtask` under a Not Started parent, and SPEC-02 BR-25 rejects it while an earlier blocking Subtask is open.
- **BR-11b** `smoke` is completed **only on a story where it was materialised** — SPEC-02 §3.1 makes it Conditional on `shipsUi`, and `build.js:666` already runs the phase only for a frontend story, so the two predicates are the same one (D-47, D-48). A backend story's chain has six Subtasks, not seven.
- **BR-12** The rewired call-site identities are **`implementer`** (the Handoff agent, the Implementer, and the workflow's own `start_stage` / `complete_subtask` calls), **`build-briefer`** (the briefer) and **`gate-runner`** (the test-quality gate agent). `/pm-update` calls `project_view` under **`pm-update`**; `/human-review-loop` calls `log_defect` under **`sandro`** (BR-25).
- **BR-13** `test-quality.js`'s gate agent is instructed to take coverage numbers from the **console table**, and no longer to read a markdown report under `project/test-reports/`. When the table is truncated it reads **`coverage/coverage-summary.json`** — the same file `recordTestRun.ts` itself reads ([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-04), so the fallback is the source of truth rather than a rendering of it, and `gate-runner`'s existing `Read` grant covers it. **The `TestRun` is not a source here and cannot be**: `posttest` fires after `npm test` exits, so at the moment the gate agent reports, its own run's `TestRun` does not yet exist (D-107). **The `TestRun` write is INT-004's, not this spec's.**
- **BR-13a** Both gate call sites invoke **`npm run record-test-run`** after `npm test`, **without regard to whether the suite passed**. `posttest` alone cannot carry INT-004: npm skips a `post` script when the main script exits non-zero, so a failing run — the one worth recording — would never be written, and `build.js`'s phase-3 gate is deliberately red. The double write on a passing run is absorbed by [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-20's idempotence, not by a conditional an instruction could get wrong. The run is written under **INT-004's own identity** (SPEC-09 BR-17), not the invoking agent's (D-107).
- **BR-13b** `test-quality.js` invokes it only on a **full** run. Its scoped path (`:237`, `:241`) is `npx jest`, not an npm lifecycle at all, and its coverage table is partial by design — recording it would put a partial `linesPct` on RPT-001's gate tile as though it described the suite.
- **BR-13c** `build.js:382`'s claim that the `posttest` generator "always fires" is **corrected**, not merely repointed. It is false today and would stay false after the rewiring.
- **BR-14** `Financial Planner/CLAUDE.md` carries **no `project/` block**; one line points at Project Tracker as the state of record.
- **BR-14a** Neither the **repo-root `CLAUDE.md`** nor `Financial Planner/CLAUDE.md` describes the shared `scripts/` folder as holding `generateTestReport.ts`; both name the lint suite alone, because SPEC-09 BR-02 moves the script into Project Tracker. **Neither line carries a retired-path reference**, which is why neither appeared in any surface measurement — the root `CLAUDE.md` had never appeared in one at all. Found by grepping the script's own name at the SPEC-09 workshop (D-103). `Financial Planner/design/TECH_STACK.md` and `TEST_STRATEGY.md` name it too and are **not** rewiring work — D-12 keeps them as markdown and they go to the `/refresh-docs` sweep with the other 32 design-doc references.

**`/pm-update` — INT-003**

- **BR-15** The `/pm-update` skill **survives**. It stays the seeded driver of the Required `pm-update` stage at position 80 (SPEC-02 §3.1) and therefore a blocking predecessor of `commit` (D-52). Deleting it would make `complete_stage('commit')` unreachable on every story.
- **BR-16** The skill retains **exactly two checks** — check 1 and check 3. Checks 4, 5 and 6 and the whole of Phase 2 Reconcile are deleted.
- **BR-17** The two survivors are **git history versus recorded state** and **the FRICEW catalogue versus the actual story backlog**. Their sources are `project_view` for recorded state, `git log` for the git side, and `Financial Planner/design/BUSINESS_ARCHITECTURE.md` for the catalogue side.
- **BR-18** Check 3's read of BA-001 is **legal after cutover**: `lintNoMarkdownState` matches **retired paths**, not markdown-reading, and BA-001 is a design document D-12 deliberately keeps as markdown.
- **BR-19** The skill names no FRICEW type value `Integration`. Where it names a type at all, the value is **`Interface`** (D-09 as valued by D-60).
- **BR-20** The skill **edits nothing and reports**. The Reconcile phase and the instruction to re-run the v1 dashboard generator (deleted by CNV-005, D-02) are both gone.
- **BR-21** `METHODOLOGY_BLUEPRINT.md` §7.3's rows are repointed at Project Tracker's Reports, and §7 is rewritten to name the module rather than the markdown. The table points at **three** retired paths, not four.

**Human Review — INT-005**

- **BR-22** The "Where It Lands" column header reads **`log_defect`**, and the behavioural-defect row names a `log_defect` call carrying `severity`, `title`, `description` and the root cause, with `references` naming the diagnosed layer.
- **BR-23** **Chain mode** passes `story` as `{workspace-slug}/{story-id}`. **Ad-hoc mode** passes `workspace`, and the Defect links to that workspace's **Active Initiative** — the Active one carrying the highest `position` (SPEC-05 BR-20).
- **BR-24** **Exactly one of `story` and `workspace` is present.** Neither and both are rejected 400, key `verb.defect.scopeRequired` (§5).
- **BR-25** `/human-review-loop` calls `log_defect` under identity **`sandro`** (SPEC-05 BR-34's precedent), which files the Defect's Activity row in RPT-004's human half (SPEC-07 BR-30). It does not weaken `wfl.stage.humanOnly` — the skill still never calls `complete_stage('human-review')` on its own behalf (D-35).
- **BR-26** The skill's **prevention-prescription half is untouched** — ESLint rule, custom linter, hook and memory file. INT-005 changes only the Defect landing.

**Nothing above is enforced by a guard.** BR-01 … BR-26 are properties of edited instruction prose;
the mechanisms that would make them structural — the `PreToolUse` hook and `lintNoMarkdownState` — are
INT-006's and land at CNV-005 (BR-06). Until then §7's inspection FUTs are what catches a missed edit.

---

## 5. Error Handling

| Object      | Rejections a rewired consumer can provoke                                                                                                                                                                                                            | Owner                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **INT-002** | `verb.story.unqualified`, `verb.target.notFound`, `verb.identity.missing`, `verb.stage.alreadyComplete`, `verb.stage.notStarted`, `wfl.stage.predecessorOpen`; plus `verb.stage.subtasksOpen`, which is a **success with warnings**, not a rejection | SPEC-01 §5, SPEC-02 §5 |
| **INT-003** | **`verb.identity.missing` only.** It calls one read verb, `project_view`, which has no methodology guard and no payload to malform — but D-41 binds every call, read included, so an undeclared identity is still rejected                           | SPEC-01 §5             |
| **INT-005** | `verb.identity.missing`; `verb.value.notInCodeList` (a `severity` outside the code list, surfaced as `ASSERT_ENUM` verbatim); and `verb.defect.scopeRequired` below                                                                                  | SPEC-01 §5             |

**SPEC-08 mints no error key of its own**, and that follows from the mechanism rather than from taste.
Every rejection a rewired consumer can provoke is an **existing** SPEC-01 or SPEC-02 key, because the
consumer calls a verb and the **verb owns the guard** (D-46, D-79's general form — the mechanism decides
whether a rule gets a named key, not the other way round). This is SPEC-04 §5's and SPEC-07 §5's
disposition reached by a different route: those objects had no rejection at all, this one has only
other specs'.

**One key is added, and it belongs to SPEC-01, not to SPEC-08.**

| Condition                                                  | Response   | i18n key                    |
| ---------------------------------------------------------- | ---------- | --------------------------- |
| `log_defect` with neither `story` nor `workspace`, or both | Reject 400 | `verb.defect.scopeRequired` |

It earns a name because it is a **verb-input shape check no CAP annotation can pre-empt**: with neither
input there is nothing to resolve and no row to attempt, so the entity-level at-least-one constraint of
SPEC-03 BR-21 is unreachable from this path. **Added to SPEC-01 §5 by this spec's tenth amendment**
(D-96), alongside the amended `log_defect` signature and SPEC-01 BR-18a.

**The gap it closes was already on the record.** `DECISIONS_LOG.md:389` (D-58's Context) names it
verbatim — "`log_defect` requires a `story` and the defect log records only a Sprint" — and `SPEC-03:34`
repeats it. D-58 routed **around** it for the migration alone, which is a legitimate ruling for a
one-time Conversion but left the ongoing path unfixed; INT-005 is the first object to walk into it
(D-96).

**An instruction edit has no runtime and therefore no rejection** — the ten file edits themselves
cannot fail at execution time, only at inspection (§7).

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-08 resolves no open item.** OI-05 is the only one still open, it is not a workshop question,
and this spec touches no `Methodology` shape.

**Alerts:** asked per the standing rule — **none.** All three objects are edits to instruction prose.
Nothing observes state, nothing runs on a schedule, and this module schedules nothing.

**Provisional dependencies — R1 only.**

- **R1** (Postgres unverified) — inherited exactly as SPEC-01 … SPEC-07 inherit it. Owner: the **Data
  Model stage** (D-39). Deadline unchanged.
- **R9 — ruled OUT, and SPEC-08 is the first spec to rule it out** (D-101). R9's mechanism is
  per-**origin**: two CAP processes serving into one shell page. INT-002, INT-003 and INT-005 drive an
  in-process **stdio** MCP server (SPEC-01 §3.1 — "no HTTP server, no listening socket"), serve no page
  and issue no browser-originated request, so there is no origin for the risk to attach to. Ruled
  explicitly rather than left silent, on **D-82's precedent**: SPEC-06 carried no Report and ruled
  itself _in_, because the mechanism is per-origin rather than per-object-type. The same test run here
  gives the opposite answer for the same reason.
- **R5, R6 and R10** belong to INT-006 / SPEC-10. **R6 does not reach INT-002** — it names the _hook_
  registration in `.claude/settings.json`, whereas the MCP server's registration is a different
  gitignored file that D-44 already discharges with a tracked installer. That is a **precondition** on
  SPEC-08's objects, stated in §3, not a risk.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Goes to                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| ~~**`log_defect` cannot create the Initiative-scoped Defect the entity permits**, so `/human-review-loop`'s ad-hoc mode has no legal write path~~ — **applied in-session** as SPEC-01's **tenth** amendment: §3.1's `log_defect` row (`story?`, `workspace?`), new **SPEC-01 BR-18a** (exactly one present), and §5's new `verb.defect.scopeRequired`. **The amendment corrects a FUT**: SPEC-01 FUT-009 called `log_defect` with **no scope**, which SPEC-01 BR-18a now rejects, so it names the **story** mode and its precondition names `financial-planner/CNV-001`. **`SPEC-05` FUT-011 and FUT-013 owe nothing** — both already call `log_defect` in story mode (`SPEC-05:415`, `SPEC-05:455`) and stay valid under SPEC-01 BR-18a (D-96) | SPEC-01 — applied                                 |
| ~~The `lintNoMarkdownState` glob as stated in D-23 and `PLAN.md` §6 reaches **neither** file that needs it. `Standards/**` does not match the real directory `Standards (Documents)/`, and no stated glob reaches `Financial Planner/CLAUDE.md`. The linter must scan both literal roots plus every module's `CLAUDE.md`, or three of the ten rewired files are unguarded — the root `CLAUDE.md` joins them (BR-14a) and D-23's "load-bearing" justification for the blueprint does not survive (D-100)~~ — **discharged 2026-08-04.** [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-17 names six roots: repo `.claude/`, `Standards (Documents)/`, `Standards (Technical + Linting)/`, the repo-root `CLAUDE.md`, every module's `CLAUDE.md`, and `Project Tracker/scripts/`. The glob is replaced by a declared root list scanned with the linter's own filesystem walk (SPEC-10 BR-16, BR-19) | **SPEC-10 (INT-006)** — **discharged** |
| ~~INT-004 must not leave `test-quality.js`'s gate agent with **no coverage source**. This spec deletes the instruction to read `project/test-reports/`; SPEC-09 must state whether the console table alone suffices or the `TestRun` is readable at gate time~~ — **discharged at the SPEC-09 workshop (D-107), and BR-13 amended with it.** The console table stays primary; the truncation fallback the markdown report served becomes **`coverage/coverage-summary.json`**, the same file INT-004 reads. **The `TestRun` is not readable at gate time and the reason is mechanical, not a preference**: `posttest` fires after `npm test` exits, so the run's own `TestRun` does not exist when the gate agent reports. A read path would also have needed a twelfth verb against D-40's eleven and would have reversed D-19's written-only ruling — for a row that still could not describe the current run                                                                                                                                                                                                                                                                                                                                        | **SPEC-09 (INT-004)** — applied                   |
| CNV-005 must not delete the v1 dashboard generator before `METHODOLOGY_BLUEPRINT.md` §7 stops describing it. INT-003 rewrites the section; CNV-005 removes the thing it described                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **SPEC-12 (CNV-005)** — raised                    |
| `/human-review-loop` writes its Defects under identity `sandro`, which files them in RPT-004's **human** half. If SPEC-07 intended the human half to mean "written by a human at a Form" rather than "recording a human's finding", SPEC-07 BR-30's derivation needs a word (D-99)                                                                                                                                                                                                                                                                                                                                                                                                                                                              | **SPEC-07 (RPT-004)** — raised, no amendment owed |

**BA-001 corrections** — four, all **applied in this session**.

| Correction                                                                                                                                                                                                            | Where             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~INT-005's row cites `.claude/skills/human-review-loop/SKILL.md` at **line 103**~~ — the reference is at **line 122**, the `DEFECT_LOG` column header under "## Where It Lands". The reference count of 1 is correct | §4 INT-005 — done |
| ~~INT-003's row calls `METHODOLOGY_BLUEPRINT.md`'s table "a 'where state lives' table pointing at all **four** retired paths"~~ — it points at **three**; `project/test-reports/` appears nowhere in that file        | §4 INT-003 — done |
| ~~§11's prose reads "five grouped (15 objects) and seven standalone"~~ — §11's own table yields **six grouped (16 objects) and six standalone**. SPEC-08 is one of the grouped specs the prose omits                  | §11 — done        |
| ~~§3.7's OI-03 row says `functional-tester` and `ux-tester` have "no trigger yet" and settles "before or during Scaffold"~~ — D-35 closed OI-03, both commands exist, and Scaffold is complete                        | §3.7 — done       |

---

## 7. Functional Unit Tests

**Twelve FUTs: FUT-001 … FUT-010 are inspection, FUT-011 and FUT-012 are behavioural** (D-95). The
inspection set is exactly what `lintNoMarkdownState` later automates, so it is the same test earlier
rather than a weaker one. The two behavioural FUTs are the amended `log_defect` signature (FUT-011) and
PSV falsifiable check 1, the end-to-end build run (FUT-012); both need the MCP server registered, which
is why the rest of the set does not.

Story IDs below are **Financial Planner's** unless the text says otherwise — Project Tracker runs its
own `CNV-001` and `INT-002` (BA-001 §3.3), so an unqualified ID would name this catalogue's object.

### FUT-001: No rewired file mentions a retired markdown path

**Covers:** INT-002, INT-003, INT-005
**Preconditions:** All ten files have been rewired per §3.1, §3.2 and §3.3. No verb call is needed —
this is an inspection.
**Steps:**

1. Search all ten rewired files for `SPRINT_BOARD|DEFECT_LOG|project/sprints/|project/test-reports`,
   using an explicit `**/*.md` glob alongside the `.js` paths.

**Expected Result:**

- **Zero matches** across all ten files (BR-02).
- The glob is stated because it is load-bearing: a directory-scoped ripgrep over `.claude/` **without**
  it returns only the `.js` hits and under-reports by **five** files, which would pass this FUT while
  five files still carried the strings. **Corrected at the SPEC-10 workshop (D-116):** the count read
  "six", and the cause read as a missing glob. Measured, a default `rg` enumerates **4 of 37** files
  under `.claude/` because `.gitignore:10`'s `.claude/*.md` is applied by ripgrep at every depth while
  `git check-ignore` reports those files not ignored and `git ls-files` reports them tracked. The five
  hidden files are `agents/build-briefer.md`, `agents/implementer.md`, `commands/build.md`,
  `skills/human-review-loop/SKILL.md` and `skills/pm-update/SKILL.md`. The explicit `**/*.md` glob
  works because command-line globs outrank ignore files, not because the `.md` files needed naming —
  which is why [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-19 forbids the linter from delegating its walk
  at all.

### FUT-002: `boardRow` is gone from the schema and from the briefer's contract

**Covers:** INT-002
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read `BRIEF_SCHEMA` in `.claude/workflows/build.js`.
2. Read `.claude/agents/build-briefer.md`'s field bullets.

**Expected Result:**

- `BRIEF_SCHEMA` declares **no `boardRow` property**, and `required` does not list it (BR-07).
- `build-briefer.md` carries **no `boardRow` bullet** (BR-07).
- No replacement field is introduced — the row is not moved, it is deleted (BR-07).

### FUT-003: The chain is opened, every phase records, and Handoff closes it in order

**Covers:** INT-002
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read `.claude/workflows/build.js` from its first phase to its last, listing every verb call it
   instructs and the slug each names.
2. Read the Handoff agent's prompt in `.claude/workflows/build.js`.
3. Read Handoff mode in `.claude/agents/implementer.md`.

**Expected Result:**

- Step 1 shows **`start_stage` on `sprint-build`** before the first phase, and a **`complete_subtask`**
  for each of `brief`, `red`, `implement`, `gate`, `coverage`, `smoke`, `handoff` — the seven SPEC-02
  §3.1 slugs, one per `build.js:6-14` phase (BR-11a). `smoke`'s call is instructed **conditionally**, on
  the same `shipsUi` predicate that gates the phase (BR-11b).
- Steps 2 and 3 both name **`complete_subtask` on `handoff`**, then **`complete_stage` on
  `sprint-build`**, in that order (BR-11), and it is the **last** pair in step 1's list.
- No call site instructs any edit of a markdown row (BR-01, BR-02).
- The story argument at every site is the qualified `{workspace-slug}/{story-id}` value carried from
  resolution, not one built from `moduleDir` (BR-04, BR-04a).

### FUT-004: `/build` with no argument resolves through `next_action()`

**Covers:** INT-002
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read `.claude/commands/build.md`'s argument table, empty-`$ARGUMENTS` row.

**Expected Result:**

- The row names **`next_action()`** in workspace mode (BR-09, SPEC-04 BR-09).
- It contains **no board read** and no "first Backlog row" instruction (BR-02, BR-09).

### FUT-005: Each rewired call site declares its own identity

**Covers:** INT-002
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read the identity named at each of the three call sites — the Handoff agent / Implementer, the
   briefer, and `test-quality.js`'s gate agent.

**Expected Result:**

- The identities are **`implementer`**, **`build-briefer`** and **`gate-runner`** respectively
  (BR-12).
- No call site omits an identity or names a shared one — an undeclared identity would be rejected
  `verb.identity.missing` rather than defaulted (BR-03, SPEC-01 §5).

### FUT-006: `Financial Planner/CLAUDE.md` documents no `project/` folder

**Covers:** INT-002
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read the Folder Structure block in `Financial Planner/CLAUDE.md`.

**Expected Result:**

- **No `project/` block**, and no `SPRINT_BOARD.md`, `DEFECT_LOG.md` or `sprints/` entry (BR-14,
  BR-02).
- One line points at **Project Tracker** as the state of record (BR-14).
- This file is one of the two D-100 shows no stated `lintNoMarkdownState` glob reaches, so this FUT is
  the only thing catching a missed edit here until SPEC-10 lands.

### FUT-007: `/pm-update` retains exactly two checks

**Covers:** INT-003
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Enumerate the checks in `.claude/skills/pm-update/SKILL.md`.
2. Read each survivor's stated source.

**Expected Result:**

- **Exactly two checks** remain: **git history versus recorded state**, and **the FRICEW catalogue
  versus the actual story backlog** (BR-16, BR-17).
- Checks 4, 5 and 6 and **Phase 2 Reconcile** are absent (BR-16, BR-20).
- The stated sources are `project_view`, `git log` and
  `Financial Planner/design/BUSINESS_ARCHITECTURE.md` — and no retired markdown path (BR-17, BR-18).
- The skill still exists and is still the driver of the `pm-update` stage (BR-15).

### FUT-008: The skill names `Interface`, never `Integration`, and no dashboard generator

**Covers:** INT-003
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Search `.claude/skills/pm-update/SKILL.md` for `Integration`.
2. Read every place the skill names a FRICEW type value.
3. Search it for the dashboard-generator instruction.

**Expected Result:**

- **Zero occurrences of `Integration`** as a FRICEW type value; where a type is named at all it is
  **`Interface`** (BR-19, D-60).
- The "re-run the dashboard generator" instruction is **absent** — CNV-005 deletes that generator
  (BR-20, D-02).
- The skill states that it edits nothing and reports (BR-20).

### FUT-009: `METHODOLOGY_BLUEPRINT.md` §7.3 names no retired path

**Covers:** INT-003
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` §7.3's data-sources table.

**Expected Result:**

- **No row names `project/SPRINT_BOARD.md`, `project/sprints/*.md` or `project/DEFECT_LOG.md`** —
  the three retired paths that table actually carried (BR-21, BR-02).
- The rows point at Project Tracker's Reports, and §7 names the module rather than the markdown
  (BR-21).
- Like FUT-006, this is the only check on this file until SPEC-10 fixes the glob (D-100).

### FUT-010: Human Review's landing column names the verb

**Covers:** INT-005
**Preconditions:** FUT-001's rewired files.
**Steps:**

1. Read the "Where It Lands" table in `.claude/skills/human-review-loop/SKILL.md`.

**Expected Result:**

- The column header reads **`log_defect`**, not `DEFECT_LOG` (BR-22).
- The behavioural-defect row names a **`log_defect` call** carrying `severity`, `title`, `description`
  and the root cause, with `references` naming the diagnosed layer — not a markdown row (BR-22).
- The **Mechanism, Memory and CLAUDE.md columns are unchanged**, and no other row of the table is
  edited (BR-26).

### FUT-011: Ad-hoc mode logs a Defect against the Active Initiative, and neither-or-both is refused

**Covers:** INT-005, INT-001
**Preconditions:** The MCP server is registered by D-44's installer script. The migrated fixture is
loaded — **W1-S3 is the Active Initiative** (SPEC-03 BR-10) and four Defects exist, Defect D-001 …
Defect D-004 (SPEC-03 BR-20). No story is in play.
**Steps:**

1. Call `log_defect` with `workspace` `financial-planner`, no `story`, a `severity`, a `title` and a
   `description`, under identity **`sandro`**.
2. Call `log_defect` with **neither** `story` nor `workspace`.
3. Call `log_defect` with **both**.

**Expected Result:**

- Step 1 **succeeds** and returns a `defectId`. The Defect links to the **W1-S3** Initiative with
  `story` **null** (BR-23, SPEC-05 BR-20), and **exactly one** `defectLogged` Activity row is emitted
  with `actor` **`sandro`** (BR-25, SPEC-01 BR-03, SPEC-07 BR-32).
- Steps 2 and 3 are each rejected **400**, key **`verb.defect.scopeRequired`** (BR-24, §5).
- Both rejections **write nothing and emit nothing**, including no record of the attempt (SPEC-01
  BR-05) — the Defect count stays at five and the Activity count is unchanged.

### FUT-012: An end-to-end `/build` run touches no retired markdown path

**Covers:** INT-002, INT-001
**Preconditions:** The MCP server is registered by D-44's installer script. The migrated fixture is
loaded: **Financial Planner's CNV-001** is the one Backlog story on W1-S3 and the only Milestone with
a materialised chain — 8 Tasks and 6 Subtasks, all Not Started (SPEC-03 BR-18, SPEC-03 BR-31).
**Steps:**

1. Run `/build` with **empty** arguments and record which story it resolves, how, and in what form.
2. Let the workflow run through every phase to Handoff, recording each verb call in order.
3. Read the chain and call `next_action("financial-planner/CNV-001")`.

**Expected Result:**

- Step 1 resolves **`financial-planner/CNV-001`** through **`next_action()`**, with **no board read**
  (BR-09, BR-02). The ID arrives already qualified from the verb and is carried, not constructed from
  `moduleDir` (BR-04, BR-04a) — qualified matters, because Project Tracker runs a `CNV-001` of its own
  (BA-001 §3.3).
- Step 2 opens with **`start_stage(…, 'sprint-build')`**, then one **`complete_subtask`** per completing
  phase in `brief` → `red` → `implement` → `gate` → `coverage` → `handoff` order (BR-11a). **`smoke` is
  neither materialised nor completed** — CNV-001 is a Conversion and `shipsUi` is false, so the chain
  carries six Subtasks (BR-11b, SPEC-02 §3.1, D-48).
- Handoff is the **last** pair: `complete_subtask(…, 'handoff')` then `complete_stage(…, 'sprint-build')`,
  under identity **`implementer`** (BR-11, BR-12). Neither is refused — the parent is In Progress from
  step 2's `start_stage` and no blocking Subtask is open, which is exactly what SPEC-02 BR-24 and
  SPEC-02 BR-25 would otherwise reject.
- **No write occurs to any of the four retired markdown paths** at any point in the run (BR-01, BR-02).
- Step 3 shows `sprint-build` **Complete** with all six Subtasks Complete, and `next_action` returns
  **`code-quality`** — the next incomplete Task in library position order (SPEC-04 BR-07, SPEC-02 §3.1).

---

_SPEC-08 specifies INT-002, INT-003 and INT-005 — the three consumer rewirings — per [BA-001 §11 row 08](../BUSINESS_ARCHITECTURE.md) (D-37). The verbs they call are [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s, amended a tenth time here (D-96); the guards those verbs enforce are [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md)'s; the fixture its behavioural FUTs run against is [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s; the resolution `/build` now uses is [SPEC-04](SPEC-04-NEXT-ACTION.md)'s; the Active Initiative an ad-hoc Defect resolves to is [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md) BR-20's; the register those Defects land in is [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md)'s. The guards that would make this rewiring structural are **not** enabled here — they are INT-006's, at CNV-005 (D-07). **SPEC-08 resolves no OI.** **Provisional on R1** ([D-39](../DECISIONS_LOG.md)); **R9 ruled out** ([D-101](../DECISIONS_LOG.md))._
