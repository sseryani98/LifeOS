# Design System

**Document ID:** DS-001
**Version:** 1.0
**Date:** 2026-08-06
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-06 | Sandro & Claude | Initial creation from the Design System stage. Build technology ruled **Fiori Elements FPM** for all 6 UI-bearing objects with **drafts off**; the browser read path named; theme and density recorded as inherited; one `ObjectPageLayout` in 4 regions; **17** domain-to-role mappings; charts answered **none**. Records D-144 through D-152. |

---

## 2. Summary

This document settles what each of slice 1's six UI-bearing surfaces is **built with** and what it
**looks like**. It styles what [IA-001](INFORMATION_ARCHITECTURE.md) names and decides no route, no
link and no concrete visual value.

| Aspect                  | Decision                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Build technology**    | **Fiori Elements FPM** (`sap.fe.core.fpm`), uniform across all **6** objects (D-144)                                                                                  |
| **Draft enablement**    | **Off.** No entity in this module is draft-enabled — this is the ruling Data Model (stage 9) was waiting for (D-144)                                                  |
| **Browser read path**   | A **read-only OData projection** of `project_view` on the same CAP service INT-001 connects to in-process. One handler, two transports (D-145)                        |
| **Theme**               | `sap_horizon` — **inherited, not chosen**. One `<body>`, one theme attribute (D-146)                                                                                  |
| **Density**             | Compact (`sapUiSizeCompact`) — inherited by the same mechanism (D-146)                                                                                                |
| **Page layout**         | One `sap.uxap.ObjectPageLayout` — RPT-001 as the snapping header, **3** anchor-bar sections in resume order (D-148)                                                   |
| **Semantic roles**      | This module's own domain vocabulary over the **same 5** Horizon semantic states Financial Planner's DS-001 uses. **17** mappings, **2** stated "none" (D-149)         |
| **Status indicators**   | `ObjectStatus` for states; `NumericContent` inside `GenericTile` for the gate tile. No `ObjectNumber` — this module renders no semantic amount (D-149)                |
| **Charts**              | **None.** No spec specifies one; the 2 hits across the 4 UI specs are deferral sentences, not requirements (D-150)                                                    |
| **Loading / failure**   | **One** loading state and **one** read-failure state for the whole page, because one `project_view` call feeds all four Reports (D-151)                               |
| **Empty states**        | Text-based placeholders, no illustrations. RPT-003's is the normal case; RPT-004's is unreachable (D-151)                                                             |
| **Annotation-UX rules** | Bind **partially** — `@UI.LineItem` + `CssDefaults`, `PresentationVariant`, `@UI.Hidden`, `@Common.Text`/`ValueList` bind; **`@UI.SelectionFields` does not** (D-144) |
| **Table standards**     | Widths sum to 100%, title with count. **3 deliberate departures** from Financial Planner's DS-001 §9.1.1 — no search, no personalization, no variant management       |
| **Theme boundary**      | Roles here; every concrete value at stage 8. The shared-shell CSS collision is **named, not solved** (D-152)                                                          |
| **Cross-module debt**   | Widened: the dependency reaches `app/shared/` as well as the shell. Same owner as D-143 (D-147)                                                                       |
| **Risks assigned here** | **None** — register checked, not assumed. RSH-003's only live risk was R9, executed and closed (D-140)                                                                |
| **Spec amendments**     | **6** recorded across SPEC-01, SPEC-04, SPEC-05, SPEC-06, SPEC-07 and SPEC-11                                                                                         |
| **Decisions logged**    | **D-144 through D-152** (9 decisions)                                                                                                                                 |

---

## 3. Surface Inventory

The **6** UI-bearing objects are [IA-001](INFORMATION_ARCHITECTURE.md) §3's, unchanged. This document
adds no surface and removes none; the column below names what each object **renders**, which is what
gets styled.

| ID          | Name                     | Spec    | Renders                                                                             | Home                                    |
| ----------- | ------------------------ | ------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| **RPT-001** | Workspace Header         | SPEC-05 | 4 sections — Status, Current Focus, calculated health, gate tile                    | The page header (§5)                    |
| **RPT-002** | Next Action & Task Queue | SPEC-04 | 3 sections — next action, open task queue, 5 most recently completed                | Section 1                               |
| **RPT-003** | Methodology Chain        | SPEC-07 | 3 sections — chain header, Task rows, Subtask rows nested under `sprint-build` only | Section 2                               |
| **RPT-004** | Registers                | SPEC-07 | 3 sections — Defect table, Decision list, combined Activity timeline                | Section 3, as 3 sub-sections            |
| **FRM-001** | Workspace Header Editor  | SPEC-05 | 7 fields, 3 actions — Save Focus, Add Narrative Entry, Complete Initiative          | Inline on RPT-001 (D-139)               |
| **FRM-002** | Sprint Planning Form     | SPEC-06 | 9 fields, 2 modes — Plan Sprint, Add Story (D-78)                                   | A dialog launched from the page (D-139) |

**WFL-001 ships no UI, and that is a ruling** ([IA-001](INFORMATION_ARCHITECTURE.md) §3.1). It is
enforcement invoked exclusively through INT-001's verbs, so it renders nothing and this document
styles nothing for it. Restated here so its absence reads as measured rather than missed.

---

## 4. Build Technology (D-144)

**Ruling: Fiori Elements FPM (`sap.fe.core.fpm`) for all six objects, on non-draft entity sets.
Draft enablement is OFF.**

