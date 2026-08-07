# Theme

**Document ID:** TH-001
**Version:** 1.0
**Date:** 2026-08-06
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-06 | Sandro & Claude | Initial creation from the Theme stage. Theme ruled **inherited wholesale** from Financial Planner — this module writes **no CSS**. [DS-001](DESIGN_SYSTEM.md) §9's **17** role mappings resolved onto **5** Horizon custom properties, measured against the pinned runtime. Contrast verified on the surface each pairing lands on. Records D-153 through D-159. |

---

## 2. Summary

This document is the concrete visual contract for the project view. It resolves the semantic roles
[DS-001](DESIGN_SYSTEM.md) §9 declares into named CSS custom properties with measured values, and
decides no role, no control and no layout.

| Aspect                     | Decision                                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Theme ownership**        | **Inherited wholesale** from Financial Planner. This module defines no palette and **writes no CSS file** (D-153)                                                       |
| **Base theme**             | `sap_horizon` — inherited page-globally, not chosen (Financial Planner's DS-001 §3; Project Tracker D-146)                                                              |
| **Brand palette**          | Financial Planner's "Obsidian & Amber" — Obsidian `#2A2725`, Amber `#C8973E`. **Not this module's to set** (D-153)                                                      |
| **Semantic tokens**        | **5** Horizon custom properties, **none of them overridden** by the inherited CSS — measured: **0** semantic overrides in its `:root` block (D-154)                     |
| **Role resolution**        | All **17** [DS-001](DESIGN_SYSTEM.md) §9 mappings resolve through those 5 properties. `ObjectStatus` and `NumericContent` resolve to the **same** token family (D-154)  |
| **Horizon default tables** | **Not restated here.** The exemplar's is wrong in **6** rows against the pinned runtime; this document names the token and the measurement instead (D-154)              |
| **Border radius**          | **0** on buttons, fields, elements, popovers and tiles — inherited, not decided. **5** radius properties set in the shared `:root` (D-153)                              |
| **Component overrides**    | **None written by this module.** **12** targeted selectors are inherited, of which **1** governs this module's page canvas (D-153)                                      |
| **Programmatic colours**   | **None.** No chart, no code-applied palette — follows D-150                                                                                                             |
| **Contrast**               | All **7** pairings pass WCAG AA on the surface each actually lands on. **2** fail on the page canvas, which is why D-155 is a rule and not a footnote                   |
| **The rule this produced** | A semantic `ObjectStatus` or `sap.m.Link` **may not render directly on the ObjectPage canvas** — Warning drops to **4.44:1** and Link to **4.27:1** there (D-155)       |
| **CSS contract**           | `Financial Planner/app/shared/css/theme-overrides.css`, **187** lines, injected by `app/shell/Component.ts:20`. **Not** the `<link>` its own document describes (D-156) |
| **Write access**           | **Read-only.** This module may not edit that file. Owner is D-143's owner, unchanged                                                                                    |
| **Amendments to DS-001**   | **None** — a stated "none", and the point of D-152 having been written first (D-157)                                                                                    |
| **Risks assigned here**    | **None** — register checked, not assumed                                                                                                                                |
| **Decisions logged**       | **D-153 through D-159** (7 decisions)                                                                                                                                   |

---

## 3. Theme Ownership (D-153)

**Ruling: Project Tracker inherits Financial Planner's theme wholesale. It defines no palette, writes
no CSS file, and adds no custom property.**

[DS-001](DESIGN_SYSTEM.md) §13.1 hands this stage one question by name: does this module inherit the
theme wholesale, or scope its own overrides under a component-root class. This is the answer.

### 3.1 Why

| Reason                                                                                                                                                                                                                                                   | Evidence                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **CSS custom properties on `:root` are global by construction.** D-146 puts both modules in one `<body>`. A second `:root` block does not scope — it replaces, for every component in the page                                                           | `Financial Planner/app/index.html:45`; D-146 |
| **The chrome a user crosses is Financial Planner's.** D-30 gives one ShellBar, one side nav, one page background. A Project-Tracker-only accent would either stop at the content area — reading as a half-applied theme — or fight the shell             | D-30; D-143                                  |
| **Nothing in this module needs a value the inherited theme does not supply.** The whole value surface is 17 role mappings over 5 semantic states, and **none of the 5 is overridden** by the inherited CSS — so this module runs stock Horizon semantics | §5, measured                                 |
| **A distinguishing treatment is the wrong goal here.** One shell means module identity is carried by the nav entry and the page title, not by a colour break mid-session                                                                                 | IA-001 §7.1                                  |

### 3.2 What was rejected, and what it would have cost

| Option                                 | Rejected because                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope overrides under a class root** | The mechanism exists and is proven — `includeStylesheet` from a Component (§10) — but scoped selectors **cannot reach the ShellBar or the side nav**, which are the shared chrome, and the shell re-appends the inherited sheet to `<head>` on every rendering (§10.2), so cascade order is a live hazard rather than a settled one. It buys a partial visual identity and costs an untested ordering dependency |
| **Define its own palette**             | A second `:root` palette in one `<body>` is precisely the collision D-152 named. It does not scope; it wins or loses globally                                                                                                                                                                                                                                                                                    |

### 3.3 The cost, stated

**This module's visual identity is not its own, and a future decision to give it one is a change to
this ruling rather than an extension of it.** Recorded so the next module does not read the absence
of a palette section as an oversight.

---

## 4. Colour Palette — inherited (D-153)

**This module defines no palette.** The values below are Financial Planner's, recorded here because
they are what renders when this module's page is on screen — and because
[`.claude/agents/ux-tester.md`](../../.claude/agents/ux-tester.md) measures computed styles against
whatever this document names.

Measured this session in `Financial Planner/app/shared/css/theme-overrides.css` — **the file, not its
document**, because the two disagree (§11.1):

| Role            | Name       | Value     | Where it reaches this module                                     |
| --------------- | ---------- | --------- | ---------------------------------------------------------------- |
| Shell / primary | Obsidian   | `#2A2725` | The ShellBar above the page; pressed list items (`:50`, `:89`)   |
| Accent          | Amber      | `#C8973E` | Emphasized buttons, focus outlines, field focus/hover (`:37-41`) |
| Accent hover    | Dark Amber | `#A67C2E` | Button and field hover (`:59-60`, `:68`, `:84`)                  |
| Accent active   | Burnt Gold | `#8E6A24` | Pressed states (`:39`, `:61-62`, `:70`)                          |
| Link text       | Deep Gold  | `#8B6B1F` | **`sap.m.Link`** — DS-001 §8.1 and §8.5's in-page links (`:44`)  |
| Page background | Warm Stone | `#F0EDEA` | **The ObjectPage canvas** — see §10.3 and §9 (`:47`)             |
| Selection       | Gold Mist  | `#F5EDD8` | Table row hover and selection (`:87-88`)                         |
| Shell hover     | Warm Smoke | `#3D3A37` | ShellBar hover only (`:53`) — **not** the brand colour           |
| Typography      | DM Sans    | —         | `--sapFontFamily`, overridden at `:34` (`:105-122` force it)     |

**`#3D3A38` is not in this palette and is not in the file.** Financial Planner's TH-001 §3.2 records
that its own D-314 superseded that value; the nearest live value is Warm Smoke `#3D3A37`, a ShellBar
hover state, one hex digit away. Recorded because three documents outside this module still name the
superseded one (§13.2) and a reader arriving from any of them will otherwise "correct" this table.

---

## 5. Semantic Token Resolution (D-154)

**This is the section [DS-001](DESIGN_SYSTEM.md) §13 exists to hand over, and it is the one the
exemplar never wrote.** Financial Planner's TH-001 §3.3 restates its Design System's role table using
colour _names_ — "Green", "Orange" — and names no CSS custom property at all. A reviewer measuring a
computed style has nothing to compare against. This section fixes that for this module.

### 5.1 The five properties, measured

Read from the pinned runtime this session —
`https://ui5.sap.com/1.136.16/resources/sap/ui/core/themes/sap_horizon/library-parameters.json`, the
same version `Financial Planner/app/index.html:16` bootstraps:

| Semantic state     | Text property               | Value     | Icon property                  | Value     |
| ------------------ | --------------------------- | --------- | ------------------------------ | --------- |
| **Success**        | `--sapPositiveTextColor`    | `#256F3A` | `--sapPositiveElementColor`    | `#30914C` |
| **Error**          | `--sapNegativeTextColor`    | `#AA0808` | `--sapNegativeElementColor`    | `#F53232` |
| **Warning**        | `--sapCriticalTextColor`    | `#B44F00` | `--sapCriticalElementColor`    | `#E76500` |
| **Information**    | `--sapInformativeTextColor` | `#0064D9` | `--sapInformativeTextColor`    | `#0064D9` |
| **None (neutral)** | `--sapNeutralTextColor`     | `#131E29` | — (inherits the text property) | `#131E29` |

**None of these five is overridden by the inherited CSS.** Measured: a grep for
`--sapPositive|--sapNegative|--sapCritical|--sapInformative|--sapNeutral` across
`theme-overrides.css`'s 187 lines returns **0** hits. So this module renders **stock Horizon
semantics**, and the Obsidian & Amber brand deliberately avoids the semantic range rather than
colliding with it.

**Information is the one asymmetry, and it is measured rather than assumed:**
`.sapMObjStatusInformation .sapMObjStatusIcon` resolves to `--sapInformativeTextColor`, not to
`--sapInformativeElementColor` — unlike the other three states, which use their Element property for
the icon. Recorded so a build persona does not "fix" it.

### 5.2 Which component reads which property

Measured in `https://ui5.sap.com/1.136.16/resources/sap/m/themes/sap_horizon/library.css`:

| Component                             | Selector measured                                         | Resolves to                                 |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `ObjectStatus`, Success               | `.sapMObjStatusSuccess .sapMObjStatusText`                | `--sapPositiveTextColor`                    |
| `ObjectStatus`, Error                 | `.sapMObjStatusError .sapMObjStatusText`                  | `--sapNegativeTextColor`                    |
| `ObjectStatus`, Warning               | `.sapMObjStatusWarning .sapMObjStatusText`                | `--sapCriticalTextColor`                    |
| `ObjectStatus`, Information           | `.sapMObjStatusInformation .sapMObjStatusText`            | `--sapInformativeTextColor`                 |
| `ObjectStatus`, None                  | `.sapMObjStatus` (the base rule)                          | `--sapNeutralTextColor`                     |
| `NumericContent`, `valueColor` states | `.sapMNCScale.Good` / `.Error` / `.Critical` / `.Neutral` | The **same four** text properties, in order |

**`ObjectStatus` and `NumericContent` resolve to one token family**, which is what makes DS-001 §10's
two-component split visually coherent: the gate tile's number and the health band beside it are the
same green or the same red, not two greens.

### 5.3 The 17 mappings, resolved

[DS-001](DESIGN_SYSTEM.md) §9's role map, carried through §5.1. **This table adds no mapping and
changes none** — the Domain and Semantic state columns are DS-001's, and only the last column is
this document's.

| Domain            | Value                                     | Semantic state | Resolved property           | Value     |
| ----------------- | ----------------------------------------- | -------------- | --------------------------- | --------- |
| Health band       | `Healthy`                                 | Success        | `--sapPositiveTextColor`    | `#256F3A` |
| Health band       | `NeedsAttention`                          | Warning        | `--sapCriticalTextColor`    | `#B44F00` |
| Health band       | `Struggling`                              | Error          | `--sapNegativeTextColor`    | `#AA0808` |
| Task status       | `Complete`                                | Success        | `--sapPositiveTextColor`    | `#256F3A` |
| Task status       | `In Progress`                             | Information    | `--sapInformativeTextColor` | `#0064D9` |
| Task status       | `Not Started`                             | None           | `--sapNeutralTextColor`     | `#131E29` |
| Step kind         | `Recommended`                             | Information    | `--sapInformativeTextColor` | `#0064D9` |
| Step kind         | `Required`                                | None           | `--sapNeutralTextColor`     | `#131E29` |
| Defect severity   | `Critical`, `High`                        | Error          | `--sapNegativeTextColor`    | `#AA0808` |
| Defect severity   | `Medium`, `Low`                           | Warning        | `--sapCriticalTextColor`    | `#B44F00` |
| Defect status     | `Closed`                                  | None           | `--sapNeutralTextColor`     | `#131E29` |
| Initiative status | `Active`                                  | Information    | `--sapInformativeTextColor` | `#0064D9` |
| Initiative status | `Complete`                                | Success        | `--sapPositiveTextColor`    | `#256F3A` |
| Gate tile         | `failed = 0`                              | Success        | `--sapPositiveTextColor`    | `#256F3A` |
| Gate tile         | `failed > 0`                              | Error          | `--sapNegativeTextColor`    | `#AA0808` |
| Activity actor    | human (`sandro`)                          | Information    | `--sapInformativeTextColor` | `#0064D9` |
| Activity actor    | machine (`migration`, any agent identity) | None           | `--sapNeutralTextColor`     | `#131E29` |

**17 rows, matching [DS-001](DESIGN_SYSTEM.md) §9 exactly.** `Milestone.status` and `fricewType` carry
no role (D-149) and therefore no value; this stage does not invent one.

### 5.4 `Recommended` versus `Required` — the one role that needs checking, not just resolving

SPEC-07 BR-12 makes distinguishability a **rule**: `Recommended` never blocks and may legally sit open
on a Done Milestone. Resolved, the pair is `#0064D9` against `#131E29` — a hue difference, not a
lightness one. **It is a colour-only distinction, which fails the "nothing conveyed by colour alone"
lens `ux-tester` applies.** [DS-001](DESIGN_SYSTEM.md) §10 already carries the fix: it has a row for
`Recommended` with `sap-icon://hint` and **no row for `Required`**. **The icon is what discharges
BR-12, not the colour** — recorded here because resolving the roles is what made the gap visible.

---

## 6. Programmatic Colours

**None.** No colour in this module is applied in code rather than through the theme.

Financial Planner's TH-001 §3.5 defines six issuer chart colours applied as constants to VizFrame
series, and §3.6 maps a CPP threshold to a semantic state. Both are that module's, and both presume
charts. **D-150 rules this module has none**, and neither
`Financial Planner/app/shared/controls/VizFrameCard.ts` nor `ApexChartCard.ts` is used here.

Stated rather than dropped, on **D-134's precedent** — a heading with no content reads as an
oversight; a stated "none" reads as a ruling.

---

## 7. Border Radius (D-153)

**0 on all containers and interactive controls — inherited, not decided.**

Measured in the shared `:root` block (`theme-overrides.css:93-97`), against the pinned runtime's
defaults:

| Property                          | Horizon 1.136.16 default | Inherited value | Reaches                                               |
| --------------------------------- | ------------------------ | --------------- | ----------------------------------------------------- |
| `--sapButton_BorderCornerRadius`  | `.5rem`                  | `0`             | Every button on RPT-001, FRM-001 and FRM-002          |
| `--sapField_BorderCornerRadius`   | `.25rem`                 | `0`             | Every `sap.fe.macros.Field`, `Select`, `CheckBox`     |
| `--sapElement_BorderCornerRadius` | `.75rem`                 | `0`             | `sap.m.Panel`, `MessageStrip`, generic containers     |
| `--sapPopover_BorderCornerRadius` | `.5rem`                  | `0`             | FRM-002's dialog, FRM-001's two dialogs               |
| `--sapTile_BorderCornerRadius`    | `1rem`                   | `0`             | The gate tile's `GenericTile`, RPT-002's `sap.f.Card` |

**This module makes no radius decision and cannot make a different one** — the properties are set on
the shared `:root`, so an alternative would require overriding them page-globally, which §3 rules out.
Financial Planner's TH-001 §4.3 exceptions (radio buttons, avatars, switch tracks, progress
indicators, busy indicators) hold here unchanged, and this module renders none of them today.

