# A Local Multi-App UI5 Shell Needs No BTP — and This Repo Already Runs One

**Document ID:** RSH-003
**Version:** 1.0
**Date:** 2026-07-26
**Status:** Draft

---

## 1. Change History

| Date       | Author          | Description                               |
| ---------- | --------------- | ----------------------------------------- |
| 2026-07-26 | Sandro & Claude | Initial creation from the Research stage. |

---

## 2. What This Establishes

**Every mechanism required to put two modules under one UI5 shell is available locally, and the
Financial Planner is already running the hand-built version of it — but nothing in `cds-plugin-ui5`
or the CAP server provides a shell, so whichever option Design picks, the shell is code somebody
writes and maintains.** `cds-plugin-ui5` mounts UI5 apps side by side at separate URL paths and stops
there; CAP's own index page is a dev-only `<ul>` of links that is switched off in production and that
this repo has already overridden. The one genuinely BTP-only option — SAP Build Work Zone / the
Launchpad service — is also the one nobody needs, because the `sap.ushell` sandbox that SAP's own
`@sap/cds-fiori` uses for Fiori preview is served from the same public CDN this repo already
bootstraps from, at the exact version it pins. The real constraint is not BTP and not the CAP
process: it is **one HTTP origin**, and the repo's absolute OData paths (`/service/adminSvcs/`) are
where a second module collides with the first. What would change this answer is a decision to serve
the two modules from two CAP processes without a proxy in front.

**Mode:** Ground · **Feeds:** OI-02 (shell half), RPT-001…RPT-004, Information Architecture, Design
System, Tech Stack · **Researched:** 2026-07-26

Versions pinned for everything that decays: `@sap/cds` 9.8.4, `cds-plugin-ui5` 0.17.4,
`@sap/cds-fiori` 2.2.0, `ui5-tooling-transpile` 3.11.3, SAPUI5 1.136.16, all as installed on disk on
2026-07-26.

---

## 3. `cds-plugin-ui5` Mounts Apps Side by Side and Has No Concept of a Shell

**The plugin's entire job is to run each UI5 project's own express middleware stack under a mount
path on the CAP server; it composes nothing.** `Documented` — `cds-plugin.js:181-208` iterates the
discovered modules and ends each iteration with `app.use(mountPath, router)`. There is no cross-app
registry, no intent resolution, no navigation service, no chrome. Two apps mounted by the plugin are
two unrelated URL prefixes on one express app.

Three properties of it do matter for a two-module shell:

| Property                                                                                                                  | Evidence                                                                                                    | Why it matters                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Apps are discovered from the `app/` folder **or from the CDS server's npm `dependencies`/`devDependencies`**              | `Documented` — `lib/findUI5Modules.js:91-109`; README line 5 ("or be a dependency of the CDS server")        | A shared shell, or a whole module's UI, can be an npm package that both modules depend on  |
| Both `type: application` and `type: component` UI5 projects are mounted                                                   | `Documented` — `lib/findUI5Modules.js:134-136`                                                              | A reusable component library is a first-class citizen, not a workaround                    |
| Mount path resolution order: `package.json` `cds/cds-plugin-ui5/modules/{id}/mountPath` → `ui5.yaml` `customConfiguration` → `metadata.name` | `Documented` — `lib/findUI5Modules.js:158-162`                                                              | The **consuming** server can re-mount a dependency's app without editing that app          |

That last row is the load-bearing one for OI-02: a Project Tracker CAP server could consume Financial
Planner UI packages and relocate their mount paths from its own `package.json`, with no change to the
Financial Planner sources. `Inferred` from the three cited code paths — I did not run it.

Two caveats a design stage should carry. First, the plugin only activates for `cds serve` /
`service === "all"` (`Documented` — `cds-plugin.js:167`), so it is a serving concern, not a build
one. Second, its own README opens by stating it is "an **open-source, community-driven project** …
maintained outside SAP's standard support model" (`Documented` — `node_modules/cds-plugin-ui5/README.md:3`).
The repo is already fully committed to it, so this is not new risk, but a second module doubles the
exposure.