| ID      | Object                   | Technology                           | Reason                                                                                 |
| ------- | ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------- |
| RPT-001 | Workspace Header         | FE FPM — the page's header region    | Composes onto the one FPM page; `sap.fe.macros.Field` drives FRM-001 inline            |
| RPT-002 | Next Action & Task Queue | FE FPM — section 1                   | Its two collections bind as `sap.fe.macros.Table`                                      |
| RPT-003 | Methodology Chain        | FE FPM — section 2                   | Task rows bind as `sap.fe.macros.Table`; Subtasks nest as a plain list                 |
| RPT-004 | Registers                | FE FPM — section 3                   | The Defect table binds as a macro table; the two lists are `sap.m` controls            |
| FRM-001 | Workspace Header Editor  | FE FPM — inline in the header        | `sap.fe.macros.Field` supplies field rendering and validation display                  |
| FRM-002 | Sprint Planning Form     | FE FPM — a fragment on the same page | Loaded by the page controller through the shared `DialogManager`; fields are FE macros |

[IA-001](INFORMATION_ARCHITECTURE.md) §5 deferred this ruling here with a deadline of **before Data
Model (stage 9)**. The deadline holds — this is stage 7.

### 4.1 The two constraints D-138 attached, and how this ruling honours them

1. **A full FE template app was already ruled out by D-137**, because `sap.fe.templates`
   ListReport/ObjectPage bring their own routing and route patterns, which collides with the
   one-route shape. **FPM is not a template** — it is a custom page hosted by the FE runtime, and it
   carries no routing of its own. D-137's route count is untouched.
2. **The stated tension — FE is driven by OData entity sets while D-05 removes the CRUD path.**
   Resolved rather than inherited: FPM binds a page to a **context**, and needs no CRUD surface. The
   only entity sets exposed are the read-only projection §4.3 rules, plus `Initiative` and
   `Milestone`, which D-79's shared CAP create-handler already presumes for FRM-002. Agents still
   reach state only through INT-001's verbs. [BA-001](BUSINESS_ARCHITECTURE.md) §7 is explicit that
   D-05's prohibition binds **agents bypassing the service layer**, not Sandro using a validated Form
   over CAP.

### 4.2 The measurement that decided it

FPM's shape is not inferred — it is running in this repo. Measured this session across the **4** app
manifests under `Financial Planner/app/*/webapp/`: **2** use `sap.fe.templates` (`admin-master-data`,
`transactions`), **1** uses `sap.fe.core.fpm` (`connection-manager`) and **1** uses neither
(`csv-import-wizard`, freestyle). So `connection-manager` is the only FPM app either module has, and
it is the whole evidence base for this ruling:

| Measurement          | Value                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Target shape         | `type: "Component"`, `name: "sap.fe.core.fpm"`, `options.settings: { viewName, contextPath, navigation }` — `webapp/manifest.json:56-78`               |
| `contextPath`        | `/ProviderConnections` — `webapp/manifest.json:70`                                                                                                     |
| **Draft enablement** | **None.** `ProviderConnections` is a plain projection with a bound action — `Financial Planner/srv/admin-service.cds:73-75`, no `@odata.draft.enabled` |
| Root view            | `sap.fe.core.rootView.NavContainer` — `webapp/manifest.json:32`                                                                                        |
| FE libraries         | `sap.fe.core` and `sap.fe.macros`, declared **per-component** in its own manifest (`:27-28`), not page-globally                                        |
| View                 | A hand-written XML view using `sap.fe.macros` — `webapp/view/ConnectionManager.view.xml`                                                               |
| Controller           | Extends the shared `BasePageController`, using `DialogManager`, `Messaging` and `model/ConnectionService.ts` — the shared standards' pattern exactly   |

**`@odata.draft.enabled` appears 17 times in Financial Planner's model** — 16 in
`srv/admin-service.cds` and 1 in `srv/transaction-service.cds` — and **not one of them is the FPM
app's entity**. FPM's benefits therefore arrive without drafts, which is what makes this ruling
compatible with D-05 rather than in tension with it.

### 4.3 Draft consequence — stated for the Data Model stage

**No entity in this module is draft-enabled.** This closes what
[`SPEC-11`](specs/SPEC-11-PROJECT-STATE-EXPORTER.md) BR-06 (`:159`) left open: it reads "No entity in
this module is draft-enabled today, and whether any becomes so is **not yet decided**", citing
SPEC-05 §3 and SPEC-06 §3's deferral. That is now decided. BR-06's filter text is **unchanged** — it
is unconditional by design, excluding whatever the CSN marks as a draft shadow and asserting nothing
about whether the set is non-empty.

**A correction to D-138's own consequence wording.** D-138 stated that BR-06 "becomes vacuous only if
stage 7 rules freestyle". That is wrong: it becomes vacuous because **drafts are ruled off**, which
FPM permits. The Fiori-Elements-versus-freestyle axis was never the one that decided it.

### 4.4 Which shared annotation rules bind — measured, not inferred

The "Annotation UX (Fiori Elements)" bullet in `Financial Planner/CLAUDE.md` binds **partially** under
FPM. Measured in `Financial Planner/app/connection-manager/annotations/connections.cds` (90 lines):

| Rule                                                                | Binds?  | Evidence                                                        |
| ------------------------------------------------------------------- | ------- | --------------------------------------------------------------- |
| `@UI.LineItem` with `![@HTML5.CssDefaults]` widths totalling 100%   | **Yes** | `:49-71` — 34% + 33% + 33%                                      |
| `@UI.PresentationVariant` with `SortOrder` + `Visualizations`       | **Yes** | `:67-70`                                                        |
| `@UI.Hidden` on `ID` and the four managed fields                    | **Yes** | `:4-19`, `:42-46`                                               |
| `@Common.Text` + `TextArrangement`                                  | **Yes** | `:4-7`, `:20-27`                                                |
| `@Common.ValueList` with `ValueListParameterInOut` / `…DisplayOnly` | **Yes** | `:20-40`                                                        |
| **`@UI.SelectionFields`**                                           | **No**  | The file carries none. There is no ListReport and no filter bar |

A `sap.fe.macros.Table` takes its annotated columns via
`metaPath="@com.sap.vocabularies.UI.v1.LineItem"` **and** accepts custom columns declared in the view
as `<macros:columns><mtable:Column>` — measured at
`Financial Planner/app/connection-manager/webapp/view/ConnectionManager.view.xml:16-67`. **That
hybrid is what lets an annotated table carry an `ObjectStatus` cell**, and it is the mechanism §6's
control table relies on throughout.