**All five Horizon defaults above were re-measured, not copied.** Three of the five are wrong in the
exemplar's own default column — see §11.1.

---

## 8. Component Overrides (D-153)

**None written by this module.** It renders no control needing a treatment the inherited CSS does not
already give it.

The inherited file carries **12** targeted-selector rule blocks (measured, `theme-overrides.css:100-187`).
Of those, **one governs this module's page directly**, and it is worth naming because it was written
for a different module's dashboards and silently became this module's page background:

| Inherited selector                                                                          | Effect here                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`.sapUxAPObjectPageWrapper`** (`:162-164`)                                                | **This module's entire page sits inside this element** (D-148). `sap.uxap` hardcodes `#f5f6f7`; the override sets it to `var(--sapBackgroundColor)` = Warm Stone `#F0EDEA`. This is what §9's contrast finding turns on |
| `.sapUiBody` and a 12-selector list (`:105-122`) — **2** of the 12 blocks, **13** selectors | Forces DM Sans onto text, labels, titles, links, buttons, inputs, list cells and table cells                                                                                                                            |
| `.sapMIBar.sapMTB.sapMOTB.sapTntToolHeader` and its four descendants (`:126-152`)           | The ShellBar above the page. **Shared chrome — not this module's surface**                                                                                                                                              |
| `.sapTntToolPageMain` (`:156-158`)                                                          | The ToolPage content area this module's component mounts into                                                                                                                                                           |
| `.sapTntToolPageAsideContent`, `.sapTntNLI.sapTntNLISelected`, and its anchor (`:168-187`)  | The side nav, including the entry that selects this module. **Shared chrome**                                                                                                                                           |

