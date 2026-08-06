# SPEC-04 — Next Action

**Spec ID:** SPEC-04
**FRICEW Objects:** ENH-002 (Enhancement), RPT-002 (Report)
**Wave:** 2
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01, SPEC-02 and SPEC-03. ~~and **R9** (D-69),
which goes live here because this is the first spec carrying a Report.~~ **R9 was executed and
discharged at the Information Architecture stage, 2026-08-06 (D-140, D-141)** — it changed no business
rule and no FUT here, exactly as D-69 predicted. **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-28 | Sandro & Claude | Initial creation from the SPEC-04 workshop. Records D-66 through D-69. Provisional on R1 (D-39) and R9 (D-69). SPEC-03 amended in-session with `Initiative.position` / `Milestone.position` (BR-14a, BR-33a); a sixth SPEC-01 amendment is owed, §6.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-07-28 | Sandro & Claude | Four defects fixed on review, before approval. **FUT-010's precondition was unreachable through its own guards** — it named `commit` Not Started and then called `complete_stage` on it, which SPEC-02 §5 rejects with `verb.stage.notStarted`; `commit` is now In Progress. **BR-12 was overclaimed and contradicted by FUT-002**, which shows SPEC-02 BR-20 refusing `start_stage` on an In Progress Task; scoped to the verb the payload's `status` names. FUT-010 and FUT-012 cited bare `BR-16` / `BR-19` where this spec has rules of those numbers, so both now name SPEC-01 and SPEC-02. BR-06 narrowed to candidates — a Milestone with no Tasks has no tier.                                                          |
| 2026-07-28 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on **R1 and R9** for build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-07-30 | Sandro & Claude | §6's cross-spec row addressed to SPEC-06 is **struck through as applied** — BR-34's Milestone-position rule is carried by SPEC-06 BR-16, which resolves the row order at save (SPEC-06 BR-29) and adds the Add Story case. No rule changed; status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-08-06 | Sandro & Claude | **R9 executed and discharged** at the Information Architecture stage (D-140, D-141) — the spec is now provisional on **R1 alone**. R9's stated premise was wrong: cross-origin composition fails under `cds watch` too, not only under `NODE_ENV=production`. Layout, routing and navigation deferred by BR-33 are settled in `INFORMATION_ARCHITECTURE.md` (D-137); RPT-002's story rows gain click navigation selecting RPT-003's chain.                                                                                                                                                                                                                                                                                      |
| 2026-08-06 | Sandro & Claude | **BR-33 is discharged in full at the Design System stage (D-144, D-148, D-150).** It deferred four things; navigation and section arrangement were answered at Information Architecture the same day, and **layout and chart types are answered here** — RPT-002 is section 1 of one `sap.uxap.ObjectPageLayout`, and **there is no chart**, because no spec specifies one and none is adopted. Build technology is **Fiori Elements FPM with drafts OFF**, so RPT-002's two collections render as `sap.fe.macros.Table` with the default sort and personalization toolbar **explicitly disabled** — BR-31 rules those out and FPM's defaults disagree with it. No business rule and no FUT changes. Status stays **Approved**. |

---

## 1. Overview

The engine that answers "what next" and the component that renders it. ENH-002 resolves a **Task** —
never a story, never a Subtask (D-08, D-68) — as the first incomplete Task in library position order,
**regardless of kind**, carrying the kind so the display can rank without the resolver lying about the
order (D-66). RPT-002 renders that answer, the open task queue behind it, and the five most recently
completed stages, from a single `project_view` call.

The resolver reads Tasks and the seeded library and nothing else: not `Milestone.status`, which is
derived (D-53) and vacuous over an empty Task set (D-64). Its candidate ordering is explicit —
`Initiative.position` then `Milestone.position` — because the twelve migrated rows share one
`createdAt` and supply no other total order (D-67).

**This spec is provisional on R1.** Nothing here has been executed against Postgres. ~~and two
CAP processes serving into one shell page has never been executed at all. Both are owned, not merely
noted; see §6.~~ **R9 was executed at the Information Architecture stage and is discharged** — see §6.

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity              | Role in this spec                                        | Attributes this spec requires                                                                 |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Milestone**       | The candidate the selector ranks                         | `storyId`, **`position`** (new), and its Tasks. **`status` is deliberately not read** (BR-03) |
| **Initiative**      | Ranks above Milestone in the candidate order             | **`position`** (new)                                                                          |
| **Task**            | The unit ENH-002 resolves to                             | `stepCode`, `status`, `completedAt`                                                           |
| **MethodologyStep** | Supplies the resolved step's label, order, kind, driver  | `code`, `name`, `description`, `kind`, `position`, `requiresHuman`, `driver`                  |
| **Workspace**       | The scope of workspace mode                              | `slug`                                                                                        |
| **Activity**        | Read for the actor that completed a recently-done stage  | `kind`, `actor`, `target`, `occurredAt`                                                       |
| **Subtask**         | **Not read.** Resolution and the queue are stage-grained | — (D-68)                                                                                      |