---

## 4. CAP's Index Page Is a Dev-Only Link List That This Repo Has Already Replaced

**`cds watch` serves a generated welcome page with two `<ul>`s — web application HTML files found
under `app/`, and service endpoints — and it is off in production by construction.** `Documented` —
`@sap/cds/lib/env/defaults.js:21` reads `index: !production, // index page is off in production`. The
template itself (`@sap/cds/app/index.html`) is 30 lines of unstyled HTML whose footer says: "This is
an automatically generated page. You can replace it with a custom `./app/index.html`."

It is not a launchpad and was never intended as one. It is not themed, not configurable beyond
replacing it wholesale, and it lists paths rather than apps — `@sap/cds/app/index.js:50-57` builds the
list by globbing `*.html`, `*/*.html`, `*/*/*.html` under the app folder. `cds-plugin-ui5` then
rewrites that same `<ul>` to append its mounted apps as `<li><a class="ui5">` links
(`Documented` — `cds-plugin.js:216-271`), which is a developer convenience and is presented as one.

The repo has already taken the footer's advice. `@sap/cds/server.js:44-49` mounts
`express.static(./app)` **before** the generated index handler, with the comment `//> if none in
./app`, so `Financial Planner/app/index.html` wins at `/`. That file is the shell bootstrap, and
`Financial Planner/CLAUDE.md` documents the dev entry point as `http://localhost:4004/index.html`.

**Consequence worth stating plainly:** there is exactly **one** HTML file in the entire Financial
Planner `app/` tree (`Verified` — `find app -name "*.html"` returns only `app/index.html`). No
individual app has a standalone entry point. The "separate apps with cross-links" baseline is not the
current state and would have to be built, not fallen back to.

---

## 5. Five Options Exist; Exactly One Is BTP-Only, and It Is the One Nobody Needs

