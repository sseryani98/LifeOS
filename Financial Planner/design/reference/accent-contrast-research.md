# Accent Contrast Research — Amber on Buttons, Deep Gold on Warm Stone

**Date:** 2026-10-30  
**Decision:** D-316 (see [THEME.md](../THEME.md) §3.7 and §9)  
**Trigger:** A UX pass measured white text on the Amber emphasized button, and Deep Gold links on the Warm Stone page, below WCAG AA in a real browser.  
**Method:** Every ratio below was recomputed from hex with the WCAG 2.x relative-luminance formula (sRGB linearisation, `(L1 + 0.05) / (L2 + 0.05)`, never rounded up). APCA Lc values use APCA-W3 0.0.98G-4g. Live values were read back with `getComputedStyle` on SAPUI5 1.136.16.

---

## 1. Verdict

1. **Emphasized buttons keep white text and take a darker step of the amber hue as their fill.** Burnt Gold `#8E6A24` at rest, Deep Gold `#7A5E1B` on hover, Umber `#654B1D` on press. Amber `#C8973E` stays the brand colour for non-text accents only.
2. **Deep Gold is darkened from `#8B6B1F` to `#7A5E1B`**, so link text and the variant title clear 4.5:1 on every light surface the app paints, not just on white.
3. **The focus ring moves from Amber to Dark Amber `#A67C2E`.** Amber is under 3:1 on every surface.

---

## 2. The Rules That Apply

| Rule                                 | Threshold                                                                            | Applies to                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| WCAG 2.2 SC 1.4.3 Contrast (Minimum) | 4.5:1 normal text. 3:1 only for large text: ≥ 18pt (~24px), or ≥ 14pt (~18.5px) bold | Button labels (14px regular, 700 when pressed), links      |
| WCAG 2.2 SC 1.4.11 Non-text Contrast | 3:1 against adjacent colours                                                         | Focus indicators, component states                         |
| Inactive components                  | Exempt from both                                                                     | Disabled buttons                                           |
| Hover                                | Author hover treatments are not "required to identify" the state                     | Hover need not reach 3:1, but must not lower text contrast |
| Threshold arithmetic                 | Not rounded: 4.499:1 fails                                                           | All rows below                                             |

The button label is 14px (measured live: 400 at rest, 700 while pressed), and the UX pass saw 13px bold in dialogs. Both are far below the 18.5px bold large-text line, so **4.5:1 is the bar, not 3:1**. THEME.md's earlier "AA for large text" claim did not apply to any button in the app.

---

## 3. Ratio Table

### 3.1 Before

| Pair                                   | WCAG   | APCA Lc | AA            |
| -------------------------------------- | ------ | ------- | ------------- |
| White on Amber `#C8973E` (rest)        | 2.64:1 | −56.4   | Fail          |
| White on Dark Amber `#A67C2E` (hover)  | 3.79:1 | −70.8   | Fail          |
| Blue `#0064D9` on Burnt Gold (pressed) | 1.11:1 | 0.0     | Fail          |
| Deep Gold `#8B6B1F` on White           | 4.98:1 | 74.3    | Pass          |
| Deep Gold on Parchment `#FAFAF8`       | 4.76:1 | 71.2    | Pass          |
| Deep Gold on Warm Stone `#F0EDEA`      | 4.27:1 | 63.9    | Fail          |
| Deep Gold on Gold Mist `#F5EDD8`       | 4.26:1 | 63.8    | Fail          |
| Deep Gold on Soft Ash `#E8E5E2`        | 3.97:1 | 59.2    | Fail          |
| Amber focus ring on White              | 2.64:1 | —       | Fail (1.4.11) |
| Amber focus ring on Warm Stone         | 2.26:1 | —       | Fail (1.4.11) |
| White ring inside Amber fill           | 2.64:1 | —       | Fail (1.4.11) |

The pressed row is the worst result and nobody had flagged it. Horizon's `--sapButton_Emphasized_Active_TextColor` is `#0064D9`, and our override changed the active fill without changing that text colour.

THEME.md's old figures were wrong on both colours. It said Amber on white was ~3.8:1, but 3.79:1 is the _Dark Amber_ figure. It said Deep Gold on white was ~5.6:1, and the true value is 4.98:1.

