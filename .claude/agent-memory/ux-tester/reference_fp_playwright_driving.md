---
name: fp-playwright-driving
description: How to drive Financial Planner's shell in Playwright; deep-link hashes fail, Edit creates a draft
metadata:
  type: reference
---

- Shell entry is `http://localhost:4004/` (not /shell/webapp/index.html, which 404s). Deep-link `#Transactions` does NOT navigate; click side-nav items with `.sapTntNLI:has-text("...")`. The Transactions group must be expanded first (click its expand chevron).
- Object-page Edit creates a CAP draft; briefs often forbid drafts, so edit mode is unreachable by design. Say so instead of skipping silently.
- Console always has ~11 baseline errors per app (Component-preload.js 404, i18n_en*.properties 404, lrep/flex 404) = dev-server noise, not findings. Real defects show as extra errors on a nav click.
- Reusable probe: loop `body *` with offsetWidth, collect non-0 borderTopLeftRadius (excluding 50%) and blue-dominant colours (b > r+50). Returned empty on a clean theme pass.
- Playwright file output (console filename) must be inside `c:\Projects\Life OS` or its `.playwright-mcp`, not the scratchpad.
- No hover tool is loaded: to read `:hover` styles, `click` a harmless toggle (the DynamicPage pin button `[id*=pinBtn]`, click twice to restore) then evaluate `button:hover`. Buttons that open dialogs/file choosers lose or wedge hover. For the FileUploader, read CSSOM hover rules instead of clicking (file chooser blocks the MCP).
- Admin apps stay mounted hidden after nav, so `button:has-text("Go")` matches 9 — target by full id (`...FilterBar::Transactions-btnSearch`).
- Hash deep links (`#SimpleFINConnections`, `#/SimpleFINConnections`) never navigate on load or hashchange; the D-005 deep-link half is unverifiable on screen (D-014 area).
- Every admin nav click logs `TypeError: o.storeInnerAppStateAsync is not a function` (+1 per click); baseline-ish, tied to D-014.
- Stock Horizon `--sapContent_LabelColor` `#556B82` (cool slate) still colours field labels/object subtitle; THEME.md does not override it. 5.3:1 on Parchment, passes AA, only a warm-theme tint gap.