### 4.5 One cost, stated

`sap.fe.macros.Table` ships a toolbar with sort and personalization affordances **by default**.
[`SPEC-04`](specs/SPEC-04-NEXT-ACTION.md) BR-31 and [`SPEC-07`](specs/SPEC-07-CHAIN-AND-REGISTERS.md)
BR-33 rule filters and sorting out of slice 1. **FPM's defaults and this module's specs disagree, and
the disagreement resolves in the specs' favour** — every macro table must have them explicitly
disabled. Recorded so a build persona does not read the default toolbar as sanctioned.

---

## 5. The Browser Read Path (D-145)

**Ruling: the UI reads through a read-only OData projection of `project_view` on the same CAP service
INT-001 connects to in-process. One handler, two transports.**

### 5.1 The gap this closes

| Fact                                                                                                                      | Source                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| INT-001's transport is **MCP stdio, in-process with CAP. "No HTTP server, no listening socket."**                         | [SPEC-01](specs/SPEC-01-MCP-INTENT-VERB-LAYER.md) §3.1 |
| All four Reports "render from a single `project_view` call", citing SPEC-01 BR-22                                         | SPEC-04 BR-32, SPEC-05 BR-30, SPEC-07 BR-01            |
| The **write** path is named — FRM-002 is "a UI5 surface issuing OData writes"                                             | D-82; SPEC-06 §6                                       |
| Shared validation is a CAP create-handler on `Initiative` and `Milestone`, which presumes those entity sets are reachable | D-79                                                   |
| **The read path is named nowhere in any of the twelve specs**                                                             | This stage's finding                                   |

A browser cannot call an MCP stdio server. The four Reports had a stated data contract with no
transport behind it.

### 5.2 The ruling

The same composed-payload implementation backs both transports. **INT-001's stdio verb is
unchanged** — §3.1's "no HTTP server, no listening socket" describes the MCP server, not the CAP
service it connects to. A **read-only** OData projection exposes the same payload for the browser and
serves as the FPM `contextPath`. Its collections — the task queue, each Milestone's chain, the
Defects, the Decisions, the Activity rows — are **navigation properties**, because `sap.fe.macros`
binds collections rather than arbitrary JSON.

**D-05 is not re-opened.** The projection is read-only and exposes no write path; agents reach state
only through the verbs.

### 5.3 Cost, stated plainly

**This places a real requirement on the Data Model stage.** The `project_view` payload must be
expressible as a read-only entity with navigation properties rather than an opaque function result.
That is a larger ask than a freestyle page would have made, and it is the price of the FPM ruling in
§4. It is recorded in the shape D-43 established — a spec's §2 is an **input to** the Data Model, not
a reference to it.

---

## 6. Theme & Density (D-146)

**`sap_horizon`. Density Compact (`sapUiSizeCompact`).**

**This is forced, not preferred, and saying so is the point.** D-143 makes this module register its
component into `Financial Planner/app/index.html`. Measured there this session:

| Measurement           | Value                                                    | Location |
| --------------------- | -------------------------------------------------------- | -------- |
| Theme attribute       | `data-sap-ui-theme="sap_horizon"`                        | `:17`    |
| Density               | `<body class="sapUiBody sapUiSizeCompact" id="content">` | `:45`    |
| Preloaded libraries   | `sap.m, sap.tnt, sap.f, sap.ui.layout, sap.uxap`         | `:24`    |
| CSS custom properties | `data-sap-ui-xx-cssVariables="true"`                     | `:24`    |

Both the theme attribute and the density class are **page-global** — one `<body>`, one theme, for
every hosted component. **A second theme or a second density is not expressible in that page.** Dark
mode is out of scope for the same structural reason, not as a preference.

The preloaded library list is what §7's layout ruling draws on: `sap.uxap` is already there, so the
page shell costs no new library.

### 6.1 The shared UI5 library dependency (D-147) — extends D-143, does not re-open it

D-143 named this module's build-time dependency on `Financial Planner/app/index.html` and
`app/shell/controller/NavConfig.ts`. Measured this session, **it is wider than the shell**:

| Measurement                    | Value                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Financial Planner/app/shared` | `"type": "library"` (`manifest.json:5`), id **`com.financialplanner.shared`** (`manifest.json:4`), mapped as a resource root at `app/index.html:19`                                             |
| What it holds                  | `BaseController.ts`, `BasePageController.ts` (`@namespace com.financialplanner.shared`, `:14`), `DialogManager.ts`, `Messaging.ts`, `constants.ts`, `types.ts`, `util/`, `controls/`, `css/`    |
| Why this module needs it       | The shared standards **mandate** the `Messaging` helper (lint-enforced, `lint:messaging`), `BaseController`/`BasePageController`, and `DialogManager` for dialogs — and they apply here in full |

So this module's controllers import from a **Financial-Planner-namespaced** library. **The dependency
is forced by the standards, not chosen** — the alternative, copying the helpers into this module,
would fork a lint-enforced shared helper into two versions that drift.

**Ruling: accept it for slice 1, and attach it to the owner D-143 already named** — whoever builds
the third module's UI, or the first cross-module shell navigation, whichever comes first. One debt,
one owner, now correctly sized.

---

## 7. Page Layout (D-148)

**One `sap.uxap.ObjectPageLayout`, hosted by the FPM target. RPT-001 is the page header; the other
three Reports are anchor-bar sections in resume order.**

| Region                 | Object            | Control                                                                    |
| ---------------------- | ----------------- | -------------------------------------------------------------------------- |
| Page header (snapping) | RPT-001 + FRM-001 | `sap.uxap.ObjectPageDynamicHeaderTitle` + `ObjectPageDynamicHeaderContent` |
| Section 1              | RPT-002           | `sap.uxap.ObjectPageSection`                                               |
| Section 2              | RPT-003           | `sap.uxap.ObjectPageSection`                                               |
| Section 3              | RPT-004           | `sap.uxap.ObjectPageSection` with **3** `ObjectPageSubSection`s            |

### 7.1 Why `sap.uxap`

- It is **already preloaded page-globally** (`Financial Planner/app/index.html:24`), so the page
  shell costs no new library.
- Its **snapping header** is exactly the shape of a header read on arrival and scrolled past.
- Its **anchor bar** gives in-page jumps, which is **in-page disclosure, not navigation** —
  consistent with D-137's one route. The anchor bar is visible: with three sections it is the
  cheapest way to reach RPT-004 without scrolling past the whole chain.

The rejected alternative was `sap.f.GridContainer`, the card-grid shape Financial Planner's DS-001 §5
uses for its dashboards. It does not fit: **the four Reports are not peer cards.** One of them is a
page header, and a grid would render it as a tile among tiles.

### 7.2 Why this order

| Position  | Object  | Reason                                                                                                                                                                                                                                   |
| --------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header    | RPT-001 | PSV falsifiable check 3 (`PROBLEM_STATEMENT_AND_VISION.md:103`; [IA-001](INFORMATION_ARCHITECTURE.md) §9.1 Flow A) requires resumption with **zero navigation** — so the status, focus, health and gate tile must be readable on arrival |
| Section 1 | RPT-002 | The same check. The next action is the other half of "the view alone is enough to resume", and it must not require scrolling                                                                                                             |
| Section 2 | RPT-003 | "Read mid-build, not on resuming" ([BA-001](BUSINESS_ARCHITECTURE.md) §8) — a distinct consumer, so it follows                                                                                                                           |
| Section 3 | RPT-004 | Answers [IA-001](INFORMATION_ARCHITECTURE.md) §9.2's Flow B, history interrogation — the deliberate, non-daily journey                                                                                                                   |

### 7.3 Responsive behaviour

Desktop-first, matching the density ruling. `ObjectPageLayout` reflows its header content to a single
column at narrow widths; **no separate mobile layout is specified**, because this is a single-user
local deployment and no spec or vision check measures a mobile journey.

---

## 8. Control Conventions

Every row names the element and the control that renders it, and cites the rule the element comes
from. Nothing here restates what a surface holds — that is the specs'.

### 8.1 RPT-001 — the page header

| Element                             | Control                                                                                                            | Source               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------- |
| §1 Status                           | `ObjectPageDynamicHeaderTitle` heading = the Initiative's name; `sap.m.ObjectStatus` for its status                | SPEC-05 BR-20        |
| §2 Current Focus                    | `sap.m.Text`, with `sap.m.ObjectAttribute` for the last-change date from the most recent `focusChange` Activity    | SPEC-05 BR-21, BR-22 |
| §3 Calculated health                | `sap.m.ObjectStatus` for the band; the reason chain as a `sap.m.List` of `sap.m.StandardListItem`                  | SPEC-05 BR-23        |
| §3 reason item, Milestone-targeted  | `sap.m.Link` — navigates **in-page** to RPT-003                                                                    | IA-001 §6.2          |
| §3 reason item, Initiative-targeted | **Plain text, not a link** — there is no Initiative-scoped surface to reach                                        | IA-001 §6.3          |
| §4 Gate tile                        | `sap.m.GenericTile` with `sap.m.NumericContent`; the subheader **names the Initiative and the run's `executedAt`** | SPEC-05 BR-24, BR-25 |

### 8.2 FRM-001 — inline on RPT-001

| Element             | Control                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Current Focus edit  | `sap.fe.macros.Field`, inline in the header content                                                                                                                                              |
| Save Focus          | `sap.m.Button` in the header title actions                                                                                                                                                       |
| Add Narrative Entry | `sap.m.Button` → `sap.m.Dialog` fragment: kind as `sap.m.Select` over the three human kinds, text as `sap.m.TextArea`                                                                            |
| Complete Initiative | `sap.m.Button` → `sap.m.Dialog` fragment: `mergeCommit` and `tag` as `sap.fe.macros.Field`; the D-73 warning as `sap.m.MessageStrip` type `Warning`, naming each Milestone with incomplete Tasks |

**Stated explicitly so it does not read as a contradiction:** two of FRM-001's three actions open a
small dialog for fields the header does not display. That is a **control choice inside D-139's inline
ruling**, not a change to it — D-139 rules where the surface lives, and it lives inline on RPT-001.

### 8.3 RPT-002 — section 1

| Element                   | Control                                                                                                                                             | Source               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| §1 The next action        | `sap.f.Card` with `sap.f.cards.Header` carrying story, `stepCode`, name, description and driver; `kind` and `requiresHuman` as `sap.m.ObjectStatus` | SPEC-04 BR-11        |
| §2 Open task queue        | `sap.fe.macros.Table`; the blocker cell as `sap.m.ObjectStatus`, a null blocker rendering an empty cell                                             | SPEC-04 BR-23, BR-25 |
| §3 Recently completed     | `sap.fe.macros.Table`, capped at 5 rows                                                                                                             | SPEC-04 BR-26, BR-27 |
| Row click, all 3 sections | The whole row navigates **in-page** to RPT-003                                                                                                      | IA-001 §6.2          |

### 8.4 RPT-003 — section 2

| Element           | Control                                                                                                                                                                         | Source                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| §1 Chain header   | `sap.m.Panel` `headerText`; `fricewType`, `description`, `shipsUi` and the **materialised Task count** as `sap.m.ObjectAttribute`                                               | SPEC-07 BR-11               |
| §1 Story selector | `sap.m.Select` — an in-page control whose selection is reflected in the `story` route parameter                                                                                 | IA-001 §4.1; D-137          |
| §2 Task rows      | `sap.fe.macros.Table`; `status` as `sap.m.ObjectStatus`; ordered by `position` ascending                                                                                        | SPEC-07 BR-06, BR-13        |
| §3 Subtask rows   | A nested `sap.m.List` beneath the `sprint-build` row **only**, `position` ascending. **Always rendered, never on expansion.** Carries no `driver` and no `requiresHuman` column | SPEC-07 BR-08, BR-09, BR-13 |

**Why the Subtasks are always rendered:** [IA-001](INFORMATION_ARCHITECTURE.md) §6.4 inventories
**four** in-page disclosures and this is not one of them. **Why they are a list and not a second
table:** SPEC-07 BR-09 gives a Subtask row four values against the Task row's eight, because SPEC-02
§3.1's subtask step table declares neither `driver` nor `requiresHuman` — different column sets are
not one table.

### 8.5 RPT-004 — section 3

| Element               | Control                                                                                                                                                                          | Source                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| §1 Defect table       | `sap.fe.macros.Table`; the `Scope` cell a `sap.m.Link` **only when Scope resolves to a story**, plain text when it resolves to an Initiative name                                | SPEC-07 BR-19, BR-20; IA-001 §6.2, §6.3 |
| §1 `description`      | `sap.m.Panel` with `expandable="true"`, in a full-width region under the row                                                                                                     | SPEC-07 BR-20; IA-001 §6.4              |
| §2 Decision list      | `sap.m.List` of `sap.m.CustomListItem`; a null `rationale` renders explicit "not recorded" text, **never a blank**                                                               | SPEC-07 BR-23, BR-24                    |
| §3 Activity timeline  | `sap.m.List` of `sap.m.CustomListItem`, **one row shape for all sixteen kinds**; the machine/human label as `sap.m.ObjectStatus`, derived from `actor` and **never** from `kind` | SPEC-07 BR-28, BR-30, BR-31             |
| §3 `payload`          | `sap.m.Panel` with `expandable="true"`; **no summary is derived from it**                                                                                                        | SPEC-07 BR-29; IA-001 §6.4              |
| No `TestRun` register | Written-only in slice 1; it surfaces as RPT-001's gate tile                                                                                                                      | D-19                                    |

**On `expandable`:** set `expandable="true"` and **leave `expanded` unset** — `sap.m.Panel`'s
`expanded` defaults to `false`, and the shared standards forbid setting an attribute to its control's
default (`lint:default-attrs`).

### 8.6 FRM-002 — the dialog

| Element              | Control                                                                                                                                          | Source                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| The dialog           | `sap.m.Dialog`, loaded by the **page controller** through the shared `DialogManager`                                                             | D-139; shared standards    |
| Mode switch          | `sap.m.SegmentedButton` — Plan Sprint / Add Story                                                                                                | D-78                       |
| Scalar fields        | `sap.fe.macros.Field`; `Type` a code-list dropdown over D-09/D-60's six singular values; `Ships UI` a `sap.m.CheckBox` with **no default value** | SPEC-06 BR-14, BR-15       |
| Story rows           | `sap.m.Table` with `sap.ui.core.dnd.DragDropInfo` for reorder before save                                                                        | SPEC-06 BR-29; IA-001 §6.4 |
| On-open notice       | `sap.m.MessageStrip`                                                                                                                             | SPEC-06 BR-31; IA-001 §6.4 |
| Prior-sprint warning | `sap.m.MessageStrip` type `Warning`, naming the **consequence** and not only the condition                                                       | SPEC-06 BR-26; D-80        |
| Duplicate story ID   | Flagged on the row as it is entered — row-level `valueState` `Error`                                                                             | SPEC-06 BR-30              |

**Why the page controller and not an `ExtensionAPI`.** The shared standards describe `DialogManager`
as constructible "from a Controller _or_ an ExtensionAPI", and the ExtensionAPI is the surface a
Fiori Elements **template** extension gets. An FPM page declares its own `viewName` and therefore has
an ordinary controller — measured in `Financial Planner/app/connection-manager`, whose controller
extends the shared `BasePageController` and constructs `new DialogManager(this)`. That is the shape
this module inherits.

### 8.7 Table standards for this module

| Convention           | Standard                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Column widths        | `![@HTML5.CssDefaults]` widths summing to **100%**                                |
| Table title          | Always present, including the row count — `{Title} ({count})`                     |
| Technical fields     | `ID`, `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy` always `@UI.Hidden`    |
| Presentation variant | `@UI.PresentationVariant` with `SortOrder` and `Visualizations: ['@UI.LineItem']` |
| Search               | **None** — departure, see below                                                   |
| Personalization      | **Off** — departure                                                               |
| Variant management   | **Off** — departure                                                               |
| Filter bar           | **None**, and no `@UI.SelectionFields` — there is no ListReport (§4.4)            |

**Three deliberate departures from `Financial Planner`'s DS-001 §9.1.1**, which mandates search,
personalization and variant management on all tables. Reason: SPEC-04 BR-31 and SPEC-07 BR-33 rule
filters and sorting out of slice 1, and the day-one volumes are **8 open Tasks, 4 Defects, 5
Decisions and 2 Activity rows** — a personalization dialog over four rows tests nothing, which is
D-22's own principle. **Financial Planner's DS-001 is that module's design system, not a shared
standard**; the shared standards live in `Financial Planner/CLAUDE.md` and are not departed from.

---

## 9. Semantic Roles (D-149)

**This module defines its own domain vocabulary and maps it onto the same five Horizon semantic
states Financial Planner's DS-001 §6 uses.** One shared shell (D-30) therefore carries one visual
grammar while each module owns its own words.

**This section names roles, never colours.** Every concrete value is stage 8's — see §12.

| Domain            | Value                                     | Semantic state               | Source               |
| ----------------- | ----------------------------------------- | ---------------------------- | -------------------- |
| Health band       | `Healthy`                                 | Success                      | D-70                 |
| Health band       | `NeedsAttention`                          | Warning                      | D-70                 |
| Health band       | `Struggling`                              | Error                        | D-70                 |
| Task status       | `Complete`                                | Success                      | SPEC-02              |
| Task status       | `In Progress`                             | Information                  | SPEC-02              |
| Task status       | `Not Started`                             | None                         | SPEC-02              |
| Step kind         | `Recommended`                             | Information                  | SPEC-07 BR-12        |
| Step kind         | `Required`                                | None — the default rendering | SPEC-07 BR-12        |
| Defect severity   | `Critical`, `High`                        | Error                        | SPEC-05 BR-07        |
| Defect severity   | `Medium`, `Low`                           | Warning                      | SPEC-05 BR-08        |
| Defect status     | `Closed`                                  | None                         | SPEC-07 BR-21        |
| Initiative status | `Active`                                  | Information                  | SPEC-05 BR-20        |
| Initiative status | `Complete`                                | Success                      | SPEC-05 BR-20        |
| Gate tile         | `failed = 0`                              | Success                      | SPEC-05 BR-24        |
| Gate tile         | `failed > 0`                              | Error                        | SPEC-05 BR-24        |
| Activity actor    | human (`sandro`)                          | Information                  | SPEC-07 BR-30, BR-31 |
| Activity actor    | machine (`migration`, any agent identity) | None                         | SPEC-07 BR-30, BR-31 |

**`Recommended` must render distinguishably from `Required`**, because it never blocks and can
legally sit open on a Done Milestone (SPEC-07 BR-12). That is a rule, not a nicety — SPEC-04's worked
example row four is exactly the state it makes legible.

**`Thriving` is excluded from the health vocabulary** (D-70): nothing in slice 1 can produce it, and
an unreachable enum value is specification without a test.

### 9.1 Two stated "none"s, both rulings

| Value              | Ruling                                                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Milestone.status` | **No semantic role — nothing renders it as a status.** SPEC-07 BR-17 gives RPT-003's chain header no derived status, and SPEC-04 BR-03 and SPEC-05 BR-06 both exclude it as an input. A role for a value nothing renders is specification without a test        |
| `fricewType`       | **No semantic role — it is a category, not a state.** Its six values (`Interface`, `Conversion`, `Enhancement`, `Form`, `Report`, `Workflow`; D-09, D-60) carry no better-or-worse ordering, so colouring them would assert a judgment the domain does not make |