### 3.2 After

| Pair                                 | WCAG   | APCA Lc | AA            |
| ------------------------------------ | ------ | ------- | ------------- |
| White on Burnt Gold `#8E6A24` (rest) | 4.96:1 | −79.6   | Pass          |
| White on Deep Gold `#7A5E1B` (hover) | 6.10:1 | −85.5   | Pass          |
| White on Umber `#654B1D` (pressed)   | 8.15:1 | −92.7   | Pass          |
| Deep Gold `#7A5E1B` on White         | 6.10:1 | 80.3    | Pass          |
| Deep Gold on Parchment               | 5.83:1 | 77.2    | Pass          |
| Deep Gold on Warm Stone              | 5.23:1 | 69.9    | Pass          |
| Deep Gold on Gold Mist               | 5.22:1 | 69.8    | Pass          |
| Deep Gold on Soft Ash                | 4.86:1 | 65.2    | Pass          |
| Dark Amber `#A67C2E` ring on White   | 3.79:1 | —       | Pass (1.4.11) |
| Dark Amber ring on Parchment         | 3.62:1 | —       | Pass (1.4.11) |
| Dark Amber ring on Warm Stone        | 3.25:1 | —       | Pass (1.4.11) |
| Dark Amber ring on Gold Mist         | 3.24:1 | —       | Pass (1.4.11) |
| Dark Amber ring on Soft Ash          | 3.02:1 | —       | Pass (1.4.11) |
| White ring inside Burnt Gold fill    | 4.96:1 | —       | Pass (1.4.11) |

**Disabled:** Horizon fades the whole button to `--sapContent_DisabledOpacity` (0.4). On white the label renders white on a `#D2C3A7` fill (1.73:1). That is permitted, because SC 1.4.3 and SC 1.4.11 both exempt inactive components. GOV.UK warns that low-contrast disabled buttons confuse users, so a later change could replace them with an explanation of why the action is unavailable.

### 3.3 Alternatives Scored

| Option                                        | Rest   | Hover                | Pressed              | APCA at rest | Outcome                                                                                       |
| --------------------------------------------- | ------ | -------------------- | -------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| A. Obsidian `#2A2725` text on Amber           | 5.62:1 | 3.92:1 on Dark Amber | 2.99:1 on Burnt Gold | Lc 48.4      | Rejected: hover and press must _lighten_ against Horizon's convention, and APCA rates it weak |
| B. White text, darker amber fill (**chosen**) | 4.96:1 | 6.10:1               | 8.15:1               | Lc −79.6     | Contrast rises in every state, and it matches Horizon, Carbon and Material                    |
| C. Keep Amber fill, white text, bold label    | 2.64:1 | —                    | —                    | Lc −56.4     | Rejected: weight does not change the ratio, and 14px bold is not large text                   |

Option A passes WCAG at rest, and it keeps the most amber on screen. It fails on two counts. First, hover and press could no longer darken: Obsidian on the old hover and press fills falls to 3.92:1 and 2.99:1, so both states would have to get lighter, the opposite of every Horizon button. Second, APCA rates Obsidian on this mid-tone (Lc 48) worse than white on the darker fill (Lc 80). Amber sits close to the luminance midpoint, and neither text colour reads well on it.

---

## 4. What Design Systems Do

| System          | Primary button                                                                                                                                                                                                                                                                                              | Source tier                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **SAP Horizon** | White on `#0070F2`, which computes to 4.57:1: the brand blue is tuned to just clear 4.5:1. Horizon draws a 2px white focus ring _inside_ the emphasized fill (measured live), so the ring's contrast is white against the fill. Morning Horizon targets WCAG 2.2 AA and treats disabled elements as exempt. | Live DOM + search summary (sap.com returned 403) |
| **Material 3**  | Light-scheme `primary` is tone 40 and `onPrimary` is tone 100 (`lightFromCorePalette`). A tone difference of 50 guarantees ≥ 4.5:1. For any hue, including amber, the filled button is a _dark_ tone of the brand under white text.                                                                         | Source code + MCU docs                           |
| **IBM Carbon**  | `button-primary` = Blue 60 `#0F62FE` (white text 5.00:1), hover `blue.60Hover` `#0050E6` (6.38:1), active Blue 80 `#002D9C` (11.32:1). Contrast rises with every state. Focus is a `$focus` border plus a `$focus-inset` white ring. Carbon requires 4.5:1 for text and 3:1 for UI states.                  | Token files + Carbon docs                        |
| **GOV.UK**      | Uses its bright brand yellow `#FFDD00` (1.35:1 on white) **only** as a focus fill, always paired with black `#0B0C0C` text (14.55:1) and a black bar. The yellow handles dark backgrounds and the black handles light ones. It never puts text on a light accent without black.                             | GOV.UK Design System                             |