**No `sap.fe.macros` control is overridden by anything in that file**, so every macro table, field and
the FPM page chrome render at Horizon defaults under the inherited custom properties. Recorded because
D-144 makes FPM this module's entire build technology and a reader may reasonably expect a treatment
for it.

---

## 9. Contrast Verification (D-155)

**Every pairing passes WCAG AA on the surface it actually lands on. Two fail on the page canvas, and
that near-miss is why this section produces a rule rather than a tick.**

`ObjectStatus` renders at `.875rem` — **14px**, measured at `.sapMObjStatus{font-size:.875rem}` in
`sap/m/themes/sap_horizon/library.css`. That is **not** WCAG large text (which needs ≥24px, or ≥18.66px
bold), so the **4.5:1** body threshold applies to every row below, not the 3:1 large-text one.

### 9.1 Which surface each element lands on — resolved, not assumed

| Surface                                                                                                     | Background    | Measured at                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ObjectPage dynamic header (RPT-001, FRM-001)                                                                | `#FFFFFF`     | `.sapFDynamicPageHeader{background:#fff}` — hardcoded in `sap.f`, **not overridden**                                                                                        |
| Tables and lists (RPT-002, RPT-003, RPT-004)                                                                | `#FFFFFF`     | `--sapList_Background` = `#fff`, **not overridden**                                                                                                                         |
| The gate tile (RPT-001 §4)                                                                                  | `#FFFFFF`     | `--sapTile_Background` = `#fff`, **not overridden**                                                                                                                         |
| `sap.m.Panel` (RPT-003 chain header, the two expandable regions)                                            | `#FFFFFF`     | Default `backgroundDesign` is Translucent → `--sapGroup_ContentBackground` = `#fff`, **not overridden**                                                                     |
| `sap.f.Card` (RPT-002 §1)                                                                                   | `#FFFFFF`     | `.sapFCardHeader{background:#fff}` — hardcoded in `sap.f`                                                                                                                   |
| **The ObjectPage canvas** — section gutters, anchor-bar strip, and any content placed bare in a sub-section | **`#F0EDEA`** | `.sapUxAPObjectPageWrapper`, overridden to `var(--sapBackgroundColor)` (§8). **`ObjectPageSubSection` carries no background rule of its own**, so it is transparent to this |

