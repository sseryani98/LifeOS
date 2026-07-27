# Research Pack — Index and Gate

**Document ID:** RSH-000
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                    |
| ---------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. Five topics researched in one parallel wave; gate verdict recorded. |

---

## 2. Gate Verdict

> **GO WITH CAVEATS.** D-05's in-process MCP-over-CAP design is **Viable with caveats** and was
> proven by an executed spike rather than inferred — CAP handlers, `@mandatory`, managed fields and
> transaction rollback all fire with no HTTP server running — so wave 1 may proceed; the caveats are
> four implementation constraints on `INT-001`, an untested Postgres leg, and two open items
> (**OI-01**, **OI-02**) that are now grounded but still Sandro's to rule on.

The result that would have changed the build did **not** materialise. `INT-001` is the widest fan-out
object in BA-001, and every wave-1 and wave-3 object sits on it; had Topic 1 returned `Not viable` or
`Unproven`, D-05, D-06 and the whole rewiring stage would have needed rethinking. It returned
`Viable with caveats` at **Verified** tier.

---

## 3. The Pack

| Doc                                                          | Topic                                     | Mode     | Verdict                                    | Confidence                            | Feeds                                            |
| ------------------------------------------------------------ | ----------------------------------------- | -------- | ------------------------------------------ | ------------------------------------- | ------------------------------------------------ |
| [`mcp-over-cap-in-process.md`](mcp-over-cap-in-process.md)   | MCP server calling CAP in-process         | Validate | **Viable with caveats**                    | High on mechanism, Medium on Postgres | `INT-001`, `INT-004`; D-05, D-06, D-26; Tech Stack |
| [`cap-multi-module-backend.md`](cap-multi-module-backend.md) | Two CAP modules in one npm workspace      | Ground   | — _(no verdict; Ground mode)_              | High — on-disk source                 | **OI-02** (backend); `INT-001`, `CNV-002`; Data Model |
| [`ui5-multi-app-shell.md`](ui5-multi-app-shell.md)           | Multi-app UI5 shell without BTP           | Ground   | — _(no verdict; Ground mode)_              | High on stack, Medium on cross-module | **OI-02** (shell); `RPT-001`…`RPT-004`; IA, Design System |
| [`claude-code-pretooluse-hooks.md`](claude-code-pretooluse-hooks.md) | `PreToolUse` hook mechanics       | Ground   | — _(no verdict; Ground mode)_              | High — official docs + on-disk        | `INT-006`; D-07; Rewire stage                    |
| [`project-state-durability.md`](project-state-durability.md) | What replaces git's durability            | Compare  | **`pg_dump` runbook + built CSV exporter** | High on tooling, Medium on restore    | **OI-01**; `CNV-005`; D-27                       |

Two topics were **deliberately excluded** from this wave and remain open: **OI-04** (what calculated
health computes) belongs to the `ENH-003` workshop, and **OI-05** (methodology genericity) settles at
Data Model per D-22. Nothing found in this wave changes that judgement — neither is a fact to
discover, and researching them would have smuggled a design decision past the workshop.

---

## 4. What Changed — the Assumption Ledger

Refuted assumptions are the highest-value output of this stage. Fourteen prior assumptions were
graded.

