# Theme

**Document ID:** TH-001
**Version:** 1.0
**Date:** 2026-02-21
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                      |
| ---------- | --------------- | ---------------------------------------------------------------- |
| 2026-02-21 | Sandro & Claude | Initial creation — Step 14 complete. D-308 through D-313 logged. |
| 2026-02-21 | Sandro          | Approved. Status Draft → Approved.                               |

---

## 2. Summary

Custom visual identity layered on top of `sap_horizon` (Horizon Light). Targeted overrides only — no theme package, no build tooling.

| Aspect              | Decision                                                        |
| ------------------- | --------------------------------------------------------------- |
| **Base Theme**      | SAP Horizon Light (`sap_horizon`) — unchanged (D-56)            |
| **Brand Identity**  | "Obsidian & Amber" — warm gold accent on dark shell (D-314)     |
| **Shell Color**     | Obsidian `#2A2725` — deep warm black (D-314)                    |
| **Accent Color**    | Amber `#C8973E` — warm gold for interactive elements (D-314)    |
| **Border Radius**   | 0 on all containers and interactive controls (D-310)            |
| **Card Treatment**  | Horizon shadow retained, sharp corners (D-311)                  |
| **Semantic Colors** | Horizon defaults — no override                                  |
| **Link Color**      | Deep Gold `#8B6B1F` — replaces Horizon blue for WCAG AA (D-314) |
| **Page Background** | Warm Stone `#F0EDEA` — reduces white void (D-314)               |
| **Side Nav**        | Soft Ash `#E8E5E2` — tinted for three-column depth (D-314)      |
| **Override Method** | Single CSS file after Horizon, CSS custom properties (D-312)    |
| **Total Overrides** | 30 custom properties + ~5 targeted selectors (D-314)            |
| **Amends**          | D-60, D-308, D-309, D-313 (replaced by D-314 palette)           |

---

## 3. Color Palette

### 3.1 Design Intent

"Obsidian & Amber" — a warm, premium palette inspired by financial instruments and achievement. The deep obsidian shell anchors the app while amber accents connote finance, value, and reward. Zero SAP blue in any brand or interactive element. Semantic colors (green, red, orange, blue, grey) remain unchanged and carry all functional meaning.

This amends D-60 ("standard Horizon semantic colors only, no custom accent") and replaces the earlier Warm Charcoal palette (D-308/D-309) with a fully differentiated brand identity.

### 3.2 Brand Palette

| Role                    | Name       | Hex       | Usage                                                                                     |
| ----------------------- | ---------- | --------- | ----------------------------------------------------------------------------------------- |
| **Shell/Primary**       | Obsidian   | `#2A2725` | ShellBar background, active list press, deep anchor color                                 |
| **Accent**              | Amber      | `#C8973E` | Emphasized buttons, nav active indicator, selection highlight, focus outline, brand color |
| **Accent Hover**        | Dark Amber | `#A67C2E` | Hover states on emphasized buttons and interactive elements                               |
| **Accent Active**       | Burnt Gold | `#8E6A24` | Pressed/active state on emphasized elements                                               |
| **Link Text**           | Deep Gold  | `#8B6B1F` | Text links — replaces Horizon blue, WCAG AA compliant                                     |
| **Page Background**     | Warm Stone | `#F0EDEA` | Page/body background — reduces white void                                                 |
| **Surface**             | Parchment  | `#FAFAF8` | Card/content group backgrounds — subtle lift against Warm Stone                           |
| **Side Nav**            | Soft Ash   | `#E8E5E2` | Side navigation panel — three-column depth effect                                         |
| **Selected Background** | Gold Mist  | `#F5EDD8` | Selected table rows, hover backgrounds, active list items                                 |
| **Shell Hover**         | Warm Smoke | `#3D3A37` | Hover on ShellBar elements (lighter than obsidian on dark surface)                        |

All values share a warm undertone (amber-brown family, not cool/blue). Contrast ratios: Obsidian against white = ~13.5:1 (WCAG AAA). Amber against white = ~3.8:1 (WCAG AA for large text). Deep Gold against white = ~5.6:1 (WCAG AA).

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

Text links use Deep Gold (`#8B6B1F`) instead of Horizon blue. This eliminates the last SAP-blue fingerprint from interactive elements. Deep Gold against white = ~5.6:1, meeting WCAG AA. Links remain visually distinct from body text (`#1D2D3E`) through both color difference and underline convention.

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

---

## 4. Border Radius

### 4.1 Rule