### 9.2 The measured ratios

| Foreground                                 | Value     | On `#FFFFFF` (where it renders) | On `#F0EDEA` (the canvas) |
| ------------------------------------------ | --------- | ------------------------------- | ------------------------- |
| Success `--sapPositiveTextColor`           | `#256F3A` | **6.15:1** — AA                 | 5.28:1 — AA               |
| Error `--sapNegativeTextColor`             | `#AA0808` | **7.64:1** — AA                 | 6.55:1 — AA               |
| Warning `--sapCriticalTextColor`           | `#B44F00` | **5.17:1** — AA                 | **4.44:1 — FAILS AA**     |
| Information `--sapInformativeTextColor`    | `#0064D9` | **5.49:1** — AA                 | 4.71:1 — AA               |
| None `--sapNeutralTextColor`               | `#131E29` | **16.86:1** — AA                | 14.46:1 — AA              |
| Link `--sapLinkColor` (inherited override) | `#8B6B1F` | **4.98:1** — AA                 | **4.27:1 — FAILS AA**     |
| Label `--sapContent_LabelColor`            | `#556B82` | **5.51:1** — AA                 | 4.72:1 — AA               |

**Every element this module renders today lands on `#FFFFFF`, so nothing fails as designed.** That
conclusion is measured (§9.1), not assumed — and it is the opposite of what the ratios alone suggest.

