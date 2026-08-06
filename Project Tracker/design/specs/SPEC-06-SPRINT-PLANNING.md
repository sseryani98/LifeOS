# SPEC-06 — Sprint Planning

**Spec ID:** SPEC-06
**FRICEW Objects:** FRM-002 (Form)
**Wave:** 2
**CDS Service:** Not yet defined — see §2. This spec is an input to the Data Model stage.
**Status:** Approved
**Provisional on:** **R1** (D-39), inherited from SPEC-01 … SPEC-05. ~~and **R9** (D-69), which a Form
inherits by the ruling taken at this workshop (D-82).~~ **R9 was executed and discharged at the
Information Architecture stage, 2026-08-06 (D-140, D-141).** **Not Approved-for-build until R1 clears.**

---

## Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-06 | Sandro & Claude | **R9 executed and discharged** at the Information Architecture stage (D-140, D-141) — provisional on **R1 alone**. D-82's write-surface reasoning was vindicated and sharpened: the preflight fails on the **request header** (`X-CSRF-Token`), not the method. §3's deferred layout/technology question is answered — **FRM-002 is a dialog launched from the project view** (D-139), with build technology deferred to Design System (D-138).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-30 | Sandro & Claude | Amended in-session at the SPEC-07 workshop (D-83, D-84). **BR-25's clause "a kind a verb emits" is struck** — SPEC-07 named the nine verb-emitted `Activity.kind` values and `plan_sprint` emits **`sprintPlanned`**, which FRM-002 also writes, so the clause was false the moment the vocabulary existed. The positive enumeration already carries the whole constraint, so no enforcement is lost. §6's row to SPEC-07 struck through as discharged, with the same correction: what keeps RPT-004's timeline separable is **`actor`**, not the kind partition. Status stays **Approved**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-30 | Sandro          | Status → Approved. All eight DESIGN_WORKSHOP §6 criteria met. Still provisional on **R1 and R9** for build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-07-30 | Sandro & Claude | Seven defects fixed on Sandro's review, before approval. Three substantive, all of the "the mechanism named cannot fire" class. **§5 rejected a duplicate `Initiative.name` with 409 `frm.sprint.nameDuplicate` while §2 amendment 2 made it `@assert.unique`** — under D-46 that surfaces as `ASSERT_UNIQUE`/400 verbatim and the named key could never fire; uniqueness is now a handler check, mirroring `storyId`. **The same contradiction held for `branch`**, whose `@mandatory` annotation cannot produce a `frm.sprint.branchRequired`; that key is withdrawn and the row is a CAP `ASSERT_*` pass-through. **BR-18 claimed BR-07 … BR-17 are enforced in a create-handler, but BR-12's story count is invisible on a committed Initiative row** — the D-64 vacuous-over-empty-set trap; BR-18 now states that Plan Sprint arrives as one deep insert, which is also what makes BR-22 atomic by construction. Plus: FUT-003 cited a bare `BR-09` where SPEC-05 carries one too; FUT-012 asserted an ENH-002 outcome its steps never produced; FUT-009's Form step read as impossible without saying that BR-14's refusal of a default is what makes an untouched row null; and **BR-10 and BR-11 had `frm.*` keys with no test**, now **FUT-015**. 14 FUTs → **15**. |
| 2026-07-30 | Sandro & Claude | Initial creation from the SPEC-06 workshop. Records D-76 through D-82. Provisional on R1 (D-39) and R9 (D-82). SPEC-01 amended in-session with its **seventh** and **eighth** amendments — `plan_sprint`'s `stories[]` gains `shipsUi` (D-76) and the verb gains an explicit `workspace` input (D-77). SPEC-02 §3.2's `Milestone.shipsUi` source cell sharpened; SPEC-04 §6's row addressed to this spec struck through as applied (BR-16). `research/README.md` §5's R9 Affects cell widened to the two Forms (D-82). **SPEC-06 resolves no OI; OI-05 alone remains.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

---

## 1. Overview

The only human path that creates work. FRM-002 has two modes — **Plan Sprint** creates an Initiative
and one Milestone per story row, and **Add Story** adds a single Milestone to an Active Initiative —
and it shares every rule with the `plan_sprint` verb by placing them in a CAP create-handler both
callers hit rather than in a Validator either could skip (D-78, D-79).

It has **no completion path**: FRM-001 owns the Initiative's transition to Complete and its
`mergeCommit` and `tag` (SPEC-05 BR-27, BR-31, D-74). Planning a sprint while the last one is still
open **warns and succeeds**, because two Active Initiatives is a legal state (SPEC-05 BR-20, D-80).

---

## 2. Data Model References

**There is no DM-001 yet.** Workshops is stage 5 and Data Model is stage 9, so this section is an
**input to** the data model rather than a reference to it (D-43). Every entity and attribute below is
a requirement this spec places on the Data Model stage.