### 9.2 The collision check this ruling had to pass

D-30 puts both modules in one chrome, so two colour systems would collide — but so would one colour
meaning two things. Checked against `Financial Planner`'s DS-001 §6:

| Semantic state | Financial Planner means           | Project Tracker means                         | Aligned? |
| -------------- | --------------------------------- | --------------------------------------------- | -------- |
| Success        | Active card, met bonus, on budget | Healthy, Complete, gate passed                | Yes      |
| Error          | Missed bonus, over budget         | Struggling, Critical/High Defect, gate failed | Yes      |
| Warning        | To Cancel, near limit             | NeedsAttention, Medium/Low Defect             | Yes      |
| Information    | Focus state, in-progress bonus    | In Progress, Recommended, Active, human       | Yes      |
| None (neutral) | Closed state, pending, historical | Not Started, Closed Defect, machine           | Yes      |

**The grammar aligns on all five.** Green means good in both, red means bad in both, grey means
inactive in both. That is what makes an own-vocabulary ruling safe in a shared shell, and it is the
check the alternative — inheriting DS-001 §6 wholesale — would have failed differently, since that
table has no row for a health band or a defect severity.

---

## 10. Status Indicators (D-149)

`ObjectStatus` for states; `NumericContent` inside `GenericTile` for the gate tile's counts.