**Everything else ENH-002 and RPT-002 read is already required by SPEC-01 and SPEC-02** — the Data
Model stage should not double-count. This spec adds exactly two attributes.

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | New on `Initiative`: **`position`** — Integer, **not null**, gapped by 10, **unique within its Workspace** (`@assert.unique`). BR-07's second sort key (D-67).                                                                                                               |
| 2   | New on `Milestone`: **`position`** — Integer, **not null**, gapped by 10, **unique within its Initiative** (`@assert.unique`). BR-07's third sort key (D-67).                                                                                                                |
| 3   | **Not a new attribute — a note.** `Task.completedAt` is already required to be clearable (SPEC-02 §2 amendment 7). A reopen clearing it is what removes a stage from RPT-002's recently-completed section (BR-28); no additional attribute records "was recently completed". |

---

## 3. Functional Description

### 3.1 ENH-002 — Next-Action Resolver [Enhancement]

#### Inputs

| Input                                                                                 | Source                                                       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `story`, optional, as `{workspace-slug}/{story-id}`                                   | The caller. Absent → workspace mode (D-45)                   |
| Every Milestone in the Workspace, with its Tasks and their `status`                   | ENH-001's instantiated chains (SPEC-02)                      |
| `Initiative.position`, `Milestone.position`                                           | Set by the creating caller — `plan_sprint`, FRM-002, CNV-002 |
| Per Task's step: `name`, `description`, `kind`, `position`, `requiresHuman`, `driver` | CNV-001's seeded library (SPEC-02 §3.1)                      |

`Milestone.status` is **not** an input (BR-03).

#### Outputs

One next-action payload as BR-11 defines it, or **null** (BR-15). ENH-002 writes nothing and emits no
Activity event (BR-20).

#### Algorithm

1. **Build the candidate set** — every Milestone in the Workspace holding at least one incomplete Task
   (BR-04).
2. **Tier each candidate** from its Tasks alone — 1, 2 or 3 per BR-05.
3. **Order the candidates** by tier ascending, then `Initiative.position`, then `Milestone.position`
   (BR-07). The order is total; ties are impossible.
4. **Select the first candidate.** No candidate → return the empty result (BR-15).
5. **Resolve within it** — the first incomplete Task in `MethodologyStep.position` order, regardless of
   kind (BR-02).
6. **Assemble the payload** (BR-11), including the candidate's tier and the step's `requiresHuman`.

**Story mode skips steps 1–4** and applies steps 5–6 to the named story alone (BR-08). The two modes
are one resolver plus a story selector, not two behaviours (BR-09, D-68).

#### Worked example — `financial-planner/CNV-001`, real slice-1 numbers

8 Tasks and 6 Subtasks; `ux-test` and `smoke` were never materialised because `shipsUi` is false
(SPEC-02 FUT-005). Positions are the seeded ones: `sprint-build` 10, `code-quality` 20,
`test-quality` 30, `functional-test` 40, `human-review` 60, `documentation` 70, `pm-update` 80,
`commit` 90.

| State of the chain                                                                                                                 | Tier  | Next action         | kind            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------- | --------------- |
| Freshly migrated — all 8 Tasks Not Started                                                                                         | **2** | `sprint-build`      | Required        |
| `sprint-build` Complete, the other 7 Not Started                                                                                   | **1** | `code-quality`      | Required        |
| Through `human-review` Complete; `documentation`, `pm-update`, `commit` open                                                       | **1** | **`documentation`** | **Recommended** |
| `pm-update` and `commit` Complete, `documentation` still Not Started — SPEC-02 FUT-009's end state; the Milestone derives **Done** | **3** | **`documentation`** | **Recommended** |
| `documentation` Complete too — no incomplete Task remains                                                                          | —     | **null** (BR-15)    | —               |

Rows three and four are the explicit answer to the question SPEC-02 §6 handed to this spec. Row three
says a Recommended step **is** the headline next action the moment position order reaches it, ahead of
blocking work that sits later (BR-02, BR-10). Row four says a Done Milestone's residual Recommended
step still resolves — at tier 3, so it can never outrank real work elsewhere (BR-05, BR-07) — and it
resolves without the resolver ever reading the Done (BR-03).

