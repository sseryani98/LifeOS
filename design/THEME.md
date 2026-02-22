# Theme

**Document ID:** TH-001
**Version:** 1.0
**Date:** 2026-02-21
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-21 | Sandro & Claude | Initial creation — Step 14 complete. D-308 through D-313 logged. |
| 2026-02-21 | Sandro | Approved. Status Draft → Approved. |

---

## 2. Summary

Custom visual identity layered on top of `sap_horizon` (Horizon Light). Targeted overrides only — no theme package, no build tooling.

| Aspect | Decision |
|--------|----------|
| **Base Theme** | SAP Horizon Light (`sap_horizon`) — unchanged (D-56) |
| **Brand Color** | Warm Charcoal `#3D3A38` — replaces Horizon blue (D-308) |
| **ShellBar** | Dark charcoal background, white text (D-309) |
| **Border Radius** | 0 on all containers and interactive controls (D-310) |
| **Card Treatment** | Horizon shadow retained, sharp corners (D-311) |
| **Semantic Colors** | Horizon defaults — no override |
| **Link Color** | Horizon blue — no override |
| **Override Method** | Single CSS file after Horizon, CSS custom properties (D-312) |
| **Total Overrides** | 28 custom properties + ~2 targeted selectors (D-313) |
| **Amends** | D-60 (was "no custom accent" → now defined custom palette) |

---

## 3. Color Palette

### 3.1 Design Intent

Replace Horizon's corporate SAP blue with a warm charcoal/slate palette. The brand color recedes — neutral, understated, premium — letting semantic colors (green, red, orange, blue, grey) carry all the meaning. Data speaks; chrome stays quiet.

This amends D-60 ("standard Horizon semantic colors only, no custom accent") — the semantic colors remain unchanged, but a custom brand accent is now defined.

### 3.2 Brand Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Primary** | Warm Charcoal | `#3D3A38` | ShellBar background, emphasized buttons, nav active indicator, selection highlight, focus outline |
| **Primary Hover** | Dark Charcoal | `#2E2B29` | Hover states on primary buttons and interactive elements |
| **Primary Active** | Deep Charcoal | `#252220` | Pressed/active state |
| **Selected Background** | Warm Mist | `#EDECEB` | Selected table rows, active list items, subtle highlight backgrounds |
| **Shell Hover** | Ash | `#4A4745` | Hover on ShellBar elements (lighter than charcoal on dark surface) |

All five values share the same warm undertone (slightly reddish-brown grey, not cool/blue grey). Contrast ratios: Primary against white = ~10.2:1 (WCAG AAA). Primary Hover against white = ~12.5:1.

Page background, body text, and all other surface colors remain Horizon defaults.

### 3.3 Semantic Colors — Unchanged

The five semantic states defined in DS-001 §6 remain at Horizon defaults. No overrides. The warm charcoal brand intentionally avoids collision with any semantic state.

| State | Color | Usage (from DS-001 §6) |
|-------|-------|------------------------|
| Positive / Success | Green | Active, met bonus, on-track budget, successful sync |
| Critical / Error | Red | Missed bonus, over budget, sync error |
| Warning | Orange | To Cancel, near budget limit, uncategorized |
| Information | Blue | Focus state, in-progress bonus, user-corrected |
| Neutral | Grey | Closed, pending, never synced |

### 3.4 Link Color — Horizon Blue Retained

Text links keep Horizon's default blue (`#0064D9`). Blue is universally understood as "clickable" and aligns with the Information semantic state. Overriding link color to charcoal would reduce scannability with no UX benefit.

### 3.5 Domain Chart Colors — Reference

Issuer chart colors defined in SPEC-19 §4.1.13 (D-220). Applied programmatically to chart data series as constants — not part of CSS theme overrides.

