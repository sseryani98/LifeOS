# Information Architecture

**Document ID:** IA-001
**Version:** 1.0
**Date:** 2026-08-06
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                      |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-06 | Sandro & Claude | Initial creation from the Information Architecture stage. 6 UI-bearing objects onto 1 route with 1 optional parameter; 8 navigation links mapped; shell placement ruled; risk **R9 executed** and regraded `Inferred` → `Verified`. Records D-137 through D-143. |

---

## 2. Summary

This document settles how slice 1's six UI-bearing objects decompose into pages, how each is reached,
where the module's UI sits in the shared shell, and which origin serves it. It does not restate what
any surface holds — that is the specs' — and it decides no colour, control or entity.

| Aspect                    | Outcome                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI-bearing objects**    | **6** — RPT-001…RPT-004, FRM-001, FRM-002. WFL-001 ships no UI                                                                                           |
| **Routes**                | **1** (`project-view`) plus **1** optional `story` parameter (D-137)                                                                                     |
| **In-page disclosure**    | **4** disclosures inventoried; RPT-003's story selector changes a section, not a page — no second route (D-137)                                          |
| **Build technology**      | Deferred to **Design System (stage 7)**, deadline **before Data Model (stage 9)** — uniform across all **6** objects, with two named constraints (D-138) |
| **Navigation links**      | **8** mapped — **5** carry `{workspace-slug}/{story-id}`, **1** carries the workspace slug, **2** carry none by ruling (D-137, D-139)                    |
| **Negative link rulings** | **2** — Initiative-targeted items are not links; the Decision list and Activity timeline carry no outbound links (D-137)                                 |
| **Side-nav entries**      | **1**, in a **third** nav group added to the existing shell (D-143)                                                                                      |
| **Landing**               | The project view, opened with no parameter set and RPT-003 defaulted per SPEC-07 BR-05 (D-137)                                                           |
| **Shell placement**       | One entry in Financial Planner's existing `app/shell`; the shell stays Financial-Planner-owned for slice 1 (D-30, D-143)                                 |
| **Origin**                | **One origin** via a reverse proxy fronting both CAP processes; execution belongs to Tech Stack (D-141)                                                  |
| **Risk R9**               | **Executed.** Grade `Inferred` → **`Verified`**. Its stated premise was wrong — composition breaks in dev too (D-140)                                    |
| **Reachability**          | **6 of 6** UI-bearing objects reachable; the project view has exactly **1** path, and that is acceptable                                                 |
| **Task flows**            | **6** falsifiable checks → **2** flows and **3** stated "none"; checks 2 and 5 fold into one flow (D-142)                                                |
| **Wave-gating**           | Hidden-until-built. With **1** nav entry there is no partial-nav state to gate — the ruling is near-vacuous and is stated as such (D-139)                |
| **Spec amendments**       | **8** recorded across SPEC-04, SPEC-05, SPEC-06, SPEC-07 and SPEC-11                                                                                     |
| **Decisions logged**      | **D-137 through D-143** (7 decisions)                                                                                                                    |

---

## 3. Surface Inventory

**6** of the 22 objects in [BA-001](BUSINESS_ARCHITECTURE.md) bear UI — the four Reports of its §8 and
the two Forms of its §7. All six compose onto one page. The contribution column names what each object puts
on that page; the section content itself is the spec's and is not restated here.

