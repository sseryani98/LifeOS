# Theme

**Document ID:** TH-001
**Version:** 1.4
**Date:** 2026-11-04
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                                                                                                                                                                           |
| ---------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-21 | Sandro & Claude | Initial creation — Step 14 complete. D-308 through D-313 logged.                                                                                                                                                      |
| 2026-02-21 | Sandro          | Approved. Status Draft → Approved.                                                                                                                                                                                    |
| 2026-10-30 | Claude          | D-316: contrast fix. Emphasized fill, Deep Gold and focus ring darkened. §3 contrast claims corrected.                                                                                                                |
| 2026-10-30 | Claude          | D-318: selection → Burnt Gold, field focus → Dark Amber. Side nav, surfaces, radii, ShellBar shadow, blue leaks and 72 font fixed. §7 rebuilt from the file; Horizon defaults re-read from the 1.136.16 runtime.      |
| 2026-10-30 | Claude          | D-319: §3.1 covers decorative illustrations. Illustration blues → amber ramp, table rules → Taupe `#B3ABA3`. Default-button hover text and FileUploader states fixed (D-006, D-012). §7 recounted.                    |
| 2026-11-03 | Claude          | D-320: label text → Driftwood `#6B6259`, replacing Horizon slate `#556B82` (D-018). §7.1 recounted.                                                                                                                   |
| 2026-11-04 | Claude          | Refresh against the file: §6.3 load mechanism re-read from `Component.ts`; §3.7 and §8 gain the D-320 rows; Summary and §7.3 counts, §6.4 examples, two stale body-text hexes and the ghost-button borders corrected. |
| 2026-11-04 | Sandro          | Re-approved after the refresh. Status stays Approved.                                                                                                                                                                 |

---

## 2. Summary

Custom visual identity layered on top of `sap_horizon` (Horizon Light). Targeted overrides only — no theme package, no build tooling.

| Aspect              | Decision                                                      |
| ------------------- | ------------------------------------------------------------- |
| **Base Theme**      | SAP Horizon Light (`sap_horizon`) — unchanged (D-56)          |
| **Brand Identity**  | "Obsidian & Amber" — warm gold accent on dark shell (D-317)   |
| **Shell Color**     | Obsidian `#2A2725` — deep warm black (D-317)                  |
| **Accent Color**    | Amber `#C8973E` — brand accent, non-text only (D-317, D-316)  |
| **Emphasized Fill** | Burnt Gold `#8E6A24` under white text — 4.96:1 (D-316)        |
| **Selection**       | Burnt Gold `#8E6A24` — ≥ 3.95:1 on every surface (D-318)      |
| **Field Focus**     | Dark Amber `#A67C2E` — same as the focus ring (D-318)         |
| **Border Radius**   | 0 on all containers and interactive controls (D-310)          |
| **Card Treatment**  | Horizon shadow retained, sharp corners (D-311)                |
| **Semantic Colors** | Horizon defaults — no override                                |
| **Link Color**      | Deep Gold `#7A5E1B` — ≥ 4.86:1 on every light surface (D-316) |
| **Page Background** | Warm Stone `#F0EDEA` — reduces white void (D-317)             |
| **Side Nav**        | Soft Ash `#E8E5E2` — tinted for three-column depth (D-317)    |
| **Override Method** | Single CSS file after Horizon, CSS custom properties (D-312)  |
| **Illustrations**   | Amber ramp, Obsidian outlines, Taupe greys (D-319)            |
| **Total Overrides** | 102 custom properties + 29 targeted rules, 49 selectors (§7)  |
| **Amends**          | D-60, D-308, D-309, D-313 (replaced by D-317 palette)         |

---

## 3. Color Palette

### 3.1 Design Intent

"Obsidian & Amber" — a warm, premium palette inspired by financial instruments and achievement. The deep obsidian shell anchors the app while amber accents connote finance, value, and reward. Zero SAP blue in any brand or interactive element. Semantic colors (green, red, orange, blue, grey) remain unchanged and carry all functional meaning.

**Scope of "zero SAP blue" (D-319).** The rule covers decorative artwork too, not only interactive elements. An empty-state `IllustratedMessage` is often the largest coloured thing on a page, so a blue scene undoes the identity where the user looks first. Illustrations take the amber ramp in §5.12. Two things stay out of scope: semantic blue (Information state, §3.3), which carries meaning, and issuer chart colors (§3.5), which are data. Cool Horizon greys used as structure, such as table rules, move to Taupe.

This amends D-60 ("standard Horizon semantic colors only, no custom accent") and replaces the earlier Warm Charcoal palette (D-308/D-309) with a fully differentiated brand identity.

### 3.2 Brand Palette

| Role                    | Name       | Hex       | Usage                                                                                                  |
| ----------------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------ |
| **Shell/Primary**       | Obsidian   | `#2A2725` | ShellBar background, active list press, deep anchor color                                              |
| **Accent**              | Amber      | `#C8973E` | Brand color, field and checkbox hover border — never under or as text, never a required state cue      |
| **Focus / Border**      | Dark Amber | `#A67C2E` | Focus ring on every control; field focus border; default-button hover border                           |
| **Emphasized Fill**     | Burnt Gold | `#8E6A24` | Emphasized button at rest; selection color: nav indicator, tab bar, current wizard step, row border    |
| **Link / Emph. Hover**  | Deep Gold  | `#7A5E1B` | Text links in every state, variant title, selected tab and wizard text, check mark, emphasized hover   |
| **Emphasized Active**   | Umber      | `#654B1D` | Emphasized button pressed                                                                              |
| **Page Background**     | Warm Stone | `#F0EDEA` | Page/body background — reduces white void                                                              |
| **Surface**             | Parchment  | `#FAFAF8` | Cards, ObjectPage blocks, page and filter-bar header, tables, toolbars, wizard — lift on Warm Stone    |
| **Side Nav**            | Soft Ash   | `#E8E5E2` | Side navigation panel — three-column depth effect                                                      |
| **Selected Background** | Gold Mist  | `#F5EDD8` | Selected table rows, hover backgrounds, active list items                                              |
| **Shell Hover**         | Warm Smoke | `#3D3A37` | Hover on ShellBar elements (lighter than obsidian on dark surface)                                     |
| **Structural Rule**     | Taupe      | `#B3ABA3` | Table header, group and footer rules; illustration layering grey. Replaces Horizon grey-blue `#A8B3BD` |
| **Label Text**          | Driftwood  | `#6B6259` | Field, dialog and table labels; object-page subtitle. Replaces Horizon slate `#556B82`                 |

All values share a warm undertone (amber-brown family, not cool/blue). Amber, Dark Amber, Burnt Gold, Deep Gold and Umber are steps of one hue (38–42°), so the darker steps still read as amber.