| #   | Prior assumption                                                             | Grade                | What the evidence says                                                                                                                                             |
| --- | ---------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | D-05: in-process keeps CAP handlers and validation executing                 | **holds** (Verified) | `before`/`on`/`after`, `ASSERT_MANDATORY`, `ASSERT_RANGE`, managed fields and rollback all fired with `cds.app === undefined` and zero server handles.             |
| 2   | D-05: "the mechanism is `cds.connect.to()`"                                  | **refuted as written** | Bare `cds.connect.to('SpikeService')` **throws** — `Didn't find a configuration for 'cds.requires.SpikeService'`. Needs `cds.serve` first, the service class, or `{kind:'app-service'}`. |
| 3   | D-05: a generic Postgres MCP "bypasses … managed fields"                     | **partly refuted**   | `createdAt`/`createdBy` were still stamped on a direct `db` write. Only **raw SQL** loses them. The rationale overstates the contrast.                             |
| 4   | `INT-001` carve-out: OI-02 threatens the "one resolvable CDS model" premise  | **refuted — inverted** | A Node process runs exactly one CAP project by construction. Two models makes `INT-001` **simpler**, not harder; one composed model would drag in FP's 128 objects, its Postgres binding, its cron jobs and its `ENCRYPTION_KEY`. |
| 5   | OI-02 phrasing: "one CAP service or one per module"                          | **partly refuted**   | The real axis is one CDS **model** or two — one model can already expose four services, as FP does. The database question is separable from both.                  |
| 6   | D-03/D-16: differing namespaces are the cross-module collision hazard        | **partly refuted**   | **84 of FP's 128 Postgres objects carry no namespace** (64 service views, 19 draft shadow tables, `DRAFT_DraftAdministrativeData`). Namespaces protect far less than assumed. |
| 7   | `INT-006`: a `PreToolUse` hook can hard-deny with a message the agent sees   | **holds**            | `permissionDecision: "deny"` + `permissionDecisionReason`; the docs state Claude Code "blocks the tool call, and shows Claude the reason."                          |
| 8   | `INT-006` matcher `Write\|Edit\|MultiEdit`                                   | **partly refuted**   | **`MultiEdit` is not a tool.** Absent from the docs and from the installed `sdk-tools.d.ts`. Harmless dead text, but the spec should drop it.                       |
| 9   | _Implicit:_ the hook config is a committed repo artifact                     | **refuted** (Verified) | **`.claude/settings.json` is gitignored** (`.gitignore:8`). `INT-006`'s two halves have different durability — the linter is tracked, the hook registration is not. |
| 10  | D-07: not parsing `Bash` is a sound carve-out                                | **holds**            | Anthropic's own docs document Bash command matching as fragile and fail-open. But the **inventory is incomplete** — see risk R5.                                    |
| 11  | OI-01: "periodic CDS/CSV export" is an available mechanism                   | **refuted**          | **CAP has no data export at all.** 27 CLI commands, none export data. `cds add data` writes empty headers. `cds.utils.csv.serialize` is broken for tabular data.    |
| 12  | OI-01: "seed files as the checked-in form" is a distinct option              | **refuted**          | Not producible from the database, so it collapses into "build an exporter". **Hand-maintained** seed files are `Rejected` — they reinstate the unconstrained-artifact defect PSV §2 names. |
| 13  | OI-02 shell: "nobody has checked" whether a shell is achievable locally      | **refuted**          | Financial Planner **already runs a hand-built shell** — `app/shell`, a `sap.tnt.ToolPage` hosting four apps as components. Refuted for the single-module case; open cross-module. |
| 14  | _Implicit:_ a shared UI5 shell requires one CAP service                      | **refuted**          | It requires one **origin**, not one service. That keeps the shell options live under either backend outcome — but couples the two decisions.                        |

### A contradiction that had to be resolved

Two independent sources disagreed on the single most load-bearing hook question: **do `PreToolUse`
hooks fire inside subagents?** A guard that does not reach subagents guards nothing here, because the
entire build workflow runs through `implementer`, `test-author` and friends.

- `research-scout` said **yes**, citing the official hooks reference (`Documented`).
- `claude-code-guide` said **no**, citing open GitHub issue #34692 (`Reported`).

**Resolved: yes, hooks fire in subagents.** Issue #34692 was filed 2026-03-15 and its *proposed fix*
was "the hook's stdin JSON should include an `agent_id` … to distinguish which agent made the call".
The current documentation now documents exactly that field — `agent_id`, "Present only when the hook
fires inside a subagent call" — so the issue describes a since-closed gap. Documented beats Reported,
and recency confirms it. Independently verified on this machine: `agent_id` appears **21 times** in
the installed `cli.js` (v2.1.90), so the plumbing is present in the installed build, not only in the
newer docs.

---

## 5. Open Risks

Contradictions and unknowns that survived reconciliation. Each carries what would settle it.

