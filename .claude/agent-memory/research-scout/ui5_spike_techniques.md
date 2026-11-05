---
name: ui5-spike-techniques
description: How to read pinned SAPUI5/FE source and run browser spikes against a module without writing to it
metadata:
  type: reference
---

**FE / UI5 runtime source is not on disk.** Only `@sapui5/types` is installed. Fetch the real code
with `curl https://ui5.sap.com/<pin>/resources/sap/fe/core/controllerextensions/routing/RouterProxy-dbg.js`
(the `-dbg.js` suffix gives the readable build). `sap/fe/core/.library` confirms the version. The SDK
topic tree is `https://ui5.sap.com/<pin>/docs/topics/index.json`; walk it with node to search titles.
`community.sap.com` returns 403 to WebFetch, so do not plan on reading it.

**A browser spike needs no module writes.** Root `node_modules/playwright` plus the cached chromium
in `%LOCALAPPDATA%/ms-playwright` are enough. Start the module with
`CDS_ENV=development,journey PORT=<free> npx cds-serve` (run in the background, kill it by PID from
`netstat -ano`). Serve the scratch shell HTML/Component/views and patch real manifests in flight with
`context.route(...)`, registered on the context so a second tab inherits them.

Gotchas (2026-11-05, FE nested-routing spike):

- Playwright routes registered **later win**. A catch-all `spikeshell/**` 404 registered last shadowed
  every specific route, and the result was "script load error".
- The planner's Transactions ListReport has default posted-date filters, and the journey rows fall
  outside them, so the table shows "No data found". Clear the filters through the MDC FilterBar:
  find the DOM id ending `--fe::FilterBar::Transactions[-content]`, then call
  `setFilterConditions({})` and `triggerSearch()`.
- Count data rows with `tr.sapMListTblRow:not(.sapMListTblHeader):not([id$='nodata'])`. The bare
  class also matches the header row and the no-data row.
- The in-memory dev database lives for the whole server run. A draft created in one mode is still
  there in the next mode, so give each mode its own server if draft state matters.
- `history.length` does not grow when a new entry replaces the forward entry after Back. Assert
  "Back lands on X", not the length.