| Domain            | Value           | Component                         | State           | Icon                            |
| ----------------- | --------------- | --------------------------------- | --------------- | ------------------------------- |
| Health band       | Healthy         | `ObjectStatus`                    | Success         | `sap-icon://sys-enter-2`        |
| Health band       | NeedsAttention  | `ObjectStatus`                    | Warning         | `sap-icon://alert`              |
| Health band       | Struggling      | `ObjectStatus`                    | Error           | `sap-icon://error`              |
| Task status       | Complete        | `ObjectStatus`                    | Success         | `sap-icon://accept`             |
| Task status       | In Progress     | `ObjectStatus`                    | Information     | `sap-icon://process`            |
| Task status       | Not Started     | `ObjectStatus`                    | None            | `sap-icon://pending`            |
| Step kind         | Recommended     | `ObjectStatus`                    | Information     | `sap-icon://hint`               |
| Defect severity   | Critical / High | `ObjectStatus`                    | Error           | `sap-icon://error`              |
| Defect severity   | Medium / Low    | `ObjectStatus`                    | Warning         | `sap-icon://alert`              |
| Defect status     | Closed          | `ObjectStatus`                    | None            | `sap-icon://decline`            |
| Initiative status | Active          | `ObjectStatus`                    | Information     | `sap-icon://play`               |
| Initiative status | Complete        | `ObjectStatus`                    | Success         | `sap-icon://accept`             |
| Gate tile         | passed / failed | `NumericContent` in `GenericTile` | Success / Error | —                               |
| Activity actor    | human           | `ObjectStatus`                    | Information     | `sap-icon://person-placeholder` |
| Activity actor    | machine         | `ObjectStatus`                    | None            | `sap-icon://robot`              |

Icon assignments may be refined during build. **The component-and-state pairing is the standard.**

**This module has no `ObjectNumber` row, and that is measured rather than omitted.** Financial
Planner's DS-001 §8 uses `ObjectNumber` for amounts carrying semantic meaning — budget figures,
profitability. Project Tracker renders no such amount: its numeric values are test counts and
coverage percentages inside the gate tile, which `NumericContent` already carries.

---

## 11. Chart Conventions (D-150)

**None. This module specifies no chart, and that is a ruling.**