### 3.2 RPT-002 — Next Action & Task Queue [Report]

#### Sections — three, and what each holds

| #   | Section             | Holds                                                                                                                                                       |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The next action     | ENH-002's payload (BR-11) — story, `stepCode`, name, description, kind, driver, `requiresHuman`, the Task's status, and the Milestone's tier                |
| 2   | The open task queue | Every incomplete Task across the candidate set, each row carrying its story, `stepCode`, kind, status, and its blocker or null (BR-23, BR-25)               |
| 3   | Recently completed  | The 5 most recent Tasks by `completedAt` descending, workspace-wide, each carrying story, `stepCode`, `completedAt` and the completing actor (BR-26, BR-27) |

#### Aggregation logic

| Section | Rule                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | **The queue's first row.** One ordering, two renderings — section 1 is not a second computation (BR-24)                                                                                                                                     |
| 2       | Ordered by BR-07 across Milestones and by BR-02's position order within each. **Tasks only** — no Subtask row appears, which is what keeps RPT-002 and RPT-003 distinct consumers (BR-23)                                                   |
| 2       | Each row's blocker is the **earliest** incomplete blocking Task earlier in its own Milestone's position order, or **null**. It is the same computation SPEC-02 BR-19 performs, read ahead of the call rather than after a rejection (BR-25) |
| 3       | Workspace-wide, Tasks only, capped at 5; fewer rows when fewer exist. The actor is read from the Task's completion **Activity** event, not from a field on the Task — a join, not a field read (BR-26, BR-27, D-57)                         |
| 3       | A reopened stage leaves the list because SPEC-02 BR-28 clears `completedAt`. Its completion Activity event survives, so the fact is not lost (BR-28, D-42)                                                                                  |

#### Filters and sorting

**None in slice 1** (BR-31). At cutover the workspace holds one open story and eight open Tasks; a
filter control over eight rows is a control over nothing.

#### Drill-down

Every row in every section identifies its story as `{workspace-slug}/{story-id}` and its stage as
`stepCode` (BR-30). Those two values are what a navigation target needs to address RPT-003's chain
view. **The interaction itself — what is clickable, where it goes, how the page is arranged — is the
Information Architecture stage's** (BR-33, D-21).

#### Day one

**Section 3 renders zero rows.** The migration leaves 8 Not Started Tasks on
`financial-planner/CNV-001` and the eleven Done Milestones have no Tasks at all, so nothing has a
`completedAt` (SPEC-03 BR-18, BR-19; D-15, D-24). It fills from the first `complete_stage` after
cutover (BR-29).

---

## 4. Business Rules

**Resolution — ENH-002**

- **BR-01** ENH-002 resolves to a **Task**. It never resolves to a Subtask, a Milestone, or a step that was not materialised.
- **BR-02** Within one Milestone the next action is the **first incomplete Task in `MethodologyStep.position` order, regardless of `kind`**. A Task is incomplete when its status is Not Started or In Progress.
- **BR-03** The resolver never reads `Milestone.status`. Every input is a Task and its step.
- **BR-04** The candidate set is every Milestone in the Workspace holding **at least one incomplete Task**.
- **BR-05** A candidate's tier is computed from Tasks alone. **Tier 1** — it has an incomplete blocking Task and at least one Task that is not Not Started. **Tier 2** — it has an incomplete blocking Task and every Task is Not Started. **Tier 3** — it has no incomplete blocking Task and at least one incomplete Task. "Blocking" is SPEC-02 BR-15: Required, or Conditional-and-materialised; Recommended never blocks.
- **BR-06** For every **candidate**, the three tiers coincide exactly with SPEC-02 BR-17's derived In Progress / Backlog / Done over the same Tasks — which is why BR-03 costs nothing and why it dodges D-64's vacuous derivation. A Milestone with no Tasks at all has no tier, because BR-04 never admits it; that is the case where BR-17 derives Done vacuously and where the two would otherwise be compared.
- **BR-07** Candidates are ordered by **tier ascending, then `Initiative.position` ascending, then `Milestone.position` ascending**. The order is total; ties are impossible because both positions are unique within their parent.
- **BR-08** `next_action(story)` applies BR-02 to that story alone. Tier and BR-07 are not consulted.
- **BR-09** `next_action()` selects the first candidate under BR-07, then applies BR-02 to it. The two modes are **one resolver plus a story selector**, not two behaviours.
- **BR-10** A Recommended step is resolved to like any other and is never skipped. Tier 3 guarantees that a Milestone whose only remaining work is Recommended can never outrank one with blocking work.

