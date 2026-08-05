# SPEC-12 — Decommission

**Spec ID:** SPEC-12
**FRICEW Objects:** CNV-005 (Conversion)
**Wave:** 3
**CDS Service:** **None.** CNV-005 reads only through INT-001's existing `project_view` contract and
writes nothing — see §2.
**Status:** Approved
**Provisional on:** **R1** (D-39), on [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md)'s precedent (D-121)
— the pre-deletion check reads the database through CAP. **R9 is ruled OUT** (D-101's test). **R4 is
not re-owned** — [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) FUT-007 settles it (D-121). **R7 is
checked here rather than inherited.** **R10 is owned here (D-119) and discharged by BR-14's proof
run.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | Sandro & Claude | Initial creation from the SPEC-12 workshop. Records **D-129 … D-136**. **The twelfth and final spec**, the **fifth Wave 3 spec**, and the **sixth standalone** one — per [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) §6's correction of the running ordinal, which BA-001 §11 puts at six standalone specs (SPEC-01, SPEC-06, SPEC-09, SPEC-10, SPEC-11, SPEC-12). **Requires no entity and no attribute** — the second spec in the module to place no requirement on the Data Model stage, after [SPEC-10](SPEC-10-CUTOVER-GUARDS.md). **SPEC-12 resolves no OI** and **mints no error key**, the eighth spec running to mint none and the third where none is structurally possible. **Provisional on R1** (D-133); **R7 checked here rather than inherited**; **R10 owned here and discharged by BR-14**; **R9 ruled out**; **R4 not re-owned**. Discharges the three §6 rows owed to it — [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s, [SPEC-08](SPEC-08-CONSUMER-REWIRING.md)'s and [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md)'s. **[SPEC-10](SPEC-10-CUTOVER-GUARDS.md) is amended in-session in three places** — BR-28, BR-27 and FUT-014's closing note, all under D-131, the last two found on the review pass — and **[SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) flips to Approved** (D-136), discharging D-93. One BA-001 correction (→ v1.13) and one `research/README.md` correction applied in-session, listed in §6. |
| 2026-08-04 | Sandro & Claude | **Status → Approved** on the day it was written, the normal path for this module. It owes nothing: all three §6 rows addressed to it are discharged, every correction it raised against BA-001, `research/README.md`, [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) and [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) was applied in-session, and **it owes [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) nothing** — there is no twelfth amendment, which is the condition D-93 was waiting on. All twelve specs are now Approved and the Workshops stage is complete.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## 1. Overview

The terminal act of cutover, which BA-001 §11 row 12 calls "a precondition checklist rather than a
feature". It moves no data — the data moved at CNV-002 and CNV-003 — it deletes the v1 dashboard and
the four retired markdown artifacts D-12 names, and it performs D-07's one enablement act. It is the
widest fan-in object in BA-001 (§10:282-283): it cannot run until all six other Interfaces objects
are complete.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute a spec
declares here is a requirement it places on the Data Model stage.

**CNV-005 requires no entity and no attribute, and places no requirement on the Data Model stage** —
the second spec in the module to place none, after [SPEC-10](SPEC-10-CUTOVER-GUARDS.md). Unlike
SPEC-10 it *does* read project state, but only through INT-001's existing `project_view` contract
([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §3.1, [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)
BR-22), which is a read of a contract already specified rather than a new requirement.

**No Data Model amendments.**

---

## 3. Functional Description

### 3.1 CNV-005 — Decommission [Conversion]

`DESIGN_WORKSHOP.md` §4.2 gives a Conversion "source format, transformation rules,
validation/rejection criteria, execution order, reconciliation approach". D-95 reshaped §3 for an
Interface whose deliverable is prose. **Here the five Conversion headings survive intact and are used
as written — with one answered "none" and stated rather than left empty** (D-134).

#### Source format — the deletion inventory

Measured 2026-08-04.

| Artifact                                 | Files                                    | Size              | Tracked?                                     |
| ---------------------------------------- | ---------------------------------------- | ----------------- | -------------------------------------------- |
| `Project Tracker/dashboard/`             | `generate.mjs`, `dashboard.html`         | 733 + 234 lines   | Tracked                                      |
| `Financial Planner/project/SPRINT_BOARD.md` | 1                                     | —                 | Tracked                                      |
| `Financial Planner/project/DEFECT_LOG.md`   | 1                                     | —                 | Tracked                                      |
| `Financial Planner/project/sprints/`     | `W1-S2-checkpoint.md`, `.gitkeep`        | 2                 | Tracked                                      |
| `Financial Planner/project/test-reports/` | 5 `tests_*.md`                          | 5                 | **Untracked** — `Financial Planner/.gitignore:21` |

#### Transformation rules — none

Nothing is transformed. The data moved at CNV-002 and CNV-003; this object removes what is left.
Stated rather than omitted, because an empty heading reads as an oversight.

#### Validation / rejection criteria — the precondition checklist

The five preconditions, BR-02 … BR-06. A failed precondition rejects the whole conversion: nothing is
deleted and nothing is enabled.

#### Execution order

The ordered act: **verify** (BR-02 … BR-06) → **delete** (BR-07 … BR-10) → **enable**, in BR-13's
order → **prove** (BR-14).

#### Reconciliation approach

The post-conditions, BR-16 … BR-18 — of which the sharpest is that
[SPEC-10](SPEC-10-CUTOVER-GUARDS.md) FUT-014 is re-run and **expected to fail**.

---

## 4. Business Rules

**Preconditions**

- **BR-01** CNV-005 is a **gated sequence, not a single act**. Every precondition in BR-02 … BR-06 is verified before anything is deleted or enabled; a failed precondition aborts the whole conversion, and nothing is deleted and nothing is enabled.
- **BR-02** **Precondition — instructions.** `lintNoMarkdownState.ts` is run against the tree **before** it is added to any module's `lint` chain, and must report **zero violations** across its six declared roots ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-16, BR-17, BR-19). A non-zero result means INT-002, INT-003 or INT-005 is incomplete. This is the **mechanical discharge of BA-001 §10:282-283's fan-in** — "CNV-005 cannot run until all six other Interfaces objects are complete" — and it costs no new code, because [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) already built the linter; CNV-005 runs it first and wires it second. Measured 2026-08-04: **27 references across 12 files**, all live and correct, which is exactly what [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-27 states and is re-verified here rather than restated.
- **BR-03** **Precondition — data.** `project_view('financial-planner')` ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §3.1, [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-22) returns the correct next action for **Financial Planner's** `CNV-001`. RSH-005 §8: **answer a question through the application, not through SQL** — one call exercises the hierarchy, the stage chain and the registers together, which is a stronger integrity test than counting rows. **This discharges [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6's row** ("CNV-005 must not run before CNV-004's tie-out has passed"): CNV-004 asserts the load's counts, chain, typing and provenance (BA-001 §5); BR-03 asserts the load still *answers*, which is the property CNV-005 is about to rely on.
- **BR-04** **Precondition — durability (R7).** `Project Tracker/state/` exists and is tracked, and a fresh `npm run export-state` produces **no diff** — which [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) BR-15's idempotence guarantees when nothing has changed since the last checkpoint, so a diff means the exporter or the database moved. R7's drill is [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) FUT-007, executed at INT-007's build (D-121). **R7 is checked here, not inherited**: RSH-005 §8's own argument is that a drill nobody runs "manufactures confidence that was never earned", and CNV-005 is about to delete the only other copy.
- **BR-05** **Precondition — INT-003.** `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` **§7 in full** no longer describes the v1 generator as the chosen approach ([SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-21). §7.2 (lines 235-249) is the description — "*Generator script → self-contained HTML (chosen for v1)*" — while [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) FUT-009 tests **§7.3's table alone**, so §7.2, §7.4 and §7.5 carry no retired-path token and are checked by reading rather than by grep. **This discharges [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6's row.**
- **BR-06** **Precondition — INT-004.** `Financial Planner/package.json`'s `posttest` no longer invokes the old generator and no gate call site writes `project/test-reports/` ([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-01, [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02, and [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13a's two explicit `npm run record-test-run` sites). **This discharges [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6's row** — deleting the folder first would let it reappear on the next `npm test`.

**Deletion**

- **BR-07** The v1 dashboard is **deleted, not evolved** (D-02): `Project Tracker/dashboard/generate.mjs` (**733 lines**) and `Project Tracker/dashboard/dashboard.html` (234 lines), and the `dashboard/` folder with them. Verified 2026-08-04: **nothing executable references either file** — no npm script in any of the three `package.json` files names it — and the only live *instruction* to re-run the generator is `.claude/skills/pm-update/SKILL.md:69-70`, removed by INT-003. Every other mention is prose in a design document. **BA-001 §5 states 734 lines and is corrected to 733 in this session** — the file ends in a newline, so `wc -l` and the true line count agree.
- **BR-08** The four retired markdown artifacts D-12 names are deleted, and **the whole `Financial Planner/project/` folder goes with them** — including `project/sprints/.gitkeep`, which is **tracked** and would keep the directory alive after its contents left. BA-001 §4's INT-002 row says the folder "stops existing"; a surviving empty directory the hook forbids writing into is not that.
- **BR-09** **The four artifacts do not have the same durability, and this spec says so rather than leaving it to be discovered.** `SPRINT_BOARD.md`, `DEFECT_LOG.md`, `sprints/W1-S2-checkpoint.md` and the dashboard are **tracked**, so git history is their archive (D-12) and no explicit archive is made — one would be redundant. **`project/test-reports/` is gitignored** (`Financial Planner/.gitignore:21`, verified 2026-08-04) and its five files are **untracked**, so their deletion is **irreversible** and `git` recovers nothing. That is **accepted, not overlooked**: D-24 already found that none of the five names a story, sprint, branch or commit, that retention already caps at five, and that `TestRun` history proper starts at Financial Planner's `CNV-001`. No archive is made of them either — committing them at the moment the guard retires the path would put the retired artifact back into git as it died.
- **BR-10** `Financial Planner/.gitignore:21`'s `project/test-reports/` rule is removed in the same act. A live ignore rule for a path that no longer exists is inert until something recreates the folder, at which point it hides it.
- **BR-11** **Nothing under `design/` is touched** (D-12). Git remains the system of record for work product; Project Tracker owns state *about* work, never the work itself. The **32 residual references across six `Financial Planner/design/*.md` files** go to a `/refresh-docs` sweep and are **not catalogued work** (D-23, BA-001 §3.8) — re-measured 2026-08-04 against D-23's own token set and still **exactly 32** (TEST_STRATEGY 7, BUILD_PLAN 7, PROJECT_MANAGEMENT 7, VERSION_CONTROL 5, TECH_STACK 4, `user-profile/DECISIONS_LOG` 2).

**Enablement**

- **BR-12** CNV-005 enables both guards, which is D-07's "final act of the rewiring stage". **[SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-28 calls this "one act"; it is an ordered sequence with a proof step, and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-28 is amended in-session to say so** (D-131). Nothing about *what* is enabled changes.
- **BR-13** The order is: (1) add `lint:no-markdown-state` to **both** modules' `lint` chains — `Financial Planner/package.json:16` (22 legs today, one of them the module-local `lint:ui5`) and `Project Tracker/package.json:13` (21) — which is the act [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-27 **withheld rather than forbade**. BR-27 reads "not added … in Wave 3", and CNV-005 is itself a Wave 3 object, so it is read as scoped to SPEC-10's own delivery; **[SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-27's wording is corrected in this session** to say so, on [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-28's own authority (D-131). (2) run `Standards (Technical + Linting)/scripts/installCutoverHook.ts` ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-26); (3) BR-14's proof run. **The linter goes first because it is the revertible one**: reverting it is a single `package.json` edit, whereas a `PreToolUse` deny beats every permission mode including `bypassPermissions` and `--dangerously-skip-permissions` ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) §5, D-112).
- **BR-14** **The proof run is R10's settling event.** One run under `claude --debug-file` (RSH-004 §12): a `Write` to a retired path must be **denied**, with the deny JSON on stdout naming the artifact and the record's `verb` ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-12), and a `Write` to any other path must be **allowed**. D-115 already establishes that the enablement act and the settling act are the same event; BR-14 makes that a step rather than a hope. **R10 is discharged here, or CNV-005 has not completed** — the installed Claude Code is v2.1.90 against documentation read to v2.1.218, and no hook has ever fired in this repo.
- **BR-15** **Rollback is stated, and it is machine-local.** If BR-14's proof run fails, the registration is removed by re-running the installer's uninstall path or by editing `.claude/settings.json` directly; that file is **gitignored** (`.gitignore:8`), so no commit is involved and no other clone is affected. The linter leg reverts by one `package.json` edit. This is a different case from [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-13a's fail-open, which covers the hook erroring on *itself*; BR-15 covers a correctly-functioning hook denying the wrong thing.

**Post-conditions**

- **BR-16** [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) FUT-014 ("Nothing is enabled") is **re-run and expected to fail on two of its three assertions** — the two *enablement* ones. Its third, that the four SPEC-10 artifacts exist and are tracked, was true before and stays true: enabling a guard does not untrack it. **FUT-014's own closing note says "inverts all three assertions" and is corrected in this session** (D-131) — measured against its three expected results, only the `lint`-chain and `hooks`-key assertions invert. Verified 2026-08-04 that all three still **pass** today: `.claude/settings.json` holds `permissions` only with **no `hooks` key**, and no module's `lint` chain names `lint:no-markdown-state`.
- **BR-17** CNV-005 **writes no project state** — no row, **no write-verb call**, and **no `Activity`**. It does call **one read verb**, `project_view`, at BR-03; [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03 binds *state-changing* verbs, so a read emits nothing and the distinction is load-bearing rather than pedantic — it is what makes BR-17 assertable at all while BR-03 still runs. The argument is D-124's, one object over. The **deletion commit is the record**, which is D-12 holding on its own terms: git remains the system of record for work product, and the retirement of the markdown is work product. No `Activity.kind` is minted, so [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-32's sixteen values stand.
- **BR-18** Three sets of claims in this repo become false the moment CNV-005 runs, and **no retired-path token names any of them**, so neither guard catches them and no reference count finds them. CNV-005 edits them as part of the act: `Project Tracker/CLAUDE.md:80` (Folder Structure records `dashboard/` as "Deleted by CNV-005 at cutover (D-02) — **not yet**"), `Project Tracker/CLAUDE.md:155` ("**Do not enable the two cutover guards** … before cutover"), and the repo-root `CLAUDE.md:48` and `:113` (the linter count, **21 → 22**). **The root `CLAUDE.md:48` edit is the second one that line receives, not the first**: [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-14a already strikes its "`+ generateTestReport`" clause, because SPEC-09 BR-02 moves that script into Project Tracker — and that token is what makes the line guardable at all (D-111). CNV-005 changes only the count and must not revert BR-14a's edit. **This is D-102's shape a fourth time** — after D-102 itself, D-107's `build.js:382` and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) §6's `build.js:379` — a change the object must *make* that a count of what must be *removed* can never *find* (D-102).

---

## 5. Error Handling

**SPEC-12 mints no error key of its own, and here that is structural rather than a disposition**
(D-46, D-79 — the mechanism decides whether a rule gets a named key). **Eighth spec running to mint
none** (after SPEC-04, SPEC-05, [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md),
[SPEC-08](SPEC-08-CONSUMER-REWIRING.md), [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md),
[SPEC-10](SPEC-10-CUTOVER-GUARDS.md), [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md)) and the **third
where none is structurally possible**, after [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) and
[SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md). Two reasons, both structural:

1. **CNV-005 is not CAP and is not a verb.** It is a sequence of file operations, two `package.json` edits and an installer run, so there is no i18n surface and no caller to receive a typed rejection.
2. **Its only failure mode is a precondition that does not hold**, and the response is to **stop before acting** — a human reading a check result rather than an error surfacing through a boundary.

| Condition                                                | Surface                                                                                                                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| BR-02 — the linter reports non-zero                      | **Stop.** The linter's own violation list names file, line, token and verb ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-24)           |
| BR-03 — `project_view` answers wrongly or errors         | **Stop.** Nothing is deleted and nothing is enabled (BR-01)                                                                      |
| BR-04 — `git status` on `state/` is non-empty after export | **Stop.** A diff means the exporter or the database moved since the last checkpoint                                            |
| BR-05 / BR-06 — INT-003 or INT-004 incomplete            | **Stop.** Read by inspection; there is no process to fail                                                                        |
| BR-14 — the proof run denies nothing                     | **Stop and roll back** per BR-15 — machine-local, no commit                                                                      |
| A deletion completes partially                           | Four of the five artifacts are file operations **under git**, so a partial deletion is recoverable. The five untracked test reports are the one irreversible step and are sequenced **last** among the deletions, so an abort before them costs nothing (BR-09) |

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-12 resolves no open item.** OI-01 was resolved by D-31 and INT-007 implements it — it is not
reopened here.

**Alerts:** asked per the standing rule — **none.** CNV-005 observes no state, schedules nothing, and
runs once.

**Provisional dependencies — SPEC-12 is provisional on R1.**

- **R1 — binds**, on [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md)'s precedent (D-121) rather than
  [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s rule-out (D-119). BR-03's `project_view` call reads the
  database through the CAP service layer, and BR-04's exporter check does too; per D-39 neither module
  has ever connected to Postgres. Ruled explicitly on D-82's precedent, not inherited.
- **R7 — checked here, not inherited.** Owner is INT-007's own build (D-121) with the deadline "before
  CNV-005 runs"; BR-04 is the check that the deadline was met. RSH-005 §8's argument — a drill nobody
  runs manufactures confidence never earned — is why this is a precondition rather than an assumption.
- **R10 — owned here (D-119) and discharged by BR-14.** SPEC-12 is the first spec to carry it as owner.
  `research/README.md` §5:107 has **no Owner and no Grade column**, so ownership is recorded in prose,
  on [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s and [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md)'s
  precedent. Re-measured 2026-08-04: still v2.1.90.
- **R4 — not re-owned.** Settled by [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md)'s FUT-007 in the same
  execution as R7 (D-121). Named so a reader can see it was considered.
- **R9 — ruled OUT**, on D-101's precedent and D-82's test: CNV-005 has no UI, no HTTP server, no
  origin, no page and no browser-originated request. Ruled rather than inherited silently.

Provisional on R1 does **not** hold up approval — "provisional" is a recorded dependency and not a
third status; the Definition of Done has Draft and Approved only.

### Discharged here — the three rows owed to SPEC-12

1. **[SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md) §6 — CNV-004's tie-out** must pass before
   CNV-005 runs. Discharged by BR-03.
2. **[SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6 — INT-003 vs the dashboard.** The generator is not
   deleted before `METHODOLOGY_BLUEPRINT.md` §7 stops describing it. Discharged by BR-05.
3. **[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6 — `project/test-reports/` after INT-004.** The
   folder is retired only after INT-004 stops writing to it. Discharged by BR-06.

**All three are ordering constraints**, which is the shape of this object and why BA-001 calls it a
checklist rather than a feature.

### Cross-spec notes raised, not designed here

| Note                                                                                                                                                                                                                                                                                                                                                       | Goes to                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `Project Tracker/CLAUDE.md:25` says "Twenty linters run" — already raised to `/refresh-docs` by [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) §6, and BR-18 lands on the **same file**. Whoever gets there first should write **22**, since BR-13 adds the twenty-second shared linter                                                                                | **`/refresh-docs`** — raised   |
| `Project Tracker/CLAUDE.md`'s Open Risks table grades **R7 `Unknown`** and **R4 `Inferred`**; both are settled at INT-007's build (D-121)                                                                                                                                                                                                                   | **`/refresh-docs`** — raised   |
| `research/README.md` §6's decay row for `pg_dump` / `pgBackRest` is dated 2026-07-26 and records local machine state never rechecked. Raised by [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) to Build; restated here because BR-04's `pg_dump` floor depends on it                                                                                           | **Build** — restated           |
| [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) and [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) carry the wrong running "standalone" ordinal (second and third). BA-001 §11 yields **six** standalone specs — SPEC-01, SPEC-06, SPEC-09, SPEC-10, SPEC-11, SPEC-12 — making [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) the fifth and SPEC-12 the sixth               | **`/refresh-docs`** — raised   |
| `PROBLEM_STATEMENT_AND_VISION.md` §6 item 5 (eight files against D-23's ten), §5 ("D-01 through D-18") and §8 (four resolved OIs still listed Open)                                                                                                                                                                                                          | **`/refresh-docs`** — raised   |
| `research/README.md` §5's R8 is unstruck while `Project Tracker/CLAUDE.md` says D-29 dissolved it                                                                                                                                                                                                                                                            | **`/refresh-docs`** — raised   |

### BA-001 corrections — one, applied in this session → v1.13

| Correction                                                                                                                                                                                                                     | Where             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| ~~CNV-005's row states `generate.mjs` at **734 lines**~~ → measured **733**. Every other claim in the row was re-read against D-02, D-12, D-31 and RSH-005 and still holds                                                     | §5 CNV-005 — done |

### `research/README.md` corrections — one, applied in this session

| Correction                                                                                                                                                                                                                                                                                          | Where     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| §7's routing table gains a **`Workshops — CNV-005`** row naming RSH-005 in full plus R10, R7, R4, R1 and R9. **Third occurrence of the same defect** — D-108 for INT-004, D-127 for INT-007, now CNV-005 — and D-39's lesson in its fifth form (D-135)                                                | §7 — done |

### [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) amendment — applied in this session

Three edits, all applied in-session; [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) is Approved and amended
in-session on the established path (D-67, D-72, D-104, D-117). All three trace to **D-131**.

| [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) | Was | Now |
| --- | --- | --- |
| **BR-28** | "in one act: run the installer, and add `lint:no-markdown-state`" | An **ordered sequence with a proof step** — lint leg, installer, one hook run. Nothing about *what* is enabled changes |
| **BR-27** | "not added to any module's `lint:*` block **in Wave 3**" | "**by SPEC-10**". CNV-005 is itself Wave 3, so the old wording forbade the act BR-28 mandates. The rule **withholds; it does not forbid** |
| **FUT-014**'s closing note | "BR-28's single act inverts **all three** assertions" | Inverts **two of three**. Its third — the four artifacts exist and are tracked — is true before and after; enabling a guard does not untrack it |

**FUT-014's three assertions are themselves untouched**, which is what BR-16 and FUT-013 depend on;
only its closing note was wrong. **BR-25 and BR-26 are untouched.**

### [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) — owes nothing from this spec

CNV-005 calls no verb, and `project_view(workspace?)` already exists
([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) §3.1). **There is no twelfth
[SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) amendment**, and D-93's condition is therefore met.
Stated explicitly because six of eleven prior workshops amended it — its absence here is a finding
rather than a silence, and it is what flips that spec to Approved (D-136).

---

## 7. Functional Unit Tests

**Fifteen FUTs in D-95's split — nine inspection, six behavioural.** Every one covers CNV-005. Per
BA-001 §3.3 an **unqualified** story ID always means this catalogue, and every Financial Planner story
ID carries its module name — so FUT-002's target is written **Financial Planner's `CNV-001`**, never
bare, because this catalogue's `CNV-001` is the Methodology Library Seed.

### FUT-001: The linter reports zero before it is wired in

**Covers:** CNV-005 *(inspection)*
**Preconditions:** INT-002, INT-003 and INT-005 are complete. `lintNoMarkdownState.ts` exists
([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-16) and is in **no** module's `lint` chain
([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-27).
**Steps:**

1. Run the linter directly via `tsx`, not through any `lint` chain.

**Expected Result:**

- Exit **0** and **no violations**.
- All **six** declared roots are reported as scanned or skipped
  ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-17, BR-18).
- `Project Tracker/scripts/` is **present rather than skipped**, because
  [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02 created it (BR-02).

### FUT-002: `project_view` answers for Financial Planner's `CNV-001`

**Covers:** CNV-005 *(behavioural)*
**Preconditions:** The migration has run (CNV-002, CNV-003) and CNV-004's tie-out has passed. The MCP
server is registered by D-44's installer.
**Steps:**

1. Call `project_view('financial-planner')`.

**Expected Result:**

- The next action names **Financial Planner's** `CNV-001` and its first incomplete Task.
- The header, the task queue, **each Milestone's chain** and the three registers are all present in the
  one response ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-22).
- This is BR-03's check, and it is stronger than a row count because it exercises the hierarchy, the
  chain and the registers together (RSH-005 §8).

### FUT-003: `state/` is current

**Covers:** CNV-005 *(behavioural)*
**Preconditions:** INT-007 is built and the last checkpoint export is committed.
**Steps:**

1. Run `npm run export-state`.
2. Run `git status --porcelain "Project Tracker/state/"`.

**Expected Result:**

- **Empty output** — every file byte-identical to the committed export
  ([SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md) BR-15).
- A non-empty diff fails BR-04 and stops the conversion.

### FUT-004: The blueprint no longer describes the generator

**Covers:** CNV-005 *(inspection)*
**Preconditions:** INT-003 is complete.
**Steps:**

1. Read `Standards (Documents)/METHODOLOGY_BLUEPRINT.md` §7 in full — §7.1 through §7.5.

**Expected Result:**

- **No text presents a generator script emitting `dashboard.html` as the chosen approach** (BR-05).
- §7.3's table names **no** retired path.
- [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) FUT-009 covers **§7.3 only**, which is why this FUT reads the
  whole section: §7.2 (lines 235-249), §7.4 and §7.5 carry no retired-path token and no grep reaches
  them.

### FUT-005: Nothing writes test reports

**Covers:** CNV-005 *(inspection)*
**Preconditions:** INT-004 is complete.
**Steps:**

1. Read `Financial Planner/package.json`'s `posttest`.
2. Read both gate call sites — `.claude/workflows/build.js` and `.claude/workflows/test-quality.js`.

**Expected Result:**

- `posttest` points at `Project Tracker/scripts/recordTestRun.ts`
  ([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02).
- **No call site writes `project/test-reports/`**
  ([SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-01,
  [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-13a) (BR-06).

### FUT-006: A failed precondition deletes nothing

**Covers:** CNV-005 *(behavioural, negative)*
**Preconditions:** A fixture tree in which **one** retired-path reference is deliberately left in a
scanned root.
**Steps:**

1. Run the CNV-005 sequence against the fixture.

**Expected Result:**

- It **stops at BR-02** (BR-01).
- `Financial Planner/project/` and `Project Tracker/dashboard/` are **byte-for-byte unchanged**.
- **No `lint` chain is edited.**
- `.claude/settings.json` still has **no `hooks` key**.

### FUT-007: The dashboard is gone

**Covers:** CNV-005 *(inspection)*
**Preconditions:** The deletion step has run.
**Steps:**

1. `ls "Project Tracker/dashboard"`.

**Expected Result:**

- The folder **does not exist**, and neither `generate.mjs` nor `dashboard.html` is on disk (BR-07).

### FUT-008: `Financial Planner/project/` is gone, `.gitkeep` included

**Covers:** CNV-005 *(inspection)*
**Preconditions:** FUT-007's.
**Steps:**

1. `ls "Financial Planner/project"`.
2. `git ls-files "Financial Planner/project"`.

**Expected Result:**

- The folder **does not exist**.
- `git ls-files` returns **nothing** — **including `sprints/.gitkeep`**, which is tracked and would
  otherwise keep the directory alive after its contents left (BR-08).

### FUT-009: The deletion's durability is asymmetric, and git proves it

**Covers:** CNV-005 *(inspection)*
**Preconditions:** The deletion is committed.
**Steps:**

1. `git log --diff-filter=D --name-only -1`.

**Expected Result:**

- The deletion commit lists `Financial Planner/project/SPRINT_BOARD.md`,
  `Financial Planner/project/DEFECT_LOG.md`, `Financial Planner/project/sprints/W1-S2-checkpoint.md`,
  `Financial Planner/project/sprints/.gitkeep`, `Project Tracker/dashboard/generate.mjs` and
  `Project Tracker/dashboard/dashboard.html`.
- It lists **none** of the five `project/test-reports/tests_*.md` files, because they were never
  tracked.
- **This is the test that makes BR-09's accepted irreversibility visible rather than assumed.**

### FUT-010: The dead ignore rule is gone

**Covers:** CNV-005 *(inspection)*
**Preconditions:** FUT-008's.
**Steps:**

1. Read `Financial Planner/.gitignore`.

**Expected Result:**

- **No `project/test-reports/` line** (BR-10).

### FUT-011: Both lint chains carry the leg and pass

**Covers:** CNV-005 *(behavioural)*
**Preconditions:** The enablement step has run through BR-13's leg (1).
**Steps:**

1. Read `Financial Planner/package.json`'s and `Project Tracker/package.json`'s `lint` scripts.
2. Run `npm run lint` in each module.

**Expected Result:**

- Each chain names **`lint:no-markdown-state`** (BR-13).
- **The `lint:no-markdown-state` leg passes in both**, which BR-02's precondition run is what makes
  reachable. The assertion is scoped to that leg: an unrelated pre-existing failure elsewhere in
  either chain fails `npm run lint` without falsifying BR-13.

### FUT-012: The hook denies and allows — R10 settles

**Covers:** CNV-005 *(behavioural)*
**Preconditions:** `installCutoverHook.ts` has run, and `.claude/settings.json` carries the
`PreToolUse` registration **beside** its existing `permissions` block
([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-26).
**Steps:**

1. Under `claude --debug-file`, attempt a `Write` to `Financial Planner/project/SPRINT_BOARD.md`.
2. Attempt a `Write` to a scratch file under the module's test tree.

**Expected Result:**

- Step 1 is **denied**; the debug log shows the hook fired; the deny reason names the **artifact** and
  the record's **`verb`** ([SPEC-10](SPEC-10-CUTOVER-GUARDS.md) BR-12).
- Step 2 is **allowed**.
- **This is R10's settling event and the first hook firing ever observed in this repo** (BR-14).

### FUT-013: [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) FUT-014 is inverted

**Covers:** CNV-005 *(inspection)*
**Preconditions:** FUT-011's and FUT-012's.
**Steps:**

1. Re-run [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) FUT-014's three reads — every module's `lint` chain,
   `.claude/settings.json`, and `git ls-files` for the four artifacts.

**Expected Result:**

- **Two of the three assertions now fail**, and the third still holds: a `lint` chain **does** name
  `lint:no-markdown-state`, `.claude/settings.json` **does** have a `hooks` key — and the four
  [SPEC-10](SPEC-10-CUTOVER-GUARDS.md) artifacts are **still tracked**, which was true before and
  stays true.
- That is FUT-014's own closing instruction read precisely: it is the enablement pair that inverts,
  not the delivery (BR-16).

### FUT-014: CNV-005 emits no Activity

**Covers:** CNV-005 *(behavioural, negative)*
**Preconditions:** The database is deployed and reachable; the CNV-005 sequence has not yet run.
**Steps:**

1. Count `Activity` rows.
2. Run the whole CNV-005 sequence.
3. Count `Activity` rows again.

**Expected Result:**

- The two counts are **identical** (BR-17).
- **No row of any kind is written.**
- The sequence **does** call a verb — BR-03's `project_view` — and the count still holds, because
  [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-03 binds **state-changing** verbs and a read is not
  one. That is the reason this FUT passes rather than an accident of timing, and it is why BR-17 says
  "no *write*-verb call".
- [SPEC-07](SPEC-07-CHAIN-AND-REGISTERS.md) BR-32's **sixteen** `Activity.kind` values are unchanged.

### FUT-015: `design/` is untouched and the falsified claims are fixed

**Covers:** CNV-005 *(inspection)*
**Preconditions:** The whole sequence has run.
**Steps:**

1. Re-count retired-path references across the six `Financial Planner/design/*.md` files, against
   D-23's token set.
2. Read `Project Tracker/CLAUDE.md:80` and `:155`, and the repo-root `CLAUDE.md:48` and `:113`.

**Expected Result:**

- **Still exactly 32** references under `design/`, **none removed** (BR-11).
- The `dashboard/` line and the "do not enable the two cutover guards" line are updated, and **both
  linter counts read 22** (BR-18).

---

_SPEC-12 specifies CNV-005, the terminal act of cutover, per [BA-001 §11 row 12](../BUSINESS_ARCHITECTURE.md) — a precondition checklist rather than a feature, and the widest fan-in object in the catalogue. The preconditions it verifies belong to [SPEC-08](SPEC-08-CONSUMER-REWIRING.md), [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) and [SPEC-11](SPEC-11-PROJECT-STATE-EXPORTER.md); the guards it enables are [SPEC-10](SPEC-10-CUTOVER-GUARDS.md)'s, built there and enabled here (D-07); the contract it reads through is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s, which it does not amend — and that absence is what discharges D-93 and flips SPEC-01 to Approved ([D-136](../DECISIONS_LOG.md)). It discharges the three §6 rows owed to it by [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md), [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) and [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md), all three ordering constraints. **SPEC-12 resolves no OI**, **mints no error key** — structurally, not by disposition — and is **provisional on R1** ([D-133](../DECISIONS_LOG.md)); **R10 is owned here and discharged by BR-14's proof run**, **R7 is checked rather than inherited**, **R4 is not re-owned**, and **R9 is ruled out**._