Measured this session: a case-insensitive search for `chart|graph|vizframe|sparkline|donut|apexcharts`
across the four UI-bearing specs matches **7** lines — 2 in SPEC-04, 1 in SPEC-05, 1 in SPEC-06 and 3
in SPEC-07. **Five of the seven are the word `paragraph`** and match on `graph`; the arithmetic is
recorded here so the next reader does not "correct" the figure below. The remaining **two** are
[`SPEC-04`](specs/SPEC-04-NEXT-ACTION.md) BR-33 (`:223`) and
[`SPEC-07`](specs/SPEC-07-CHAIN-AND-REGISTERS.md) BR-03 (`:212`), and **both are deferral sentences**
handing chart types to this stage — not requests for a chart. **No spec requires a chart.**

The surfaces are tiles, tables, a nested list and a timeline. The slice-1 volumes — **8** open Tasks,
**4** Defects, **5** Decisions, **2** Activity rows and **1** TestRun — do not support a chart that
would tell Sandro anything a table does not. **No chart library is adopted**, and
`Financial Planner/app/shared/controls/VizFrameCard.ts` and `ApexChartCard.ts` are not used by this
module.

Recorded as a stated "none" on **D-134's precedent**: an empty heading reads as an oversight, a
stated "none" reads as a ruling. Both deferring spec sentences are discharged by this answer.

---

## 12. Empty, Loading & Error States (D-151)

**One `project_view` call feeds the whole page**, so the page has exactly **one** loading state and
**one** read-failure state — not four. That follows directly from SPEC-04 BR-32, SPEC-05 BR-30 and
SPEC-07 BR-01 all naming a single call, and it makes per-section busy states wrong rather than
merely unnecessary.

| Scenario                                    | Convention                                                                                                      | Source        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------- |
| Page loading                                | `sap.m.BusyIndicator` on the `ObjectPageLayout` until the single read returns. **No per-section busy state**    | D-151         |
| The single read fails                       | **One** page-level `sap.m.MessageStrip` type `Error` at the top of the page; sections render their empty states | D-151         |
| Table with no rows                          | Standard `noDataText`. **No illustrated empty states**                                                          | D-151         |
| RPT-001 §1 — no Active Initiative           | Section empty state; **no status value is invented**                                                            | SPEC-05 BR-20 |
| RPT-001 §2 — `currentFocus` null            | Section empty state rather than a blank. **The day-one case**                                                   | SPEC-05 BR-22 |
| RPT-001 §4 — no `TestRun` at all            | Section empty state rather than a zeroed tile                                                                   | SPEC-05 BR-26 |
| RPT-002 §3 — recently completed             | **Renders zero rows on day one**, filling from the first `complete_stage` after cutover. Not an error state     | SPEC-04 BR-29 |
| RPT-003 — Milestone with zero Tasks         | Empty state stating the chain was **never recorded** — not skipped stages, not pending work                     | SPEC-07 BR-14 |
| RPT-003 — Conditional step not materialised | **Nothing at all.** No row exists; the chain is simply shorter and nothing marks a skip                         | SPEC-07 BR-10 |
| RPT-004 — all three registers               | **No empty state, because none is reachable**                                                                   | SPEC-07; D-89 |
| Long write (FRM-001, FRM-002)               | Button `busy` state. No blocking `BusyDialog` — these are single-row writes                                     | D-151         |

**The empty-state _text_ is the specs', not this document's.** This document rules the **treatment**:
text-based placeholders, no illustrations — matching what Financial Planner's DS-001 §9.4 chose, so
one shell does not carry two empty-state idioms.

**RPT-003 and RPT-004 sit on opposite sides of the same principle deliberately** (D-89). RPT-003's
empty state is the **normal case**, on eleven of twelve Milestones; RPT-004's is **unreachable**,
because the migration writes 4 Defects, 5 Decisions and 2 Activity rows before any user opens the
page and nothing deletes any of them. Recorded so the asymmetry does not read as an inconsistency.

---

## 13. Theme Boundary (D-152)

**This document names semantic roles and control conventions. `THEME.md` (stage 8) owns every
concrete value.**

That is the split Financial Planner already runs and the split `/ux-test` already expects:
`.claude/agents/ux-tester.md:19-20` reads `DESIGN_SYSTEM.md` for "density, layout grid, chart
conventions, status indicators, the semantic colour roles", and `:21-23` reads `THEME.md` for "the
concrete visual contract: the brand palette, the ShellBar treatment, border radius, the CSS
custom-property overrides."

Measured this session: `Financial Planner/design/DESIGN_SYSTEM.md` is **307** lines and its §6 names
roles; `Financial Planner/design/THEME.md` is **466** lines and holds the palette, border radius,
component overrides, the CSS custom-property layer and the override strategy.

### 13.1 What stage 8 still owns — and one question the exemplar never faced

Stage 8 has real work: no concrete value in this module has been decided.

**And it inherits a question Financial Planner's own Theme stage never had to answer.** D-146 puts
this module inside **one `<body>` at one origin**, with `data-sap-ui-xx-cssVariables="true"` set
page-globally (`Financial Planner/app/index.html:24`) and
`Financial Planner/app/shared/css/theme-overrides.css` loaded once for the whole page. **Two THEME
documents writing CSS custom properties into that one page would collide.**

Stage 8's first question is therefore whether this module **inherits Financial Planner's theme
wholesale** or **scopes its overrides under a component-root class**.

**This stage names that question and does not answer it.** It is stage 8's — and answering it here
would require this document to name concrete values, which its own boundary forbids.

---

## 14. Spec Amendments

The edits are applied in-session by the host; this section is the record.