| Entity         | Role in this spec                                                                | Attributes this spec requires                                                                                                                                               |
| -------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workspace**  | The scope FRM-002 writes into, and the uniqueness scope for both BR-10 and BR-17 | `slug`, `name` (SPEC-01 §2)                                                                                                                                                 |
| **Initiative** | Created by Plan Sprint; the target Add Story writes onto                         | `name`, `goal` (nullable), `branch`, `status`, `position`, `mergeCommit` (null at creation), `tag` (null at creation) — all already required by SPEC-01 / SPEC-03 / SPEC-05 |
| **Milestone**  | Created by both modes                                                            | `storyId`, `fricewType`, `description`, `shipsUi`, `position`. `status` is derived (SPEC-02 BR-17) and its creation status is a transient input (SPEC-03 BR-15, D-64)       |
| **Activity**   | FRM-002's emission, one row per write                                            | `kind`, `actor`, `target`, `payload`, `occurredAt`                                                                                                                          |

**Everything else is already required by SPEC-01 … SPEC-05; the Data Model stage should not
double-count. This spec adds no new attribute — it adds two code-list values and three constraints.**

**Amendments flagged for Data Model**

| #   | Amendment                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`Activity.kind` gains two values — `sprintPlanned` and `storyAdded`** — joining `checkpoint`, `migration`, `statusUpdate`, `focusChange`, `initiativeStatus` and `lesson`. **Extends SPEC-05 §2 amendment 3 to eight values.** camelCase, following the convention already standing on the SPEC-05 kinds; SPEC-05 §2 amendment 6's casing divergence is not settled here (D-81).                                                                              |
| 2   | **`Initiative.name` is unique within its Workspace** — a constraint, not a new attribute (BR-10). **Enforced by the shared create-handler, not by `@assert.unique`**, so it rejects 409 with a named key exactly as `storyId` does (BR-19). An annotation would surface as `ASSERT_UNIQUE`/400 passing through verbatim under D-46, which is the wrong treatment for "that name is taken, pick another".                                                        |
| 3   | **`Initiative.branch` is mandatory** (`@mandatory`); `goal` stays nullable (SPEC-03 §2 amendment 3). **No format assertion on `branch`** — see BR-11. Because this one **is** an annotation, an empty `branch` surfaces as CAP `ASSERT_NOT_NULL` verbatim and mints no `frm.*` key (§5).                                                                                                                                                                        |
| 4   | **No `Initiative.syncPoint` attribute exists.** Recorded as an amendment because "no column" is a Data Model instruction, not an omission. The live board header carries `Sync point: #4 — Categorization engine trained` (`Financial Planner/project/SPRINT_BOARD.md:7`) and nothing in slice 1 reads it — no Report renders it, no verb writes it, no rule turns on it. D-22: an unreachable value is specification without a test. **SPEC-03 owes nothing.** |

---

## 3. Functional Description

### 3.1 FRM-002 — Sprint Planning Form [Form]

#### Two modes

| Mode            | Creates                                      | Target                                 |
| --------------- | -------------------------------------------- | -------------------------------------- |
| **Plan Sprint** | One Initiative + one Milestone per story row | The Workspace of the project view      |
| **Add Story**   | One Milestone                                | An Active Initiative chosen explicitly |

**Add Story exists because there is otherwise no legal write path** (D-78). `plan_sprint` creates a
whole Initiative, and none of D-40's other ten verbs creates a Milestone — so adding a story to a live
sprint could not be done at all, while Financial Planner's own W1-S3 carries four stories. This is the
same analysis D-40 ran to find four missing verbs and D-74 ran to find `Initiative.mergeCommit` had no
writer.

#### Field list

| Field       | Type                                                                   | Required                                     | Validation                                                                                                              |
| ----------- | ---------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Workspace   | Read-only context of the project view                                  | —                                            | Never chosen (BR-06)                                                                                                    |
| Sprint name | Text                                                                   | **Yes, Plan Sprint mode**                    | Unique within the Workspace (BR-10); pre-filled by incrementing the current Initiative's name (BR-28)                   |
| Goal        | Text, multi-line                                                       | No — nullable (BR-11)                        | —                                                                                                                       |
| Branch      | Text                                                                   | **Yes, Plan Sprint mode**                    | Non-empty, **no format assertion** (BR-11); pre-filled `sprint/{name}` (BR-28)                                          |
| Initiative  | The Workspace's **Active** Initiatives                                 | **Yes, Add Story mode**                      | Complete Initiatives are not offered (BR-27); defaults to the current Initiative (BR-28)                                |
| Story ID    | Text — repeating, one per story row                                    | Yes (BR-14)                                  | Unique within the Workspace across every Initiative (BR-17); a duplicate is flagged on the row as it is entered (BR-30) |
| Type        | Code list {Interface, Conversion, Enhancement, Form, Report, Workflow} | Yes (BR-14)                                  | D-60's singular values (BR-15)                                                                                          |
| Description | Text, multi-line                                                       | Yes (BR-14)                                  | Non-empty (BR-14)                                                                                                       |
| Ships UI    | Boolean                                                                | **Yes, and it has no default value** (BR-14) | Not null; pre-**ticked** on Form and Report rows and freely cleared (BR-28)                                             |