Contrast ratios, computed with WCAG 2.x relative luminance (full table in §3.7): Obsidian on white = 14.84:1. **Amber on white = 2.64:1, which fails every text threshold.** That is why Amber carries no text. Deep Gold `#7A5E1B` on white = 6.10:1. The pre-D-316 figures here ("Amber ~3.8:1, AA for large text" and "Deep Gold ~5.6:1") were wrong. 3.8:1 is the Dark Amber figure, the old Deep Gold `#8B6B1F` was 4.98:1, and no button label in the app is large text.

### 3.3 Semantic Colors — Unchanged

The five semantic states defined in DS-001 §6 remain at Horizon defaults. No overrides. The amber brand intentionally avoids collision with any semantic state.

| State              | Color  | Usage (from DS-001 §6)                              |
| ------------------ | ------ | --------------------------------------------------- |
| Positive / Success | Green  | Active, met bonus, on-track budget, successful sync |
| Critical / Error   | Red    | Missed bonus, over budget, sync error               |
| Warning            | Orange | To Cancel, near budget limit, uncategorized         |
| Information        | Blue   | Focus state, in-progress bonus, user-corrected      |
| Neutral            | Grey   | Closed, pending, never synced                       |

### 3.4 Link Color — Deep Gold

Text links use Deep Gold (`#7A5E1B`) instead of Horizon blue. This eliminates the last SAP-blue fingerprint from interactive elements. Links sit on Warm Stone, Parchment, Gold Mist and white, not only on white, so the value is chosen to clear 4.5:1 on the darkest of them: 4.86:1 on Soft Ash, 5.23:1 on Warm Stone, 6.10:1 on white (D-316). The original `#8B6B1F` fell to 4.27:1 on Warm Stone and 4.26:1 on Gold Mist. The FE variant title also inherits `--sapLinkColor`. Links remain visually distinct from body text (`#131E29`) through both color difference and underline convention.

### 3.5 Domain Chart Colors — Reference

Issuer chart colors defined in SPEC-19 §4.1.13 (D-220). Applied programmatically to chart data series as constants — not part of CSS theme overrides.

| Issuer    | Hex               | Color Name               |
| --------- | ----------------- | ------------------------ |
| TD        | `#00A650`         | Green                    |
| Amex      | `#006FCF`         | Blue                     |
| CIBC      | `#C41F3E`         | Red                      |
| Scotia    | `#FFB819`         | Gold                     |
| BMO       | `#009B8D`         | Teal                     |
| RBC       | `#7B2D8E`         | Purple                   |
| Aggregate | `sapNeutralColor` | Grey (dashed line style) |

Non-mapped issuers fall back to VizFrame auto-assigned qualitative palette.

### 3.6 CPP Semantic Coloring — Reference

CPP coloring in RPT-004 (Trophy Case) defined in SPEC-21 BR-06. Uses standard Horizon semantic states, not custom colors:

| Condition                  | State       | Color  |
| -------------------------- | ----------- | ------ |
| CPP ≥ 2× program valuation | Positive    | Green  |
| CPP ≥ 1× program valuation | Information | Blue   |
| CPP < 1× program valuation | Warning     | Orange |

### 3.7 Contrast Verification (D-316, D-318)

Bar: WCAG 2.2 AA. Text needs 4.5:1, because button labels are 14px (400 at rest, 700 pressed) and dialog labels are 13px bold, both under the 18.5px-bold large-text line. Focus indicators need 3:1 against adjacent colors (SC 1.4.11). Ratios are shown to two decimals; no rounding crosses a bar. Research, sources and the scored alternatives are in [reference/accent-contrast-research.md](reference/accent-contrast-research.md).

| Pair                                  | Before | After  | Bar   |
| ------------------------------------- | ------ | ------ | ----- |
| Emphasized label, rest                | 2.64:1 | 4.96:1 | 4.5:1 |
| Emphasized label, hover               | 3.79:1 | 6.10:1 | 4.5:1 |
| Emphasized label, pressed             | 1.11:1 | 8.15:1 | 4.5:1 |
| Emphasized focus ring (white in fill) | 2.64:1 | 4.96:1 | 3:1   |
| Link / variant title on Warm Stone    | 4.27:1 | 5.23:1 | 4.5:1 |
| Link on Gold Mist (selected row)      | 4.26:1 | 5.22:1 | 4.5:1 |
| Link on Soft Ash                      | 3.97:1 | 4.86:1 | 4.5:1 |
| Link on white                         | 4.98:1 | 6.10:1 | 4.5:1 |
| Focus ring on white                   | 2.64:1 | 3.79:1 | 3:1   |
| Focus ring on Warm Stone              | 2.26:1 | 3.25:1 | 3:1   |
| Focus ring on Soft Ash                | 2.10:1 | 3.02:1 | 3:1   |

**D-318 rows.** Amber was still carrying three state cues after D-316, each between 2.10:1 and 2.64:1. They move to steps D-316 already uses:

| Pair                                                | Before | After  | Bar   |
| --------------------------------------------------- | ------ | ------ | ----- |
| Field focus border on white field (Dark Amber)      | 2.64:1 | 3.79:1 | 3:1   |
| Field focus border on Parchment (Dark Amber)        | 2.53:1 | 3.62:1 | 3:1   |
| Nav selection bar on Gold Mist (Burnt Gold)         | 2.26:1 | 4.25:1 | 3:1   |
| Nav selection bar on Soft Ash (Burnt Gold)          | 2.10:1 | 3.95:1 | 3:1   |
| Selected color on Parchment — tab bar, row border   | 2.53:1 | 4.74:1 | 3:1   |
| Selected color on Warm Stone                        | 2.26:1 | 4.25:1 | 3:1   |
| White step number on current wizard circle          | 2.64:1 | 4.96:1 | 4.5:1 |
| Selected tab / current wizard step text (Deep Gold) | n/a    | 5.83:1 | 4.5:1 |
| Check mark on white field (Deep Gold)               | n/a    | 6.10:1 | 3:1   |

**D-320 rows.** Horizon's slate label text fell under the bar on Soft Ash. Driftwood `#6B6259` replaces it:

| Pair                     | Before | After  | Bar   |
| ------------------------ | ------ | ------ | ----- |
| Label text on Soft Ash   | 4.39:1 | 4.76:1 | 4.5:1 |
| Label text on Warm Stone | 4.72:1 | 5.12:1 | 4.5:1 |
| Label text on Parchment  | 5.27:1 | 5.71:1 | 4.5:1 |

"n/a" rows were Horizon blue before. The step-number row is why selection is Burnt Gold and not Dark Amber: white on Dark Amber is 3.79:1, under the text bar.

The pressed label before the fix was Horizon's blue `--sapButton_Emphasized_Active_TextColor` (`#0064D9`) on Burnt Gold. D-316 pins it to white.

**Disabled** emphasized buttons keep Horizon's 0.4 opacity: a white label on `#D2C3A7` over white, 1.73:1. That is permitted, because inactive components are exempt from SC 1.4.3 and SC 1.4.11.