**Payload**

- **BR-11** A resolved next action carries `story` as `{workspace-slug}/{story-id}` (D-45), `stepCode`, `name`, `description`, `kind`, `driver`, `requiresHuman`, the Task's current `status`, and the Milestone's `tier`.
- **BR-12** **The resolved Task is always addressable by the verb its `status` names**: `start_stage` when Not Started, `complete_stage` when In Progress. No guard in SPEC-02 BR-19 … BR-22 can refuse **that** verb, because by BR-02's construction every Task earlier in position order is already Complete. The claim is scoped to the named verb and not wider: calling the _other_ one is still refused — SPEC-02 BR-20 rejects `start_stage` on an In Progress Task, which FUT-002 exercises.
- **BR-13** `requiresHuman` is BR-12's one exception: SPEC-02 BR-23 refuses an agent's `complete_stage` on such a step, so the payload names it in advance rather than letting the caller discover it by rejection. This is the D-35 defect — a next action naming a stage the caller cannot run — closed by a field.
- **BR-14** `driver` is carried verbatim from the seeded `MethodologyStep.driver` (D-56 (1)), never hardcoded — the same generation SPEC-02 BR-31 uses for remediation.

**Empty and unknown**

- **BR-15** No candidate Milestone → the result is **empty, not an error**: `ok: true`, next action null.
- **BR-16** The payload's `tier` is what distinguishes resuming started work (1) from starting fresh (2) from mopping up an optional step (3); BR-15's empty result is a fourth, distinct state.
- **BR-17** `next_action(story)` on a **known** story with no incomplete Task returns BR-15's empty result. An **unknown** story is rejected 404 `verb.target.notFound` (SPEC-01 §5). A story with nothing left and a story that does not exist are different answers.

**Consumers**

- **BR-18** Three consumers, one engine: the `next_action` verb (SPEC-01 §3.1), `project_view`'s next-action section (SPEC-01 BR-22), and the `nextAction` on every write-verb success response (SPEC-01 BR-16).
- **BR-19** SPEC-01 BR-16's `nextAction` is **story-scoped** to the verb's target story and is null when that story has no incomplete Task. It does **not** fall back to workspace scope — the workspace answer is RPT-002's, reached through `project_view`.
- **BR-20** ENH-002 writes nothing and emits no Activity event (SPEC-01 BR-04).

**Carve-outs**

- **BR-21** No manual override of the resolved next action and no staleness decay in slice 1 (BA-001 §6).

**Report — RPT-002**

- **BR-22** RPT-002 has three sections: the next action, the open task queue, the recently completed.
- **BR-23** The queue is **every incomplete Task across the candidate set**, ordered by BR-07 across Milestones and by BR-02's position order within each. Tasks only — no Subtask appears, which is what keeps RPT-002 and RPT-003 from rendering the same rows.
- **BR-24** **The next action is the queue's first row.** One ordering, two renderings.
- **BR-25** Each queue row carries the blocker SPEC-02 BR-19 would name if `start_stage` were called on it — the **earliest** incomplete blocking Task earlier in its own Milestone's position order — **or null when there is none**. It is the same computation, not a second one.
- **BR-26** Recently completed is the **5** most recent Tasks by `completedAt` descending, workspace-wide, Tasks only. Fewer than five rows when fewer exist.
- **BR-27** Each recently-completed row carries the actor that completed it, read from the Task's completion **Activity event** (D-41, D-42) rather than from a field on the Task — the same reading D-57 established when it made "when was this last completed" an Activity query. Cost, stated: it is a join, not a field read.
- **BR-28** A reopened stage leaves the recently-completed list, because SPEC-02 BR-28 clears `completedAt` and it is no longer completed. Its completion Activity event survives, so the fact is not lost (D-42, D-57).
- **BR-29** On cutover the recently-completed section is **empty**: the migration leaves 8 Not Started Tasks on `financial-planner/CNV-001` and the eleven Done Milestones have no Tasks at all (SPEC-03 BR-18, BR-19; D-15, D-24). It fills from the first `complete_stage` after cutover.
- **BR-30** Every row in every section identifies its story as `{workspace-slug}/{story-id}` (D-45, BA-001 §3.3).
- **BR-31** No filters and no sorting controls in slice 1 — one open story and eight open Tasks.
- **BR-32** RPT-002 renders from a single `project_view` call (SPEC-01 BR-22, FUT-015). It issues no `next_action` call of its own.
- **BR-33** ~~Layout, chart types, section arrangement and navigation are the Information Architecture stage's (D-21).~~ **All four are answered.** Navigation and section arrangement at Information Architecture, 2026-08-06 — RPT-002's story rows in all three sections gain click navigation to RPT-003 via the `story` parameter (D-137, [IA-001](../INFORMATION_ARCHITECTURE.md) §6.2). Layout and **chart types** at Design System, 2026-08-06 — RPT-002 is section 1 of one `sap.uxap.ObjectPageLayout` (D-148), and **there are no charts: none is specified in any spec and none is adopted** (D-150, [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) §11).
- **BR-34** `Initiative.position` and `Milestone.position` are set by the creating caller: `plan_sprint` derives Milestone positions from its `stories[]` array index (× 10) and the Initiative's from the Workspace's current maximum + 10; FRM-002 does the same from the order Sandro enters; CNV-002 supplies board order (SPEC-03 BR-14a). **No verb signature changes** — `stories[]` is already an ordered array in SPEC-01 §3.1.