| Issuer | Hex | Color Name |
|--------|-----|------------|
| TD | `#00A650` | Green |
| Amex | `#006FCF` | Blue |
| CIBC | `#C41F3E` | Red |
| Scotia | `#FFB819` | Gold |
| BMO | `#009B8D` | Teal |
| RBC | `#7B2D8E` | Purple |
| Aggregate | `sapNeutralColor` | Grey (dashed line style) |

Non-mapped issuers fall back to VizFrame auto-assigned qualitative palette.

### 3.6 CPP Semantic Coloring — Reference

CPP coloring in RPT-004 (Trophy Case) defined in SPEC-21 BR-06. Uses standard Horizon semantic states, not custom colors:

| Condition | State | Color |
|-----------|-------|-------|
| CPP ≥ 2× program valuation | Positive | Green |
| CPP ≥ 1× program valuation | Information | Blue |
| CPP < 1× program valuation | Warning | Orange |

---

## 4. Border Radius

### 4.1 Rule

All container and interactive control border radii set to `0`. Sharp edges throughout. This gives the app a clean, architectural feel that pairs with the understated charcoal palette.

### 4.2 Components Set to 0

| Component Category | SAPUI5 Controls |
|--------------------|-----------------|
| **Buttons** | `sap.m.Button`, `sap.m.SegmentedButton`, `sap.m.ToggleButton` |
| **Inputs** | `sap.m.Input`, `sap.m.TextArea`, `sap.m.SearchField`, `sap.m.DatePicker`, `sap.m.ComboBox`, `sap.m.MultiComboBox`, `sap.m.Select`, `sap.m.StepInput` |
| **Cards** | `sap.f.Card`, `sap.m.GenericTile`, `sap.ui.integration.widgets.Card` |
| **Containers** | `sap.m.Panel`, `sap.m.Dialog`, `sap.m.Popover`, `sap.m.MessageStrip`, `sap.m.MessageBox` |
| **Toolbar** | `sap.m.OverflowToolbar`, `sap.m.Toolbar` |
| **Tabs** | `sap.m.IconTabBar` (tab headers) |
| **Checkboxes** | `sap.m.CheckBox` (square is the natural sharp-edge shape) |

### 4.3 Exceptions — Keep Rounded

| Component | Reason |
|-----------|--------|
| `sap.m.RadioButton` | Circle is the universal radio affordance — square radio buttons break the checkbox/radio distinction |
| Avatars / User icons | Circular by convention |
| `sap.m.Switch` track | Pill shape is the toggle affordance |
| `sap.m.ProgressIndicator` track | Slight rounding for visual clarity |
| `sap.m.BusyIndicator` | Animated — no border radius applicable |

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

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Background | White (`#FFFFFF`) | Warm Charcoal (`#3D3A38`) |
| Text / app title | Dark (`#1D2D3E`) | White (`#FFFFFF`) |
| Icons | Dark | White |
| Bottom separator | 1px border | Subtle `box-shadow: 0 1px 4px rgba(0,0,0,0.15)` — soft drop shadow anchors the dark bar against the white content below |

### 5.2 Emphasized Buttons

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Background | SAP Blue (`#0070F2`) | Warm Charcoal (`#3D3A38`) |
| Text | White | White (unchanged) |
| Border | None | None (unchanged) |
| Hover background | Darker blue | Dark Charcoal (`#2E2B29`) |
| Active background | Darkest blue | Deep Charcoal (`#252220`) |
| Focus outline | Blue | Charcoal (`#3D3A38`) |

### 5.3 Default Buttons (non-emphasized)

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Background | Transparent | Transparent (unchanged) |
| Text | Blue (`#0064D9`) | Warm Charcoal (`#3D3A38`) |
| Border | 1px blue | 1px Warm Charcoal (`#3D3A38`) |
| Hover background | Light blue tint | Warm Mist (`#EDECEB`) |

Ghost/transparent buttons follow the same pattern — charcoal text, no border, Warm Mist hover.

