# SPEC-10 — Cutover Guards

**Spec ID:** SPEC-10
**FRICEW Objects:** INT-006 (Interface)
**Wave:** 3
**CDS Service:** **None.** Neither guard reaches CAP — see §2. This is the first spec in the module
that places no requirement on the Data Model stage.
**Status:** Draft
**Provisional on:** **Nothing.** **R1 is ruled OUT** (D-119) — the first spec in the module that is
not provisional on it. **R9 is ruled OUT** (D-101's precedent). **R5 is discharged here** (D-112,
D-113); **R6 is confirmed closed** by D-32; **R10 is mitigated, not proven, and its owner is CNV-005.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-04 | Sandro & Claude | Initial creation from the SPEC-10 workshop. Records **D-109 … D-119**. **Third Wave 3 spec** and the **third standalone** one. The only object in slice 1 that writes no project state and reads none, so **§2 places no Data Model requirement** — a first. **SPEC-10 resolves no OI** and **mints no error key**, the sixth spec running to mint none but the first where none is structurally possible (§5). **Not provisional on R1** (D-119) — also a first. [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) flipped to **Approved** in the same session (**D-109**), discharging its dangling change-history citation. [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6's owed glob row and SPEC-09 §6's owed third-root row are both discharged by BR-17. **[SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02 is amended** in-session — its four literal strings are provably incomplete against the files they are scoped to, and the shared list supersedes them (**D-117**). Five BA-001 corrections applied in-session, listed in §6. |

---

## 1. Overview

The only object in slice 1 that writes no project state and reads none. Its deliverable is two
complementary deterministic guards plus the single list they share: a **`PreToolUse` hook** that
inspects a tool call's path against a retired-artifact list and hard-denies — _you cannot do the wrong
thing_ — and **`lintNoMarkdownState.ts`**, which joins the shared linter suite and fails `npm run
lint`, already in the gate — _nothing tells you to do the wrong thing_. Both are **built here and
enabled by CNV-005** (D-07). BA-001 §11 row 10 cuts it standalone for its own research document
(RSH-004) and its own risks (R5, R6, R10), and the workshop's three measured findings are what shape
it: [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02's literal string list is provably incomplete against
the files it is scoped to; a gitignore-respecting search silently walks 4 of 37 files under
`.claude/`; and `lintDocClaims.ts:15` already establishes how a shared linter reaches outside its
module's cwd without naming one.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute a spec
declares here is a requirement it places on the Data Model stage.

**INT-006 requires no entity and no attribute.** Neither guard reads or writes project state — the
hook is a Node process reading a tool call off stdin, and the linter is a filesystem scan — so **this
spec places no requirement on the Data Model stage.** It is the first spec in the module to place
none.

**No Data Model amendments.**

---

## 3. Functional Description

### 3.1 INT-006 — Cutover Guards [Interface]

[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §3.1 adapted the Interface template's four headings — API
contract, data mapping, scheduling, retry — for an Interface that is executable code rather than a
service, and §3.1 does the same here: the **contract** is a hook registration and a stdin→stdout
protocol, the **mapping** is the one shared list both guards project differently, and scheduling and
retry are stated and ruled out.

#### The shared list

One tracked artifact, `Standards (Technical + Linting)/retired-paths.json`, defines what "retired"
means. **Five records**, each with four fields.

| Field      | For        | Notes                                                                        |
| ---------- | ---------- | ---------------------------------------------------------------------------- |
| `artifact` | both       | Human name, used in messages                                                 |
| `paths`    | the hook   | Glob patterns; **empty** on a linter-only record                             |
| `tokens`   | the linter | Every literal spelling that occurs in the guarded roots                      |
| `verb`     | both       | The MCP verb named in the deny message and in the linter's output; `null` where none applies |

The five records: **sprint board**, **defect log**, **checkpoints**, **test reports**, and
**test-report generator** — the last linter-only, with empty `paths` and `verb: null`.

#### Hook — registration and shape

| Aspect       | Contract                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Script       | `.claude/hooks/blockRetiredStatePaths.js` — **plain JavaScript**                                                                |
| Registration | `command: "node"`, `args: ["${CLAUDE_PROJECT_DIR}/.claude/hooks/blockRetiredStatePaths.js"]` — **exec form**                    |
| Event        | `PreToolUse` only                                                                                                              |
| Matchers     | Two groups, one handler: `Write\|Edit\|NotebookEdit` (exact-match list) and `mcp__.*` (regex)                                   |
| `timeout`    | Seconds — small and explicit                                                                                                   |
| Deny form    | stdout carries only the deny JSON; exit **0**                                                                                  |
| Written by   | `Standards (Technical + Linting)/scripts/installCutoverHook.ts`, a tracked installer (D-32) — **not run in Wave 3**             |

#### Hook — what it inspects

`tool_input.file_path` (`Write`, `Edit`) · `tool_input.notebook_path` (`NotebookEdit`) · `file_path`
or `path` on any `mcp__*` call. **A call carrying none of these is allowed.**

#### Linter — roots and walk

Roots are a **declared list, never the whole tree**: repo `.claude/` · `Standards (Documents)/` ·
`Standards (Technical + Linting)/` · the repo-root `CLAUDE.md` · every module's `CLAUDE.md` ·
`Project Tracker/scripts/`. The repo root is derived from `import.meta.dirname`. A missing root is
skipped.

#### Scheduling and retry

**No scheduling** — the hook is invoked by Claude Code per tool call, the linter by npm. **No retry** —
a denial is an answer, not a transient fault. Neither guard connects to CAP, Postgres, or any network.

---

## 4. Business Rules

**The shared list**

- **BR-01** One tracked artifact, `Standards (Technical + Linting)/retired-paths.json`, is the single definition of a retired artifact. Both guards read it; neither carries its own list. Five records: sprint board, defect log, checkpoints, test reports, test-report generator.
- **BR-02** Each record carries `artifact`, `paths` (globs, for the hook), `tokens` (literal strings, for the linter) and `verb` (named in both guards' output; `null` where none applies). A record may carry empty `paths` — the test-report-generator record does, because no agent writes to a linter script.
- **BR-03** `tokens` carry **every spelling that occurs in the guarded roots**, not the canonical one. Measured at this workshop: `Financial Planner/CLAUDE.md:77` reads `sprints/` bare, with no `project/` prefix, and `generateTestReport.ts:6` splits the path as `join(process.cwd(), "project", "test-reports")`. [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02's four literals therefore find **2 of 3** references in the first file and **1 of 2** in the second.
- **BR-04** The list is **JSON**, not a TypeScript module. The hook is plain Node run in exec form and the linter runs under `tsx`; JSON is the only format both load without a module-system boundary between them.

**Hook — registration and shape**

- **BR-05** The hook script is `.claude/hooks/blockRetiredStatePaths.js` — **plain JavaScript, not TypeScript**. This is a stated carve-out from the module's TypeScript-everywhere convention: exec form requires `command` to resolve to a real executable, and `node_modules/.bin/tsx.cmd` is a shim that cannot be spawned (RSH-004 §6). `.claude/hooks/` is tracked — `.gitignore:10` ignores `.claude/*.md` only.
- **BR-06** Registration uses **exec form** — `command: "node"` with the script path in `args` — because `c:\Projects\Life OS\` contains a space and exec form passes each argument exactly as written, removing the quoting problem entirely (RSH-004 §6).
- **BR-07** The handler's `timeout` is expressed in **seconds** and set to a small explicit value. The existing user-scope hook on this machine sets `5000`, which is 83 minutes rather than 5 seconds (RSH-004 §5).
- **BR-08** Two matcher groups on `PreToolUse` point at the same handler: `Write|Edit|NotebookEdit` (an **exact-match list** — only letters and `|`) and `mcp__.*` (a **regex**, because it contains `.` and `*`). MCP tool names are **not** placed in the exact-match list: hyphens there require v2.1.195+ and comma separators v2.1.191+, both above the installed 2.1.90.
- **BR-09** `PreToolUse` is the only event used. Measured in the installed 2.1.90 bundle: `PermissionRequest` (83 occurrences) fires only when a permission prompt would be raised, so a pre-approved path never reaches it; `PermissionDenied` (20) fires **after** a denial, its own summary string reading "After auto mode classifier denies…". Neither appears in the documentation RSH-004 read.

**Hook — decision**

- **BR-10** The hook inspects the **union** of three `tool_input` fields — `file_path`, `notebook_path` and `path` — on **every** matched call, regardless of which tool sent it. Today `Write` and `Edit` supply `file_path`, `NotebookEdit` supplies `notebook_path`, and an MCP server may supply either `path` or `file_path`; the rule is **not scoped to that mapping**, so a tool that later gains a path field is guarded without a matcher change. A call carrying **none** of the three is allowed.
- **BR-11** A path is normalised — separators unified and `..` resolved — **before** matching. `project/../project/SPRINT_BOARD.md` is denied (RSH-004 §10).
- **BR-12** On a match, stdout carries **exactly** the deny JSON and nothing else, and the process exits **0**. `hookSpecificOutput.permissionDecision` is `"deny"`; `permissionDecisionReason` names the artifact, the record's `verb`, and one clause of reason — enough for the calling agent to switch mechanism on its next tool call rather than retry a variant path.
- **BR-13** Exit **2** is not used: it discards stdout and any JSON in it. Exit **1** is never used to deny — Claude Code treats it as a non-blocking error and the write proceeds (RSH-004 §4).
- **BR-13a** The hook **fails open on its own error** — unparseable stdin, a missing or malformed `retired-paths.json`, or any unexpected throw produces an allow: empty stdout, exit 0, and one line on stderr naming what failed. A guard that hard-denied on its own bug would block **every** `Write` and `Edit` in the session, in every permission mode, with no way to bypass it (RSH-004 §4) — and BR-24's linter covers the same tokens on the next gate. This is the one place the two guards are deliberately **not** redundant in the same direction.
- **BR-14** `Bash` is **not** matched and its commands are **not** parsed (D-32). The carve-out is stated rather than silent: a `Bash` redirect or heredoc remains an uncovered write path, and the residual is accepted because command matching is fragile and fail-open.
- **BR-15** Project Tracker's own MCP verbs carry **no path-bearing field**, so BR-10 allows them by construction. No server is named in the matcher or in the list, and no allow-list is maintained — a filesystem-style MCP server's write verb does carry such a field and is caught by the same rule.

**Linter**

- **BR-16** `lintNoMarkdownState.ts` joins the shared suite at `Standards (Technical + Linting)/scripts/`, takes **no arguments**, and derives the repo root from **`import.meta.dirname`**, not from `process.cwd()`. Precedent: `lintDocClaims.ts:15` locates the shared ESLint config the same way, with the stated reason that "renaming or moving the Standards folder cannot silently defeat the check."
- **BR-17** It scans a **declared root list**, never the tree: repo `.claude/`, `Standards (Documents)/`, `Standards (Technical + Linting)/`, the repo-root `CLAUDE.md`, every module's `CLAUDE.md`, and `Project Tracker/scripts/`.
- **BR-18** A missing scan root is **skipped, never fatal** (D-36). `Project Tracker/scripts/` does not exist today; it is created by [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02.
- **BR-19** The linter **walks the filesystem itself and never delegates to a gitignore-respecting tool** — not ripgrep, not `git grep`, not a glob library with gitignore support. Measured: a default `rg` over `.claude/` enumerates **4 of 37** files, because `.gitignore:10`'s `.claude/*.md` excludes every `.md` at every depth — while `git check-ignore` reports those files **not ignored** and `git ls-files` reports them **tracked**. ripgrep and git disagree, and the disagreement hides **every one of the five `.md` consumers** [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) rewires under that root, leaving only its two `.js` files visible. (**Five, not six.** `PLAN.md:302` and [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) FUT-001 both say the omission "under-reports by six files"; measured today it is five — `agents/build-briefer.md`, `agents/implementer.md`, `commands/build.md`, `skills/human-review-loop/SKILL.md`, `skills/pm-update/SKILL.md`. Both are corrected in this session, §6.)
- **BR-20** The linter matches retired **paths**, never markdown-reading in general. `/pm-update`'s surviving check reads `Financial Planner/design/BUSINESS_ARCHITECTURE.md` and stays legal (D-98, [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-18).
- **BR-21** Three files are **exempt by path** because they necessarily contain the tokens: `retired-paths.json`, the hook script, and the linter itself. A guard that flags its own definition is broken by construction.
- **BR-22** `Project Tracker/CLAUDE.md:5` is **rewritten**, not exempted — it describes the retired artifacts without naming them. There is **no line-level opt-out marker** anywhere in the linter: an escape hatch on a guard whose point is having none is D-05's removed CRUD path in a second form.
- **BR-23** D-12 markdown is out of scope **by construction**: `Financial Planner/design/**` and `Project Tracker/design/**` are not scan roots, so the 32 references bound for the `/refresh-docs` sweep and these specs' own text can never fire it.
- **BR-24** A violation prints **file, line, matched token and the record's `verb`**, and exits non-zero, failing `npm run lint`. Naming the verb costs one field read from a file the linter has already parsed, and makes a failure say what the instruction should say instead.

**Enablement**

- **BR-25** SPEC-10 **enables nothing** (D-07). It delivers four tracked artifacts: the hook script, the installer, the linter, and the shared list.
- **BR-26** The installer is `Standards (Technical + Linting)/scripts/installCutoverHook.ts` (D-32). It **merges** the hook registration into `.claude/settings.json`, preserving the existing `permissions` block and any hooks already present, and is **idempotent** — re-running it writes no duplicate handler. It is **not run** in Wave 3.
- **BR-27** `lintNoMarkdownState` is **not added to any module's `lint:*` block** in Wave 3. Adding it would fail `npm run lint` on the current tree, where 27 references across 12 files are still live and correct.
- **BR-28** CNV-005 enables both guards in one act: **run the installer**, and **add `lint:no-markdown-state`** to every module's `lint` chain. That single act is D-07's "final act of the rewiring stage".

---

## 5. Error Handling

**SPEC-10 mints no error key of its own, and here that is structural rather than a disposition**
(D-46, D-79). A `PreToolUse` hook is not CAP and has no i18n surface: its deny reason is a plain string
on stdout that the model reads, and BR-12 requires it to **name a verb**, which an i18n key cannot do.
The linter's output is a violation list and a non-zero exit. **There is no key space to mint into.**
SPEC-04, SPEC-05, SPEC-07, [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) and
[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) each minted none by disposition; this is the first spec
where none is structurally possible — sixth running.

| Condition                                   | Surface                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Write`/`Edit` to a retired path            | Deny JSON on stdout, exit 0; the reason names artifact + verb (BR-12)                |
| `NotebookEdit` to a retired path            | Same, read from `notebook_path` (BR-10)                                              |
| `mcp__*` call carrying a retired path       | Same (BR-10, BR-15)                                                                  |
| `mcp__*` call carrying no path field        | **Allowed** — no output, exit 0 (BR-10, BR-15)                                       |
| Malformed or unparseable stdin              | **Allowed** — the hook fails **open** on its own error (see below)                   |
| Retired token found in a scanned root       | Linter prints file, line, token, verb; non-zero exit fails `npm run lint` (BR-24)    |
| Scan root absent                            | Skipped silently (BR-18, D-36)                                                       |

**The fail-open choice is deliberate.** A guard that hard-denied on its own bug would block every
`Write` in the session, and the linter covers the same ground on the next gate.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-10 resolves no open item.** OI-05 is the only one still open, it is not a workshop question,
and this spec touches no `Methodology` shape.

**Alerts:** asked per the standing rule — **none.** Neither guard observes state and neither schedules
anything.

**Provisional dependencies — none. SPEC-10 is the first spec in the module that is not provisional
on R1.**

- **R1 — ruled OUT.** Neither guard touches CAP. The hook is a Node process reading stdin; the linter
  is a filesystem scan. Nothing connects to Postgres, so D-39's risk has nothing to attach to.
  SPEC-01 … [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) all shipped provisional on it; ruled
  explicitly here rather than inherited silently, on D-82's own argument.
- **R9 — ruled OUT**, on D-101's precedent and D-82's test: no HTTP server, no origin, no page, no
  browser-originated request.
- **R5 — discharged here.** It is the risk this spec exists to answer. Its "what would settle it" cell
  reads "A design ruling at the `INT-006` workshop; add matchers." BR-08 adds `mcp__.*` and
  `NotebookEdit`; BR-10 gives `NotebookEdit` its own field read and MCP calls a path-field rule; BR-14
  restates the `Bash` residual as accepted rather than unknown.
- **R6 — confirmed closed by D-32**, and the reading verified rather than assumed: R6 names the
  **hook's** registration in `.claude/settings.json` (`.gitignore:8`), which BR-26's tracked installer
  discharges. The MCP server's registration is `.mcp.json` (`.gitignore:13`), a different file
  discharged by D-44 — [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6 narrows R6 this way and INT-006's
  own text does not widen it back.
- **R10 — mitigated, not proven, and it gains an owner: CNV-005.** Re-measured at this workshop
  against the installed bundle: Claude Code **2.1.90**; `PreToolUse` 60, `PostToolUse` 98,
  `hookSpecificOutput` 66, `permissionDecisionReason` 6, `MultiEdit` **1** (a spinner-label lookup, not
  a tool), `NotebookEdit` **8**. D-32's drop of `MultiEdit` and addition of `NotebookEdit` both hold on
  measurement. What is still unproven is **execution**: no hook has been run under this build. RSH-004
  §12 names the settling event — one hook run under `claude --debug-file` — and D-07 forbids
  registering one before cutover, so **CNV-005 is both the enablement and the proof.** Recording an
  owner is D-39's and D-108's lesson a third time; `research/README.md` §5 has no Owner column at all,
  which is why R5, R6 and R10 have carried none.

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Goes to                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **`build.js:379` tells the gate agent that `npm run lint` is "ESLint plus 21 `lint:*` scripts"; Financial Planner's chain carries 22 today and 23 once BR-28 lands.** Already stale before this spec, and no retired-path reference names it — **D-102's shape a third time** (after D-102 itself and D-107's `build.js:382`): a correction the rewiring must make that a reference count cannot find. The durable fix is to drop the number, not to increment it                                                                                                                       | **[SPEC-08](SPEC-08-CONSUMER-REWIRING.md) (INT-002)** — applied in-session |
| `Project Tracker/CLAUDE.md` Status says "Twenty linters run" while its own Folder Structure block says "the 21 shared linters"; the repo-root `CLAUDE.md:48` says 21 and is correct                                                                                                                                                                                                                                                                                                                                                                                                  | **`/refresh-docs`** — raised           |
| `PROBLEM_STATEMENT_AND_VISION.md` §6 item 5 still says the rewiring surface is **eight files** (D-23 makes it ten), §5 still says "D-01 through D-18", and §8 still lists OI-01 … OI-04 as Open when D-31, D-29/D-30, D-35 and D-70 each closed one. The document has not been touched since Scope                                                                                                                                                                                                                                                                                    | **`/refresh-docs`** — raised           |
| **D-23's text on disk still states the rationale D-100 withdrew** — that `METHODOLOGY_BLUEPRINT.md` "sits inside `lintNoMarkdownState`'s stated `Standards/**` glob… that makes it load-bearing". D-23's decision survives on its other test ("does the file instruct an agent"), but a reader hitting D-23 before D-100 gets the refuted reason with no pointer                                                                                                                                                                                                                       | **Decisions log** — amendment pointer applied in-session |

**Discharged here**

- [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6's owed glob row — BR-17 names all six roots.
- [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6's owed third-root row — BR-17 and BR-18.
- [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) FUT-006 and SPEC-08 FUT-009, which each say they are "the
  only thing catching a missed edit until SPEC-10 lands", are **superseded by BR-17** — D-95's
  observation that the inspection FUTs are "the same test earlier", read forward.

**Corrections to `PLAN.md` §6 and [SPEC-08](SPEC-08-CONSUMER-REWIRING.md)** — applied in this session,
both from D-116 and D-117.

| Correction                                                                                                                                                                                                                                                                                                                        | Where                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| ~~"any future measurement of this surface that omits the glob under-reports by **six** files"~~ → **five**, and the stated cause — a missing `**/*.md` glob — is replaced by the real one: ripgrep applies `.gitignore:10` at every depth, git does not, and command-line globs outrank ignore files | `PLAN.md` §6 and [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) FUT-001 — done |
| ~~"Sixteen references across ten files"~~, asserted at SPEC-08's last amendment as "unchanged and still correct" → **21**. Sixteen is `PLAN.md` §6's **eight-file** count; it includes the two in `generateTestReport.ts`, which [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) owns, and excludes the eight D-23 added | [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §1 — done |
| ~~SPEC-08 BR-02's four literal strings~~ → the shared list (D-117), reconciling the four different spellings BR-02, SPEC-08 FUT-001, SPEC-08 FUT-006 and SPEC-08 FUT-009 each used while citing BR-02 | [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02 — done |
| **D-23 gains an amendment banner** — its Rationale still stated the "load-bearing" glob justification D-100 withdrew, and its arithmetic starts from the sixteen. D-23's ten files and SPEC-08's ten are **two different sets sharing one number**, overlapping on nine | `DECISIONS_LOG.md` D-23 — done |

**BA-001 corrections** — five, all **applied in this session**.

| Correction                                                                                                                                                                                                                                                       | Where             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| ~~"joining the existing **20-linter** shared suite"~~ → **21**, per D-36, which corrected exactly this count. The repo-root `CLAUDE.md:48` already reads 21                                                                                                       | §4 INT-006 — done |
| ~~"scanning `.claude/**` and `Standards/**` — including `Standards (Documents)/`"~~ → D-100 proves a literal `Standards/**` does not match `Standards (Documents)/`. Replaced with BR-17's six roots                                                              | §4 INT-006 — done |
| ~~R6 "closed by D-32" sitting in the same document as §11 row 10 listing R6 among SPEC-10's live risks~~ → the row now states R6 closed, and §11 row 10's reason for the cut rests on R5 and R10                                                                  | §4 / §11 — done   |
| ~~Traces To reads "PSV P1; D-07, D-32; INT-002, INT-003, CNV-005"~~ → adds **INT-001** (named in the row's own prose), **INT-004** (whose moved script is the third root, D-103) and **FRM-002** (which declares a hard dependency on the hook at BA-001 §4 and was never reciprocated) | §4 INT-006 — done |
| ~~The row names "the retired-path list" with no enumeration and no cross-reference~~ → points at BR-01's five records                                                                                                                                             | §4 INT-006 — done |

---

## 7. Functional Unit Tests

**Sixteen FUTs, every one against the built but unregistered artifacts** (BR-25), so none requires
Claude Code to be running and none violates D-07. The hook is a stdin→stdout process (RSH-004 §9), the
linter and installer are ordinary Node programs, and the fixture tree and fixture settings file live
under the module's test tree.

Story IDs below are **Financial Planner's** unless the text says otherwise (BA-001 §3.3).

### FUT-001: A `Write` to the sprint board is denied, and the reason names the verb

**Covers:** INT-006
**Preconditions:** The four artifacts exist and nothing is registered (BR-25). `retired-paths.json`
carries the sprint-board record with its `verb` (BR-01, BR-02).
**Steps:**

1. Run the hook script and feed it on stdin:
   `{"hook_event_name":"PreToolUse","tool_name":"Write","tool_input":{"file_path":"<repo>/Financial Planner/project/SPRINT_BOARD.md","content":"x"}}`.
2. Capture stdout, stderr and the exit code.

**Expected Result:**

- Exit **0** (BR-12).
- stdout parses as JSON and contains **nothing else** — no log line, no trailing text.
- `hookSpecificOutput.permissionDecision` is `"deny"`.
- `permissionDecisionReason` names the **sprint board** and the record's **`verb`** (BR-12, BR-01).

### FUT-002: A path reaching a retired artifact through `..` is denied

**Covers:** INT-006
**Preconditions:** FUT-001's.
**Steps:**

1. Feed the same event with `file_path` set to
   `<repo>/Financial Planner/project/../project/SPRINT_BOARD.md`.
2. Repeat with **BR-11's normalisation removed** from the script, so the raw string is matched against
   the record's globs.

**Expected Result:**

- Step 1 denies exactly as FUT-001 does (BR-11).
- Step 2 **allows**, and the write it would have permitted lands on the sprint board. That contrast is
  what makes BR-11 a rule rather than tidiness.

### FUT-003: `NotebookEdit` is inspected on `notebook_path`, not `file_path`

**Covers:** INT-006
**Preconditions:** FUT-001's.
**Steps:**

1. Feed `tool_name` `NotebookEdit` with `notebook_path` set to a retired path and **no `file_path` key
   at all**.
2. Feed `tool_name` `NotebookEdit` with the retired path in `file_path` and `notebook_path` absent — a
   shape no tool produces today.

**Expected Result:**

- Step 1 **denies** (BR-10). A hook reading only `file_path` would allow it, which is the gap D-32
  found: `NotebookEdit` carries its path in a different field.
- Step 2 **also denies** — BR-10 reads the union of the three fields on every matched call rather than
  a per-tool mapping, so a tool that gains a path field is guarded before anyone notices it did.

### FUT-004: An MCP call carrying no path field is allowed

**Covers:** INT-006, INT-001
**Preconditions:** FUT-001's.
**Steps:**

1. Feed a `tool_name` of the form `mcp__<project-tracker-server>__record_test_run` — the server slug is
   the installer's (D-44) and no rule here depends on it — with the verb's own inputs
   ([SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md) BR-20a) and **no path-bearing field**.

**Expected Result:**

- **Allow** — exit 0, **empty stdout** (BR-10, BR-15).
- This is the sanctioned write path after cutover; a guard that denied it would block the thing it
  exists to protect.

### FUT-005: An MCP call carrying a retired path is denied

**Covers:** INT-006
**Preconditions:** FUT-001's.
**Steps:**

1. Feed `tool_name` `mcp__<some-filesystem-server>__write_file` with `path` set to a retired artifact.
2. Search `retired-paths.json` and the registration's matchers for that server's name.

**Expected Result:**

- Step 1 **denies** (BR-10, BR-15).
- Step 2 finds **zero matches** — the decision comes from the field, not from the server (BR-15).

### FUT-006: A legitimate write is allowed and produces no output

**Covers:** INT-006
**Preconditions:** FUT-001's.
**Steps:**

1. Feed a `Write` to `Financial Planner/srv/modules/transactions/transactionService.ts`.

**Expected Result:**

- Exit **0**, **empty stdout**, empty stderr (BR-12).
- Stray output on stdout is a documented failure mode that corrupts the JSON contract (RSH-004 §4),
  which is why emptiness is asserted rather than only "no deny".

### FUT-007: Exit 1 is never the deny path

**Covers:** INT-006
**Preconditions:** The hook script as written.
**Steps:**

1. Search `blockRetiredStatePaths.js` for `process.exit(1)` and `exit(2)`.
2. Read the deny branch and assert its exit code.

**Expected Result:**

- **Zero matches** for both strings (BR-13).
- The deny branch exits **0**.
- This is an inspection FUT and the only one in the set — the reference carries an explicit warning
  that exit 1 is treated as a non-blocking error and the write proceeds.

### FUT-008: The linter finds the `.md` files a gitignore-respecting search skips

**Covers:** INT-006, INT-002
**Preconditions:** The linter exists and is not wired into any `lint` chain (BR-27). The current tree,
before the rewiring.
**Steps:**

1. Run the linter with `.claude/` among its roots (BR-17).
2. Separately run `rg` over `.claude/` with default flags.
3. Run `git check-ignore` and `git ls-files` over the same `.md` files.

**Expected Result:**

- The linter enumerates **every file** under the root — 37 today — and reports the tokens in **seven**
  files: the two the default `rg` also finds (`workflows/build.js`, `workflows/test-quality.js`) **and
  the five it does not** (`agents/build-briefer.md`, `agents/implementer.md`, `commands/build.md`,
  `skills/human-review-loop/SKILL.md`, `skills/pm-update/SKILL.md`) (BR-19). Assert the five, not a
  total — the file count under `.claude/` moves whenever a skill is added.
- Each reported violation names **file, line, matched token and the record's `verb`** (BR-24).
- The default `rg` enumerates **4** and finds **none of the five**.
- `git check-ignore` reports those files **not ignored** and `git ls-files` reports them **tracked**.
- The ripgrep/git disagreement is the finding, and it is why BR-19 names the mechanism rather than the
  outcome.

### FUT-009: The token list catches the two spellings SPEC-08 BR-02 misses

**Covers:** INT-006
**Preconditions:** A **fixture tree** carrying the two real spellings verbatim — a `CLAUDE.md` whose
folder-structure block has `sprints/` bare under a `project/` header, and a `.ts` file containing
`join(process.cwd(), "project", "test-reports")`. The fixture is used rather than the live files
because by the time the linter is enabled both have been rewired (BR-27, BR-28).
**Steps:**

1. Run the linter over the fixture tree.
2. Run a matcher over the same fixture using
   [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02's four literals.

**Expected Result:**

- The linter reports **both** (BR-03).
- [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02's literals report **neither** — the measurement D-117
  rests on.

### FUT-010: A missing scan root is skipped, not fatal

**Covers:** INT-006
**Preconditions:** `Project Tracker/scripts/` **absent** — its state today, since
[SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) BR-02 is what creates it.
**Steps:**

1. Run the linter over the full root list.

**Expected Result:**

- Exit **0** for the absent root and **no error** (BR-18, D-36).
- The other five roots are scanned normally.

### FUT-011: Reading BA-001 stays legal

**Covers:** INT-006, INT-003
**Preconditions:** A fixture skill file containing `/pm-update`'s surviving check — a read of
`Financial Planner/design/BUSINESS_ARCHITECTURE.md`.
**Steps:**

1. Run the linter over the fixture.

**Expected Result:**

- **No violation** (BR-20, [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-18, D-98). The linter matches
  retired paths, not markdown-reading.

### FUT-012: The guard's own artifacts do not flag themselves

**Covers:** INT-006
**Preconditions:** All four delivered artifacts in place (BR-25).
**Steps:**

1. Run the linter over the full root list.
2. Search the linter for any line-level opt-out marker.
3. Read `Project Tracker/CLAUDE.md` and the linter's exemption list.

**Expected Result:**

- **Zero** violations from `retired-paths.json`, `blockRetiredStatePaths.js` and
  `lintNoMarkdownState.ts`, each of which necessarily contains the tokens (BR-21).
- The exemption is **by path**, and **no line-level marker exists anywhere** in the linter (BR-22).
- **Zero** violations from `Project Tracker/CLAUDE.md`, and that file is **not** in the exemption list
  — its line 5 was rewritten to describe the retired artifacts without naming them (BR-22). Without
  this step the guard turns `npm run lint` red on its own module the moment BR-28 enables it.

### FUT-013: The installer merges without destroying anything, and twice equals once

**Covers:** INT-006
**Preconditions:** A **fixture settings file** in a temp directory carrying a populated
`permissions.allow` array and one unrelated `PostToolUse` hook — never the real
`.claude/settings.json`.
**Steps:**

1. Run `installCutoverHook.ts` against the fixture.
2. Read the fixture.
3. Run the installer a second time and re-read.

**Expected Result:**

- `permissions.allow` is unchanged **member for member** (BR-26).
- The unrelated `PostToolUse` hook is still present.
- Exactly **one** `PreToolUse` handler for this script after step 1, and still exactly one after step 3
  (BR-26).
- The handler's `timeout` is a small number of **seconds**, not milliseconds (BR-07).

### FUT-014: Nothing is enabled

**Covers:** INT-006
**Preconditions:** The tree as SPEC-10 leaves it.
**Steps:**

1. Read every module's `lint` chain.
2. Read the repo's `.claude/settings.json`.
3. Read `git ls-files` for the four artifacts.

**Expected Result:**

- No module's `lint` chain names `lint:no-markdown-state` (BR-27).
- `.claude/settings.json` has **no `hooks` key** and still carries `permissions` only (BR-25).
- All four artifacts exist and are **tracked** (BR-25).
- This is the FUT that proves D-07 was honoured, and it is the one that must be **re-run and expected
  to fail** at CNV-005 — BR-28's single act inverts all three assertions.

### FUT-015: Both guards read one list

**Covers:** INT-006
**Preconditions:** A fixture copy of `retired-paths.json` and a fixture file containing a distinctive
token.
**Steps:**

1. Add a **sixth** record with a distinctive path and token.
2. Run the hook against a `Write` to that path, and the linter against the fixture file.
3. Remove the record and repeat step 2.

**Expected Result:**

- Step 2: **both** fire, with **neither** the hook script nor the linter edited (BR-01).
- Step 3: **both** stop firing.
- One list, two projections — which is what makes BR-01 a rule rather than a convention.

### FUT-016: The hook fails open on its own error

**Covers:** INT-006
**Preconditions:** FUT-001's.
**Steps:**

1. Feed the hook a stdin payload that is not valid JSON.
2. Feed it a valid `Write` event to a retired path with `retired-paths.json` **absent**.
3. Feed the same event with `retired-paths.json` present but malformed.

**Expected Result:**

- All three **allow** — exit **0**, **empty stdout**, and one line on stderr naming what failed
  (BR-13a).
- **No deny JSON is emitted in any of the three**, including step 2, where the path genuinely is
  retired. Failing closed there would block every `Write` and `Edit` in the session in every permission
  mode, including `bypassPermissions`, with no way to bypass it — which is why BR-13a chooses the
  opposite failure and BR-24's linter is what still catches the token.

---

_SPEC-10 specifies INT-006, the two cutover guards and the single list they share, per [BA-001 §11 row 10](../BUSINESS_ARCHITECTURE.md). It discharges [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) §6's owed glob row and [SPEC-09](SPEC-09-TEST-REPORT-TO-TESTRUN.md) §6's owed third-root row, amends [SPEC-08](SPEC-08-CONSUMER-REWIRING.md) BR-02 onto the shared list (D-117), and is enabled — not by itself — by **SPEC-12 (CNV-005)**, which runs the installer and adds the `lint:*` leg in one act (BR-28, D-07). **SPEC-10 resolves no OI**, **mints no error key** — structurally, not by disposition — and is **not provisional on R1**, the first spec in the module that is not ([D-119](../DECISIONS_LOG.md))._