---

## 5. Error Handling

| Condition                                                     | Response                                                                                   | i18n key                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| `next_action` with a bare story ID                            | Reject 400                                                                                 | `verb.story.unqualified` ¹ |
| `next_action` naming a story that does not exist              | Reject 404, listing the workspace's stories                                                | `verb.target.notFound` ¹   |
| `next_action(story)` on a known story with no incomplete Task | **Succeed**, next action null                                                              | —                          |
| `next_action()` with no candidate Milestone                   | **Succeed**, next action null                                                              | —                          |
| A duplicate or null `position` within a parent                | Refused **at write time** by `@assert.unique` / not-null, surfaced verbatim per SPEC-01 §5 | — (CAP `ASSERT_*`)         |
| RPT-002's underlying `project_view` fails                     | SPEC-01's handling; RPT-002 adds no error path of its own                                  | —                          |

¹ Existing SPEC-01 key, reused rather than duplicated.

**ENH-002 has no rejection of its own.** It is a read verb, so BR-20 means there is nothing to roll
back and nothing to log; the two rejections above are SPEC-01's addressing rules firing before the
resolver runs. And the ordering **cannot** be ambiguous at read time, because the Data Model forbids
it — a duplicate or absent `position` is refused when it is written, not tolerated and tie-broken
later. That is this module's thesis (D-01: constraints make consistency structural) applied to its own
resolver.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-04 | **Not resolved here.** Calculated health is SPEC-05's.                      |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity and ENH-002 writes
nothing, so there is no emission path to attach one to. The one alert-shaped case — a next action
naming a stage nobody can run — is closed structurally rather than by notification: D-35 gives all
nine stages an invocation point, and BR-13 names `requiresHuman` on the payload so the caller knows
before it calls.

**Provisional dependencies — R1. R9 is discharged.**

- **R1** inherited from SPEC-01, SPEC-02 and SPEC-03 (D-39). The Postgres repeat is owned by the Data
  Model stage.
- ~~**R9** is **new here** — SPEC-04 is the first spec carrying a Report, and R9 is two CAP processes
  serving into one shell page, graded `Inferred` and never executed.~~ **R9 was executed at the
  Information Architecture stage on 2026-08-06 and is `Verified` (D-140).** D-69's prediction held —
  it changed no BR and no FUT here, because it decided which **origin** serves the page rather than
  what the page **says**. Two findings inverted its premise: cross-origin composition fails under
  `cds watch` as well as in production, because CAP's CORS middleware never sends
  `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`, the `cors` getter) and UI5's V4 model
  always sends `X-CSRF-Token`, so the `$batch` preflight is rejected; and an absolute `http://`
  dataSource URI crashes CAP at boot (`@sap/cds-fiori/app/routes.js:68`). **The serving position is
  one origin behind a reverse proxy (D-141)**, which leaves every manifest's relative `/service/…` URI
  unchanged. Execution of the proxy belongs to the **Tech Stack** stage.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                     | Goes to                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| ~~**A sixth SPEC-01 amendment is owed.** §3.1's `next_action` row describes one mode ("The single next incomplete stage"); it must name **both** modes and the empty result (BR-08, BR-09, BR-15). And **BR-16 must state that `nextAction` is story-scoped and null when the target story is exhausted** (BR-19) — as written it says only "carries the resulting next action"~~ — **applied 2026-07-30**, SPEC-01 change history row 4 | SPEC-01 — applied       |
