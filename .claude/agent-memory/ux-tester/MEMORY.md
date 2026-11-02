# ux-tester memory


Earned on real UX passes, not theory. Apply them to every module that runs on UI5 Horizon.

- **Never trust the rubric's own contrast numbers — compute them.** Planner THEME.md claimed
  white-on-Amber was ~3.8:1; it measured ~2.6:1. A doc-claimed ratio is a hypothesis.
- **Measure contrast against the background the text actually sits on**, not against white. A
  link colour that passes on white can fail on the tinted page background.
- **Measure the painted element, not its container.** UI5 nests controls, and the inner layer often
  repaints over your override: `.sapTntSideNavigation`/`.sapTntNLI` inside the aside,
  `.sapMBtnInner` inside the button, `.sapFDynamicPageContent` inside a themed page.
- **Diff every THEME.md custom property against computed `:root`.** A variable missing from the
  override file (e.g. `--sapGroup_ContentBackground`) silently falls back to stock Horizon.
- **Known Horizon-blue (`#0064D9`, `rgb(0,100,217)`) leak points:** IconTabBar selected state, Wizard
  progress step, CheckBox (`.sapMCbBg`), focus outlines on side-nav items.
- **Known radius leak points under a 0-radius theme:** ObjectPage `.sapUxAPBlockContainer`, the
  floating draft footer (`.sapMIBar.sapMTBInactive`), DynamicPage header collapse/pin buttons,
  side-nav items (`.sapTntNLI`), Wizard step container.
- **Font leaks:** check `.sapMBtnInner` and Wizard titles; stock `72-Bold`/`72-Semibold` survives an
  override that only targets `.sapMBtnContent`.
- **Header shadows/separators** the doc specifies are easy to leave unimplemented — measure
  `box-shadow` and `border-bottom`, do not eyeball.

Run one sweep per page before the targeted checks — it catches all leaks of the classes above in a
single `browser_evaluate`:

```js
[...document.querySelectorAll("body *")].filter(el => el.offsetParent).flatMap(el => {
  const cs = getComputedStyle(el), hits = [];
  if (/rgb\(0, 100, 217\)/.test(cs.color + cs.backgroundColor + cs.borderColor + cs.outlineColor)) hits.push("horizonBlue");
  if (parseFloat(cs.borderRadius) > 0 && el.offsetWidth > 24) hits.push(`radius ${cs.borderRadius}`);
  if (/^"?72/.test(cs.fontFamily)) hits.push("font72");
  return hits.length ? [{ cls: el.className.toString().slice(0, 60), hits }] : [];
}).slice(0, 80);
```

Adjust the blue, radius and font tests to the module's own THEME.md — they encode the planner's
contract (no SAP blue, 0 radius, DM Sans). Note any element that legitimately needs a radius
(Wizard step circles at 50%), so it is not reported again.

**Coverage gaps to say out loud, not skip:** a step that needs a file upload, a list with no rows,
and sibling pages built on the same template you did not open. Report them as unreached and name
the findings likely to repeat there.


## Contrast — every state, every surface (from the D-316 contrast ruling, 2026-10-30)

- Measure button text contrast at **rest, hover and pressed** — the worst planner failure was the
  pressed state (Horizon blue text on the pressed fill, 1.11:1), invisible at rest.
- Focus rings are non-text: need 3:1 against **each** surface they can sit on (white, page bg, side
  nav), not just one. Amber `#C8973E` failed 3:1 everywhere.
- Link hover/active/visited colours often stay stock Horizon `#0064D9` after the rest colour is
  themed — check all four link states.

## Where leaks actually live (from the D-318 CSS fix, 2026-10-30)

- Side-nav focus ring is a hardcoded `::after` border (`#0032A5`), not `outline` — an `outline`
  read with style `none` is a false lead. Inspect `getComputedStyle(el, "::after")`.
- Horizon gets bold from the `72-Bold` font face, not `font-weight`; after a font swap check titles
  still compute 700.
- Empty-state illustrations ("No data found") stay Horizon blue — non-interactive, accepted.
- Input fields stay white on Parchment cards by design (editable affordance, THEME.md §5.6).
- Port 4004 may be held by another session's server — check before `npm start`, don't kill it.

## Reference notes

- [FP Playwright driving](reference_fp_playwright_driving.md) — shell URL, nav by click not hash, baseline console noise, drafts, probe recipe

## False positives to skip (from D-006/D-012, 2026-10-30)

- `sap.ui.unified.FileUploader` hides a native `<input type=file>` at opacity 0.01 — its Arial
  font and browser button are invisible. Measure the visible UI5 button, not the native input.
- The italic placeholder ("No file chosen", "Select a card") is Horizon's normal style, not a leak.
- Illustrations paint from `--sapContent_Illustrative_ColorN`; `--sapIllus_*` are only aliases.
- Drive button **hover** — default/transparent buttons leaked Horizon blue only on hover.