All container and interactive control border radii set to `0`. Sharp edges throughout. This gives the app a clean, architectural feel that pairs with the understated charcoal palette.

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

### 4.3 Exceptions — Keep Rounded

| Component                       | Reason                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `sap.m.RadioButton`             | Circle is the universal radio affordance — square radio buttons break the checkbox/radio distinction |
| Avatars / User icons            | Circular by convention                                                                               |
| `sap.m.Switch` track            | Pill shape is the toggle affordance                                                                  |
| `sap.m.ProgressIndicator` track | Slight rounding for visual clarity                                                                   |
| `sap.m.BusyIndicator`           | Animated — no border radius applicable                                                               |

### 4.4 Implementation

Five CSS custom property overrides:

```css
:root {
  --sapButton_BorderCornerRadius: 0;
  --sapField_BorderCornerRadius: 0;
  --sapElement_BorderCornerRadius: 0;
  --sapPopover_BorderCornerRadius: 0;
  --sapTile_BorderCornerRadius: 0;
}
```

The exceptions in §4.3 don't need explicit overrides — they use their own CSS classes and are not affected by these parameters. Full parameter list in §7.

---

## 5. Component Overrides

### 5.1 ShellBar

| Property         | Horizon Default   | Override                                                                                                               |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Background       | White (`#FFFFFF`) | Obsidian (`#2A2725`)                                                                                                   |
| Text / app title | Dark (`#1D2D3E`)  | White (`#FFFFFF`)                                                                                                      |
| Icons            | Dark              | White                                                                                                                  |
| Hover            | Light grey        | Warm Smoke (`#3D3A37`)                                                                                                 |
| Bottom separator | 1px border        | Subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.15)` — soft drop shadow anchors the dark bar against the warm stone content |

### 5.2 Emphasized Buttons

| Property          | Horizon Default      | Override               |
| ----------------- | -------------------- | ---------------------- |
| Background        | SAP Blue (`#0070F2`) | Amber (`#C8973E`)      |
| Text              | White                | White (unchanged)      |
| Border            | None                 | Amber (`#C8973E`)      |
| Hover background  | Darker blue          | Dark Amber (`#A67C2E`) |
| Active background | Darkest blue         | Burnt Gold (`#8E6A24`) |
| Focus outline     | Blue                 | Amber (`#C8973E`)      |

### 5.3 Default Buttons (non-emphasized)

| Property         | Horizon Default  | Override                 |
| ---------------- | ---------------- | ------------------------ |
| Background       | Transparent      | Transparent (unchanged)  |
| Text             | Blue (`#0064D9`) | Obsidian (`#2A2725`)     |
| Border           | 1px blue         | 1px Obsidian (`#2A2725`) |
| Hover background | Light blue tint  | Gold Mist (`#F5EDD8`)    |
| Hover border     | Darker blue      | Dark Amber (`#A67C2E`)   |

Ghost/transparent buttons follow the same pattern — obsidian text, no border, Gold Mist hover.

### 5.4 Cards

| Property      | Horizon Default  | Override               |
| ------------- | ---------------- | ---------------------- |
| Box shadow    | Subtle elevation | Keep (Horizon default) |
| Border        | None             | None (unchanged)       |
| Background    | White            | Parchment (`#FAFAF8`)  |
| Border radius | Rounded          | 0 (per §4)             |

Cards get sharp corners from §4 but retain their Horizon shadow. Parchment surface provides subtle lift against Warm Stone page background.

### 5.5 Side Navigation

| Property                     | Horizon Default  | Override                      |
| ---------------------------- | ---------------- | ----------------------------- |
| Background                   | White            | Soft Ash (`#E8E5E2`)          |
| Active item indicator        | Blue left border | Amber left border (`#C8973E`) |
| Active item background       | Blue tint        | Gold Mist (`#F5EDD8`)         |
| Hover background             | Light blue tint  | Gold Mist (`#F5EDD8`)         |
| Group headers                | Grey text        | Grey text (unchanged)         |
| Divider between groups       | Light grey       | Light grey (unchanged)        |
| Collapsed mode — active icon | Blue             | Amber                         |

The tinted side nav background creates a three-column depth effect: dark shell > warm sidebar > light content.

### 5.6 Input Fields

| Property        | Horizon Default                   | Override                                       |
| --------------- | --------------------------------- | ---------------------------------------------- |
| Border          | 1px bottom border (blue on focus) | 1px bottom border — Amber on focus             |
| Focus outline   | Blue                              | Amber (`#C8973E`)                              |
| Value help icon | Blue                              | Horizon default (keep — functional affordance) |