### 9.3 The rule this produces

> **A semantic `ObjectStatus` or a `sap.m.Link` may not be placed directly in an
> `ObjectPageSubSection` without a background-bearing container** — a `Panel`, a `Card`, a list or a
> table. On the bare canvas, Warning falls to **4.44:1** and Link to **4.27:1**, both below AA at
> 14px.

This is checkable: `ux-tester` reads the computed `background-color` of the status's offset parent and
the two figures above. It is a real constraint on the build rather than a note, because
[DS-001](DESIGN_SYSTEM.md) §8.4 §2 places an `ObjectStatus` inside a sub-section and §8.5 §1 places a
`sap.m.Link` inside one — and both are safe **only** because the macro table they sit in supplies a
white background. Move either out of its table and the rule fires.

### 9.4 One figure in the exemplar is wrong, and it matters here

Financial Planner's TH-001 §3.4 states Deep Gold `#8B6B1F` against white is "~5.6:1, meeting WCAG AA".
**Measured: 4.98:1.** Still AA, so the conclusion holds and the figure does not. It is recorded because
the margin is 0.48 rather than 1.1, and because `sap.m.Link` is how DS-001 §8.1 and §8.5 render
in-page navigation — the most-clicked text on the page.

---

## 10. The CSS Contract (D-156)