| Spec                    | Amendment                                                                                                                                                                                                                                                                                            | Decision     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| SPEC-01                 | **The browser read path is named.** `project_view`'s payload is additionally exposed as a **read-only OData projection** on the same CAP service. INT-001's stdio transport is unchanged — §3.1's "no HTTP server, no listening socket" describes the MCP server, not the CAP service it connects to | D-145        |
| SPEC-04 (`:223`, BR-33) | "Layout, chart types, section arrangement and navigation" — layout and navigation were IA-001's; **chart types are answered here: none**                                                                                                                                                             | D-148, D-150 |
| SPEC-05 (`:223-226`)    | The deferred "Fiori Elements vs freestyle" is answered — **FE FPM, drafts off**. FRM-001's inline placement is unchanged (D-139)                                                                                                                                                                     | D-144        |
| SPEC-06 (`:101-105`)    | The same deferred heading answered the same way — **FE FPM, drafts off**                                                                                                                                                                                                                             | D-144        |
| SPEC-07 (`:212`, BR-03) | "Layout, chart type, section arrangement, navigation and interaction" — **chart type answered: none**; controls and layout answered here                                                                                                                                                             | D-148, D-150 |
| SPEC-11 BR-06 (`:159`)  | Its open clause — "whether any becomes so is **not yet decided**", citing SPEC-05 §3 and SPEC-06 §3's deferral — **is closed. Drafts are ruled off.** The filter's text is unchanged, because it is unconditional by design                                                                          | D-144        |

---

## 15. Risks Assigned to This Stage

**None — and the register was checked rather than assumed.**

Verified this session: `research/README.md` §7's routing table routes **Information Architecture /
Design System / Theme → RSH-003** (`research/README.md:148`). RSH-003's only live risk was **R9**,
which was **executed and closed** at the Information Architecture stage (D-140), regraded `Inferred`
→ `Verified`. No other row in `research/README.md` §5 names this stage.

Stated rather than left silent, because a stage that inherits nothing and does not say so is
indistinguishable from one that never looked.

For completeness — where the still-open risks actually sit, none of them here:

| Risk               | Owner                    | Source                              |
| ------------------ | ------------------------ | ----------------------------------- |
| **R1**             | The **Data Model** stage | D-39                                |
| **R4**, **R7**     | **INT-007's own build**  | D-121                               |
| **R10**            | **CNV-005**              | D-119                               |
| R2, R3, R5, R6, R8 | Closed or dissolved      | D-33, D-29, D-112/D-113, D-32, D-29 |

**The reverse proxy D-141 rules for is untested and belongs to Tech Stack.** It is not executed here
and this stage does not design around it having been executed.

### 15.1 This stage has no linter

**Nothing mechanically validates a control choice, a semantic role map, or count accuracy.** The
coverage check behind this document is **procedural**, exactly as
[BA-001](BUSINESS_ARCHITECTURE.md) §3.9 records for the catalogue and
[IA-001](INFORMATION_ARCHITECTURE.md) §8.2 records for the architecture. Read the counts against the
artifacts if you need them to be true.

---

## 16. Decisions Reference

| ID        | Title                                                                                      | Summary                                                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-144** | Fiori Elements FPM for all six surfaces, on non-draft entity sets                          | Uniform across all 6 objects. **Drafts off** — measured against the repo's only FPM app, which runs on a non-draft entity set. Closes SPEC-11 BR-06's open clause.                        |
| **D-145** | The browser read path is a read-only OData projection of `project_view`                    | INT-001 is MCP stdio and a browser cannot call it. One handler, two transports; the projection is read-only, so D-05 stands. Places a real requirement on Data Model.                     |
| **D-146** | Theme and density are inherited, not chosen                                                | `sap_horizon` + Compact. One `<body>`, one theme attribute (`Financial Planner/app/index.html:17`, `:45`). A second theme is not expressible in that page.                                |
| **D-147** | The shared UI5 library dependency extends D-143's shell dependency                         | `app/shared` is `com.financialplanner.shared` and the shared standards mandate its helpers. Accepted for slice 1, attached to D-143's existing owner.                                     |
| **D-148** | The project view is one `ObjectPageLayout` — RPT-001 as header, 3 sections in resume order | `sap.uxap` is already preloaded. A `GridContainer` grid was rejected: the four Reports are not peer cards, because one of them is a page header.                                          |
| **D-149** | Project Tracker owns its domain vocabulary over the shared semantic states                 | 17 mappings, 2 stated "none". The grammar aligns with Financial Planner's DS-001 §6 on all five states, which is what makes an own-vocabulary ruling safe in one shell.                   |
| **D-150** | No charts — a stated "none"                                                                | No spec specifies a chart; the 2 hits across the 4 UI specs are deferral sentences. Recorded on D-134's precedent rather than dropped.                                                    |
| **D-151** | One call, one loading state, one failure state                                             | A single `project_view` read feeds all four Reports, so page-level states are correct and per-section ones are wrong. RPT-003's empty state is the normal case; RPT-004's is unreachable. |
| **D-152** | The Theme boundary — roles here, values at stage 8                                         | This document names no concrete value. Stage 8 inherits a question the exemplar never faced: two THEME documents writing CSS custom properties into one `<body>` would collide.           |

---

_This document governs what Project Tracker's six UI-bearing surfaces are built with and how they look — build technology, theme, density, layout, controls, semantic roles, status indicators, chart conventions and state treatment. It traces to [Business Architecture](BUSINESS_ARCHITECTURE.md) (the FRICEW catalogue), [Information Architecture](INFORMATION_ARCHITECTURE.md) (the surfaces it styles), the UI-bearing specs [SPEC-04](specs/SPEC-04-NEXT-ACTION.md), [SPEC-05](specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md), [SPEC-06](specs/SPEC-06-SPRINT-PLANNING.md) and [SPEC-07](specs/SPEC-07-CHAIN-AND-REGISTERS.md), and the [Decisions Log](DECISIONS_LOG.md) at D-144 … D-152. Theme (stage 8) resolves the semantic roles §9 declares into concrete values; Data Model (stage 9) consumes §4.3's draft ruling and §5.3's read-path requirement._