Applies to: `Input`, `TextArea`, `SearchField`, `DatePicker`, `ComboBox`, `Select`, `StepInput`.

### 5.7 Tables

| Property          | Horizon Default | Override                      |
| ----------------- | --------------- | ----------------------------- |
| Row density       | Compact (~32px) | Compact (unchanged, per D-56) |
| Row hover         | Light blue tint | Gold Mist (`#F5EDD8`)         |
| Selected row      | Blue tint       | Gold Mist (`#F5EDD8`)         |
| Header background | Light grey      | Light grey (unchanged)        |
| Column borders    | None (Horizon)  | None (unchanged)              |

### 5.8 Dialogs & Popovers

| Property         | Horizon Default   | Override                                                |
| ---------------- | ----------------- | ------------------------------------------------------- |
| Overlay backdrop | `rgba(0,0,0,0.6)` | Unchanged                                               |
| Box shadow       | Elevation shadow  | Keep — dialogs need visual separation from page content |
| Border radius    | Rounded           | 0 (per §4)                                              |

Dialogs retain their box-shadow (unlike the flat page content) because they float above the page and need depth to communicate modality.

### 5.9 Message Strips

No overrides beyond 0 border radius. Semantic colors (green, red, orange, blue) drive Message Strip appearance. The charcoal palette does not interfere.

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

The app has a single shell entry point (`index.html`) wrapping all pages via side navigation. The override stylesheet is loaded via a `<link>` tag placed **after** the SAPUI5 bootstrap:

```html
<!-- SAPUI5 bootstrap — loads sap_horizon from CDN -->
<script
  id="sap-ui-bootstrap"
  src="https://ui5.sap.com/1.136.16/resources/sap-ui-core.js"
  data-sap-ui-theme="sap_horizon"
  ...
></script>

<!-- Theme overrides — loaded after Horizon, wins by cascade order -->
<link rel="stylesheet" href="shared/css/theme-overrides.css" />
```

One `<link>`, one file, applied to all apps. No per-app references needed.

### 6.4 Override Layers

The CSS file contains two layers:

| Layer                     | Mechanism                                 | Purpose                                                                                                                                         |
| ------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Custom properties**  | `:root { --sapBrandColor: #3D3A38; ... }` | Colors, border radii — covers ~90% of overrides. All components referencing these properties update automatically.                              |
| **2. Targeted selectors** | `.sapMBtnEmphasized { ... }`              | Component-specific tweaks where custom properties alone don't achieve the desired result (e.g., ShellBar dark mode, specific hover treatments). |

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

All values set via `:root { }` block. Grouped by category.

#### Brand & Selection

| CSS Custom Property       | Horizon Default | Override  | Notes                                              |
| ------------------------- | --------------- | --------- | -------------------------------------------------- |
| `--sapBrandColor`         | `#0070F2`       | `#C8973E` | Amber accent — cascades to many derived properties |
| `--sapHighlightColor`     | `#0064D9`       | `#C8973E` | Selection and highlight                            |
| `--sapActiveColor`        | `#0064D9`       | `#8E6A24` | Pressed/active states (Burnt Gold)                 |
| `--sapSelectedColor`      | `#0064D9`       | `#C8973E` | Selected items                                     |
| `--sapContent_FocusColor` | `#0064D9`       | `#C8973E` | Focus outlines on all interactive elements         |

#### Links

| CSS Custom Property | Horizon Default | Override  | Notes                                    |
| ------------------- | --------------- | --------- | ---------------------------------------- |
| `--sapLinkColor`    | `#0064D9`       | `#8B6B1F` | Deep Gold — replaces Horizon blue (§3.4) |

#### Page Background & Surfaces

| CSS Custom Property            | Horizon Default | Override  | Notes                                      |
| ------------------------------ | --------------- | --------- | ------------------------------------------ |
| `--sapBackgroundColor`         | `#FAFAFA`       | `#F0EDEA` | Warm Stone — reduces white void            |
| `--sapGroup_ContentBackground` | `#FFFFFF`       | `#FAFAF8` | Parchment — subtle lift against Warm Stone |

#### Shell

| CSS Custom Property               | Horizon Default | Override  | Notes                         |
| --------------------------------- | --------------- | --------- | ----------------------------- |
| `--sapShellColor`                 | `#FFFFFF`       | `#2A2725` | Obsidian shell background     |
| `--sapShell_TextColor`            | `#1D2D3E`       | `#FFFFFF` | ShellBar text and app title   |
| `--sapShell_InteractiveTextColor` | `#0064D9`       | `#FFFFFF` | ShellBar interactive elements |
| `--sapShell_Hover_Background`     | `#EBECEE`       | `#3D3A37` | Warm Smoke hover              |