Every system checked handles a light or mid-tone brand colour the same way. **The brand hue survives, and the text-bearing surface is a darker step of it.** Pure-light accents are kept for decoration or paired with black. None uses a mid-tone fill with white text.

---

## 5. Does APCA Change the Answer?

**No, but it backs it up.** APCA is not normative. It was removed from the WCAG 3 working draft in July 2023, and the April 2026 editor's draft says the contrast algorithm "is yet to be determined". WCAG 2.2 remains the bar that regulations cite. APCA's own authors advise using colours that also conform to WCAG 2.

APCA still adds useful information here. It scores the chosen fill at Lc −79.6, which is above the Lc 75 body-text minimum. It scores option A (Obsidian on Amber) at Lc 48.4, which is below even the Lc 60 minimum for non-body content text. The ruling passes both models, and option A passes only WCAG 2.

---

## 6. Live Verification (2026-10-30, SAPUI5 1.136.16, Issuers + Transaction List)

| Element                         | Computed                                                  |
| ------------------------------- | --------------------------------------------------------- |
| Go — rest                       | bg `rgb(142,106,36)` · text `rgb(255,255,255)` · 14px/400 |
| Go — hover                      | bg `rgb(122,94,27)` · text `rgb(255,255,255)`             |
| Go — pressed                    | bg `rgb(101,75,29)` · text `rgb(255,255,255)` · 14px/700  |
| Go — keyboard focus             | 2px ring `rgb(255,255,255)` inside the fill               |
| Adapt Filters — keyboard focus  | 2px ring `rgb(166,124,46)` on white                       |
| Variant title "Standard"        | `rgb(122,94,27)`, 24px                                    |
| Page background                 | `rgb(240,237,234)`                                        |
| Text still in old gold or amber | 0 elements                                                |

---

## 7. Sources

- W3C, [Understanding SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): large-scale definition, no rounding, inactive exemption.
- W3C, [Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): focus indicators at 3:1, hover not required, inactive exempt.
- Material, [`scheme.ts` — `lightFromCorePalette`](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/scheme/scheme.ts): primary tone 40, onPrimary tone 100.
- Material, [Contrast for accessibility](https://github.com/material-foundation/material-color-utilities/blob/main/concepts/contrast_for_accessibility.md): a tone difference of 50 gives ≥ 4.5:1, and 40 gives ≥ 3:1.
- IBM Carbon, [Button style](https://carbondesignsystem.com/components/button/style/), [white `button.tokens.json`](https://github.com/carbon-design-system/carbon/blob/main/packages/themes/tokens/themes/white/button.tokens.json), [Accessibility — color](https://carbondesignsystem.com/guidelines/accessibility/color/).
- GOV.UK Design System, [Focus states](https://design-system.service.gov.uk/get-started/focus-states/), [Colour](https://design-system.service.gov.uk/styles/colour/), [Button](https://design-system.service.gov.uk/components/button/).
- SAP Fiori Design, [Morning Horizon colors](https://www.sap.com/design-system/fiori-design-web/v1-139/foundations/visual/colors/morning-horizon). This page returned 403, so the AA target and exemptions come from a search-result summary.
- APCA, [Bronze simple mode](https://readtech.org/ARC/tests/bronze-simple-mode/): Lc 75 body minimum and Lc 60 for other content text.
- Adrian Roselli, [WCAG3 Contrast as of April 2026](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html): APCA is not in WCAG 3, so conform to WCAG 2.
