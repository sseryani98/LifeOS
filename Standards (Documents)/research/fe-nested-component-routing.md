# FE nested component routing: it fixes browser Back for an app with one list, but not for an app that hosts many lists

**Nested component routing works for Fiori Elements V4 1.136.16 under a hand-built shell, and it fixed browser Back for the Transactions list in a spike. It is still not the cleaner fix for D-096.** In the spike, a router-owning shell hosted the Transactions FE app with a `prefix` and put its ListReport at the empty pattern. A list → record click then pushed a history entry, and Back returned to the list. A deep link opened the record, and the draft hash worked. The weak point is `admin-master-data`. It hosts 15 ListReports in one component, and only one list per component can sit at the empty pattern, so the other 14 keep the D-096 defect unless that app is split into 15 components. Every URL changes either way. A nested shell is a rewrite of `app/shell`. It also runs FE in a configuration SAP does not document. The list-hash rename fixed the same Transactions case in the same spike, so **the rename is the right fix for D-096**. Nested routing is a shell-architecture question for later, not a defect fix.

**Mode:** Validate · **Verdict:** Viable with caveats (as a mechanism) · Not the right fix for D-096 · **Confidence:** Medium · **Feeds:** D-096 fix decision; shell architecture (D-30 / D-141) · **Researched:** 2026-11-05 · **Status:** Draft

---

## SAP documents nested component routing and FE separately, but never FE as the nested component

**No official source says that an FE V4 app can be the child of a non-FLP UI5 router. It is not forbidden either. The supported shapes are "FE inside FLP", "FE standalone" and "a reuse component inside FE".**

- The UI5 topic "Enabling Routing in Nested Components" (ui5.github.io/docs, `fb19f50`, fetched 2026-11-05) defines the mechanism. It uses `componentUsages`, a target with `type: "Component"` and `usage`, and a `prefix` on the route's target. It states that the mechanism "requires asynchronous routing in **all** used components", that "all component instances share the browser hash", and that `HashChanger.getInstance().setHash()` must not be used. The topic does not mention Fiori Elements or FLP. (Documented)
- The 1.136.16 SDK topic index (`https://ui5.sap.com/1.136.16/docs/topics/index.json`) was searched for FE topics with titles matching reuse, nest, embed, standalone, launchpad, component, routing or hash. The only routing-adjacent FE topics found were "Configuring Internal/External Navigation" and "Including Reuse Components on an Object Page". The second covers FE as the *host*. No topic covers FE as a nested child. (Documented: the topic is absent)
- The FE source anticipates nested routes only below FE. `RouterProxy.splitAppSpecificRoute` (`sap/fe/core/controllerextensions/routing/RouterProxy-dbg.js`, 1.136.16) gives the example `"&/Entity('abc')/NextEntity('xyz')&/Prefix/NestedRoute"`: FE's own hash comes first and a nested component's hash second. (Documented, source)
- SAP Community threads "Nested routing to Fiori elements" (2021) and "Routing in nested components" (2023) report navigation breaking with nested FE apps. Both returned HTTP 403, so only their search-result titles were seen, and nothing from them is cited as evidence. (Reported, unread)

## FE's RouterProxy reads the prefix-stripped child hash, so the D-096 comparison works under nesting

**`RouterProxy.getHash()` asks the FE router's own hash changer for the hash. Under nesting that is a `RouterHashChanger` child, which returns the hash without the prefix, so the ListReport's hash is `""` and FE ranks it an ancestor of `Transactions(…)`.** (Documented from source; then Verified)

| Function (RouterProxy-dbg.js 1.136.16)                        | Reads                                                                 | Under nesting                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getHash`                                                     | `this._oRouter.getHashChanger().getHash()`                            | child subhash, no prefix (`RouterHashChanger.getHash` returns `this.hash`; `HashChanger._parseHash` splits the browser hash on `&/` into `{prefix: subhash}`, from `sap/ui/core/routing/HashChanger-dbg.js`)                                                                            |
| `_pushNewState` → `_compareCacheStates`                       | `extractEntitySetsFromHash(getHash())`                                | list `""` gives `[]`, which is an ancestor of `["Transactions"]`, so the action is **append**                                                                                                                                                                                          |
| `_rebuildBrowserHistory`                                      | `getHashChanger().setHash/replaceHash` + `history.replaceState`       | goes through the child hash changer, so the parent rebuilds the full hash                                                                                                                                                                                                             |
| `hashGuard` (the `popstate` listener)                         | `decodeURI(window.location.hash).split("&/")[1]`                      | **gets `tx/Transactions(…)`, prefix included.** FE assumes its own hash is the first `&/` segment, as it is in FLP. The state built here does not match the managed history, so this is a latent mismatch (Inferred). It did not break any path the spike measured                      |
| `getFullHash` → `checkIfBackExitsApp`, `checkIfBackIsOutOfGuard` | `ShellServiceMock.splitHash` (regex `/#[^/]*\/(.*)/`)              | returns two `&/` segments, so both functions short-circuit with "nested route involved" and return `false`. The draft guard therefore never reports that Back leaves it (Inferred; not exercised)                                                                                       |