**APCA** is not a conformance target, since it is not in WCAG 3 drafts. It is recorded as a cross-check only. The emphasized label scores Lc −79.6 and links on Warm Stone score Lc 69.9.

**Rule going forward:** Amber `#C8973E` never carries text and is never the only cue for a required state. Hover may use it, since SC 1.4.11 does not require hover to reach 3:1. Any new text-on-accent or accent-on-surface pair gets a row in this table before it ships.

---

## 4. Border Radius

### 4.1 Rule

All container and interactive control border radii set to `0`. Sharp edges throughout. This gives the app a clean, architectural feel that pairs with the Obsidian & Amber palette.

### 4.2 Components Set to 0

| Component Category | SAPUI5 Controls                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Buttons**        | `sap.m.Button`, `sap.m.SegmentedButton`, `sap.m.ToggleButton`                                                                                        |
| **Inputs**         | `sap.m.Input`, `sap.m.TextArea`, `sap.m.SearchField`, `sap.m.DatePicker`, `sap.m.ComboBox`, `sap.m.MultiComboBox`, `sap.m.Select`, `sap.m.StepInput` |
| **Cards**          | `sap.f.Card`, `sap.m.GenericTile`, `sap.ui.integration.widgets.Card`                                                                                 |
| **Containers**     | `sap.m.Panel`, `sap.m.Dialog`, `sap.m.Popover`, `sap.m.MessageStrip`, `sap.m.MessageBox`                                                             |
| **Toolbar**        | `sap.m.OverflowToolbar`, `sap.m.Toolbar`                                                                                                             |
| **Tabs**           | `sap.m.IconTabBar` (tab headers)                                                                                                                     |
| **Checkboxes**     | `sap.m.CheckBox` (square is the natural sharp-edge shape)                                                                                            |
| **Page chrome**    | ObjectPage section blocks, floating draft footers, DynamicPage header collapse/pin buttons, `sap.m.SplitButton`, `sap.m.Wizard` steps                |
| **Navigation**     | `sap.tnt.NavigationListItem` (items, groups and focus ring)                                                                                          |

### 4.3 Exceptions — Keep Rounded

| Component                       | Reason                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sap.m.RadioButton`             | Circle is the universal radio affordance — square radio buttons break the checkbox/radio distinction |
| Avatars / User icons            | Circular by convention                                                                               |
| `sap.m.Switch` track            | Pill shape is the toggle affordance                                                                  |
| `sap.m.ProgressIndicator` track | Slight rounding for visual clarity                                                                   |
| `sap.m.BusyIndicator`           | Animated — no border radius applicable                                                               |
| `sap.m.Wizard` step circles     | 50% — the numbered circle is the step affordance, the same reasoning as the radio button             |

### 4.4 Implementation

Six CSS custom property overrides:

```css
:root {
  --sapButton_BorderCornerRadius: 0;
  --sapButton_Segment_BorderCornerRadius: 0;
  --sapField_BorderCornerRadius: 0;
  --sapElement_BorderCornerRadius: 0;
  --sapPopover_BorderCornerRadius: 0;
  --sapTile_BorderCornerRadius: 0;
}
```

The tokens do not reach every corner. Horizon 1.136.16 hardcodes radii on ObjectPage blocks (12px), floating footers (12px), the DynamicPage collapse and pin buttons (8px), the split button frame (8px), the focused wizard step (8px), navigation items (6px) and the input focus ring (4px). Each gets a targeted rule (§7.2). The exceptions in §4.3 don't need explicit overrides — they use their own CSS classes and are not affected by these parameters.

---

## 5. Component Overrides

### 5.1 ShellBar

| Property         | Horizon Default   | Override                                                                                                               |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Background       | White (`#FFFFFF`) | Obsidian (`#2A2725`)                                                                                                   |
| Text / app title | Dark (`#131E29`)  | White (`#FFFFFF`)                                                                                                      |
| Icons            | Dark              | White                                                                                                                  |
| Hover            | Light grey        | Warm Smoke (`#3D3A37`)                                                                                                 |
| Bottom separator | 1px border        | Subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.15)` — soft drop shadow anchors the dark bar against the warm stone content |

### 5.2 Emphasized Buttons

| Property          | Horizon Default      | Override               |
| ----------------- | -------------------- | ---------------------- |
| Background        | SAP Blue (`#0070F2`) | Burnt Gold (`#8E6A24`) |
| Text              | White                | White, all states      |
| Border            | None                 | Matches background     |
| Hover background  | Darker blue          | Deep Gold (`#7A5E1B`)  |
| Active background | Darkest blue         | Umber (`#654B1D`)      |
| Active text       | Blue (`#0064D9`)     | White (`#FFFFFF`)      |
| Focus outline     | White ring in fill   | White ring in fill     |

The fill gets darker at each state, and the white label gets more contrast with it: 4.96:1 → 6.10:1 → 8.15:1 (§3.7, D-316). Amber is not used as the fill. White on Amber is 2.64:1.

### 5.3 Default Buttons (non-emphasized)

| Property         | Horizon Default  | Override                 |
| ---------------- | ---------------- | ------------------------ |
| Background       | Transparent      | Transparent (unchanged)  |
| Text             | Blue (`#0064D9`) | Obsidian (`#2A2725`)     |
| Border           | 1px blue         | 1px Obsidian (`#2A2725`) |
| Hover background | Light blue tint  | Gold Mist (`#F5EDD8`)    |
| Hover border     | Darker blue      | Dark Amber (`#A67C2E`)   |
| Hover text       | Blue (`#0064D9`) | Obsidian (`#2A2725`)     |

Ghost/transparent buttons follow the same pattern — obsidian text, no border at rest, Gold Mist hover with a Dark Amber border, Burnt Gold border when pressed.

The CSV Import upload control is `sap.ui.unified.FileUploader`. Its button is a `sap.m.Button` and takes this treatment, but `sap.ui.unified` hardcodes the button's hover grey, pressed blue and dotted blue outline, so three targeted rules route them back to the tokens (§7.2). The native `<input type="file">` inside it is a 0.01-opacity click target: its Arial computed font is never painted.

### 5.4 Cards

| Property      | Horizon Default  | Override               |
| ------------- | ---------------- | ---------------------- |
| Box shadow    | Subtle elevation | Keep (Horizon default) |
| Border        | None             | None (unchanged)       |
| Background    | White            | Parchment (`#FAFAF8`)  |
| Border radius | Rounded          | 0 (per §4)             |

Cards get sharp corners from §4 but retain their Horizon shadow. Parchment surface provides subtle lift against Warm Stone page background.

### 5.5 Side Navigation