| ~~**CNV-002 must set `Initiative.position` and `Milestone.position`**, since ENH-002 has no other total order over twelve rows sharing one `createdAt`~~ — **applied in-session** as SPEC-03 BR-14a / BR-33a                                                                                                                                                                                                                             | SPEC-03 — applied       |
| **Initiative-status gating** (already raised by SPEC-02 §6) now also bears on **BR-04's candidate set** — if a Complete Initiative's Milestones are excluded, BR-04 narrows                                                                                                                                                                                                                                                              | SPEC-05 (FRM-001)       |
| ~~**FRM-002 must supply `Milestone.position`** from the order Sandro enters the stories, exactly as `plan_sprint` does (BR-34)~~ — **applied in-session** as SPEC-06 BR-16, which resolves the row order at **save** rather than at entry (SPEC-06 BR-29) and adds the Add Story rule, the target Initiative's maximum + 10                                                                                                              | SPEC-06 — applied       |
| **RPT-003 renders Subtasks; RPT-002 deliberately does not** (BR-23), which is what keeps BA-001 §8's "distinct consumer" claim true rather than aspirational                                                                                                                                                                                                                                                                             | SPEC-07 (RPT-003)       |
| **D-37 §11.1's amendment trigger was tested again and did not fire** — BR-34's positions are derived from `plan_sprint`'s existing ordered `stories[]` array, so no verb signature changes, on D-55's precedent                                                                                                                                                                                                                          | BA-001 §11.1 — recorded |

**BA-001 corrections** — all four **applied at BA-001 v1.5**, in this session.