#### Buttons — Emphasized

| CSS Custom Property                         | Horizon Default | Override  | Notes      |
| ------------------------------------------- | --------------- | --------- | ---------- |
| `--sapButton_Emphasized_Background`         | `#0070F2`       | `#C8973E` | Amber      |
| `--sapButton_Emphasized_BorderColor`        | `#0070F2`       | `#C8973E` | Amber      |
| `--sapButton_Emphasized_TextColor`          | `#FFFFFF`       | `#FFFFFF` | Unchanged  |
| `--sapButton_Emphasized_Hover_Background`   | `#0064D9`       | `#A67C2E` | Dark Amber |
| `--sapButton_Emphasized_Hover_BorderColor`  | `#0064D9`       | `#A67C2E` | Dark Amber |
| `--sapButton_Emphasized_Active_Background`  | `#0058B8`       | `#8E6A24` | Burnt Gold |
| `--sapButton_Emphasized_Active_BorderColor` | `#0058B8`       | `#8E6A24` | Burnt Gold |

#### Buttons — Default

| CSS Custom Property             | Horizon Default | Override  | Notes      |
| ------------------------------- | --------------- | --------- | ---------- |
| `--sapButton_TextColor`         | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_BorderColor`       | `#0064D9`       | `#2A2725` | Obsidian   |
| `--sapButton_Hover_Background`  | `#EBF5FE`       | `#F5EDD8` | Gold Mist  |
| `--sapButton_Hover_BorderColor` | `#0064D9`       | `#A67C2E` | Dark Amber |

#### Input Fields

| CSS Custom Property             | Horizon Default | Override  | Notes             |
| ------------------------------- | --------------- | --------- | ----------------- |
| `--sapField_Focus_BorderColor`  | `#0064D9`       | `#C8973E` | Amber focus state |
| `--sapField_Hover_BorderColor`  | `#0064D9`       | `#C8973E` | Amber hover state |
| `--sapField_Active_BorderColor` | `#0064D9`       | `#A67C2E` | Dark Amber active |

#### Lists & Tables

| CSS Custom Property                  | Horizon Default | Override  | Notes              |
| ------------------------------------ | --------------- | --------- | ------------------ |
| `--sapList_Hover_Background`         | `#EBF5FE`       | `#F5EDD8` | Gold Mist hover    |
| `--sapList_SelectionBackgroundColor` | `#EBF5FE`       | `#F5EDD8` | Gold Mist selected |
| `--sapList_Active_Background`        | `#0064D9`       | `#2A2725` | Obsidian pressed   |
| `--sapList_Active_TextColor`         | `#FFFFFF`       | `#FFFFFF` | Unchanged          |

#### Border Radius

| CSS Custom Property               | Horizon Default | Override | Notes             |
| --------------------------------- | --------------- | -------- | ----------------- |
| `--sapButton_BorderCornerRadius`  | `0.5rem`        | `0`      |                   |
| `--sapField_BorderCornerRadius`   | `0.5rem`        | `0`      |                   |
| `--sapElement_BorderCornerRadius` | `0.5rem`        | `0`      | Generic elements  |
| `--sapPopover_BorderCornerRadius` | `0.75rem`       | `0`      | Dialogs, popovers |
| `--sapTile_BorderCornerRadius`    | `1rem`          | `0`      | Cards, tiles      |

#### Not Overridden (kept at Horizon defaults)

| CSS Custom Property     | Horizon Default        | Why Kept                                      |
| ----------------------- | ---------------------- | --------------------------------------------- |
| `--sapPositiveColor`    | `#256F3A`              | Semantic — no override                        |
| `--sapCriticalColor`    | `#E76500`              | Semantic — no override                        |
| `--sapNegativeColor`    | `#AA0808`              | Semantic — no override                        |
| `--sapInformativeColor` | `#0064D9`              | Semantic — no override                        |
| `--sapNeutralColor`     | `#788FA6`              | Semantic — no override                        |
| `--sapTextColor`        | `#1D2D3E`              | Body text stays Horizon                       |
| `--sapFontFamily`       | `'DM Sans', '72', ...` | Custom brand font — warm geometric sans-serif |

### 7.2 Layer 2 — Targeted Selectors