**This module writes no CSS.** The contract below is what it **depends on**, and it is stated because
a build persona needs to know where the values come from and what they may not touch.

### 10.1 The file

| Fact    | Value                                                                               |
| ------- | ----------------------------------------------------------------------------------- |
| Path    | `Financial Planner/app/shared/css/theme-overrides.css`                              |
| Size    | **187** lines, measured this session                                                |
| Layer 1 | **44** CSS custom properties in one `:root` block (`:32-98`)                        |
| Layer 2 | **12** targeted-selector rule blocks (`:100-187`)                                   |
| Owner   | Financial Planner. **Project Tracker reads it and may not write into it** — see §12 |

### 10.2 The load mechanism — measured, and it is not what the exemplar's document says

| Fact                                              | Evidence                                                                                                                                                       |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Injected at runtime by the shell Component**    | `Financial Planner/app/shell/Component.ts:20` — `void includeStylesheet("shared/css/theme-overrides.css")` in `init()`                                         |
| **Re-appended to `<head>` after every rendering** | `app/shell/Component.ts:27-32` — `onAfterRendering` moves the `<link>` to the end of `<head>` so it wins the cascade over late-loaded SAPUI5 library CSS       |
| **There is no `<link>` in the host page**         | `Financial Planner/app/index.html` carries exactly **1** `rel="stylesheet"` element — the DM Sans font at `:12-14` — and **0** references to `theme-overrides` |

**Financial Planner's TH-001 §6.3 and its D-312 both describe a `<link>` tag in `index.html` placed
after the SAPUI5 bootstrap. That is not how the repo loads it.** The distinction is not cosmetic: the
real mechanism means the stylesheet is owned by **the shell Component's lifecycle**, so anything a
second module loaded would be re-overtaken on the shell's next rendering. **That is the single fact
that made §3's inherit-wholesale ruling cheap** — the alternative depended on a cascade position the
shell actively reclaims.

**Raised, not fixed.** Correcting another module's Approved Theme document and its decisions log is
outside this stage; it is recorded in §13.2 as owed.

### 10.3 What the contract gives this module for free

No build step, no resource root, no `<link>`, and no ordering problem: the shell loads the sheet
before this module's component mounts, and every custom property is already resolved by the time an
`ObjectStatus` renders. The shared standards' `!important` ban is inherited with it and this module
adds no selector that could need one.

---

## 11. Inherited Property Mapping (D-154)

**This document does not restate the exemplar's property table, and that is a ruling.**

The **44** properties in the shared `:root` are Financial Planner's contract, maintained in that
module's TH-001 §7. Copying them here creates a second source of truth for values this module does not
own — which is exactly the failure mode measured below.

What this module **needs** named is §5's five semantic properties and §7's five radius properties.
Those are here, measured. Everything else is cited, not copied.

### 11.1 Why — the exemplar's own table went stale in five distinct ways

Measured this session against the file and against the pinned runtime:

| Drift                                                                                                                                   | Measured                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The property count is wrong in two different places.** Its Summary and D-314 say **30**; its §7.1 table lists **35**                  | The file has **44**                                                                                                                                                                                                                                                                                             |
| **The selector count is wrong in three different places.** Summary says "~5", D-314 says **6**, §7.2 lists **8** rows                   | The file has **12**                                                                                                                                                                                                                                                                                             |
| **A documented override is absent from the file.** §7.1 maps `--sapGroup_ContentBackground` → `#FAFAF8`                                 | The property does not appear in `theme-overrides.css` at all — which is why §9.1's containers resolve to `#FFFFFF`                                                                                                                                                                                              |
| **A real override is filed under "Not Overridden".** §7.1 lists `--sapFontFamily` as kept at its Horizon default                        | It is overridden at `:34`, and reinforced by 2 rule blocks carrying 13 selectors at `:105-122`                                                                                                                                                                                                                  |
| **Six "Horizon Default" values disagree with the runtime**, against a §7.3 claim that they were "verified against the CDN-loaded theme" | `sapInformativeColor` `#0070F2` not `#0064D9`; `sapBackgroundColor` `#F5F6F7` not `#FAFAFA`; `sapContent_FocusColor` `#0032A5` not `#0064D9`; `sapField_BorderCornerRadius` `.25rem` not `0.5rem`; `sapElement_BorderCornerRadius` `.75rem` not `0.5rem`; `sapPopover_BorderCornerRadius` `.5rem` not `0.75rem` |