| #      | Risk                                                                                                                                                                                            | Affects                        | What would settle it                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| **R1** | The Topic 1 spike ran on **in-memory SQLite**. Postgres is unproven. This is the one item that could move Topic 1's verdict.                                                                     | `INT-001`, D-05                | Repeat the spike's `run.js` against `@cap-js/postgres`. Cheap.                                    |
| **R2** | **How a TypeScript service implementation loads** outside `cds watch` is unresolved. `_sibling()` only sees `.ts` under `CDS_TYPESCRIPT`, and FP's own tests carry the comment "cds.test cannot load the TypeScript service impl". Project Tracker will be TypeScript. | `INT-001`, `INT-004`, Tech Stack | A Tech Stack decision (`tsx` / `cds-tsx` / `CDS_TYPESCRIPT`), then one loading test. **Highest-priority residual.** |
| **R3** | Two module **roots** each declaring their own `cds.requires.db`. `cds.env` binds once to one root and does not re-read.                                                                          | `INT-001`, OI-02               | Two-root spike, or simply never run both models in one process.                                   |
| **R4** | `cds deploy` keeps one `cds_model` CSN snapshot **per Postgres schema**, with `schema_evolution: "auto"` on by driver default. Two projects deploying into one schema would each read the other's model as "prior" and emit DROPs. Code path Documented; consequence **Inferred, not executed**. | OI-02, `CNV-002`               | Throwaway Postgres, two deploys, inspect. **Highest-value unrun test in the wave.**               |
| **R5** | `INT-006`'s coverage inventory is incomplete. Beyond the sound `Bash` carve-out, **MCP write verbs** (`mcp__*` needs its own matcher) and **`NotebookEdit`** (field is `notebook_path`) are unguarded. The MCP one is sharp — this repo runs its own MCP server after cutover. | `INT-006`, D-07                | A design ruling at the `INT-006` workshop; add matchers.                                          |
| **R6** | The hook registration lives in a **gitignored** file. On a fresh clone, half of `INT-006` is absent and cutover's guarantee silently lapses.                                                     | `INT-006`, OI-01               | Decide: un-ignore `.claude/settings.json`, or a tracked installer script, or accept.               |
| **R7** | The **CSV round-trip is untested** for OI-01's recommended exporter. A naive row-count check passes while `createdAt`/`createdBy` history is destroyed.                                          | OI-01, `CNV-005`               | Export → drop → `cds deploy` → compare row counts **and managed-field values**.                   |
| **R8** | **Privacy collision.** If Project Tracker shares Financial Planner's database, the OI-01 exporter runs over a model containing Sandro's card portfolio, which `db/seed/` currently protects by `.gitignore`. | OI-01, OI-02                   | Falls away entirely if the modules get separate databases. Reconcile OI-01 **after** OI-02.        |
| **R9** | **Two CAP processes in one shell page** is `Inferred` only, from relative resource roots plus `cors: !production`.                                                                               | OI-02 (shell), `RPT-001`…`004` | Second server on another port, one resource root, both components in one host page.                |
| **R10** | Installed Claude Code is **v2.1.90**; the documentation read covers to v2.1.218. Mitigated (all key literals and `agent_id` present in the installed bundle) but not proven by execution.        | `INT-006`                      | One hook run under `claude --debug-file`, or upgrade.                                             |

### Two questions that turn on Sandro's taste, not on evidence

These are named rather than answered, per the rule that research supplies evidence and Design makes
the call.

1. **Does "no cloud" (PSV §7.2, written about _deployment_) reach a backup _destination_?** This is
   the highest-leverage open question in Topic 4. Without an answer, **no durability option survives
   the laptop dying** — and note the repo has **no git remote at all** (`Verified`), so "survives
   laptop loss" is a property the current markdown state does not have either.
2. **Export cadence** — every `complete_stage` (noisy), every sprint checkpoint (matches the existing
   `--no-ff` + tag ritual), or on demand. Evidence mildly favours checkpoint; the choice is
   preference.

---

## 6. Decays — findings with a shelf life