### 5.4 Cards

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Box shadow | Subtle elevation | Keep (Horizon default) |
| Border | None | None (unchanged) |
| Background | White | White (unchanged) |
| Border radius | Rounded | 0 (per §4) |

Cards get sharp corners from §4 but retain their Horizon shadow. No other card-level overrides.

### 5.5 Side Navigation

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Background | White | White (unchanged) |
| Active item indicator | Blue left border | Warm Charcoal left border |
| Active item text | Blue | Warm Charcoal (`#3D3A38`) |
| Active item icon | Blue | Warm Charcoal |
| Hover background | Light blue tint | Warm Mist (`#EDECEB`) |
| Group headers | Grey text | Grey text (unchanged) |
| Divider between groups | Light grey | Light grey (unchanged) |
| Collapsed mode — active icon | Blue | Warm Charcoal |

### 5.6 Input Fields

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Border | 1px bottom border (blue on focus) | 1px bottom border — Charcoal on focus |
| Focus outline | Blue | Warm Charcoal |
| Value help icon | Blue | Horizon default (keep — functional affordance) |

Applies to: `Input`, `TextArea`, `SearchField`, `DatePicker`, `ComboBox`, `Select`, `StepInput`.

### 5.7 Tables

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Row density | Compact (~32px) | Compact (unchanged, per D-56) |
| Row hover | Light blue tint | Warm Mist (`#EDECEB`) |
| Selected row | Blue tint | Warm Mist (`#EDECEB`) |
| Header background | Light grey | Light grey (unchanged) |
| Column borders | None (Horizon) | None (unchanged) |

### 5.8 Dialogs & Popovers

| Property | Horizon Default | Override |
|----------|----------------|----------|
| Overlay backdrop | `rgba(0,0,0,0.6)` | Unchanged |
| Box shadow | Elevation shadow | Keep — dialogs need visual separation from page content |
| Border radius | Rounded | 0 (per §4) |

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
<script id="sap-ui-bootstrap"
  src="https://ui5.sap.com/1.120/resources/sap-ui-core.js"
  data-sap-ui-theme="sap_horizon"
  ...>
</script>