Verified against running DOM in SAPUI5 1.136.16. Each selector has a comment in the CSS file noting the component and version.

| Selector                                    | Override                    | Reason                                                                                      |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| `.sapUiBody .sapMText, ...` (12 selectors)  | `font-family`               | Horizon bakes `"72"` directly into compiled CSS instead of referencing `--sapFontFamily`    |
| `.sapMIBar.sapMTB.sapMOTB.sapTntToolHeader` | `background-color`, `color` | ToolHeader doesn't apply `--sapShellColor` in 1.136.16 — four-class selector beats CDN      |
| `.sapTntToolHeader .sapMTitle`              | `color`                     | Title control defaults to `--sapTextColor` (dark) — must inherit shell white                |
| `.sapTntToolPageMain`                       | `background-color`          | Horizon hardcodes cool grey `#F5F6F7` — override to `--sapBackgroundColor` (Warm Stone)     |
| `.sapUxAPObjectPageWrapper`                 | `background-color`          | ObjectPage scroll area also hardcodes cool grey — override to match Warm Stone              |
| `.sapTntToolPageAsideContent`               | `background-color`          | Side nav aside panel — Soft Ash (`#E8E5E2`) for three-column depth effect                   |
| `.sapTntNLI.sapTntNLISelected`              | `background` (composite)    | Horizon bakes blue gradient indicator + blue tint background. Override to amber + Gold Mist |
| `.sapTntNLI.sapTntNLISelected a`            | `background-color`          | Inner anchor also gets hardcoded blue tint — override to Gold Mist                          |

### 7.3 Note on Horizon Defaults

Horizon default values listed above are based on `sap_horizon` 1.136.16 and verified against the CDN-loaded theme. The override values are final — Horizon defaults are documented here for reference, not as contractual values.

---

## 8. Spec Amendments

| Document            | Amendment                                                                                                                    | Decision |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| DS-001 §6 (D-60)    | "Standard Horizon semantic colors only, no custom accent" replaced with Obsidian & Amber palette. Semantic colors unchanged. | D-314    |
| TH-001 §3.2 (D-308) | Warm Charcoal palette replaced by Obsidian & Amber 10-value palette.                                                         | D-314    |
| TH-001 §5.1 (D-309) | ShellBar color changed from `#3D3A38` to `#2A2725` (Obsidian).                                                               | D-314    |
| TH-001 §3.4         | Link color changed from Horizon blue to Deep Gold (`#8B6B1F`).                                                               | D-314    |

---

## 9. Decisions Reference

| ID    | Title                             | Summary                                                                                                                                                                                                                                                           |
| ----- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-308 | ~~Brand palette — Warm Charcoal~~ | Superseded by D-314. Was: `#3D3A38` as primary brand color.                                                                                                                                                                                                       |
| D-309 | ~~Dark ShellBar~~                 | Superseded by D-314. Was: Charcoal background (`#3D3A38`).                                                                                                                                                                                                        |
| D-310 | Zero border radius                | All containers and interactive controls set to `0`. Exceptions: radio buttons, avatars, switch tracks, progress indicators.                                                                                                                                       |
| D-311 | ~~Component overrides~~           | Superseded by D-314. Was: Charcoal emphasized buttons, Warm Mist hover/selection.                                                                                                                                                                                 |
| D-312 | Override strategy                 | Single CSS file (`app/shared/css/theme-overrides.css`) loaded after Horizon via `index.html`. Two layers: CSS custom properties first, targeted selectors as fallback. No theme build tooling.                                                                    |
| D-313 | ~~Color mapping table~~           | Superseded by D-314. Was: 28 custom properties, 8 kept at defaults.                                                                                                                                                                                               |
| D-314 | Obsidian & Amber identity         | Full brand rebrand. Obsidian (`#2A2725`) shell, Amber (`#C8973E`) accent, Deep Gold (`#8B6B1F`) links, Warm Stone (`#F0EDEA`) page background, Soft Ash (`#E8E5E2`) side nav. 30 custom properties + 6 targeted selectors. Supersedes D-308, D-309, D-311, D-313. |

---

_This document is the single source of truth for the Financial Planner's custom theme. It layers on top of [Design System](DESIGN_SYSTEM.md) (D-56 through D-62), references issuer colors from [SPEC-19](specs/SPEC-19-CHURNBOARD.md) §4.1.13 (D-220) and CPP coloring from [SPEC-21](specs/SPEC-21-TROPHY-CASE.md) BR-06. All decisions logged in [Decisions Log](user-profile/DECISIONS_LOG.md)._