**None of these changes a single rendered pixel** — the override _values_ are correct and the file is
what runs. They are recorded because they are the argument for the ruling: a restated default column
reads as verified when it is not, and this module would have inherited that defect by copying it.

**The measurement method, so it can be repeated rather than trusted:** read
`https://ui5.sap.com/{pinned-version}/resources/sap/ui/core/themes/sap_horizon/library-parameters.json`
for values and the per-library `themes/sap_horizon/library.css` for which selector reads which
property. The pinned version is `Financial Planner/app/index.html:16`.

---

## 12. Shared-Shell Boundary

| Question                                     | Answer                                                                                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What does this module **write** to the page? | **Nothing visual.** No stylesheet, no custom property, no selector                                                                                                                             |
| What does it **read**?                       | The 44 inherited custom properties and the 12 inherited rule blocks, one of which (`.sapUxAPObjectPageWrapper`) governs its page canvas                                                        |
| What does it **not** control?                | The ShellBar, the side nav, the page background, the font, the radius, the accent — all shared chrome or page-global properties                                                                |
| Who owns the file?                           | Financial Planner. **This module has read-only standing.** Editing it would make Project Tracker a _writer_ into the other module's tree, which is a larger claim than D-143's read dependency |
| When does this have to change?               | When a module needs a value the shared sheet does not supply. **Owner: D-143's owner, unchanged** — whoever builds the third module's UI, or the first cross-module shell navigation           |

**The unbuilt part, named honestly.** No mechanism exists for a module to contribute scoped theme
values, and none is designed here. If one is ever needed, §10.2 is the constraint it must solve: the
shell reclaims the last position in `<head>` on every rendering, so a second stylesheet needs either a
higher-specificity strategy or a change to `Component.ts:27-32`. **This has never been executed** —
graded `Inferred`, and it is not this stage's to settle because §3 removes the need for it.

---

## 13. Amendments

### 13.1 To this module's documents — none (D-157)

**This stage amends [DS-001](DESIGN_SYSTEM.md) in nothing, and that is the result of D-152 having been
written first.**

Financial Planner's Theme amended its own Design System retroactively —
`Financial Planner/design/DESIGN_SYSTEM.md:17` records a Change History row replacing that document's
§6 "no custom accent" with a brand palette **after** it was Approved. That happened because its Design System had never
anticipated a Theme stage. This module's DS-001 §13 was written **anticipating** this stage and drew
the boundary in advance, so there is nothing to reach back and change:

- **No new role.** §3 introduces no brand accent, so DS-001 §9's 17-row table needs no eighteenth row.
- **No changed role.** §5.3 carries all 17 mappings through unaltered.
- **No changed control.** §5.4 relies on DS-001 §10's existing `sap-icon://hint`, adding nothing.
- **DS-001 §13.1 is not amended either.** It names the ownership question and declines to answer it;
  that remains an accurate description of what it did.

Recorded as a stated "none" on D-134's precedent. **A Theme that amends nothing is evidence the
boundary was drawn correctly, not evidence the stage found nothing.**

### 13.2 To documents outside this module — one applied, two owed

| Document                                               | Finding                                                                                                                               | Disposition                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `.claude/agents/ux-tester.md:21-23`                    | Told the agent Financial Planner's theme is "Warm Charcoal (`#3D3A38`)". Superseded by that module's own D-314                        | **Applied this session.** It is a live rubric — a wrong palette there produces wrong findings |
| `Financial Planner/design/THEME.md` §6.3 and its D-312 | Both describe a `<link>` in `index.html`; the repo injects via `Component.ts:20` (§10.2)                                              | **Owed.** Raised, not applied — another module's Approved document                            |
| `Financial Planner/design/DESIGN_SYSTEM.md:17`, `:29`  | Change History and Summary still name Warm Charcoal `#3D3A38` as the brand, which that module's own TH-001 §3.2 records as superseded | **Owed.** Raised, not applied                                                                 |

The two owed items are Financial Planner's to fix and belong to a `/refresh-docs` sweep of that
module. They are named here because §4 and §10 of this document are the reason they were found.

---

## 14. Risks Assigned to This Stage

**None — and the register was checked rather than assumed.**