#### Actions

**Plan Sprint · Add Story.** Two writes, two Activity rows, one each (BR-23).

#### Layout, navigation, Fiori Elements vs freestyle

D-20 makes FRM-002 a Form over CAP with validation rather than a CRUD escape hatch (BR-01). Whether it
is built with Fiori Elements or freestyle, how it is arranged, and what it navigates to are the
**Information Architecture / Design System stages'** call and are not decided here (D-21).

#### Filters and sorting

**None.** FRM-002 creates records and lists nothing. The one ordered thing is the story rows, and their
order is data (BR-16), not a sort control.

#### The shared-validation mechanism (D-79)

BA-001 §7 asserts FRM-002 and `plan_sprint` "both write through the same CAP service, so validation is
shared rather than duplicated" without naming a mechanism. It is a **CAP create-handler on `Initiative`
and `Milestone`** — D-58's precedent, which put ENH-001 in a create-handler rather than verb-layer
logic. The consequence is the point: both callers hit identical checks **structurally**, and neither can
skip them, which a caller-invoked Validator class cannot guarantee (BR-18). Field-level rules stay CDS
annotations and surface as CAP `ASSERT_*` verbatim (BR-20, D-46).

#### The prior-sprint warning (D-80)

FRM-002 **warns and does not block** when the Workspace already holds an Active Initiative with
Milestones carrying incomplete Tasks (BR-26). This is SPEC-05 BR-35's shape, itself SPEC-01 BR-11's
shape one level up, and for D-73's reason: two Active Initiatives is a legal state (SPEC-05 BR-20), so
a block would refuse the normal case.

The warning names the consequence, not only the condition. The new Initiative takes the highest
`position` (BR-09), so RPT-001's header flips to it immediately while the prior sprint still holds the
open work — and **FRM-001, not FRM-002, is what closes the prior sprint** (SPEC-05 BR-27).

#### Carve-outs

| Carve-out                         | Reason                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No hierarchy maintenance form** | Area, Engagement and Workspace get exactly one instance each (D-11) and CNV-002 already creates them (BA-001 §7, BR-05)                                         |
| **No completion path**            | FRM-001 owns Active → Complete with `mergeCommit` and `tag` (SPEC-05 BR-27, BR-31, D-74; BR-04)                                                                 |
| **No edit and no removal**        | FRM-002 never amends or deletes an existing Initiative or Milestone (BR-04). **Cost, stated:** correcting a mistyped story ID after save has no path in slice 1 |
| **No sync point**                 | See §2 amendment 4                                                                                                                                              |

---

## 4. Business Rules

**Scope and modes**

- **BR-01** FRM-002 has exactly two actions — Plan Sprint and Add Story. It is not a CRUD surface (D-20).
- **BR-02** Plan Sprint creates one Initiative and one Milestone per story row.
- **BR-03** Add Story creates exactly one Milestone, on an Initiative Sandro selects.
- **BR-04** FRM-002 never edits or removes an existing Initiative or Milestone, and has no completion path — FRM-001 owns the transition to Complete with `mergeCommit` and `tag` (SPEC-05 BR-27, BR-31).
- **BR-05** FRM-002 never creates an Area, an Engagement or a Workspace (BA-001 §7, D-11).
- **BR-06** FRM-002 writes into the Workspace of the project view it renders on. The Workspace is read-only context and is never chosen.

**The Initiative**

- **BR-07** A created Initiative is born **Active**. There is no Planned state (SPEC-03 §2 amendment 2, D-62).
- **BR-08** `mergeCommit` and `tag` are null at creation, and FRM-002 never writes either (SPEC-05 BR-27).
- **BR-09** `Initiative.position` is the Workspace's current maximum **+ 10** — the same rule `plan_sprint` uses (SPEC-04 BR-34). Any other rule points SPEC-05 BR-20's header at the wrong sprint.
- **BR-10** `Initiative.name` is unique within its Workspace.
- **BR-11** `goal` is optional. `branch` is required and non-empty, with **no format assertion** — `sprint/W{n}-S{n}` is Financial Planner's convention, not a constraint this module owns.
- **BR-12** A sprint carries at least one story. Zero story rows is rejected.

**The Milestones**

- **BR-13** Every Milestone is created with status **Backlog** — a transient creation input, never stored (SPEC-03 BR-15, D-64) — so ENH-001 instantiates its chain (SPEC-02 BR-09, D-54).
- **BR-14** A story row carries `storyId`, `fricewType`, `description` and `shipsUi`. All four are required and `shipsUi` has **no default value** (SPEC-03 BR-16 forbids a null `shipsUi` on any Milestone).
- **BR-15** `fricewType` ∈ {Interface, Conversion, Enhancement, Form, Report, Workflow} — D-60's singular code-list values (SPEC-03 §2 amendment 11).
- **BR-16** In Plan Sprint mode `Milestone.position` is the row's index in the **final** row order at save × 10 (SPEC-04 BR-34). In Add Story mode it is the target Initiative's current maximum + 10.
- **BR-17** `storyId` is unique within the **Workspace**, across every Initiative — not merely within one sprint.