| Finding                                                                                                            | Dated      | What dates it                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------- |
| **SAP ships `@cap-js/mcp` v1.2.0, Beta** — read-only, generic `describe`/`query`/`call_action`, **HTTP transport only** | 2026-07-21 | Published 5 days before this research. Beta. Likely to gain transports and writes — recheck before `INT-001` is built. |
| No documented precedent for **MCP-stdio-over-CAP**                                                                 | 2026-07-26 | Absence of evidence, not evidence of absence. Search paths listed in RSH-001 §12.      |
| Claude Code hook contract — `permissionDecision`, `agent_id`, exit-code semantics                                  | 2026-07-26 | Moving surface. Docs at v2.1.218; installed CLI v2.1.90.                               |
| `MultiEdit` does not exist as a tool                                                                               | 2026-07-26 | Tool inventory changes between releases.                                               |
| `sap.ushell` sandbox available locally at SAPUI5 **1.136.16**                                                      | 2026-07-26 | Version-pinned; SAP's support posture on productive sandbox use is unestablished.       |
| `pgBackRest` has no Windows support; `pg_dump` 17.6 present but not on `PATH`                                      | 2026-07-26 | Local machine state.                                                                   |

---

## 7. Consumers — which stage reads what

| Stage                             | Reads                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- |
| **Scaffold**                      | RSH-002 (workspace/dependency shape), RSH-001 §`cds.root` constraint     |
| **Workshops** — `INT-001`         | RSH-001 in full. The four implementation caveats are spec input.        |
| **Workshops** — `INT-006`         | RSH-004 in full, plus risks R5, R6, R10.                                |
| **Information Architecture / Design System / Theme** | RSH-003                                              |
| **Data Model**                    | RSH-002 (one model or two; OI-05 also settles here per D-22)            |
| **Tech Stack**                    | RSH-001 (R2, the TypeScript-impl question), RSH-002, RSH-003            |
| **Rewire tooling (stage 14)**     | RSH-004                                                                 |
| **Cutover / `CNV-005`**           | RSH-005 — `CNV-005` stays blocked until OI-01 is ruled on               |

---

## 8. Proposed Decisions — for Sandro to rule on, not logged

This research stage **did not write to `DECISIONS_LOG.md`**. The stage was run unattended, and every
item below asserts a ruling Sandro has not made; logging them would have manufactured consent. They
are staged here for a decision in the main thread.

| Proposed | Subject                                                                                                                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-28     | **Amend D-05's wording** (not its decision). Three corrections: the mechanism needs a construction step, not a bare `cds.connect.to()`; the "bypasses managed fields" contrast overstates the case; and `@cap-js/mcp` now exists and was considered and set aside. |
| D-29     | **OI-02 backend** — one CDS model or two, and shared / schema-per-module / database-per-module. Evidence favours **two models, separate databases**, which makes `INT-001` simpler and dissolves risk R8 — but the ruling is Sandro's. |
| D-30     | **OI-02 shell** — one shell or many, decided **together with** D-29 because a shared shell forces one origin.                                                                                                 |
| D-31     | **OI-01 durability** — `pg_dump -Fc` runbook as the floor, plus a built CSV exporter as the diffable, git-committed form. If accepted, **BA-001 gains one object** per D-27's own trigger. See the caveat below. |
| D-32     | **`INT-006` scope correction** — drop `MultiEdit` from the matcher, add `mcp__*` and `NotebookEdit`, and settle where the hook registration lives given `.claude/settings.json` is gitignored.                 |

**Caveat on D-31's object type.** D-27 pre-labels the export mechanism a **Conversion**. A _recurring_
exporter is structurally an **Interface** — catalogued as `CNV` it would land inside BA-001 §5's
strict `CNV-001 → … → CNV-005` execution chain, where it does not belong.

---

_This pack is the Research-stage output for slice 1 of Project Tracker. Every document is **Draft**;
approval is Sandro's to give. The gate is **GO WITH CAVEATS** — wave 1 may proceed on `INT-001`,
while `CNV-005` remains blocked on **OI-01** and the Data Model / Tech Stack stages remain blocked on
**OI-02**._