Verified this session: `research/README.md` §7's routing table routes **Information Architecture /
Design System / Theme → RSH-003** (`research/README.md:148`). RSH-003's only live risk was **R9**,
**executed and closed** at the Information Architecture stage (D-140), regraded `Inferred` →
`Verified`. No other row in `research/README.md` §5 names this stage.

Stated rather than left silent, because a stage that inherits nothing and does not say so is
indistinguishable from one that never looked.

**No risk is created here either.** §3's ruling was chosen partly because the alternative would have
created one — a scoped-override mechanism nobody has executed (§12). Where that unbuilt path is
described, it is graded `Inferred` rather than assumed to work.

| Risk               | Owner                    | Source                              |
| ------------------ | ------------------------ | ----------------------------------- |
| **R1**             | The **Data Model** stage | D-39                                |
| **R4**, **R7**     | **INT-007's own build**  | D-121                               |
| **R10**            | **CNV-005**              | D-119                               |
| R2, R3, R5, R6, R8 | Closed or dissolved      | D-33, D-29, D-112/D-113, D-32, D-29 |

**The reverse proxy D-141 rules for is untested and belongs to Tech Stack.** Not executed here, and
this stage does not design around it having been executed.

### 14.1 This stage has no linter

**Nothing mechanically validates a token resolution, a contrast figure or a palette claim.** The
coverage check behind this document is **procedural**, exactly as [BA-001](BUSINESS_ARCHITECTURE.md)
§3.9 records for the catalogue, [IA-001](INFORMATION_ARCHITECTURE.md) §8.2 for the architecture and
[DS-001](DESIGN_SYSTEM.md) §15.1 for the design system. **Every value in §5, §7 and §9 is reproducible
by the method in §11.1** — re-measure them rather than trusting them.

---

## 15. Decisions Reference

| ID        | Title                                                              | Summary                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-153** | Project Tracker inherits Financial Planner's theme wholesale       | No palette, no CSS file, no custom property. `:root` properties do not scope in a shared `<body>` (D-146), the chrome crossed is the other module's (D-30), and no role needs a value the inherited sheet lacks. Border radius 0 comes with it.       |
| **D-154** | The visual contract is 5 measured tokens, not a restated table     | All 17 DS-001 §9 roles resolve through 5 Horizon properties, **none overridden**. The exemplar's property table drifts 5 ways — wrong counts, an absent override, a misfiled one, and 6 wrong defaults — so this document cites rather than copies.   |
| **D-155** | No semantic `ObjectStatus` or `Link` bare on the ObjectPage canvas | Measured: every element lands on `#FFFFFF` today and passes AA. On the `#F0EDEA` canvas, Warning is 4.44:1 and Link 4.27:1 — both below AA at 14px. A build rule and a `/ux-test` check, not a footnote.                                              |
| **D-156** | The CSS contract is `includeStylesheet`, not a `<link>`            | `app/shell/Component.ts:20` injects the sheet and `:27-32` re-appends it after every rendering; `index.html` has no such link. The shell reclaiming the cascade is what made D-153 cheap. The exemplar's §6.3 and D-312 are wrong; raised, not fixed. |
| **D-157** | This Theme amends DS-001 in nothing — a stated "none"              | The exemplar's Theme amended its Design System retroactively because that document never anticipated a Theme stage. DS-001 §13 did. No new role, no changed role, no changed control.                                                                 |
| **D-158** | Fixed questions + derived sections is the house document shape     | Adopted a third time and now the standard for stages 9–12. `/generate-theme` carries **15** questions, 5 of which the exemplar never faced — ownership, token resolution, contrast, the shell boundary, and assigned risks.                           |
| **D-159** | `/generate-*` skills gain an approval gate and a Step 0            | Two stages running closed without asking for approval of their own output and the next stage found it. All four skills now carry an explicit "do not report the stage closed without an answer" gate and a predecessor-status check.                  |

---

_This document is the concrete visual contract for Project Tracker's project view — theme ownership, the inherited palette, semantic token resolution, border radius, contrast and the CSS contract. It resolves the semantic roles [DS-001](DESIGN_SYSTEM.md) §9 declares and adds no role of its own; it styles the surfaces [IA-001](INFORMATION_ARCHITECTURE.md) names and decides no route. Decisions are logged in the [Decisions Log](DECISIONS_LOG.md) at D-153 … D-159. [`/ux-test`](../../.claude/agents/ux-tester.md) reviews built pages against §5, §7 and §9. The first UI story writes no CSS from this document (§3), but two things here do bind it: §5.3's state value per domain value, and §9.3's placement rule._