| Option                                              | Available locally?                                              | Evidence tier                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **A. Hand-built shell app** (`sap.tnt.ToolPage` + `ComponentContainer`) | **Yes — running in this repo today**                    | `Verified` on disk (§6)                                              |
| **B. `sap.ushell` sandbox** (`fioriSandbox.html` pattern)              | **Yes — on the pinned CDN, no backend required**        | `Verified` (fetched 1.136.16 CDN) + `Documented` (`@sap/cds-fiori`)  |
| **C. UI5 component reuse** (one app consuming another's Component)     | Yes — and it is the mechanism A already uses            | `Documented` (`ComponentContainer` in repo)                          |
| **D. Separate apps + plain cross-links**                               | Yes, but must be built — no per-app `index.html` exists | `Verified` (§4)                                                      |
| **E. SAP Build Work Zone / SAP Launchpad service**                     | **No — BTP subscription**                               | `Reported` (see below)                                               |

**Option E is the trap the brief warned about, and it is genuinely out.** SAP Build Work Zone,
standard edition is consumed as a subscription in an SAP BTP subaccount — SAP publishes it in the SAP
Discovery Center service catalog with subscription service plans, and SAP KBA 3331201 is titled "How
to subscribe to SAP Build Work Zone, Standard Edition service on SAP BTP". I tier this **`Reported`
rather than `Documented`**: `help.sap.com` and `discovery-center.cloud.sap` are JavaScript-rendered
and returned no body text to `WebFetch` on 2026-07-26, so I am citing SAP-published page and KBA
titles, not quoted documentation. The claim is uncontroversial and the practical point stands
regardless: it requires a cloud subscription, PSV-001 §7.2 forbids one, and nothing in the repo
assumes it.

The related BTP-shaped answer — HTML5 Application Repository plus `@sap/approuter` — is equally
irrelevant locally, and notably **is not installed**: neither `@sap/approuter` nor any HTML5-repo
package appears in the module's dependencies. That absence is a finding: the repo has never been on
the BTP composition path, so there is nothing to unwind.

---

## 6. The Repo's Existing Shell Is Option A, and It Already Proves the Hard Parts

**`Financial Planner/app/shell` is a full UI5 application that hosts four sibling apps as UI5
components inside a `sap.tnt.ToolPage`, with a side navigation and hash-based deep-link restore.**
`Verified` by reading the sources on 2026-07-26.

The mechanism, in three files:

- `app/index.html:16-25` — a single bootstrap from `https://ui5.sap.com/1.136.16/resources/sap-ui-core.js`
  whose `data-sap-ui-resourceroots` maps every app namespace to a **relative** path
  (`"com.financialplanner.transactions": "./transactions/webapp/"`), then instantiates only the shell
  component via `ComponentSupport`.
- `app/shell/controller/App.controller.ts:87-112` — `_loadAppComponent` creates a `ComponentContainer`
  per app component, caches it, and on `componentCreated` drives the child component's **own** router
  with `component.getRouter().navTo(route, {}, true)`.
- `app/shell/controller/NavConfig.ts` — an 18-entry map of nav key → `{ component, route, hash }`,
  plus a reverse `HASH_TO_NAV_KEY`.

Each app's `ui5.yaml` pins a `mountPath` that matches its `index.html` resource root exactly — e.g.
`app/transactions/ui5.yaml` sets `mountPath: /transactions/webapp`, and `app/shell/ui5.yaml` and
`app/shared/ui5.yaml` additionally set `resources.configuration.paths.webapp: "."` because those two
have no `webapp/` subfolder.

**The cost this shell pays is router arbitration, and it is visible in the code.** Every hosted app is
a standard `UIComponent` with its own `sap.ui5.routing` block (`app/transactions/webapp/manifest.json`
declares `TransactionsList` and `TransactionsObjectPage` routes), and they all share one browser hash.
The shell resolves this by hand: `_restoreFromHash` splits the hash on `(` and `/` and looks the
fragment up in `HASH_TO_NAV_KEY` (`App.controller.ts:138-149`), and `_isOnObjectPage` decides whether
"back" means the ListReport or the welcome page by testing `hash.includes("(") && hash.includes(")")`
(`App.controller.ts:76-79`). That heuristic is the tax option A charges, and it grows with app count.

**What the shell does not require of a hosted app is equally important.** No app manifest references
the shell, declares `crossNavigation`, or declares `componentUsages` (`Verified` — grep across all
`app/*/webapp/manifest.json` returns no hits for either key). The apps are shell-agnostic UI5
components. Everything shell-specific lives in `app/index.html` and `NavConfig.ts`.

---

## 7. The `sap.ushell` Sandbox Is on the Pinned CDN and Needs No Backend — but It Ships Under `test-resources/`

**Both halves of the launchpad sandbox are served from the exact SAPUI5 version this repo pins, and
SAP's own CAP package uses them.** `Verified` on 2026-07-26 by fetching:

- `https://ui5.sap.com/1.136.16/test-resources/sap/ushell/bootstrap/sandbox.js` → JavaScript,
  header comment "The Unified Shell's bootstrap code for development sandbox scenarios", `@version 1.136.16`
- `https://ui5.sap.com/1.136.16/resources/sap/ushell/library.js` → JavaScript, library `sap.ushell`,
  version 1.136.16, dependencies `sap.ui.core` and `sap.m`

`@sap/cds-fiori` 2.2.0 — an SAP-shipped CAP plugin already installed in this module — generates
exactly this page for its `/$fiori-preview` route. `Documented` — `node_modules/@sap/cds-fiori/app/preview.js:161`
carries the comment "copied from UI5's test-resources/sap/ushell/shells/sandbox/fioriSandbox.html",
and lines 171-230 are the recipe:

```js
window["sap-ushell-config"] = {
  defaultRenderer: "fiori2",
  renderers: { fiori2: { componentData: { config: { /* … */ } } } },
  applications: {
    "preview-app": {
      title: "Browse …",
      additionalInformation: "SAPUI5.Component=preview",
      applicationType: "URL",
      url: "/$fiori-preview/…/app",
      navigationMode: "embedded",
    },
  },
};
// …
<script id="sap-ushell-bootstrap" src="${ui5Host}test-resources/sap/ushell/bootstrap/sandbox.js"></script>
<script id="sap-ui-bootstrap" src="${ui5Host}resources/sap-ui-core.js"
  data-sap-ui-libs="sap.ui.core, sap.ui.generic.app, sap.ushell, sap.fe.templates" …></script>
// …
sap.ui.getCore().attachInit(function () {
  sap.ushell.Container.createRenderer().placeAt("content");
});
```

The whole thing is a static HTML page with an inline config object. **No BTP, no launchpad service, no
server-side component** — the `applications` registry is client-side, which is precisely why it works
offline and locally.

**The honest caveat, and it is the one that decays:** the bootstrap is published under
`test-resources/`, not `resources/`. SAP frames it consistently as a development artefact — the CDN
page at `.../shells/sandbox/fioriSandbox.html` is titled "Fiori Launchpad - Sandbox for application
development" (`Documented`, accessed 2026-07-26), and SAP's own `@sap-ux/preview-middleware` README
(SAP/open-ux-tools, `main` branch, read 2026-07-26) describes its FLP as hosting "a local SAP Fiori
launchpad based on your configuration" at `/test/flp.html` for `ui5 serve` / `fiori run`, with no
discussion of productive deployment. Community sources repeat a stronger phrasing — that the sandbox
platform is restricted to development or demo use and must not be used for productive scenarios — but
**I could not locate that sentence in a fetchable SAP primary source**; see §9.

For a single-user local deployment with no SLA and no support contract, "development artefact" is a
weaker objection than it would be in an enterprise context. But the artefact lives under a path SAP is
free to reorganise between UI5 versions, and this repo pins UI5 exactly (per the repo's own SAPUI5
version-consistency standard), so a version bump is the event that would need re-verification.

---

## 8. A Shared Shell Requires One HTTP Origin — Which Is Not the Same as One CAP Process

**This is the constraint that actually binds, and it is where the shell question touches the backend
half of OI-02.** Two independent facts create it:

1. **Resource roots are relative.** `app/index.html:17-24` maps namespaces to `./transactions/webapp/`
   and friends. A shell page can only load a component whose resource root it can resolve from its own
   origin. `Documented`.
2. **OData data-source URIs are absolute server-root paths.** Every Fiori Elements app declares
   `"uri": "/service/adminSvcs/"` or `"/service/transactionSvcs/"` at `manifest.json:13`. `Verified` —
   grep across all four app manifests. These resolve against whatever origin serves the page, not
   against the app's mount path.

So if Project Tracker's UI is loaded into a page served by the Financial Planner's CAP process, its
`/service/projectSvcs/` calls go to the Financial Planner's port and 404 — unless one of three things
is true: both services run in one CAP process; a reverse proxy fronts both on one origin; or the
manifests carry absolute cross-origin URIs.

**One CAP process is sufficient but not necessary.** The third path is technically open in
development: CAP mounts CORS middleware ahead of everything, and it is on by default outside
production (`Documented` — `@sap/cds/lib/env/defaults.js:20`, `cors: !production`; `server.js:44`).
Cross-origin composition would therefore likely work under `cds watch` and stop working the moment
`NODE_ENV=production` is set. That last sentence is `Inferred` from the two cited lines — I did not run
a two-server composition, and it is the single test that would settle it.

There is also a fourth path that avoids the question. CAP ships an undocumented-in-this-repo helper,
`app.serve('/endpoint').from(pkg, folder)` (`Documented` — `@sap/cds/server.js:110-115`), which mounts
another npm package's folder as static content on **this** server and registers it in the index links.
Combined with `cds-plugin-ui5`'s dependency discovery (§3), the composition can be done at the
package level rather than the process level: one CAP process serves the pages, and the modules ship
their UIs as packages.

**Cross-topic flag for `cap-multi-module-backend`:** a shared shell does **not** force one CAP service.
It forces one origin. If that scout recommends two CAP processes, the shell option set narrows to
(a) accept a proxy in the stack, (b) make data-source URIs absolute and accept the production-CORS
cliff, or (c) one shell per module. None of those is fatal; all three are Design decisions that must
be made together with the backend one, not after it.

---

## 9. The Shell Decision Lives in Two Files; the Routing Tax Does Not

**The cheapest reversible position question has a concrete answer in this repo: hosted apps carry no
shell-specific configuration at all, so "one shell per module now" costs one file plus a routing
strategy to reverse — not a per-app migration.** `Verified` from the manifest grep in §6.

| What a later shared shell would need to change              | Cost                                                | Evidence                                       |
| ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| Resource roots for the second module's apps                 | One `index.html`, a few lines                       | `Documented` — `app/index.html:17-24`          |
| Nav entries for the second module's apps                    | One `NavConfig.ts`, one entry per app               | `Documented` — `NavConfig.ts`                  |
| Mount paths aligned to the resource roots                   | One `ui5.yaml` line per app, already the convention | `Documented` — `app/*/ui5.yaml`                |
| **OData data-source URIs, if the modules are two origins**  | **One line per app manifest, plus a CORS story**    | `Verified` — `manifest.json:13` ×4             |
| **Hash arbitration across a larger app set**                | **Real shell logic, grows with app count**          | `Documented` — `App.controller.ts:76-79,138-149` |
| App manifests (`crossNavigation`, `componentUsages`)        | **None — no app declares either**                   | `Verified` — grep returns no hits              |

The bottom two rows are the ones that are not free. The apps are portable; the **shell** is not, and
its hardest part is exactly the part that does not shrink. A hand-built shell that grows from 18 nav
entries across four apps to 25+ across six will keep hand-rolling what `sap.ushell` provides as
intent-based navigation. Whether that argues for migrating to option B or for keeping two small shells
is an Information Architecture judgement, not a research finding.

One asymmetry is worth naming for RPT-002. `BUSINESS_ARCHITECTURE.md:196` calls RPT-002 "the component
that must work alone" for PSV falsifiable check 3. Under option A today, **nothing works alone** —
there is no per-app HTML entry point (§4), so every app is reachable only through the shell. If
"works alone" is meant literally at the URL level, that is a per-app `index.html` (~20 lines,
mirroring `app/index.html`), not a shell decision. `Inferred` — the phrase may well mean functionally
independent rather than separately addressable, and BA-001 does not say which.

---

## 10. Grading the Prior Assumption

**The prior assumption — "a single UI5 shell spanning both modules is achievable locally" — holds,
with one condition it did not name.**

| Part of the assumption                            | Grade                | Why                                                                                       |
| --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| Achievable locally, without BTP                   | **Holds**            | Option A runs in this repo today; option B's assets are on the pinned CDN (§6, §7)         |
| Requires no paid or hosted service                | **Holds**            | Only option E needs a BTP subscription, and it is not in the dependency tree (§5)          |
| "Nobody has checked"                              | **Refuted as stated** | The Financial Planner shipped a working single-module multi-app shell; the untested part is the *cross-module* case |
| Implicitly: the shell is a framework feature      | **Refuted**          | Neither `cds-plugin-ui5` nor CAP provides shell composition — it is application code (§3, §4) |
| Implicitly: modules are independent of each other | **Conditional**      | A shared shell binds them to one origin, and today's absolute `/service/...` URIs make that binding real (§8) |

---

## 11. What We Could Not Establish

- **Whether SAP formally prohibits productive use of the `sap.ushell` sandbox.** The strong phrasing
  ("restricted to development or demo use cases and must NOT be used for productive scenarios")
  surfaced only through web-search summaries. `help.sap.com` pages
  (`test-multiple-sap-fiori-applications-in-flp-sandbox`, `run-applications-in-sap-fiori-launchpad-environment`)
  are JavaScript-rendered and returned an empty body to `WebFetch`; the CDN's own `fioriSandbox.html`
  returned only its `<title>`. What I can document is the `test-resources/` path, the page title, and
  `@sap-ux/preview-middleware`'s dev-only framing. **What would settle it:** reading the HTML source
  comments of `fioriSandbox.html` directly, or the SAPUI5 SDK topic on the sandbox, with a tool that
  executes JavaScript.
- **Whether a two-CAP-process composition actually works in one shell page.** §8 reasons from CAP's
  CORS defaults and the relative resource roots, but this is `Inferred`. **The single test that would
  resolve it:** stand up a second CAP server on another port, point one `index.html` resource root and
  one manifest `dataSource.uri` at it, and load both components into one `ComponentContainer` host. No
  spike was authorised for this topic.
- **Whether `cds-plugin-ui5` dependency discovery works across this npm workspace.** `findUI5Modules.js:91-109`
  resolves `require.resolve(dep + '/ui5.yaml')` against direct `dependencies`/`devDependencies` only.
  The Financial Planner has **no `ui5.yaml` at its package root** (`Verified`), and its app folders are
  not workspace packages — the root `workspaces` array is `["Financial Planner"]` alone (`Verified`).
  So a shared shell would have to be extracted into its own package with a root `ui5.yaml`. Whether
  that survives npm workspace hoisting is untested.
- **Context7 was unavailable in this session** (`mcp__Context7__resolve-library-id` returned "No such
  tool available"), so `@sap/cds` and `cds-plugin-ui5` documentation was sourced from the on-disk
  packages instead — which outranks it anyway — but the published CAP guides on serving UIs were not
  cross-checked. `cap.cloud.sap/docs/advanced/fiori` returned 404 on 2026-07-26.
- **The SAP Community article "A Fiori Launchpad Sandbox for all your CAP-based projects"** returned
  HTTP 403 and could not be read.
- **UI5 component *libraries* (`type: library`) as a sharing mechanism** were not investigated. The
  repo's `app/shared` is declared `type: application` with `paths.webapp: "."`, not a UI5 library, so
  the library route across two modules is unexplored territory here.

---

## 12. Implications for Design

Grounding, not recommendation. Five things the design stages now have to work with.

1. **The shell is application code in every option.** No stage should plan on the platform supplying
   composition. Whatever IA decides, somebody writes and maintains a shell app — the choice is between
   maintaining `NavConfig.ts` + hash arbitration (option A) or maintaining a `sap-ushell-config`
   applications registry and intents (option B).

2. **OI-02's shell half and backend half are coupled through origin, not process.** Design can choose
   two CAP services and still have one shell, but only by adding a proxy, absolutising OData URIs, or
   accepting that the composition is dev-only. That trade must be settled in the same conversation as
   the backend split, and the deciding artefact is `manifest.json:13` in every app.

3. **Deferring the shell is cheap; deferring the routing strategy is not.** Hosted apps carry zero
   shell coupling, so adding Project Tracker's apps to a shared shell later is a two-file edit. What
   does not get cheaper is cross-app deep-linking: today's shell parses the URL hash with string
   heuristics, and a second module's routes land in the same hash. If IA wants durable deep links
   across modules, that is the thing to design now, whether or not the shell is shared now.

4. **Option B is a live option, not a research curiosity.** SAP's own CAP tooling generates the page,
   the assets are on the CDN version this repo already pins, and it would replace the hand-rolled hash
   logic with intent-based navigation. It carries two costs Design must weigh: a dependency on a
   `test-resources/` path across UI5 upgrades, and per-app intent registration that today's manifests
   do not have. It also carries a benefit worth naming — apps registered by intent are addressable
   individually, which is the `#` half of RPT-002's "must work alone".

5. **RPT-001…RPT-004 are inside one page, not across four apps.** D-21 makes the project view four
   Reports composing a single page, so the shell question does not touch the layout of the four —
   that is Information Architecture's call. What the shell question does determine is whether the
   project view is reached at `/project-tracker/webapp/` from its own shell, or as a nav entry beside
   Transactions and Admin in a shared one.