<!-- Theme overrides — loaded after Horizon, wins by cascade order -->
<link rel="stylesheet" href="shared/css/theme-overrides.css">
```

One `<link>`, one file, applied to all apps. No per-app references needed.

### 6.4 Override Layers

The CSS file contains two layers:

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **1. Custom properties** | `:root { --sapBrandColor: #3D3A38; ... }` | Colors, border radii — covers ~90% of overrides. All components referencing these properties update automatically. |
| **2. Targeted selectors** | `.sapMBtnEmphasized { ... }` | Component-specific tweaks where custom properties alone don't achieve the desired result (e.g., ShellBar dark mode, specific hover treatments). |

Layer 1 always comes first. Layer 2 is the escape hatch — used sparingly and only when needed.

### 6.5 Specificity Rules

- `:root` custom properties: Win by cascade order (same specificity as Horizon's `:root`, but loaded after).
- Targeted selectors: Match Horizon's selector specificity exactly — don't add unnecessary `!important` or deep nesting. If Horizon uses `.sapMBtn`, we use `.sapMBtn`.
- `!important`: Banned. If an override needs `!important`, the selector is wrong — investigate the correct class name instead.

### 6.6 What We Do NOT Use

| Tool | Why Not |
|------|---------|
| SAP Theme Designer | Cloud-hosted, generates `.theming` packages. Overkill for targeted overrides. Adds build dependency. |
| `@sap-theming/` npm packages | Build-time theme compilation. Unnecessary when CSS custom properties cover our needs. |
| Less/Sass compilation | Horizon uses CSS custom properties natively. No preprocessor step needed. |
| `sap.ui.getCore().applyTheme()` with custom theme ID | Requires a registered theme package. We're augmenting Horizon, not replacing it. |

### 6.7 Maintenance

- SAPUI5 custom property names (e.g., `--sapBrandColor`) are part of SAP's public API — stable across minor versions.
- On SAPUI5 major version upgrades, review `theme-overrides.css` against the new property list. Expected effort: minimal, one file to check.
- Targeted selectors (Layer 2) are more fragile than custom properties. Each selector should have a comment noting which component and version it targets.

---

## 7. Color Mapping Table

### 7.1 Layer 1 — CSS Custom Properties

All values set via `:root { }` block. Grouped by category.

#### Brand & Selection

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapBrandColor` | `#0070F2` | `#3D3A38` | Primary brand — cascades to many derived properties |
| `--sapHighlightColor` | `#0064D9` | `#3D3A38` | Selection and highlight |
| `--sapActiveColor` | `#0064D9` | `#2E2B29` | Pressed/active states |
| `--sapSelectedColor` | `#0064D9` | `#3D3A38` | Selected items |
| `--sapContent_FocusColor` | `#0064D9` | `#3D3A38` | Focus outlines on all interactive elements |

#### Shell

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapShellColor` | `#FFFFFF` | `#3D3A38` | ShellBar background |
| `--sapShell_TextColor` | `#1D2D3E` | `#FFFFFF` | ShellBar text and app title |
| `--sapShell_InteractiveTextColor` | `#0064D9` | `#FFFFFF` | ShellBar interactive elements |
| `--sapShell_Hover_Background` | `#EBECEE` | `#4A4745` | Hover on shell elements |

#### Buttons — Emphasized

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapButton_Emphasized_Background` | `#0070F2` | `#3D3A38` | |
| `--sapButton_Emphasized_BorderColor` | `#0070F2` | `#3D3A38` | |
| `--sapButton_Emphasized_TextColor` | `#FFFFFF` | `#FFFFFF` | Unchanged |
| `--sapButton_Emphasized_Hover_Background` | `#0064D9` | `#2E2B29` | |
| `--sapButton_Emphasized_Hover_BorderColor` | `#0064D9` | `#2E2B29` | |
| `--sapButton_Emphasized_Active_Background` | `#0058B8` | `#252220` | |
| `--sapButton_Emphasized_Active_BorderColor` | `#0058B8` | `#252220` | |

#### Buttons — Default

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapButton_TextColor` | `#0064D9` | `#3D3A38` | |
| `--sapButton_BorderColor` | `#0064D9` | `#3D3A38` | |
| `--sapButton_Hover_Background` | `#EBF5FE` | `#EDECEB` | Warm Mist |
| `--sapButton_Hover_BorderColor` | `#0064D9` | `#2E2B29` | |

#### Input Fields

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapField_Focus_BorderColor` | `#0064D9` | `#3D3A38` | Focus state |
| `--sapField_Hover_BorderColor` | `#0064D9` | `#3D3A38` | Hover state |
| `--sapField_Active_BorderColor` | `#0064D9` | `#2E2B29` | Active state |

#### Lists & Tables

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapList_Hover_Background` | `#EBF5FE` | `#EDECEB` | Row hover |
| `--sapList_SelectionBackgroundColor` | `#EBF5FE` | `#EDECEB` | Selected row |
| `--sapList_Active_Background` | `#0064D9` | `#3D3A38` | Active/pressed row |
| `--sapList_Active_TextColor` | `#FFFFFF` | `#FFFFFF` | Unchanged |

#### Border Radius

| CSS Custom Property | Horizon Default | Override | Notes |
|---------------------|----------------|----------|-------|
| `--sapButton_BorderCornerRadius` | `0.5rem` | `0` | |
| `--sapField_BorderCornerRadius` | `0.5rem` | `0` | |
| `--sapElement_BorderCornerRadius` | `0.5rem` | `0` | Generic elements |
| `--sapPopover_BorderCornerRadius` | `0.75rem` | `0` | Dialogs, popovers |
| `--sapTile_BorderCornerRadius` | `1rem` | `0` | Cards, tiles |

#### Not Overridden (kept at Horizon defaults)

| CSS Custom Property | Horizon Default | Why Kept |
|---------------------|----------------|----------|
| `--sapLinkColor` | `#0064D9` | Links keep blue — universal clickable affordance (§3.4) |
| `--sapPositiveColor` | `#256F3A` | Semantic — no override |
| `--sapCriticalColor` | `#E76500` | Semantic — no override |
| `--sapNegativeColor` | `#AA0808` | Semantic — no override |
| `--sapInformativeColor` | `#0064D9` | Semantic — no override |
| `--sapNeutralColor` | `#788FA6` | Semantic — no override |
| `--sapBackgroundColor` | `#FAFAFA` | Page background stays Horizon |
| `--sapTextColor` | `#1D2D3E` | Body text stays Horizon |
| `--sapFontFamily` | `'72', ...` | Typography stays Horizon |

### 7.2 Layer 2 — Targeted Selectors

Needed only where custom properties don't fully achieve the desired result. Determined during build based on actual DOM inspection. Known candidates:

| Selector | Override | Reason |
|----------|----------|--------|
| `.sapMShellBarCont` (or equivalent) | `background-color`, `color` | ShellBar dark treatment may need explicit class override if `--sapShellColor` doesn't cascade to all internal elements |
| `.sapTntSideNavigation .sapTntNavLI.sapTntNavLISelected` (or equivalent) | `border-left-color`, `color` | Active nav indicator — may need class-level override if not fully driven by `--sapHighlightColor` |

Exact selectors will be verified against the running DOM during Sprint W1-S1 scaffold setup. Each Layer 2 selector gets a comment in the CSS file noting the component, SAPUI5 version, and what it targets.

### 7.3 Note on Horizon Defaults

Horizon default values listed above are approximate based on `sap_horizon` 1.120.x. Exact values will be verified against the CDN-loaded theme during build. The override values are final — Horizon defaults are documented here for reference, not as contractual values.

---

## 8. Spec Amendments

| Document | Amendment | Decision |
|----------|-----------|----------|
| DS-001 §6 (D-60) | "Standard Horizon semantic colors only, no custom accent" replaced with defined custom palette. Semantic colors remain unchanged. | D-308 |

---

## 9. Decisions Reference

| ID | Title | Summary |
|----|-------|---------|
| D-308 | Brand palette — Warm Charcoal | `#3D3A38` as primary brand color. Four-value palette (primary, hover, active, selected background). Amends D-60. |
| D-309 | Dark ShellBar | Charcoal background (`#3D3A38`) with white text/icons. Subtle drop shadow for separation. |
| D-310 | Zero border radius | All containers and interactive controls set to `0`. Exceptions: radio buttons, avatars, switch tracks, progress indicators. |
| D-311 | Component overrides | Charcoal emphasized buttons, charcoal side nav active state, charcoal input focus, Warm Mist hover/selection backgrounds. Card shadow retained (Horizon default). Dialogs keep shadow for modality. |
| D-312 | Override strategy | Single CSS file (`app/shared/css/theme-overrides.css`) loaded after Horizon via `index.html`. Two layers: CSS custom properties first, targeted selectors as fallback. No theme build tooling. |
| D-313 | Color mapping table | 28 CSS custom properties overridden, 8 explicitly kept at Horizon defaults. Layer 2 targeted selectors kept to minimum, verified during build. |

---

*This document is the single source of truth for the Financial Planner's custom theme. It layers on top of [Design System](DESIGN_SYSTEM.md) (D-56 through D-62), references issuer colors from [SPEC-19](specs/SPEC-19-CHURNBOARD.md) §4.1.13 (D-220) and CPP coloring from [SPEC-21](specs/SPEC-21-TROPHY-CASE.md) BR-06. All decisions logged in [Decisions Log](user-profile/DECISIONS_LOG.md).*