**Shared validation**

- **BR-18** BR-07 … BR-17 are enforced in a **CAP create-handler on `Initiative` and `Milestone`** — not in FRM-002's UI and not in a caller-invoked Validator. FRM-002 and `plan_sprint` therefore hit identical checks structurally and neither can skip them, which is what D-20's "validation is shared rather than duplicated" means mechanically (D-58's precedent). **Plan Sprint arrives as one deep insert** — the Initiative carrying its Milestones — which is what puts the story rows in the handler's own payload; BR-12 counts them there rather than on the committed Initiative, where at creation there are none and the check would be vacuous over an empty set, the trap D-64 names. The deep insert is also what makes BR-22's atomicity the default rather than something to arrange.
- **BR-19** Because the check is one check, the duplicate-story rejection **reuses SPEC-01's `verb.story.duplicate` verbatim** rather than minting a Form key. This is the opposite disposition from SPEC-05's `frm.activity.kindNotPermitted`, and correctly so: that rule is FRM-001's own, this one is the shared handler's.
- **BR-20** Field-level constraints stay CDS annotations and surface as CAP `ASSERT_*` verbatim (D-46) — the `fricewType` code list, `shipsUi` not-null, and both `position` uniqueness constraints (SPEC-03 §2 amendment 12).

**Write contract**

- **BR-21** A **rejected** FRM-002 write creates nothing and emits nothing, including no record of the attempt. SPEC-01 BR-05's guarantee binds verbs and does not reach a Form; it is restated here exactly as SPEC-05 BR-32 restates it for FRM-001.
- **BR-22** A Plan Sprint write is **atomic across the whole sprint** — the Initiative, every Milestone and every instantiated chain commit together or not at all. One rejected story row creates no Initiative.
- **BR-23** Each FRM-002 write emits **exactly one** Activity row, inside the same transaction as the write: Plan Sprint → `sprintPlanned`, Add Story → `storyAdded`. One row per sprint, not one per story.
- **BR-24** FRM-002 writes under identity **`sandro`**, unconditionally (SPEC-05 BR-34).
- **BR-25** FRM-002 may write only `sprintPlanned` and `storyAdded`. It can never write `migration` or a kind FRM-001 owns — SPEC-05 BR-33's partition extended. ~~or a kind a verb emits~~ — **struck at the SPEC-07 workshop (D-83, D-84)**: `plan_sprint` emits `sprintPlanned`, which FRM-002 also writes, so the clause became false. The positive enumeration already carries the whole constraint, so nothing is lost. RPT-004 separates machine from human on **`actor`**, never on kind (SPEC-07 BR-31).

**Warnings and targeting**

- **BR-26** Plan Sprint **succeeds and warns** when the Workspace already holds an Active Initiative with Milestones carrying incomplete Tasks. The warning names that Initiative, each such Milestone, and the fact that the workspace header now shows the new sprint. It never blocks (SPEC-05 BR-20).
- **BR-27** Add Story targets an **Active** Initiative chosen explicitly. A Complete Initiative is not offered, and is rejected if submitted.

**Entry behaviour**

- **BR-28** The Form pre-fills the sprint name (an increment of the current Initiative's name), `branch` as `sprint/{name}`, `shipsUi` ticked on `Form` and `Report` rows, and Add Story's target as the current Initiative. **Every pre-fill is visible, editable, and not a derivation** — `shipsUi` in particular is a tick that may be cleared, because D-47 rejected the type-prefix rule _as a rule_ and SPEC-03 §3.1 records that the true set only coincides with `FRM-*` on the migrated data.
- **BR-29** Story rows are reorderable before save, and BR-16's positions are computed from the **final** order at save.
- **BR-30** A duplicate `storyId` is surfaced on the row that caused it, as it is entered. The authoritative rejection remains BR-19's at write time; the live check is an aid and never the enforcement.
- **BR-31** BR-26's condition is also shown when the Form opens, before anything is entered. Same fact at two moments; the save-time warning is the one recorded in `warnings[]`.

---

## 5. Error Handling

| Condition                                                    | Response                                                          | i18n key                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| Plan Sprint submitted with no story rows                     | Reject 400                                                        | `frm.sprint.noStories`           |
| Story ID already used in the Workspace                       | Reject 409                                                        | `verb.story.duplicate` ¹         |
| Initiative name already used in the Workspace                | Reject 409                                                        | `frm.sprint.nameDuplicate`       |
| Branch empty                                                 | Reject 400 (`ASSERT_NOT_NULL` surfaced verbatim)                  | — (CAP `ASSERT_*`)               |
| Add Story targeting a Complete Initiative                    | Reject 400, naming the Active Initiatives it accepts              | `frm.story.initiativeNotActive`  |
| `fricewType` outside the code list                           | Reject 400 (`ASSERT_ENUM` surfaced verbatim)                      | `verb.value.notInCodeList` ¹     |
| `shipsUi` null on a story row                                | Reject 400 (`ASSERT_NOT_NULL` surfaced verbatim)                  | — (CAP `ASSERT_*`)               |
| `position` collision within a parent                         | Refused at write time by `@assert.unique`, surfaced verbatim      | — (CAP `ASSERT_*`)               |
| Plan Sprint while an Active Initiative holds incomplete work | **Succeed**, `warnings[]` names the Initiative and each Milestone | `frm.sprint.priorInitiativeOpen` |

¹ Existing SPEC-01 key, reused rather than duplicated.

Every rejection above leaves the Workspace, every Initiative and the Activity log untouched (BR-21).

**The duplicate-story key is reused rather than minted, and that is the opposite call from SPEC-05's
`frm.activity.kindNotPermitted`.** D-79 puts the check in a create-handler both callers hit, so the rule
broken is the same rule and the key must be the same key — a Form-specific key would make one rule
report itself under two names depending on who tripped it. SPEC-05's kind rejection was FRM-001's **own**
rule about who may write what, which is why it needed a key of its own. Both readings are D-46's split
applied correctly to different facts.

**`shipsUi`, `fricewType` and `branch` fail as CAP `ASSERT_*` and pass through verbatim**, because a
payload missing a mandatory field or carrying a value outside a code list is the caller's own bug (D-46,
SPEC-01 §5). No `frm.*` key is minted for any of the three.

**Which rules get a named key is decided by which mechanism actually fires, not by which reads better.**
The two uniqueness rules are both handler checks, so both reject **409** with a key a human can act on —
`verb.story.duplicate` for `storyId` and `frm.sprint.nameDuplicate` for `Initiative.name` (§2 amendments
2 and 3). Had either been written as `@assert.unique`, D-46 would send it through as `ASSERT_UNIQUE`/400
verbatim and the named key could never fire — the same defect SPEC-05 fixed before approval when it
rejected a legal `Activity.kind` with `ASSERT_ENUM`.

---

## 6. Open Items

| OI    | Status in this spec                                                         |
| ----- | --------------------------------------------------------------------------- |
| OI-05 | **Not resolved here.** Methodology genericity settles at Data Model (D-22). |

**SPEC-06 resolves no open item.** OI-05 is the only one still open and it is not a workshop question.

**Alerts:** asked per the standing rule — **none.** Slice 1 has no Alert entity, and FRM-002 writes only
on an explicit human action with the result on screen, so there is no unattended event to notify anyone
about. The one alert-shaped case — "you planned a sprint while the last one is still open" — is
BR-26/BR-31's warning, delivered inline at the two moments it applies.

**Provisional dependencies — R1. R9 is discharged.**

- **R1** inherited from SPEC-01 … SPEC-05 (D-39), owned by the **Data Model stage**. Deadline unchanged.
- **R9** — **ruled here (D-82): SPEC-06 inherits it**, because FRM-002 is a UI5 surface issuing OData
  **writes** against an origin R9 had not settled, and a write is the more exposed case — a POST is not
  a CORS simple request and therefore preflights. R9's mechanism is **per-origin, not
  per-object-type**. ~~Ownership is not re-decided — it stays with the Information Architecture stage
  (D-69), and the deadline is unchanged.~~ **Executed at that stage on 2026-08-06; R9 is now `Verified`
  (D-140).** D-82's reasoning was vindicated and then sharpened: the preflight is indeed where
  composition dies, but not for the predicted reason. It fails on the **request header**, not the
  method — CAP's CORS middleware never sends `Access-Control-Allow-Headers` (`@sap/cds/server.js:93-102`)
  and UI5's V4 model always sends `X-CSRF-Token`, so `$batch` is rejected under `cds watch` as well as
  in production. **The serving position is one origin behind a reverse proxy (D-141)**, which removes
  the preflight question entirely; execution belongs to the **Tech Stack** stage.

**This spec is not Approved-for-build until R1 clears.**

**Cross-spec notes raised, not designed here**

| Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Goes to                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| ~~**`plan_sprint`'s `stories[]` gains a fourth field, `shipsUi`**~~ — **applied in-session** as SPEC-01's **seventh** amendment: §3.1's `plan_sprint` row, BR-21 and FUT-013's literal (D-76)                                                                                                                                                                                                                                                                                                                                                                                  | SPEC-01 — applied            |
| ~~**`plan_sprint` gains an explicit `workspace` input**~~ — **applied in-session** as SPEC-01's **eighth** amendment: §3.1's row, BR-21 and FUT-013's call (D-77)                                                                                                                                                                                                                                                                                                                                                                                                              | SPEC-01 — applied            |
| ~~**`research/README.md` §5's R9 row names only `RPT-001`…`004`**, so a Form inherits nothing on the stated basis~~ — **applied in-session**: the Affects cell now names the two Forms (D-82)                                                                                                                                                                                                                                                                                                                                                                                  | research/README.md — applied |
| **A verb signature changed in this session, and D-37 §11.1's amendment trigger does not fire.** That trigger is scoped to the SPEC-01/SPEC-02 seam — a WFL-001 guard that cannot be stated without changing an INT-001 signature — and this is neither a guard nor that seam. Recorded rather than left silent, on D-55's and SPEC-04's precedent of recording a tested trigger either way                                                                                                                                                                                     | BA-001 §11.1 — recorded      |
| ~~**RPT-004 renders the two Activity kinds this spec adds** — `sprintPlanned` and `storyAdded` — and BR-25's partition keeps its combined timeline separable~~ — **discharged at the SPEC-07 workshop.** Both kinds render under SPEC-07 BR-28's single row shape. **The partition claim was wrong and is corrected:** what keeps the timeline separable is **`actor`**, not kind — `plan_sprint` emits `sprintPlanned` too, so kind cannot distinguish the halves (SPEC-07 BR-30, BR-31, D-84). BR-25 keeps its write constraint with the "a kind a verb emits" clause struck | SPEC-07 — closed             |
| **`Initiative.name` uniqueness and `branch` mandatory are constraints the Data Model must carry**, and `Initiative.syncPoint` deliberately does not exist                                                                                                                                                                                                                                                                                                                                                                                                                      | Data Model                   |

**BA-001 corrections** — both **applied at BA-001 v1.7**, in this session.

| Correction                                                                                                                                                                                                 | Where            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| ~~§7's FRM-002 row describes creation only and names three story fields~~ — now names both modes, the fourth field `shipsUi`, both position rules, the create-handler mechanism and the two Activity kinds | BA-001 §7 — done |
| ~~§8's R9 paragraph names SPEC-05 and SPEC-07 as inheriting~~ — now names **SPEC-06** too, with the write-surface reason                                                                                   | BA-001 §8 — done |

---

## 7. Functional Unit Tests

Story IDs entered on a story row are **Financial Planner** IDs; BR-06 supplies the Workspace, so each
addresses as `financial-planner/{id}` (BA-001 §3.3, D-45).

### FUT-001: Plan Sprint creates an Initiative and its stories in one write

**Covers:** FRM-002
**Preconditions:** CNV-001 has seeded the library and CNV-002 has run — Workspace `financial-planner` exists with W1-S3 Active at `position` **30** (SPEC-03 BR-14a).
**Steps:**

1. Open FRM-002 on the `financial-planner` project view.
2. Enter name `W1-S4`, branch `sprint/W1-S4`, a goal, and three story rows: `ENH-004` / Enhancement / `shipsUi` **false**; `RPT-005` / Report / `shipsUi` **true**; `INT-008` / Interface / `shipsUi` **false**.
3. Save.

**Expected Result:**

- One Initiative `W1-S4`, status **Active**, `position` **40**, `mergeCommit` and `tag` **null** (BR-07, BR-08, BR-09).
- Three Milestones beneath it at positions **10 / 20 / 30** in entry order (BR-16).
- **Exactly one** Activity row, kind `sprintPlanned`, actor **`sandro`** — not three (BR-23, BR-24).

### FUT-002: `shipsUi` decides the chain length

**Covers:** FRM-002, ENH-001
**Preconditions:** FUT-001's end state.
**Steps:**

1. Read the Tasks and Subtasks on `financial-planner/RPT-005` and on `financial-planner/INT-008`.

**Expected Result:**

- `financial-planner/RPT-005` carries **9 Tasks and 7 Subtasks**.
- `financial-planner/INT-008` carries **8 Tasks and 6 Subtasks**, with `ux-test` and `smoke` never materialised (SPEC-02 §3.2's worked example, SPEC-02 BR-12).
- Every materialised row is **Not Started** (SPEC-02 BR-14).
- This is the behaviour SPEC-02 FUT-006 asserts, now reached through a **declared** input rather than an assumed one (BR-14).

### FUT-003: The workspace header follows the new sprint, and the prior one stays Active

**Covers:** FRM-002, RPT-001
**Preconditions:** FUT-001's end state — W1-S3 Active at `position` 30, W1-S4 Active at 40.
**Steps:**

1. Read RPT-001 section 1.

**Expected Result:**

- The current Initiative is **W1-S4** — Active with the highest `position` (SPEC-05 BR-20, set by BR-09 of this spec; SPEC-05 carries a BR-09 of its own, so the citation is qualified).
- W1-S3 is still **Active** and unchanged.
- Two Active Initiatives is a legal state, not an error (SPEC-05 BR-20).

### FUT-004: Planning while the prior sprint is open warns and does not block

**Covers:** FRM-002
**Preconditions:** CNV-001 and CNV-002 have run — W1-S3 is Active and holds `financial-planner/CNV-001` in Backlog with 8 Tasks all Not Started (SPEC-03 §3.1, SPEC-02 §3.2's worked example).
**Steps:**

1. Open FRM-002 and observe the on-open notice.
2. Enter a valid `W1-S4` with one story row.
3. Save.

**Expected Result:**

- The on-open notice names **W1-S3** and `financial-planner/CNV-001` (BR-31).
- The save **succeeds**; `warnings[]` names W1-S3, names `financial-planner/CNV-001`, and states that the header now shows W1-S4, key `frm.sprint.priorInitiativeOpen` (BR-26).
- W1-S3 and its Milestones are **unchanged**, and nothing is completed — FRM-001 owns that (BR-04, SPEC-05 BR-27).

### FUT-005: Add Story puts one story onto a live sprint

**Covers:** FRM-002, ENH-001
**Preconditions:** CNV-001 and CNV-002 have run — W1-S3 is Active with four Milestones at positions 10 / 20 / 30 / 40 (SPEC-03 BR-14a).
**Steps:**

1. Open FRM-002 in Add Story mode; the target defaults to **W1-S3** (BR-28).
2. Enter `ENH-010` / Enhancement / a description / `shipsUi` **false**.
3. Save.

**Expected Result:**

- One new Milestone on **W1-S3** at `position` **50** (BR-16), created Backlog and carrying a chain of **8 Tasks and 6 Subtasks** (BR-13).
- **Exactly one** Activity row, kind `storyAdded` (BR-23).
- **No Initiative is created** (BR-03).

### FUT-006: A Complete Initiative is not an Add Story target

**Covers:** FRM-002
**Preconditions:** CNV-002 has run — W1-S1 is **Complete** (SPEC-03 §3.1).
**Steps:**

1. Open Add Story and inspect the target list.
2. Submit a story row against W1-S1 directly.

**Expected Result:**

- W1-S1 is **absent** from the list (BR-27).
- The direct submission is rejected **400**, key `frm.story.initiativeNotActive`, naming the Active Initiatives it accepts (BR-27).
- No Milestone is created and no Activity row is emitted (BR-21).

### FUT-007: A story ID already used in another Initiative is refused

**Covers:** FRM-002
**Preconditions:** CNV-002 has run — `financial-planner/CNV-001` exists on **W1-S3**.
**Steps:**

1. Plan `W1-S4` with a single story row whose ID is `CNV-001`.

**Expected Result:**

- Rejected **409**, key `verb.story.duplicate` — SPEC-01's own key reused (BR-17, BR-19).
- No Initiative and no Milestone is created (BR-21, BR-22).
- The existing story sits on a **different** Initiative, which is what makes the uniqueness Workspace-scoped rather than sprint-scoped (BR-17).

### FUT-008: An invalid FRICEW type is refused through the Form path

**Covers:** FRM-002
**Preconditions:** CNV-001 and CNV-002 have run — Workspace `financial-planner` exists.
**Steps:**

1. Submit a Plan Sprint whose story row is typed `Integration`.

**Expected Result:**

- Rejected **400** with `ASSERT_ENUM` surfaced verbatim, key `verb.value.notInCodeList` (BR-15, BR-20, D-46) — `Integration` is not one of D-60's six singular values; `Interface` is.
- No Initiative and no Milestone is created (BR-21, BR-22).
- This is SPEC-01 FUT-014's guarantee reached through the shared handler rather than through the verb (BR-18).

### FUT-009: A story row with no `shipsUi` is refused, on both paths

**Covers:** FRM-002, INT-001
**Preconditions:** CNV-001 and CNV-002 have run — Workspace `financial-planner` exists.
**Steps:**

1. Call `plan_sprint` with a story row omitting `shipsUi`.
2. Submit through FRM-002 a story row whose **Ships UI has not been set**. BR-14 gives the field no default, so an untouched row carries null rather than false — which is what makes this step reachable through the Form at all, and is the whole point of refusing a default.

**Expected Result:**

- **Both** rejected **400** with `ASSERT_NOT_NULL` surfaced verbatim (BR-14, BR-20).
- This is the constraint SPEC-03 BR-16 asserts over the migrated rows, enforced in the create-handler so it binds every caller (BR-18) — and it is why the field was added to the verb (D-76).

### FUT-010: A sprint with no stories is refused

**Covers:** FRM-002
**Preconditions:** CNV-001 and CNV-002 have run — Workspace `financial-planner` exists.
**Steps:**

1. Submit Plan Sprint with a name and a branch and **no** story rows.

**Expected Result:**

- Rejected **400**, key `frm.sprint.noStories` (BR-12).
- No Initiative is created — which is the point: an empty Initiative would take the highest `position` and become RPT-001's current sprint (SPEC-05 BR-20) while contributing nothing to SPEC-04 BR-04's candidate set.

### FUT-011: One bad row creates nothing at all

**Covers:** FRM-002
**Preconditions:** CNV-001 and CNV-002 have run — `financial-planner/CNV-001` exists.
**Steps:**

1. Plan `W1-S4` with three story rows, the third duplicating `CNV-001`.

**Expected Result:**

- Rejected **409**, key `verb.story.duplicate` (BR-19).
- **Zero Initiatives, zero Milestones, zero Tasks, zero Subtasks and zero Activity rows** — including no record of the attempt (BR-21, BR-22).
- The two valid rows are **not** partially committed (BR-22).

### FUT-012: Reordering before save sets the positions

**Covers:** FRM-002
**Preconditions:** CNV-001 and CNV-002 have run — Workspace `financial-planner` exists.
**Steps:**

1. Enter three story rows in the order **A, B, C**.
2. Move **C** above **A**.
3. Save.
4. Read the three Milestones ordered by `position`.

**Expected Result:**

- Positions **10 / 20 / 30** follow **C, A, B** — the final order at save, not the order first typed (BR-16, BR-29).
- Ordering by `Milestone.position` therefore yields **C, A, B**, which is the total order SPEC-04 BR-07 walks. That consequence is asserted here as a position read, not as a `next_action` call — resolving a next action needs a tier, which this fixture does not establish.

### FUT-013: Both callers hit the same check

**Covers:** FRM-002, INT-001
**Preconditions:** CNV-001 and CNV-002 have run — `financial-planner/CNV-001` exists.
**Steps:**

1. Call `plan_sprint` with a story row duplicating `CNV-001`.
2. Submit the same through FRM-002.

**Expected Result:**

- **Both** rejected **409** with the **same key, `verb.story.duplicate`, and the same semantics** (BR-18, BR-19).
- Neither path can reach a create that the other would refuse.
- This is D-20's "validation is shared rather than duplicated" made testable, and it is what a Validator class invoked by each caller could not guarantee (BR-18).

### FUT-014: The amended verb signature carries both new inputs

**Covers:** INT-001, FRM-002, ENH-001
**Preconditions:** CNV-001 and CNV-002 have run — Workspace `financial-planner` exists with W1-S3 at `position` 30.
**Steps:**

1. Call `plan_sprint("financial-planner", "W1-S4", goal, branch, [ {id, type, description, shipsUi} × 3 ])`, with exactly one row carrying `shipsUi` **true**.

**Expected Result:**

- One Initiative at `position` **40** — the Workspace maximum + 10 (BR-09, SPEC-04 BR-34).
- Three Milestones at **10 / 20 / 30** by array index (SPEC-04 BR-34).
- The `shipsUi`-true story carries **9 Tasks and 7 Subtasks**; the other two carry **8 and 6** (SPEC-02 BR-11, BR-12).
- **One** Activity event, not four (SPEC-01 BR-03).
- The `workspace` argument is what scopes BR-17's uniqueness check (D-77).

### FUT-015: A reused sprint name and an empty branch are refused, by different mechanisms

**Covers:** FRM-002
**Preconditions:** CNV-002 has run — the Workspace holds Initiatives named `W1-S1`, `W1-S2` and `W1-S3` (SPEC-03 §3.1).
**Steps:**

1. Plan a sprint named `W1-S3` with a valid branch and one story row.
2. Plan a sprint named `W1-S4` with an **empty** branch and one story row.

**Expected Result:**

- Step 1 is rejected **409**, key `frm.sprint.nameDuplicate` (BR-10) — a **handler** check, so it carries a key naming the rule.
- Step 2 is rejected **400** with `ASSERT_NOT_NULL` surfaced verbatim and **no `frm.*` key** (BR-11, BR-20) — an **annotation**, so D-46 passes it through as the caller's own bug.
- Neither creates an Initiative or a Milestone (BR-21).
- The two rejections take different shapes on purpose: §2 amendments 2 and 3 choose different mechanisms, and §5 records that the mechanism decides the key rather than the other way round.

---

_SPEC-06 specifies FRM-002 — the only human path that creates work — per [BA-001 §11 row 06](../BUSINESS_ARCHITECTURE.md). The verb it shares its validation with is [SPEC-01](SPEC-01-MCP-INTENT-VERB-LAYER.md)'s `plan_sprint`; the chain its Milestones instantiate is [SPEC-02](SPEC-02-METHODOLOGY-AND-STAGE-ENFORCEMENT.md)'s; the data it plans on top of is [SPEC-03](SPEC-03-FINANCIAL-PLANNER-MIGRATION-LOAD.md)'s; the positions it sets are read by [SPEC-04](SPEC-04-NEXT-ACTION.md), and the sprint it never completes is [SPEC-05](SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md)'s FRM-001. **Provisional on R1** ([D-39](../DECISIONS_LOG.md)). **R9 executed and discharged** at Information Architecture ([D-140](../DECISIONS_LOG.md), [D-141](../DECISIONS_LOG.md)); FRM-002 is a dialog launched from the project view, settled in [INFORMATION_ARCHITECTURE.md](../INFORMATION_ARCHITECTURE.md) (D-139)._