| ID          | Name                     | Spec    | Contributes                                                                                                                                          | R/W                                                                  | Lands on                                        |
| ----------- | ------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| **RPT-001** | Workspace Header         | SPEC-05 | 4 sections — Status (the current Initiative's, D-75), Current Focus, calculated health (D-70, D-71), gate tile from the most recent `TestRun` (D-72) | Read only — one `project_view` call (SPEC-05 BR-30)                  | The project view                                |
| **RPT-002** | Next Action & Task Queue | SPEC-04 | 3 sections — next action, open task queue, five most recently completed                                                                              | Read only — one `project_view` call (SPEC-04 BR-32)                  | The project view                                |
| **RPT-003** | Methodology Chain        | SPEC-07 | 3 sections — chain header, Task rows, Subtask rows nested under `sprint-build` only                                                                  | Read only (SPEC-07 BR-01, BR-02)                                     | The project view, one Milestone at a time       |
| **RPT-004** | Registers                | SPEC-07 | 3 sections — Defect table, Decision list, combined Activity timeline                                                                                 | Read only (SPEC-07 BR-01, BR-02)                                     | The project view                                |
| **FRM-001** | Workspace Header Editor  | SPEC-05 | 7 fields, 3 actions — Save Focus, Add Narrative Entry, Complete Initiative (`SPEC-05:218`)                                                           | Writes; one Activity row per write, same transaction (SPEC-05 BR-32) | Inline on RPT-001 (D-139)                       |
| **FRM-002** | Sprint Planning Form     | SPEC-06 | 9 fields, 2 modes — Plan Sprint, Add Story (D-78)                                                                                                    | Write only — creates; never edits or removes (SPEC-06 BR-04)         | A dialog launched from the project view (D-139) |

### 3.1 WFL-001 ships no UI — stated, not omitted

**WFL-001 (Stage State Machine) has no surface, and that is a ruling.** It is enforcement invoked
exclusively through INT-001's verbs (BA-001 §9), so it renders nothing and needs no page. Its effects
are visible only as the state RPT-003 displays. Recorded explicitly so its absence from the inventory
above reads as measured rather than missed.

---

## 4. Page & Route Decomposition (D-137)

**One route, plus one optional parameter. Everything else is in-page disclosure.**

| Element                 | Ruling                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route                   | `project-view` — the module's only route, on Project Tracker's own component router (§7)                                                                   |
| Optional parameter      | `story`, carrying `{workspace-slug}/{story-id}`                                                                                                            |
| What the parameter does | Selects which Milestone's chain RPT-003 renders. It overrides the BR-05 default; the default still applies when the parameter is absent                    |
| Default when absent     | The story `next_action()` resolves to (SPEC-07 BR-05); when that is null, highest `Initiative.position` then highest `Milestone.position` (SPEC-07 BR-05a) |

The addressing value is not invented here: `{workspace-slug}/{story-id}` is the value SPEC-04 BR-30
already produces (`:156-157`), stated identically at SPEC-05 BR-29 (`:187-188`) and SPEC-07
(`:107-109`).

### 4.1 Tested and ruled in-page, not a route

| Candidate                    | Ruling                         | Source        |
| ---------------------------- | ------------------------------ | ------------- |
| RPT-004 Activity `payload`   | Renders on expansion — in-page | SPEC-07 BR-29 |
| RPT-004 Defect `description` | Renders on expansion — in-page | SPEC-07 BR-20 |
| RPT-003 story selector       | Changes a section, not a page  | SPEC-07 BR-05 |

### 4.2 Why one route

PSV falsifiable check 3 — "Returning after a week away costs minutes, not a session: the view alone
is enough to resume" (`PROBLEM_STATEMENT_AND_VISION.md:103`) — is the vision doc's **only** journey
check, and it forbids resumption requiring navigation. SPEC-07 BR-05 additionally wants RPT-003 to
agree with RPT-002 mid-build, which is only visible if both render together.

The parameter is designed now rather than at build because RSH-003 §12 item 3
(`research/ui5-multi-app-shell.md:361`) names deferring the routing strategy as the expensive
deferral.

---

## 5. Build Technology (D-138)

**Ruling: deferred to the Design System stage (stage 7), with a hard deadline — before the Data Model
stage (stage 9).** This is a ruling with an owner and a date, not silence. All six objects carry the
same disposition.

| ID      | Object                   | Build-technology disposition                          | Reason                                                                  |
| ------- | ------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| RPT-001 | Workspace Header         | Deferred to Design System (stage 7); deadline stage 9 | DS-001 precedent; no spec sentence defers it for this object — see §5.2 |
| RPT-002 | Next Action & Task Queue | Deferred to Design System (stage 7); deadline stage 9 | DS-001 precedent; no spec sentence defers it for this object — see §5.2 |
| RPT-003 | Methodology Chain        | Deferred to Design System (stage 7); deadline stage 9 | DS-001 precedent; no spec sentence defers it for this object — see §5.2 |
| RPT-004 | Registers                | Deferred to Design System (stage 7); deadline stage 9 | DS-001 precedent; no spec sentence defers it for this object — see §5.2 |
| FRM-001 | Workspace Header Editor  | Deferred to Design System (stage 7); deadline stage 9 | Discharges `SPEC-05:223-226`'s deferring sentence                       |
| FRM-002 | Sprint Planning Form     | Deferred to Design System (stage 7); deadline stage 9 | Discharges `SPEC-06:101-103`'s deferring sentence                       |

**Why deferred.** Financial Planner's own Design System owned this ruling — the exemplar IA has no
Build Technology section precisely because DS-001 decided it, and DS-001 ran 2026-02-16, before IA on
2026-02-21. That is the precedent this repo actually set. Design System is the very next stage, so
the deferral is one stage long.

**Why the deadline is stage 9.** `SPEC-11` BR-06
([`design/specs/SPEC-11-PROJECT-STATE-EXPORTER.md:159`](specs/SPEC-11-PROJECT-STATE-EXPORTER.md))
carries a `.drafts` exclusion filter written to be true either way _because_ this was undecided.
Draft enablement follows from the Fiori Elements answer, and Data Model is the consumer that breaks
if the answer is still open. Stage 7 lands before stage 9, so the deadline holds.

### 5.1 Two constraints stage 7 inherits

1. **A full Fiori Elements template app is ruled out by D-137, and that is not a free choice.**
   One-route-plus-parameter is a composed-page shape. `sap.fe.templates` ListReport/ObjectPage bring
   their own routing and their own route patterns. The surviving options are **freestyle** or **Fiori
   Elements FPM (a custom page)** — the shape Financial Planner's `connection-manager` already uses
   (`sap.fe.core` + `sap.fe.macros`, target `sap.fe.core.fpm`, measured this session).
2. **A stated tension, not a decision taken here.** Fiori Elements templates are driven by OData
   entity sets, and D-05 removes the CRUD path into project state on purpose. Exposing draft-enabled
   entity sets to satisfy an FE template would rebuild the escape hatch D-05 exists to close. Stage 7
   resolves this; this stage only records it.

### 5.2 The four Reports never asked the question

`SPEC-05:223-226` and `SPEC-06:101-103` both read "Whether it is built with Fiori Elements or
freestyle… are the Information Architecture / Design System stages' call and are not decided here
(D-21)". **No spec sentence defers build technology for RPT-001…RPT-004 at all.** The ruling above
covers them anyway, so an unasked question does not reach build unanswered.

---

## 6. Navigation & Entry Points (D-137, D-139)

### 6.1 Landing

The project view is the module's only page, so the landing question is what it opens _on_, not which
page. It opens with **no parameter set** and RPT-003 defaulted per SPEC-07 BR-05.

### 6.2 Navigation map

Every row names source, target, trigger and the addressing value, and cites the spec that produces
that value.

| Source                                    | Target                                | Trigger                                                     | Addressing value                                                                   | Produced by                             |
| ----------------------------------------- | ------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| Shared shell side nav                     | Project view                          | Nav item click                                              | Workspace slug `financial-planner` (one Workspace, D-11)                           | SPEC-06 BR-06; SPEC-06 FUT-001 (`:293`) |
| RPT-002 story row (any of its 3 sections) | RPT-003 (in-page)                     | Row click                                                   | `{workspace-slug}/{story-id}`                                                      | SPEC-04 BR-30 (`:156-157`, `:218`)      |
| RPT-001 health reason item                | RPT-003 (in-page)                     | Item click — **only when the item's target is a Milestone** | `{workspace-slug}/{story-id}`                                                      | SPEC-05 BR-29 (`:187-188`, `:301`)      |
| RPT-004 Defect row, Scope cell            | RPT-003 (in-page)                     | Cell click — **only when Scope resolves to a story**        | Scope = `{workspace-slug}/{story-id}`                                              | SPEC-07 BR-20 (`:234`)                  |
| RPT-003 story selector                    | RPT-003 (in-page)                     | Selection                                                   | `{workspace-slug}/{story-id}`                                                      | SPEC-07 BR-05, BR-05a (`:214-216`)      |
| Project view                              | FRM-002 (dialog)                      | "Plan Sprint" / "Add Story" action                          | **None** — Workspace is read-only context inherited from the page                  | SPEC-06 BR-06 (`:150`)                  |
| Project view (RPT-001)                    | FRM-001 (inline)                      | Inline edit, or any of the 3 actions                        | **None** — the target Initiative is read-only, "the Workspace's Active Initiative" | SPEC-05 (`:209`)                        |
| External / bookmark                       | Project view with RPT-003 preselected | URL carrying the `story` parameter                          | `{workspace-slug}/{story-id}`                                                      | SPEC-04 BR-30                           |

**8 links. 5 carry `{workspace-slug}/{story-id}`, 1 carries the workspace slug, and 2 carry no
addressing value** — because their target is fixed context the page already holds, not a record to
address.

### 6.3 Two negative rulings

Stated rather than implied, so a build persona does not read a missing link as an oversight.

| Ruling                                                                                                                           | Why                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RPT-001 reason items whose target is an **Initiative name** are **not links**. Same for Initiative-scoped Defect rows in RPT-004 | There is no Initiative-scoped surface to reach                                                                                                             |
| RPT-004's Decision list and Activity timeline carry **no outbound links**                                                        | SPEC-07 (`:184-185`) gives Activity a `target` value, but slice 1 has no surface for every target kind, and inventing one would be a page nobody specified |

### 6.4 In-page disclosure inventory — four items, not navigation

| Disclosure                                   | Trigger        | Source                 |
| -------------------------------------------- | -------------- | ---------------------- |
| RPT-004 Activity `payload`                   | Row expansion  | SPEC-07 BR-29          |
| RPT-004 Defect `description`                 | Row expansion  | SPEC-07 BR-20          |
| FRM-002's on-open notice                     | Dialog open    | SPEC-06 BR-31 (`:193`) |
| FRM-002's reorderable story rows before save | Drag / reorder | SPEC-06 BR-29 (`:191`) |

### 6.5 Wave-gating (D-139)

The module ships **one** nav entry, built entirely in **Wave 2**; **Wave 3 adds no UI**. Gating is
**hidden-until-built**, inheriting the planner's pattern (its D-307).

**The ruling is near-vacuous and is recorded as such rather than dressed up:** with one entry there is
no partial-nav state to gate. The entry either exists after Wave 2 or does not exist before it.

---

## 7. Shell Placement & Origin (D-140, D-141, D-143)

### 7.1 Placement

D-30 makes one shared UI5 shell across modules non-negotiable, so Project Tracker is **one nav entry
in the existing shell**, not its own shell. Measured on disk this session:

| Measurement                                       | Value                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Financial Planner/app/` directories              | **6** — `admin-master-data`, `connection-manager`, `csv-import-wizard`, `transactions`, `shell`, `shared`: **4** hosted app components, **1** shell, **1** shared library                                                                                  |
| `Financial Planner/app/index.html` resource roots | **6** (`:18-23`), all **relative** (`./…`)                                                                                                                                                                                                                 |
| UI5 runtime                                       | `https://ui5.sap.com/1.136.16/resources/sap-ui-core.js` (`:16`) — pinned **1.136.16**, matched by `minUI5Version` in **5 of the 6** manifests under `app/` — the sixth is `app/shared/manifest.json`, a `"type": "library"` with no `sap.ui5` block at all |
| `app/shell/controller/NavConfig.ts`               | **18** entries, counted as object-literal keys, mapping to **4** distinct components                                                                                                                                                                       |
| `app/shell/view/App.view.xml`                     | **2** top-level nav groups (Transactions, Admin) and **18** leaf entries                                                                                                                                                                                   |
| Project Tracker adds                              | A **third** group with **one** entry                                                                                                                                                                                                                       |

A `grep -c "component:"` over `NavConfig.ts` returns **19** because the `NavEntry` interface declares
the field at `NavConfig.ts:6`. The literal count is **18**; the grep figure is recorded here only so
the next reader does not "correct" the right number.

**Mount mechanism.** A `sap.ui.core.ComponentContainer` per component, cached, then
`component.getRouter().navTo(route, {}, true)` — `app/shell/controller/App.controller.ts:87-112`. The
shell itself has **no router**; routing is delegated to each hosted component. Project Tracker's
component supplies its own router and its own `project-view` route, which is what §4's parameter
lives on.

### 7.2 The shared shell stays Financial-Planner-owned for slice 1 (D-143)

Measured: the shell is namespaced `com.financialplanner.shell` throughout — `app/shell/manifest.json:3`,
`app/shell/package.json:2`, `app/shell/Component.ts:8`, `app/shell/tsconfig.json:10`, and both
references in `app/index.html` (`:18`, `:46`). Nothing outside Financial Planner references it.

**Ruling: the shell stays where it is.** Project Tracker registers its component into
`Financial Planner/app/index.html`'s resource roots and into `NavConfig.ts`.

**Consequence, stated plainly:** this module's UI acquires a build-time dependency on the other
module's `app/` folder, and the root `CLAUDE.md` forbids a non-module folder at the repo root, so
relocating or renaming the shell has nowhere obvious to go. **Owner of the relocation: whoever builds
the third module's UI, or the first cross-module shell navigation — whichever comes first.** It is
not owed by slice 1, and slice 1 works without it. This stage names the debt rather than leaving
build to discover it.

### 7.3 Risk R9 — executed (D-140)

**Grade: `Inferred` → `Verified`.**

**What was run.** Two CAP 9.8.4 servers in a scratch location outside the module tree — `serverA` on
port 4004 serving a host page, `serverB` on port 4005 serving a UI5 component plus an OData service
at `/odata/v4/probe/`. In-memory SQLite, so **R1 did not gate this**. UI5 1.136.16 from the pinned
CDN. Driven in a real browser, then repeated under `NODE_ENV=production` on serverB.

| #   | Measured result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **An absolute server-root OData path resolves against the _document_ origin, not the resource origin.** The component was served from :4005 and its `$metadata` request went to `http://localhost:4004/odata/v4/probe/$metadata` → **404**. Zero OData requests reached :4005. Financial Planner's four manifests use exactly this form — `"uri": "/service/adminSvcs/"` and `"uri": "/service/transactionSvcs/"`, all at `manifest.json:13`, re-measured this session                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2   | **R9's stated premise is FALSE, and this is the finding.** The register and D-69 both say cross-origin composition "would probably work under `cds watch`" and break under `NODE_ENV=production`. **It breaks in dev too.** CAP's CORS middleware sets only `access-control-allow-origin` and, on `OPTIONS`, `access-control-allow-methods` — it **never sends `Access-Control-Allow-Headers`** (`node_modules/@sap/cds/server.js:93-102`, read directly). UI5's OData V4 model always sends `X-CSRF-Token`, so the `$batch` preflight is rejected: _"Request header field x-csrf-token is not allowed by Access-Control-Allow-Headers in preflight response."_ Composition survives metadata and dies on the first real data request. Under `NODE_ENV=production` CORS is off entirely (`@sap/cds/lib/env/defaults.js:20` — `cors: !production`; mounted conditionally at `server.js:43-44`) and the **manifest fetch itself is blocked**, giving a blank page |
| 3   | **An absolute `http://` dataSource URI crashes the CAP process that serves the app, at boot.** `@sap/cds-fiori/app/routes.js:68` filters `!ds[k].uri.startsWith('/')` and treats everything else as relative, joining it into an Express route: `PathError: Missing parameter name`. Workaround is `cds.fiori.routes: false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

**What the spike could not establish, and it must be stated.** The spike ran `kind: dummy` auth
throughout, because production defaults to `jwt` and crashed on a missing `@sap/xssec`.
**Credentialed cross-origin — cookies, `Access-Control-Allow-Credentials`, a CSRF token round-trip
under a real auth strategy — is untested.** It also used a classic AMD `Component.js` rather than the
repo's real `cds-plugin-ui5` + `ui5-tooling-transpile` toolchain, tested no Fiori Elements app, and
exercised no cross-app shell navigation. **The reverse-proxy option was not tested at all.**

### 7.4 Origin position — one origin via a reverse proxy (D-141)

**Position: one origin, via a reverse proxy fronting both CAP processes.** Every manifest keeps its
relative `/service/…` URI unchanged; the proxy routes by path prefix to the owning process.

**Rationale.** The multi-origin alternative _was_ proven green end-to-end under `NODE_ENV=production`
(including a `$batch` POST) but needs **three coordinated changes** — an absolute dataSource URI in
the manifest, `cds.fiori.routes: false` on the app-serving process, and a hand-written CORS
middleware on the data process echoing `access-control-request-headers` — spread across two modules,
hand-maintained, and **untested under real auth**. D-82 widened R9 to reach both Forms precisely
because a Form issues OData **writes** and a POST preflights; credentialed write traffic is exactly
the case the spike left unproven. One origin makes all three changes unnecessary.

**Honest cost.** The reverse proxy is itself untested here, and it is a moving part this repo does not
currently have. **Its execution belongs to the Tech Stack stage**, which the IA skill already names as
the consumer of this stage's origin constraint.

---

## 8. Discoverability Audit

All **6** UI-bearing objects are reachable. The rows below are addressable targets, not objects — the
first row carries all four Reports, since they compose onto one page. Paths are named, not asserted.

| Target                                  | Paths | Named paths                                                                                                                                                                                                   |
| --------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project view (RPT-001…RPT-004 composed) | **1** | Shared shell side nav                                                                                                                                                                                         |
| RPT-003 chain for a _specific_ story    | **4** | RPT-002 row click; RPT-001 reason item (Milestone-targeted only); RPT-004 Defect Scope cell (story-scoped only); the `story` URL parameter. Plus the SPEC-07 BR-05 default, which needs no interaction at all |
| FRM-001                                 | **1** | Inline on RPT-001 — no navigation                                                                                                                                                                             |
| FRM-002                                 | **1** | Dialog action on the project view                                                                                                                                                                             |
| RPT-004 Activity `payload`              | **1** | Row expansion                                                                                                                                                                                                 |
| RPT-004 Defect `description`            | **1** | Row expansion                                                                                                                                                                                                 |

### 8.1 The single-path surface, called out

**The project view is reachable exactly one way — the shell side nav — and that is acceptable.** It is
the module's only page. A second path would have to originate outside the module, and D-11 gives
slice 1 no second project to originate one.

### 8.2 This stage has no linter

**Nothing mechanically validates reachability, link targets or count accuracy.** The coverage check
behind this document and the writer's validation are **procedural**, exactly as BA-001 §3.9 records
for the catalogue. Read the counts against the artifacts if you need them to be true.

---

## 9. Task Flow Mapping (D-142)

The vision doc carries **6** falsifiable checks (`PROBLEM_STATEMENT_AND_VISION.md:101-106`). They
resolve to **2** flows and **3** stated "none"; checks 2 and 5 fold into one flow. A check with no
journey keeps its row and is answered "none — because…", on D-134's precedent.

### 9.1 Flow A — check 3: resume after a week away

`PROBLEM_STATEMENT_AND_VISION.md:103` — "Returning after a week away costs minutes, not a session: the
view alone is enough to resume."

| Step | Surface      | Action                                                                                         |
| ---- | ------------ | ---------------------------------------------------------------------------------------------- |
| 1    | Project view | Open it. Read RPT-001's status, Current Focus, health and gate tile, and RPT-002's next action |

**One step. Zero navigation.** It is documented precisely _because_ it is one step: the flow is the
assertion under test, and it falsifies the moment a later stage adds a navigation step to resumption.

### 9.2 Flow B — checks 2 and 5: interrogate history

`:102` — "Did Code Quality run on this story? … with a timestamp"; `:105` — "which stories had
defects", "what did we decide about X and why".

| Step | Surface                              | Action                                                              |
| ---- | ------------------------------------ | ------------------------------------------------------------------- |
| 1    | Project view                         | Open it                                                             |
| 2    | RPT-003                              | Select the story — the selector, or arrive via an RPT-002 row click |
| 3    | RPT-003                              | Read the stage row and its completion timestamp                     |
| 4    | RPT-004 Defect table / Decision list | Expand a row for `description`                                      |

**Multi-step interaction, zero page transitions.** D-85 already makes RPT-003 the answer to check 2's
exact wording.

### 9.3 Checks with no journey — stated, not dropped

| Check | Text location | Answer                                                                                                       |
| ----- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| 1     | `:101`        | **None — not a UI journey.** It measures agent verb calls on the write path, not user steps through surfaces |
| 4     | `:104`        | **None — not a UI journey.** A structural-impossibility property                                             |
| 6     | `:106`        | **None — not a UI journey.** An extensibility property, and out of slice 1 by D-11                           |

---

## 10. Spec Amendments

The edits are applied in-session by the host; this section is the record.

| Spec                               | Amendment                                                                                                                                                                                                                                                        | Decision     |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| SPEC-04                            | RPT-002 story rows in all three sections gain click navigation selecting RPT-003's chain via the `story` parameter                                                                                                                                               | D-137        |
| SPEC-05                            | RPT-001 health reason items gain click navigation to RPT-003 **when the target is a Milestone**; Initiative-targeted items are explicitly not links                                                                                                              | D-137        |
| SPEC-05 (`:221-226`)               | The deferred "Layout, navigation, Fiori Elements vs freestyle" is answered — layout and navigation here, build technology as a deferral-with-deadline to Design System. FRM-001's inline placement confirmed                                                     | D-138, D-139 |
| SPEC-06 (`:99-103`)                | The same deferred heading answered the same way; **FRM-002 is a dialog launched from the project view**, which no spec previously stated                                                                                                                         | D-138, D-139 |
| SPEC-07                            | RPT-004 Defect Scope cell gains click navigation to RPT-003 when Scope resolves to a story; the Decision list and Activity timeline gain **no** outbound links, as a ruling                                                                                      | D-137        |
| SPEC-07                            | RPT-003's story selector is an in-page control whose selection is reflected in the `story` route parameter, discharging BR-03/BR-05's hand-off of "how a second story is selected"                                                                               | D-137        |
| SPEC-04, SPEC-05, SPEC-06, SPEC-07 | All four ship "provisional on R9". **R9 is executed and `Verified`; the provisional status is discharged.** R9 changed no business rule and no FUT in any of them, exactly as D-69 predicted — it decided the serving position, and that lands on Tech Stack     | D-140, D-141 |
| SPEC-11 BR-06 (`:159`)             | **No change.** Its `.drafts` exclusion filter was written to hold either way; D-138 defers draft enablement to Design System, so BR-06 stays correct and becomes vacuous only if stage 7 rules freestyle. Recorded so a later reader does not infer drafts exist | D-138        |

---

## 11. Decisions Reference

| ID        | Title                                                                              | Summary                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **D-137** | The project view is one route with one story parameter                             | One `project-view` route plus an optional `story` parameter carrying `{workspace-slug}/{story-id}`. Everything else is in-page disclosure.                   |
| **D-138** | Build technology is deferred to Design System, with a deadline and two constraints | Uniform across all 6 objects. Deadline: before Data Model. FE templates ruled out by D-137; the D-05 entity-set tension is stage 7's to resolve.             |
| **D-139** | FRM-001 is inline, FRM-002 is a dialog                                             | FRM-001 sits inline on RPT-001; FRM-002 opens as a dialog from the project view. Wave-gating is hidden-until-built and near-vacuous at one entry.            |
| **D-140** | R9 is executed, and its stated premise was wrong                                   | Grade `Inferred` → `Verified`. Cross-origin composition breaks in dev too — CAP never sends `Access-Control-Allow-Headers`, so the `$batch` preflight fails. |
| **D-141** | One origin via a reverse proxy, not cross-origin composition                       | Manifests keep relative `/service/…` URIs; a proxy routes by path prefix. Execution belongs to Tech Stack. The proxy is itself untested here.                |
| **D-142** | Task flow mapping survives one page as two flows and three stated nones            | 6 falsifiable checks → Flow A (check 3), Flow B (checks 2 and 5), and checks 1, 4, 6 answered "none — not a UI journey".                                     |
| **D-143** | The shared shell stays Financial-Planner-owned for slice 1                         | This module registers into `Financial Planner/app/`. The relocation is owed to the third module's UI or the first cross-module shell navigation.             |

---

_This document governs how Project Tracker's six UI-bearing objects decompose into pages, how each is reached, where the module's UI sits in the shared shell and which origin serves it. It traces to [Business Architecture](BUSINESS_ARCHITECTURE.md) (the FRICEW catalogue), [Problem Statement & Vision](PROBLEM_STATEMENT_AND_VISION.md) (the falsifiable checks §9 measures), the UI-bearing specs [SPEC-04](specs/SPEC-04-NEXT-ACTION.md), [SPEC-05](specs/SPEC-05-WORKSPACE-HEADER-AND-HEALTH.md), [SPEC-06](specs/SPEC-06-SPRINT-PLANNING.md) and [SPEC-07](specs/SPEC-07-CHAIN-AND-REGISTERS.md), and the [Decisions Log](DECISIONS_LOG.md) at D-137 … D-143. Design System and Theme style what this document names; Tech Stack executes the origin constraint §7.4 records._