| Property                     | Horizon Default  | Override                                                        |
| ---------------------------- | ---------------- | --------------------------------------------------------------- |
| Background                   | White            | Soft Ash (`#E8E5E2`) — nav and items transparent over the aside |
| Active item indicator        | Blue left border | Burnt Gold left border (`#8E6A24`), 3px (D-318)                 |
| Active item background       | Blue tint        | Gold Mist (`#F5EDD8`)                                           |
| Hover background             | Light grey       | Gold Mist (`#F5EDD8`)                                           |
| Item corners                 | 6px              | 0 (per §4)                                                      |
| Focus ring                   | Blue `#0032A5`   | Dark Amber (`#A67C2E`), square                                  |
| Group headers                | Grey text        | Grey text (unchanged)                                           |
| Divider between groups       | Light grey       | Light grey (unchanged)                                          |
| Collapsed mode — active icon | Blue             | Not verified — no collapsed mode in use                         |

The tinted side nav background creates a three-column depth effect: dark shell > warm sidebar > light content.

### 5.6 Input Fields

| Property        | Horizon Default     | Override                                                                 |
| --------------- | ------------------- | ------------------------------------------------------------------------ |
| Background      | White               | White (unchanged) — the fill marks an editable field on a Parchment card |
| Hover border    | Blue                | Amber (`#C8973E`) — hover needs no 3:1                                   |
| Focus border    | Dark blue `#0032A5` | Dark Amber (`#A67C2E`), ≥ 3.62:1 (D-318)                                 |
| Focus outline   | Blue                | Dark Amber (`#A67C2E`), ≥ 3:1 (D-316), square corners                    |
| Value help icon | Blue                | Horizon default (keep — functional affordance)                           |

Applies to: `Input`, `TextArea`, `SearchField`, `DatePicker`, `ComboBox`, `Select`, `StepInput`.

### 5.7 Tables

| Property           | Horizon Default     | Override                                                |
| ------------------ | ------------------- | ------------------------------------------------------- |
| Row density        | Compact (~32px)     | Compact (unchanged, per D-56)                           |
| Row hover          | Light blue tint     | Gold Mist (`#F5EDD8`)                                   |
| Selected row       | Blue tint           | Gold Mist (`#F5EDD8`), Burnt Gold bottom border (D-318) |
| Header background  | White               | Parchment (`#FAFAF8`)                                   |
| Body background    | White               | Parchment (`#FAFAF8`)                                   |
| Check mark         | Blue                | Deep Gold (`#7A5E1B`)                                   |
| Column borders     | None (Horizon)      | None (unchanged)                                        |
| Header/footer rule | Grey-blue `#A8B3BD` | Taupe (`#B3ABA3`), 2.17:1 on Parchment (D-319)          |

### 5.8 Dialogs & Popovers

| Property         | Horizon Default   | Override                                                |
| ---------------- | ----------------- | ------------------------------------------------------- |
| Overlay backdrop | `rgba(0,0,0,0.6)` | Unchanged                                               |
| Box shadow       | Elevation shadow  | Keep — dialogs need visual separation from page content |
| Border radius    | Rounded           | 0 (per §4)                                              |

Dialogs retain their box-shadow (unlike the flat page content) because they float above the page and need depth to communicate modality.

### 5.9 Message Strips

No overrides beyond 0 border radius. Semantic colors (green, red, orange, blue) drive Message Strip appearance. The Obsidian & Amber palette does not interfere.

### 5.10 Tabs & Wizard

| Property                        | Horizon Default | Override                                     |
| ------------------------------- | --------------- | -------------------------------------------- |
| IconTabBar selected text        | Blue            | Deep Gold (`#7A5E1B`)                        |
| IconTabBar selected bar / icons | Blue            | Burnt Gold (`#8E6A24`)                       |
| Wizard current step title       | Blue, 72-Bold   | Deep Gold (`#7A5E1B`), DM Sans bold          |
| Wizard current step circle      | Blue fill       | Burnt Gold fill, white number — 4.96:1       |
| Wizard step container           | White, rounded  | Parchment (`#FAFAF8`), 0 radius; circles 50% |

### 5.11 Typography

DM Sans replaces every `72` family token, not only `--sapFontFamily`: Light, Bold, Semibold, SemiboldDuplex, Header, Black, the button and emphasized-button families, and the object-header title. Horizon took weight from the face itself (`72-Bold`), so the wizard step title and the page title state `font-weight: bold` explicitly. Text buttons stay at 400, which is what they already rendered under the `.sapMBtnContent` override.

### 5.12 Illustrations (D-319)

Every `IllustratedMessage` scene in 1.136.16 paints from `--sapContent_Illustrative_Color1` to `Color31`. The `--sapIllus_*` names are aliases of those tokens, so retinting the base tokens reaches both. The blue steps move to an amber ramp in the same light-to-dark order, on the palette's 39–43° hue:

| Token     | Horizon   | Override  | Role in the scene             |
| --------- | --------- | --------- | ----------------------------- |
| `Color7`  | `#DBF1FF` | `#F5EDD8` | Lightest wash (Gold Mist)     |
| `Color10` | `#DBF1FF` | `#F5EDD8` | Lightest wash (Gold Mist)     |
| `Color18` | `#BCE5FF` | `#EEDFBB` | Light tint                    |
| `Color19` | `#A3DBFF` | `#E8D3A2` | Light tint                    |
| `Color20` | `#89D1FF` | `#E2C88A` | Scene panel                   |
| `Color2`  | `#56BDFF` | `#D4AC5E` | Mid tone                      |
| `Color21` | `#1B90FF` | `#C8973E` | Amber                         |
| `Color13` | `#0070F2` | `#A67C2E` | Main figure fill (Dark Amber) |
| `Color14` | `#0040B0` | `#7A5E1B` | Deep shade (Deep Gold)        |
| `Color4`  | `#00144A` | `#2A2725` | Outline (Obsidian)            |
| `Color22` | `#00144A` | `#2A2725` | Outline (Obsidian)            |
| `Color5`  | `#A9B4BE` | `#B3ABA3` | Layering grey (Taupe)         |
| `Color6`  | `#D5DADD` | `#DCD7D1` | Light layering grey           |

Skin tones, hair, red, green, teal (`Color9`, `Color17`) and magenta (`Color1`, `Color11`) are not SAP blue and stay. The artwork is decorative, so no contrast bar applies to it.

---

## 6. Override Strategy

### 6.1 Approach

Single custom CSS file loaded after Horizon. No theme build tooling, no SAP Theme Designer, no npm theming packages. Pure CSS cascade override.

SAPUI5's Horizon theme exposes all theming parameters as CSS custom properties (`--sapBrandColor`, `--sapField_BorderCornerRadius`, etc.). Redefining these in a custom stylesheet applies changes globally — every SAPUI5 component that references these properties picks up the new values automatically.

### 6.2 File Location

```
app/
  shared/
    css/
      theme-overrides.css    ← Single file, all overrides
```

### 6.3 Load Mechanism

The app has a single shell entry point (`index.html`) wrapping all pages via side navigation. `index.html` carries the SAPUI5 bootstrap (`https://ui5.sap.com/1.136.16/resources/sap-ui-core.js`, `data-sap-ui-theme="sap_horizon"`) and no override `<link>`. The override stylesheet is injected at runtime by the shell component:

```ts
// app/shell/Component.ts — init()
void includeStylesheet("shared/css/theme-overrides.css");
```

`onAfterRendering()` then re-appends that `<link>` to the end of `<head>`, so it stays after library CSS that loads late (`sap.ui.unified`, for one) and wins by cascade order.

One injection, one file, applied to all apps. No per-app references needed.

### 6.4 Override Layers

The CSS file contains two layers:

| Layer                     | Mechanism                                           | Purpose                                                                                                                                                     |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Custom properties**  | `:root { --sapBrandColor: #C8973E; ... }`           | Colors, fonts, border radii — 102 of the file's 131 blocks. All components referencing these properties update automatically.                               |
| **2. Targeted selectors** | `.sapMIBar.sapMTB.sapMOTB.sapTntToolHeader { ... }` | Component-specific tweaks where Horizon hardcodes a value instead of reading a token (the ToolHeader ignores `--sapShellColor`; hardcoded radii and greys). |

Layer 1 always comes first. Layer 2 is the escape hatch — used sparingly and only when needed.

### 6.5 Specificity Rules

- `:root` custom properties: Win by cascade order (same specificity as Horizon's `:root`, but loaded after).
- Targeted selectors: Match Horizon's selector specificity exactly — don't add unnecessary `!important` or deep nesting. If Horizon uses `.sapMBtn`, we use `.sapMBtn`.
- `!important`: Banned. If an override needs `!important`, the selector is wrong — investigate the correct class name instead.

### 6.6 What We Do NOT Use

| Tool                                                 | Why Not                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| SAP Theme Designer                                   | Cloud-hosted, generates `.theming` packages. Overkill for targeted overrides. Adds build dependency. |
| `@sap-theming/` npm packages                         | Build-time theme compilation. Unnecessary when CSS custom properties cover our needs.                |
| Less/Sass compilation                                | Horizon uses CSS custom properties natively. No preprocessor step needed.                            |
| `sap.ui.getCore().applyTheme()` with custom theme ID | Requires a registered theme package. We're augmenting Horizon, not replacing it.                     |

### 6.7 Maintenance

- SAPUI5 custom property names (e.g., `--sapBrandColor`) are part of SAP's public API — stable across minor versions.
- On SAPUI5 major version upgrades, review `theme-overrides.css` against the new property list. Expected effort: minimal, one file to check.
- Targeted selectors (Layer 2) are more fragile than custom properties. Each selector should have a comment noting which component and version it targets.

---

## 7. Color Mapping Table

### 7.1 Layer 1 — CSS Custom Properties

All values set via `:root { }` block — **102 properties**, grouped as in the file. The Horizon Default column was re-read on 2026-10-30 from the `:root` block of `sap/ui/core/themes/sap_horizon/library.css` at 1.136.16.

#### Typography

Every family token points at `var(--sapFontFamily)`, so one line carries the brand font (§5.11).

| CSS Custom Property                  | Horizon Default        | Override                                |
| ------------------------------------ | ---------------------- | --------------------------------------- |
| `--sapFontFamily`                    | `"72", "72full", ...`  | `"DM Sans", "72", "72full", Arial, ...` |
| `--sapFontLightFamily`               | `"72-Light", ...`      | `var(--sapFontFamily)`                  |
| `--sapFontBoldFamily`                | `"72-Bold", ...`       | `var(--sapFontFamily)`                  |
| `--sapFontSemiboldFamily`            | `"72-Semibold", ...`   | `var(--sapFontFamily)`                  |
| `--sapFontSemiboldDuplexFamily`      | `"72-SemiboldDuplex"…` | `var(--sapFontFamily)`                  |
| `--sapFontHeaderFamily`              | `"72-Bold", ...`       | `var(--sapFontFamily)`                  |
| `--sapFontBlackFamily`               | `"72Black", ...`       | `var(--sapFontFamily)`                  |
| `--sapObjectHeader_Title_FontFamily` | `"72Black", ...`       | `var(--sapFontFamily)`                  |
| `--sapButton_FontFamily`             | `"72-SemiboldDuplex"…` | `var(--sapFontFamily)`                  |
| `--sapButton_Emphasized_FontFamily`  | `"72-Bold", ...`       | `var(--sapFontFamily)`                  |

#### Brand & Selection

| CSS Custom Property                      | Horizon Default | Override  | Notes                                                 |
| ---------------------------------------- | --------------- | --------- | ----------------------------------------------------- |
| `--sapBrandColor`                        | `#0070F2`       | `#C8973E` | Amber — brand accent                                  |
| `--sapHighlightColor`                    | `#0064D9`       | `#8E6A24` | Burnt Gold — sits under white text in pickers (D-318) |
| `--sapActiveColor`                       | `#DEE2E5`       | `#8E6A24` | Burnt Gold pressed/active                             |
| `--sapSelectedColor`                     | `#0064D9`       | `#8E6A24` | Burnt Gold — nav bar, current wizard step (D-318)     |
| `--sapContent_FocusColor`                | `#0032A5`       | `#A67C2E` | Focus outlines — Dark Amber, ≥ 3:1 (D-316)            |
| `--sapContent_Selected_TextColor`        | `#0064D9`       | `#7A5E1B` | Deep Gold — selected text                             |
| `--sapContent_Selected_ForegroundColor`  | `#0064D9`       | `#7A5E1B` | Deep Gold — wizard current title, check mark          |
| `--sapContent_Selected_Hover_Background` | `#E3F0FF`       | `#F5EDD8` | Gold Mist — checkbox hover                            |
| `--sapField_Selector_Hover_Background`   | `#E3F0FF`       | `#F5EDD8` | Gold Mist — selector controls hover                   |

#### Links

| CSS Custom Property       | Horizon Default | Override  | Notes                                    |
| ------------------------- | --------------- | --------- | ---------------------------------------- |
| `--sapLinkColor`          | `#0064D9`       | `#7A5E1B` | Deep Gold — replaces Horizon blue (§3.4) |
| `--sapLink_Hover_Color`   | `#0064D9`       | `#7A5E1B` | Deep Gold                                |
| `--sapLink_Active_Color`  | `#0064D9`       | `#7A5E1B` | Deep Gold                                |
| `--sapLink_Visited_Color` | `#0064D9`       | `#7A5E1B` | Deep Gold — visited is not a new colour  |

#### Labels

| CSS Custom Property       | Horizon Default | Override  | Notes                                                            |
| ------------------------- | --------------- | --------- | ---------------------------------------------------------------- |
| `--sapContent_LabelColor` | `#556B82`       | `#6B6259` | Driftwood — ≥ 4.76:1 on every surface, Soft Ash included (D-320) |

#### Page Background & Surfaces

| CSS Custom Property            | Horizon Default | Override  | Notes                                       |
| ------------------------------ | --------------- | --------- | ------------------------------------------- |
| `--sapBackgroundColor`         | `#F5F6F7`       | `#F0EDEA` | Warm Stone — reduces white void             |
| `--sapGroup_ContentBackground` | `#FFFFFF`       | `#FAFAF8` | Parchment — ObjectPage blocks, wizard steps |
| `--sapTile_Background`         | `#FFFFFF`       | `#FAFAF8` | Parchment — cards, tiles (§5.4)             |
| `--sapList_Background`         | `#FFFFFF`       | `#FAFAF8` | Parchment — table body                      |
| `--sapList_HeaderBackground`   | `#FFFFFF`       | `#FAFAF8` | Parchment — table header                    |
| `--sapObjectHeader_Background` | `#FFFFFF`       | `#FAFAF8` | Parchment — page title, wizard progress bar |
| `--sapPageHeader_Background`   | `#FFFFFF`       | `#FAFAF8` | Parchment — page header                     |
| `--sapToolbar_Background`      | `#FFFFFF`       | `#FAFAF8` | Parchment — table toolbars                  |

`--sapField_Background` stays Horizon white: an input is a white fill on a Parchment card.

#### Shell

| CSS Custom Property               | Horizon Default | Override  | Notes                         |
| --------------------------------- | --------------- | --------- | ----------------------------- |
| `--sapShellColor`                 | `#FFFFFF`       | `#2A2725` | Obsidian shell background     |
| `--sapShell_TextColor`            | `#131E29`       | `#FFFFFF` | ShellBar text and app title   |
| `--sapShell_InteractiveTextColor` | `#131E29`       | `#FFFFFF` | ShellBar interactive elements |
| `--sapShell_Hover_Background`     | `#FFFFFF`       | `#3D3A37` | Warm Smoke hover              |

#### Buttons — Emphasized

| CSS Custom Property                         | Horizon Default | Override  | Notes                                                    |
| ------------------------------------------- | --------------- | --------- | -------------------------------------------------------- |
| `--sapButton_Emphasized_Background`         | `#0070F2`       | `#8E6A24` | Burnt Gold                                               |
| `--sapButton_Emphasized_BorderColor`        | `#0070F2`       | `#8E6A24` | Burnt Gold                                               |
| `--sapButton_Emphasized_TextColor`          | `#FFFFFF`       | `#FFFFFF` | Pinned                                                   |
| `--sapButton_Emphasized_Hover_Background`   | `#0064D9`       | `#7A5E1B` | Deep Gold                                                |
| `--sapButton_Emphasized_Hover_BorderColor`  | `#0064D9`       | `#7A5E1B` | Deep Gold                                                |
| `--sapButton_Emphasized_Hover_TextColor`    | `#FFFFFF`       | `#FFFFFF` | Pinned                                                   |
| `--sapButton_Emphasized_Active_Background`  | `#FFFFFF`       | `#654B1D` | Umber                                                    |
| `--sapButton_Emphasized_Active_BorderColor` | `#0064D9`       | `#654B1D` | Umber                                                    |
| `--sapButton_Emphasized_Active_TextColor`   | `#0064D9`       | `#FFFFFF` | White — Horizon's blue would be 1.48:1 on the Umber fill |

#### Buttons — Default

| CSS Custom Property                | Horizon Default | Override  | Notes      |
| ---------------------------------- | --------------- | --------- | ---------- |
| `--sapButton_TextColor`            | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_BorderColor`          | `#BCC3CA`       | `#2A2725` | Obsidian   |
| `--sapButton_Hover_Background`     | `#EAECEE`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Hover_BorderColor`    | `#BCC3CA`       | `#A67C2E` | Dark Amber |
| `--sapButton_Active_Background`    | `#FFFFFF`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Active_BorderColor`   | `#0064D9`       | `#8E6A24` | Burnt Gold |
| `--sapButton_Active_TextColor`     | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_IconColor`            | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_Hover_TextColor`      | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_Lite_Hover_TextColor` | `#0064D9`       | `#2A2725` | Obsidian   |

#### Buttons — Toggled (header pin, segmented)

| CSS Custom Property                      | Horizon Default | Override  | Notes      |
| ---------------------------------------- | --------------- | --------- | ---------- |
| `--sapButton_Selected_Background`        | `#EDF5FF`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Selected_BorderColor`       | `#0064D9`       | `#8E6A24` | Burnt Gold |
| `--sapButton_Selected_TextColor`         | `#0064D9`       | `#7A5E1B` | Deep Gold  |
| `--sapButton_Selected_Hover_Background`  | `#D9EAFF`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Selected_Hover_BorderColor` | `#0064D9`       | `#7A5E1B` | Deep Gold  |

#### Buttons — Transparent (Lite)

| CSS Custom Property                   | Horizon Default | Override  | Notes      |
| ------------------------------------- | --------------- | --------- | ---------- |
| `--sapButton_Lite_TextColor`          | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_Lite_Hover_Background`   | `#EAECEE`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Lite_Hover_BorderColor`  | `#BCC3CA`       | `#A67C2E` | Dark Amber |
| `--sapButton_Lite_Active_Background`  | `#FFFFFF`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Lite_Active_BorderColor` | `#0064D9`       | `#8E6A24` | Burnt Gold |

#### Input Fields

| CSS Custom Property                | Horizon Default       | Override              | Notes                                  |
| ---------------------------------- | --------------------- | --------------------- | -------------------------------------- |
| `--sapField_Focus_BorderColor`     | `#0032A5`             | `#A67C2E`             | Dark Amber — a focus indicator (D-318) |
| `--sapField_Hover_BorderColor`     | `#0064D9`             | `#C8973E`             | Amber — hover needs no 3:1             |
| `--sapField_Hover_BackgroundStyle` | bottom line `#0064D9` | bottom line `#C8973E` | The hover underline matches the border |
| `--sapField_Active_BorderColor`    | `#0064D9`             | `#A67C2E`             | Dark Amber active                      |

#### Lists & Tables

| CSS Custom Property                     | Horizon Default | Override  | Notes                                 |
| --------------------------------------- | --------------- | --------- | ------------------------------------- |
| `--sapList_Hover_Background`            | `#EAECEE`       | `#F5EDD8` | Gold Mist hover — also side-nav hover |
| `--sapList_SelectionBackgroundColor`    | `#EBF8FF`       | `#F5EDD8` | Gold Mist selected                    |
| `--sapList_SelectionBorderColor`        | `#0064D9`       | `#8E6A24` | Burnt Gold selected-row border        |
| `--sapList_Active_Background`           | `#DEE2E5`       | `#2A2725` | Obsidian pressed                      |
| `--sapList_Active_TextColor`            | `#131E29`       | `#FFFFFF` | White on Obsidian                     |
| `--sapList_HeaderBorderColor`           | `#A8B3BD`       | `#B3ABA3` | Taupe — header rule (D-319)           |
| `--sapList_GroupHeaderBorderColor`      | `#A8B3BD`       | `#B3ABA3` | Taupe                                 |
| `--sapList_TableGroupHeaderBorderColor` | `#A8B3BD`       | `#B3ABA3` | Taupe                                 |
| `--sapList_TableFooterBorder`           | `#A8B3BD`       | `#B3ABA3` | Taupe — table bottom rule             |
| `--sapGroup_TitleBorderColor`           | `#A8B3BD`       | `#B3ABA3` | Taupe                                 |

#### Illustrations

Thirteen `--sapContent_Illustrative_ColorN` tokens, listed with their Horizon values in §5.12.

#### Tabs

| CSS Custom Property            | Horizon Default | Override  | Notes                               |
| ------------------------------ | --------------- | --------- | ----------------------------------- |
| `--sapTab_ForegroundColor`     | `#0064D9`       | `#8E6A24` | Burnt Gold                          |
| `--sapTab_IconColor`           | `#0064D9`       | `#8E6A24` | Burnt Gold                          |
| `--sapTab_Selected_TextColor`  | `#0064D9`       | `#7A5E1B` | Deep Gold — text bar                |
| `--sapTab_Selected_Background` | `#0064D9`       | `#8E6A24` | Burnt Gold — selected bar and arrow |

#### Border Radius

| CSS Custom Property                      | Horizon Default | Override | Notes                       |
| ---------------------------------------- | --------------- | -------- | --------------------------- |
| `--sapButton_BorderCornerRadius`         | `0.5rem`        | `0`      |                             |
| `--sapButton_Segment_BorderCornerRadius` | `0.5rem`        | `0`      | Segmented and split buttons |
| `--sapField_BorderCornerRadius`          | `0.25rem`       | `0`      |                             |
| `--sapElement_BorderCornerRadius`        | `0.75rem`       | `0`      | Generic elements            |
| `--sapPopover_BorderCornerRadius`        | `0.5rem`        | `0`      | Dialogs, popovers           |
| `--sapTile_BorderCornerRadius`           | `1rem`          | `0`      | Cards, tiles                |

#### Not Overridden (kept at Horizon defaults)

| CSS Custom Property     | Horizon Default | Why Kept                                 |
| ----------------------- | --------------- | ---------------------------------------- |
| `--sapPositiveColor`    | `#256F3A`       | Semantic — no override                   |
| `--sapCriticalColor`    | `#E76500`       | Semantic — no override                   |
| `--sapNegativeColor`    | `#AA0808`       | Semantic — no override                   |
| `--sapInformativeColor` | `#0070F2`       | Semantic — no override                   |
| `--sapNeutralColor`     | `#788FA6`       | Semantic — no override                   |
| `--sapTextColor`        | `#131E29`       | Body text stays Horizon                  |
| `--sapField_Background` | `#FFFFFF`       | The white fill is the input's affordance |

### 7.2 Layer 2 — Targeted Selectors

**29 rules, 49 selectors** (the typography rule alone lists 12). Each exists because Horizon 1.136.16 hardcodes the value instead of reading a token. Verified against the running DOM on 2026-10-30; each carries a comment in the CSS file.

| Selector                                                                     | Override                                 | Reason                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- |
| `.sapUiBody`                                                                 | `font-family`                            | Body font                                                                       |
| `.sapUiBody .sapMText, ...` (12 selectors)                                   | `font-family`                            | Horizon bakes `"72"` into compiled CSS instead of referencing `--sapFontFamily` |
| `.sapMWizardProgressNavStepTitle`                                            | `font-weight: bold`                      | Weight came from the `72-Bold` face                                             |
| `.sapFDynamicPageTitleMainHeadingInner .sapMTitle`                           | `font-weight: bold`                      | Weight came from the `72Black` face; `.sapMTitle` resets it to normal           |
| `.sapUxAPObjectPageHeaderStickied ... .sapMTitle`                            | `font-family`                            | Stuck ObjectPage title hardcodes `"72Black"`                                    |
| `.sapMIBar.sapMTB.sapMOTB.sapTntToolHeader`                                  | background, color, `box-shadow`, z-index | ToolHeader ignores `--sapShellColor`; the shadow is the §5.1 separator          |
| `.sapTntToolHeader .sapMTitle`, `.sapTntToolHeader > .sapUiIcon`             | `color`                                  | Title and icon default to dark text on the dark bar                             |
| `... .sapTntToolHeader .sapMBtnInner`, `.sapMBtnIcon`, `:hover` (3 rules)    | color, hover background                  | Transparent buttons inherit dark text on the dark bar                           |
| `.sapTntToolPageMain`                                                        | `background-color`                       | Hardcoded cool grey `#F5F6F7` → Warm Stone                                      |
| `.sapUxAPObjectPageWrapper`                                                  | `background-color`                       | ObjectPage scroll area, same cool grey                                          |
| `.sapFDynamicPage .sapFDynamicPageContentWrapperStandard > ...Content`       | `background`                             | List-report content, same cool grey                                             |
| `.sapFDynamicPageHeader`, snapped header wrapper                             | `background`                             | Filter-bar band hardcodes white → `--sapObjectHeader_Background`                |
| DynamicPage collapse and pin `.sapMBtnInner`, `.sapMSB .sapMSBText`          | `border-radius: 0`                       | Hardcoded 8px                                                                   |
| `.sapUxAPObjectPageSection ... .sapUxAPBlockContainer`                       | `background`, `border-radius: 0`         | Hardcoded white and 12px                                                        |
| `.sapUxAPObjectPageFloatingFooter`, `.sapFDynamicPageActualFooterControl`    | `border-radius: 0`                       | Floating draft footers hardcode 12px                                            |
| `.sapMFocus.sapMInputBase .sapMInputBaseContentWrapper::before`              | `border-radius: 0`                       | Input focus ring hardcodes 4px                                                  |
| `.sapMWizardProgressNavStep:focus .sapMWizardProgressNavStepContainer`       | `border-radius: 0`                       | Focused step hardcodes 8px; circles keep 50% (§4.3)                             |
| `.sapUiFup .sapMBtnHoverable:hover`                                          | `background-color`                       | FileUploader button hardcodes hover grey `#EAECEE`                              |
| `.sapUiFup .sapMBtnInner:active`                                             | background, border, color                | Pressed state hardcodes white and blue `#0064D9`                                |
| `html.sap-desktop .sapUiFup .sapMFocusable:focus`, `:active` (2 selectors)   | `outline-color`                          | Dotted outline hardcodes `#0032A5`                                              |
| `.sapTntToolPageAsideContent`                                                | `background-color`                       | Soft Ash (`#E8E5E2`) aside                                                      |
| `.sapTntSideNavigation`                                                      | `background: transparent`                | Nav hardcodes white over the aside                                              |
| `.sapTntNLI`, `.sapTntNLGroup`                                               | transparent, `border-radius: 0`          | Items hardcode white and 6px                                                    |
| `.sapTntNLI:not(...):hover`                                                  | `background-color`                       | Hover hardcodes grey → Gold Mist                                                |
| `.sapTntNLI.sapTntNLISelected`, `.sapTntNLISelected.sapTntNLISecondLevel...` | `background` (composite)                 | Blue bar and tint → Burnt Gold bar on Gold Mist; second level has its own rule  |
| `.sapTntNLI.sapTntNLISelected a`                                             | `background-color`                       | Inner anchor's blue tint → Gold Mist                                            |
| `.sapTntNL .sapTntNLI:not(...)[tabindex]:focus::after` (2 selectors)         | `border-color`, `border-radius: 0`       | Focus ring is a hardcoded `#0032A5` border, not `--sapContent_FocusColor`       |

### 7.3 Note on Horizon Defaults

Horizon default values listed above were read from the `sap_horizon` 1.136.16 `:root` parameter block on the CDN on 2026-10-30. Before that pass several were wrong, among them `--sapBackgroundColor` (`#F5F6F7`, not `#FAFAFA`), `--sapActiveColor`, `--sapShell_TextColor`, `--sapShell_Hover_Background`, `--sapButton_Emphasized_Active_Background` and three radius tokens. The override values are final — Horizon defaults are documented here for reference, not as contractual values.

The two counts — 102 properties in §7.1, 29 rules in §7.2 — are counts of the file as it stands. Recount them whenever the file changes, rather than adjusting the number by hand.

---

## 8. Spec Amendments

| Document                                 | Amendment                                                                                                                                                                 | Decision |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| DS-001 §6 (D-60)                         | "Standard Horizon semantic colors only, no custom accent" replaced with Obsidian & Amber palette. Semantic colors unchanged.                                              | D-317    |
| TH-001 §3.2 (D-308)                      | Warm Charcoal palette replaced by Obsidian & Amber 10-value palette.                                                                                                      | D-317    |
| TH-001 §5.1 (D-309)                      | ShellBar color changed from `#3D3A38` to `#2A2725` (Obsidian).                                                                                                            | D-317    |
| TH-001 §3.4                              | Link color changed from Horizon blue to Deep Gold (`#8B6B1F`, darkened to `#7A5E1B` by D-316).                                                                            | D-317    |
| TH-001 §3, §5.2, §7                      | Emphasized fill Amber → Burnt Gold, with hover and pressed fills darker. Deep Gold `#8B6B1F` → `#7A5E1B`. Focus ring Amber → Dark Amber. False contrast claims corrected. | D-316    |
| TH-001 §3.2, §5.5–§5.7, §7               | Selection color, nav indicator and tab bar Amber → Burnt Gold. Field focus border Amber → Dark Amber. Selected text and check mark → Deep Gold.                           | D-318    |
| TH-001 §3.1, §3.2, §5.3, §5.7, §5.12, §7 | "Zero SAP blue" covers decorative illustrations. Illustration blues → amber ramp; table rules → Taupe; default-button hover text → Obsidian.                              | D-319    |
| TH-001 §3.2, §3.7, §7.1                  | `--sapContent_LabelColor` → Driftwood `#6B6259`, replacing Horizon slate `#556B82`, which fell to 4.39:1 on Soft Ash.                                                     | D-320    |

---

## 9. Decisions Reference

| ID    | Title                              | Summary                                                                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-308 | ~~Brand palette — Warm Charcoal~~  | Superseded by D-317. Was: `#3D3A38` as primary brand color.                                                                                                                                                                                                                                                                         |
| D-309 | ~~Dark ShellBar~~                  | Superseded by D-317. Was: Charcoal background (`#3D3A38`).                                                                                                                                                                                                                                                                          |
| D-310 | Zero border radius                 | All containers and interactive controls set to `0`. Exceptions: radio buttons, avatars, switch tracks, progress indicators, wizard step circles.                                                                                                                                                                                    |
| D-311 | ~~Component overrides~~            | Superseded by D-317. Was: Charcoal emphasized buttons, Warm Mist hover/selection.                                                                                                                                                                                                                                                   |
| D-312 | Override strategy                  | Single CSS file (`app/shared/css/theme-overrides.css`) loaded after Horizon — today by `includeStylesheet` in the shell `Component.ts`, re-appended after render (§6.3). Two layers: CSS custom properties first, targeted selectors as fallback. No theme build tooling.                                                           |
| D-313 | ~~Color mapping table~~            | Superseded by D-317. Was: 28 custom properties, 8 kept at defaults.                                                                                                                                                                                                                                                                 |
| D-317 | Obsidian & Amber identity          | Full brand rebrand. Obsidian (`#2A2725`) shell, Amber (`#C8973E`) accent, Deep Gold (`#8B6B1F`, now `#7A5E1B` per D-316) links, Warm Stone (`#F0EDEA`) page background, Soft Ash (`#E8E5E2`) side nav. Override counts live in §7, not here. Supersedes D-308, D-309, D-311, D-313.                                                 |
| D-316 | Accent contrast                    | Amber is non-text only. Emphasized buttons: white text on Burnt Gold `#8E6A24`, Deep Gold `#7A5E1B` on hover, Umber `#654B1D` pressed, active text pinned white. Deep Gold darkened to `#7A5E1B`. Focus ring is Dark Amber `#A67C2E`. All pass WCAG 2.2 AA (§3.7). Amends D-317.                                                    |
| D-318 | Selection and field-focus contrast | The three Amber state cues left after D-316 (2.10–2.64:1) move down the hue. `--sapSelectedColor` and `--sapHighlightColor` → Burnt Gold `#8E6A24` (≥ 3.95:1 on every surface, 4.96:1 under white). `--sapField_Focus_BorderColor` → Dark Amber `#A67C2E`, matching the focus ring. Amber keeps brand and hover only. Amends D-316. |
| D-319 | Illustrations and structural rules | §3.1's "zero SAP blue" covers decorative artwork. `IllustratedMessage` blues → amber ramp, navy outlines → Obsidian, cool greys → Taupe `#B3ABA3`, which also replaces Horizon's grey-blue table rules. Semantic blue and issuer chart colors stay. Amends D-317.                                                                   |
| D-320 | Label text                         | `--sapContent_LabelColor` → Driftwood `#6B6259`, the warm twin of Horizon's slate `#556B82`. 5.71:1 on Parchment, 5.12:1 on Warm Stone, 4.76:1 on Soft Ash, where the slate fell to 4.39:1. Fixes D-018.                                                                                                                            |

---

_This document is the single source of truth for the Financial Planner's custom theme. It layers on top of [Design System](DESIGN_SYSTEM.md) (D-56 through D-62), references issuer colors from [SPEC-19](specs/SPEC-19-CHURNBOARD.md) §4.1.13 (D-220) and CPP coloring from [SPEC-21](specs/SPEC-21-TROPHY-CASE.md) BR-06. All decisions logged in [Decisions Log](user-profile/DECISIONS_LOG.md)._