Without FLP, FE runs on `ShellServiceMock` (`ShellServicesFactory-dbg.js`: `shellContainer ? new ShellServices(…) : new ShellServiceMock(…)`), whether or not the app is nested.

## The spike: one FE app nested, browser Back measured

**Verified. Under nesting, a list → record click adds a browser entry and Back lands on the list. On the current shell, the same click adds nothing and Back lands on the welcome page.**

The setup was the module dev server (`CDS_ENV=development,journey PORT=4931 npx cds-serve`), driven by Playwright from `scratchpad/spike/spike.mjs`. Nothing in the module was written. The nested shell is a 20-line `UIComponent`: router `sap.m.routing.Router`, async, route `transactions` → target `{ type: "Component", usage: "txUsage" }` with `prefix: "tx"`. Its HTML, Component and views are served by request interception, and the real `transactions/webapp/manifest.json` is patched in flight to set the list pattern to `:?query:`. The FE filter bar's default filters were cleared before the row click (journey rows sit outside the default posted-date range). Three modes ran against the same server.

```text
# baseline — the current shell (index.html), unchanged
list                     {"hash":"#/Transactions","len":3,"state":"{\"feLevel\":0,…}"}
record (after row click) {"hash":"#/Transactions(ID=7e5d0002-…-000000000002,IsActiveEntity=true)","len":3,"state":"{\"feLevel\":0,…}"}
after browser Back       {"hash":"#/","len":3,…}
history grew on row click: false

# nested — shell router, Component target, prefix "tx", list at ":?query:"
list                     {"hash":"#transactions","len":3,"state":"{\"feLevel\":0,…}"}
record (after row click) {"hash":"#/transactions&/tx/Transactions(ID=7e5d0002-…-000000000002,IsActiveEntity=true)","len":4,"state":"{\"feLevel\":1,…}","opVisible":true}
after browser Back       {"hash":"#transactions","len":4,"state":"{\"feLevel\":0,…}","opVisible":false}
after 2nd browser Back   {"hash":"#/","len":4,…}
after Forward / 2nd Fwd  {"hash":"#transactions"…} / {"hash":"#/transactions&/tx/Transactions(…)","feLevel":1,"opVisible":true}
history grew on row click: true
cycle2 record B          {"hash":"#/transactions&/tx/Transactions(ID=…-000000000001,IsActiveEntity=true)","len":4,"feLevel":1}
cycle2 after Back        {"hash":"#transactions","len":4,"opVisible":false}
draft: editing           {"hash":"#/transactions&/tx/Transactions(ID=…-000000000002,IsActiveEntity=false)","len":4,"feLevel":1}
draft: after Back        {"hash":"#transactions","len":4,"opVisible":false}   draft: open popups []
deep link fresh tab      {"hash":"#/transactions&/tx/Transactions(ID=…-000000000002,IsActiveEntity=true)","len":2,"opVisible":true}

# rename — current shell; list pattern patched to "TransactionList:?query:", NavConfig hash to "TransactionList"
list                     {"hash":"#/TransactionList","len":3,"state":"{\"feLevel\":0,…}"}
record (after row click) {"hash":"#/Transactions(ID=…-000000000002,IsActiveEntity=false)","len":4,"state":"{\"feLevel\":1,…}"}
after browser Back       {"hash":"#/TransactionList","len":4,…,"opVisible":false}
history grew on row click: true
cycle2 after Back        {"hash":"#/TransactionList","len":4,"opVisible":false}
deep link fresh tab      {"hash":"#/Transactions(ID=…)","len":2,"state":"null","opVisible":false}
```

How to read the runs:

- In cycle 2, `len` stays at 4 because the new record replaces the forward entry, which is correct. What matters is that Back still lands on the list.
- The draft ran only in nested mode. The baseline and rename runs reused the same in-memory database, so they opened a draft left over from the nested run and their Edit step was skipped.
- The rename's deep link failing is the predicted gap. Without a `NavConfig` alias for the `Transactions(` record prefix, the shell does not recognise the record hash. D-096 already lists that alias as part of the rename.

## What the hash, deep links, D-093 and app state look like under nesting

**The URL contract changes from `#/Transactions(…)` to `#/transactions&/tx/Transactions(…)`. Deep links and draft hashes work. The D-093 workaround is untouched. FE app-state hashes do not exist in this setup at all.**