| Correction                                                                                                                                                                     | Where                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| ~~INT-003's and CNV-002's `Interfaces` → **`Interface`** (D-60 rules code-list values singular; §2's plural headings are count-row labels and stay)~~                          | BA-001 §2, §5 — done |
| ~~RPT-004's "~6 seeded decisions" → **5** (D-65)~~                                                                                                                             | BA-001 §6 — done     |
| ~~ENH-002's row still said "reads the open Milestones"; the candidate set is every Milestone holding an incomplete Task, and resolution is position order regardless of kind~~ | BA-001 §6 — done     |
| ~~§8's R9 paragraph had no owner~~                                                                                                                                             | BA-001 §8 — done     |

---

## 7. Functional Unit Tests

### FUT-001: Resolution is position order

**Covers:** ENH-002
**Preconditions:** `financial-planner/CNV-001` freshly migrated — 8 Tasks, all Not Started (SPEC-02 FUT-005, SPEC-03 FUT-002).
**Steps:**

1. Call `next_action("financial-planner/CNV-001")`.

**Expected Result:**

- Resolves to **`sprint-build`** at position 10 — the first incomplete Task in position order (BR-02).
- Payload carries kind **Required**, driver **`/build`**, `requiresHuman` **false**, status **Not Started**, and a non-empty `description` (BR-11, BR-14).
- `tier` is **2** — an incomplete blocking Task exists and every Task is Not Started (BR-05).

### FUT-002: The payload is addressable by the verb its status names

**Covers:** ENH-002, WFL-001
**Preconditions:** `financial-planner/CNV-001` with `sprint-build` **In Progress**.
**Steps:**

1. Call `next_action("financial-planner/CNV-001")`.
2. Call `start_stage` on the stage it returned.
3. Call `complete_stage` on the stage it returned.

**Expected Result:**

- Step 1 returns `sprint-build` with status **In Progress** (BR-11).
- Step 2 is rejected, key `wfl.stage.alreadyStarted` (SPEC-02 BR-20).
- Step 3 **succeeds** — no predecessor guard can refuse it, because every earlier Task is Complete (BR-12).
- BR-12's invariant is read off the payload's `status`: In Progress names `complete_stage`, Not Started names `start_stage`.

### FUT-003: A Recommended step is resolved to, not skipped

**Covers:** ENH-002
**Preconditions:** `financial-planner/CNV-001` with every blocking Task through `human-review` Complete; `documentation`, `pm-update` and `commit` Not Started — SPEC-02 FUT-009's own precondition.
**Steps:**

1. Call `next_action("financial-planner/CNV-001")`.

**Expected Result:**

- Resolves to **`documentation`** at position 70, kind **Recommended** — **not** `pm-update` (BR-02, BR-10).
- `tier` is **1** — a blocking Task is still incomplete and at least one Task is not Not Started (BR-05).

### FUT-004: A Done story's residual Recommended step still resolves, at tier 3

**Covers:** ENH-002
**Preconditions:** SPEC-02 FUT-009's end state on `financial-planner/CNV-001` — every blocking Task Complete, `documentation` Not Started.
**Steps:**

1. Read `Milestone.status`.
2. Call `next_action("financial-planner/CNV-001")`.
3. Call `next_action()` with no story.

**Expected Result:**

- Step 1 reads **Done** (SPEC-02 BR-17).
- Steps 2 and 3 **both** return `documentation`, kind Recommended, at **tier 3** (BR-05, BR-10).
- The resolver read no `Milestone.status` at any point — the answer is identical whether the Milestone derives Done or not (BR-03).

### FUT-005: Tier ranks residual optional work below real work

**Covers:** ENH-002
**Preconditions:** Two candidates — (a) `financial-planner/CNV-001` at FUT-004's end state, tier 3; (b) a UI story created by `plan_sprint` with `shipsUi` true, 9 Tasks all Not Started, tier 2 (SPEC-02 FUT-006).
**Steps:**

1. Call `next_action()` with no story.

**Expected Result:**

- Returns the **new story's `sprint-build`**, not `documentation` (BR-05, BR-07).
- Tier 2 outranks tier 3 regardless of either story's `Initiative.position` or `Milestone.position` — tier is the first sort key.

### FUT-006: Within a tier, Initiative then Milestone position decides

**Covers:** ENH-002
**Preconditions:** CNV-002 has run; `plan_sprint` has created W1-S4 with three stories in array order; W1-S3 still holds `financial-planner/CNV-001` with all 8 Tasks Not Started.
**Steps:**

1. Read the two Initiatives' and four Milestones' `position` values.
2. Call `next_action()` with no story.

**Expected Result:**

- W1-S3's `Initiative.position` is **30** and W1-S4's is **40** — the Workspace maximum plus 10 (BR-34, SPEC-03 BR-14a).
- W1-S4's three Milestones carry **10 / 20 / 30** in the order supplied in `stories[]` (BR-34).
- All four candidates are tier 2, so the Initiative position decides: the call returns **`financial-planner/CNV-001`'s `sprint-build`** (BR-07).

### FUT-007: A chainless story returns empty; an unknown story does not

**Covers:** ENH-002
**Preconditions:** CNV-002 has run — `financial-planner/ENH-001` is Done with zero Tasks (SPEC-03 BR-19).
**Steps:**

1. Call `next_action("financial-planner/ENH-001")`.
2. Call `next_action("financial-planner/NOPE-999")`.

**Expected Result:**

- Step 1 returns `ok: true` with next action **null** and **no error** (BR-15, BR-17).
- Step 2 is rejected **404**, key `verb.target.notFound` (BR-17, SPEC-01 §5).
- A story with nothing left and a story that does not exist are distinguishable from the response alone.

### FUT-008: An empty workspace result is not an error

**Covers:** ENH-002
**Preconditions:** Every Milestone in the workspace has zero incomplete Tasks.
**Steps:**

1. Call `next_action()` with no story.

**Expected Result:**

- `ok: true`, next action **null** (BR-15).
- The response is distinguishable from a tier-3 result, which carries a payload with `tier` 3 (BR-16).

### FUT-009: A reopen moves the next action back

**Covers:** ENH-002, WFL-001
**Preconditions:** `financial-planner/CNV-001` with `sprint-build`, `code-quality` and `test-quality` Complete and `functional-test` Not Started — SPEC-02 FUT-016 certifies this state reachable through the verbs.
**Steps:**

1. Call `next_action("financial-planner/CNV-001")`.
2. Call `reopen_stage("financial-planner/CNV-001", "code-quality", "defect found at commit")`.
3. Call `next_action("financial-planner/CNV-001")` again.

**Expected Result:**

- Step 1 returns `functional-test` (BR-02).
- Step 3 returns **`code-quality`** with status **In Progress** (BR-02, BR-11; SPEC-02 BR-28).
- `test-quality` stays Complete and is not re-resolved — resolution walks position order, not recency (BR-02).

### FUT-010: SPEC-01 BR-16's `nextAction` is story-scoped and goes null

**Covers:** ENH-002, INT-001
**Preconditions:** Two open stories — (a) `financial-planner/CNV-001` with every Task Complete except `commit`, which is **In Progress**; `documentation` is among the Complete ones, reachable since position 70 precedes 90. `commit` must be In Progress, not Not Started — SPEC-02 §5 rejects `complete_stage` on a Not Started Task with `verb.stage.notStarted`, so step 1 would never reach the assertion. (b) a `plan_sprint` story with a full untouched chain.
**Steps:**

1. Call `complete_stage("financial-planner/CNV-001", "commit")`.
2. Read the success response's `nextAction`.

**Expected Result:**

- The write succeeds.
- `nextAction` is **null** (BR-19).
- It does **not** name story (b)'s `sprint-build` — there is no fallback to workspace scope; that answer belongs to RPT-002 through `project_view`.

### FUT-011: The queue's first row is the next action

**Covers:** RPT-002, ENH-002
**Preconditions:** FUT-006's fixture — W1-S3 and W1-S4, four candidate Milestones.
**Steps:**

1. Call `project_view()` **once**.
2. Compare the next-action section to the queue's first row.

**Expected Result:**

- The two carry identical `story` and `stepCode` (BR-24).
- The queue holds every incomplete Task across the candidate set, ordered by BR-07 across Milestones and by position order within each (BR-23).
- **No Subtask appears in the queue** (BR-23).
- No second call was made — RPT-002 issues no `next_action` of its own (BR-32).

### FUT-012: Queue rows carry the blocker SPEC-02 BR-19 would name

**Covers:** RPT-002
**Preconditions:** `financial-planner/CNV-001` with `sprint-build` Complete and every Task after it Not Started.
**Steps:**

1. Read the open task queue.

**Expected Result:**

- `code-quality` is the head row with blocker **null** (BR-25).
- `test-quality`'s blocker is **`code-quality`** (BR-25).
- `functional-test`'s blocker is **also `code-quality`** — the **earliest** incomplete blocking Task, not the immediately preceding one (BR-25, SPEC-02 BR-19).
- `documentation` appears in the queue with a blocker named, and blocks nothing after it — Recommended never blocks (BR-23, SPEC-02 BR-15).

### FUT-013: Recently completed is empty at cutover and fills from the first completion

**Covers:** RPT-002
**Preconditions:** CNV-002, CNV-003 and CNV-004 have run; no verb call has been made.
**Steps:**

1. Read the recently-completed section.
2. Call `start_stage("financial-planner/CNV-001", "sprint-build")`, then `complete_stage` on the same stage.
3. Re-read the section.

**Expected Result:**

- Step 1 returns **zero rows** (BR-29).
- Step 3 returns **exactly one row** — `sprint-build`, carrying its `completedAt` (BR-26).
- That row's actor is read from the completion **Activity event**, and equals the identity that called `complete_stage` (BR-27, D-41).

### FUT-014: A reopened stage leaves the list without losing its history

**Covers:** RPT-002, WFL-001
**Preconditions:** `financial-planner/CNV-001` with `code-quality` Complete and present in the recently-completed section.
**Steps:**

1. Call `reopen_stage("financial-planner/CNV-001", "code-quality", "defect found at commit")`.
2. Re-read the recently-completed section.
3. Read the Activity log.

**Expected Result:**

- `code-quality` is **absent** from the section, because SPEC-02 BR-28 cleared `completedAt` (BR-28).
- Its original **completion** Activity event is still present, alongside the reopen event (BR-27, D-42).
- The fact of the completion is recoverable even though the row no longer displays (BR-28, D-57).

### FUT-015: Recently completed caps at five and spans the workspace

**Covers:** RPT-002
**Preconditions:** Seven Tasks Complete across **two** Milestones, at seven distinct `completedAt` values; `sprint-build`'s six Subtasks are Complete.
**Steps:**

1. Read the recently-completed section.

**Expected Result:**

- Exactly **5** rows — the five most recent by `completedAt` descending (BR-26).
- Rows are drawn from **both** Milestones, not the most recent one only (BR-26).
- **No Subtask appears**, even though six are Complete (BR-23, BR-26).

### FUT-016: Every row is workspace-qualified

**Covers:** RPT-002
**Preconditions:** FUT-006's fixture, with at least one Task Complete so all three sections hold rows.
**Steps:**

1. Read all three sections.

**Expected Result:**

- Every story reference is of the form `financial-planner/CNV-001` — workspace slug, slash, story ID (BR-30, D-45).
- **No row carries a bare `CNV-001`**, in any section, including the next-action headline.

---

_SPEC-04 specifies ENH-002 and RPT-002 — the engine that answers "what next" and the component that renders it — per [BA-001 §11 row 04](../BUSINESS_ARCHITECTURE.md). The chain it walks is [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md); the verb surface it is reached through is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md); the data it resolves over is [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md). **Provisional on R1** ([D-39](../DECISIONS_LOG.md)). **R9 executed and discharged** at Information Architecture ([D-140](../DECISIONS_LOG.md), [D-141](../DECISIONS_LOG.md)); layout, routing and navigation are settled in [INFORMATION_ARCHITECTURE.md](../INFORMATION_ARCHITECTURE.md) (D-137)._