| Concern                                       | Under nested routing                                                                                                                                                                                                       | Tier     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Record deep link (D-094)                      | Opens the object page in a fresh tab. The parent router restores the child segment, so the shell's `keepHash` logic from D-094 would be unnecessary                                                                       | Verified |
| Browser Back / Forward                        | List ↔ record ↔ shell home, both directions, across two cycles                                                                                                                                                             | Verified |
| Draft hash (`IsActiveEntity=false`)           | Edit replaces the record entry (same `feLevel`), and Back from the draft returns to the list with no dialog                                                                                                                | Verified |
| Draft guard on Back (`checkIfBackIsOutOfGuard`) | Always `false` under two `&/` segments. Whether that changes any user-visible prompt was not exercised                                                                                                                  | Inferred |
| D-093 `VirtualStateCarrier`                   | It runs from the ObjectPage `ControllerExtension`'s `routing.onBeforeBinding`, which is FE-internal and the same in both setups. Not measured in the spike                                                                   | Inferred |
| `iAppState` in the hash                       | Not produced in any mode: `TypeError: o.storeInnerAppStateAsync is not a function` logs twice in the baseline and twice nested, because `ShellServiceMock` lacks the method. App state is an FLP feature here              | Verified |
| Hash form                                     | Inconsistent leading slash: the shell writes `#transactions`, and after FE navigates the hash is `#/transactions&/tx/…`. Both match the route                                                                              | Verified |

## Migration cost: a shell rewrite that still leaves 14 admin lists broken

**Nested routing replaces the shell's hash handling instead of patching it, and it fixes D-096 only where a component hosts one list. `admin-master-data` hosts 15, so a full fix needs that app split into 15 components or the rename applied to it anyway.** (Inferred from the manifests and the `_compareCacheStates` source)

| Item                                                                                                   | Nested routing                                                                                                                                                                                         | List-hash rename (D-096 proposal)                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Fixes Transactions                                                                                     | yes (Verified)                                                                                                                                                                                         | yes (Verified)                                       |
| Fixes the 15 `admin-master-data` lists (`Issuers:?query:` … `ScrapeMappings:?query:`, one component)   | **no**: only one list can sit at `""`. The rest compare EQUAL with their own records, and `routingHints` do not help because the first key is the same entity set                                       | yes, by the same mechanism (`routingHints` → ANCESTOR) |
| Shell code                                                                                             | rewrite `App.controller.ts`: `ComponentContainer` map, `_pendingRoutes`, `_restoreFromHash`, the window `hashchange` listener (D-095) and the D-094 `keepHash` all go. They become manifest `componentUsages`, Component targets in `sap.tnt.ToolPage` `mainContents`, and side-nav state from `routeMatched` | none; `NavConfig` hashes plus a record alias          |
| FE manifests                                                                                           | every routed app gets its list moved to `:?query:`, plus `async` routing (already true for FE)                                                                                                         | 16 list patterns renamed                              |
| URLs                                                                                                   | all change (`#/transactions&/tx/…`)                                                                                                                                                                    | list URLs change; record URLs stay                    |
| Tests                                                                                                  | shell QUnit suite (32 cases built on hash fakes) and shell-launched OPA journeys rewritten                                                                                                             | constants and journey hashes updated                  |
| Supportability                                                                                         | FE-as-nested-child is undocumented; `hashGuard` prefix mismatch is latent                                                                                                                              | stays inside FE's own `routingHints` mechanism       |

## Prior assumption, graded

The prior was that nested routing would fix D-096 cleanly. **It partly held.**

- **Held:** the mechanism works for one FE app, and in the spike its hash, deep link, draft and Back behaved correctly.
- **Refuted on "cleanly":** it is undocumented for FE, it carries a latent `hashGuard` mismatch, it leaves 14 admin lists broken without a component split, and it changes more URLs than the rename does.

## What we could not establish

- **Official SAP position on FE V4 as a nested child.** I searched the UI5 docs (`fb19f50`), the 1.136.16 SDK topic index and the web. The two community threads returned 403. The question is settled only by an SAP statement, for example an issue on `SAP/open-ux-tools` or an SAP support ticket.
- **Whether the `hashGuard` prefix mismatch breaks anything.** It did not break the four paths measured. I did not test the draft "keep / discard" prompt when leaving with unsaved changes, an FCL layout, or a cancel-create. Settle with a spike that edits a field, then presses browser Back, run on both the current shell and the nested one.
- **The admin-master-data 15-list limit, end to end.** It is inferred from the manifest and the source, not run. Settle by nesting `admin-master-data` with `Issuers` at `""` and measuring Back from a `RewardsPrograms` record.
- **The D-093 header state under nesting** was not observed. It is inferred unaffected.
- **Flexibility / LREP** returns 404 (`LrepConnector … loadFlexData`) in every mode. That is pre-existing, and its behaviour under nesting is unknown.

## Verdict

**Viable with caveats as a mechanism, and not the right fix for D-096.** No kill criterion was named in the brief. The disqualifier is coverage: it cannot fix the 15 lists that share `admin-master-data` without splitting that app, and the rename fixes all 16 inside FE's own `routingHints` mechanism. **The rename is the right fix**, with the `NavConfig` record alias. Without the alias, the spike's rename run lost the record deep link.

The verdict would reverse if the shell is rebuilt anyway for cross-module hosting (D-30 / D-141). A per-module `prefix` is the UI5-native way to stop modules colliding in one hash. At that point, take nested routing on as a design story with its own spike for the draft guard. It is not a defect fix.
