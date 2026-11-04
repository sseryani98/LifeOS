/**
 * What the migration must leave behind, transcribed from Financial Planner's
 * ledgers at the snapshot commit rather than from the migration's own embedded
 * copy, so a value mistyped there is caught here instead of compared with itself.
 */

/** The identity every migrated row is written as. */
export const MIGRATION_ACTOR = "migration";

/** The checkpoint's own date, which its decisions, test run and narrative carry. */
export const CHECKPOINT_DATE = "2026-07-10";

/** The three sprints' names, as the migrated Initiatives carry them. */
export const SPRINT = {
  W1_S1: "W1-S1 — Foundation & Seed Data",
  W1_S2: "W1-S2 — Ingestion Pipeline",
  W1_S3: "W1-S3 — Transaction Processing",
} as const;

/** The hierarchy above the sprints. */
export const EXPECTED_HIERARCHY = {
  AREA: { name: "Personal Software" },
  ENGAGEMENT: { name: "Life OS" },
  WORKSPACE: {
    slug: "financial-planner",
    name: "Financial Planner",
    currentFocus: null,
  },
} as const;

/** The three Initiatives, with the git facts git holds for them. */
export const EXPECTED_INITIATIVES = [
  {
    name: SPRINT.W1_S1,
    goal: null,
    branch: "sprint/W1-S1",
    status_code: "Complete",
    mergeCommit: "513170a",
    tag: "v1.1",
    position: 10,
  },
  {
    name: SPRINT.W1_S2,
    goal: "Transactions flow from SimpleFIN and CSV into the system. Connection health visible.",
    branch: "sprint/W1-S2",
    status_code: "Complete",
    mergeCommit: "a4535fc",
    tag: "v1.2",
    position: 20,
  },
  {
    name: SPRINT.W1_S3,
    goal: "Transactions categorized, splits supported, historical data backfilled, weekly review surface functional.",
    branch: "sprint/W1-S3",
    status_code: "Active",
    mergeCommit: null,
    tag: null,
    position: 30,
  },
] as const;

/**
 * The twelve Milestones in board order within each sprint. `boardType` is the
 * board's own Type cell; `fricewType_code` is what must be stored after the
 * remap. `derivedStatus` is the code the service derives once the load is done.
 */
export const EXPECTED_MILESTONES = [
  {
    reference: "financial-planner/CNV-002",
    initiative: SPRINT.W1_S1,
    boardType: "Conversion",
    fricewType_code: "Conversion",
    description: "Seed reference lookup tables from design specs",
    shipsUi: false,
    position: 10,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/CNV-003",
    initiative: SPRINT.W1_S1,
    boardType: "Conversion",
    fricewType_code: "Conversion",
    description: "Seed Sandro's card portfolio and historical data",
    shipsUi: false,
    position: 20,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/FRM-009",
    initiative: SPRINT.W1_S1,
    boardType: "Form",
    fricewType_code: "Form",
    description:
      "Master Data Maintenance: SM30-style CRUD for all config tables",
    shipsUi: true,
    position: 30,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/INT-001",
    initiative: SPRINT.W1_S2,
    boardType: "Integration",
    fricewType_code: "Interface",
    description:
      "SimpleFIN Bridge sync: 4-layer engine, ENH-008 dedup, node-cron scheduling, encrypted access URL, retry/backoff, connection_error/stale_data/unmapped_account alerts, null-card backfill",
    shipsUi: false,
    position: 10,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/INT-002",
    initiative: SPRINT.W1_S2,
    boardType: "Integration",
    fricewType_code: "Interface",
    description:
      "CSV parsing engine: 4-layer engine + field parser + mapper, per-issuer format config resolution (Scotia/TD/CIBC/Amex), dedup classification, parseCsvImport action",
    shipsUi: false,
    position: 20,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/ENH-008",
    initiative: SPRINT.W1_S2,
    boardType: "Enhancement",
    fricewType_code: "Enhancement",
    description:
      "Deduplication engine: evaluate() returns new/duplicate/potential_duplicate per SPEC-01 §4.3",
    shipsUi: false,
    position: 30,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/FRM-003",
    initiative: SPRINT.W1_S2,
    boardType: "Form",
    fricewType_code: "Form",
    description:
      "CSV Import Wizard: 3-step freestyle wizard, tabbed review, saveCsvImport action, Import Log + Vendor entity + Transaction categorization FKs",
    shipsUi: true,
    position: 40,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/FRM-010",
    initiative: SPRINT.W1_S2,
    boardType: "Form",
    fricewType_code: "Form",
    description:
      "Connection Manager: freestyle health page, manual Sync Now, Add Connection, Re-authenticate, account→card mapping",
    shipsUi: true,
    position: 50,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/ENH-001",
    initiative: SPRINT.W1_S3,
    boardType: "Enhancement",
    fricewType_code: "Enhancement",
    description:
      "Categorization engine: three-pass matching pipeline (exact → starts-with → contains) returning vendor + dual taxonomy; user correction auto-creates MerchantPattern (learning). MerchantPattern entity + VendorCategoryStats CDS view. Wires FRM-003 pre-fill.",
    shipsUi: false,
    position: 10,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/ENH-009",
    initiative: SPRINT.W1_S3,
    boardType: "Enhancement",
    fricewType_code: "Enhancement",
    description:
      "Split logic: TransactionSplit with mySharePct/myShareAmount (either/or, share ≤ total, reimbursed = 0). splitTransaction / bulkCategorize / correctCategorization actions on TransactionService; bulk learning dedupes per description. 4-file transaction module + Mapper, unit + SQLite integration tests.",
    shipsUi: false,
    position: 20,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/FRM-001",
    initiative: SPRINT.W1_S3,
    boardType: "Form",
    fricewType_code: "Form",
    description:
      "Transaction List: Fiori Elements List Report + Object Page — inline edit (vendor/PT/EC/notes), Split dialog, Apply Categories bulk, Re-categorize action, splits section, filters. Spec gaps carried as D-021 … D-027.",
    shipsUi: true,
    position: 30,
    derivedStatus: "done",
  },
  {
    reference: "financial-planner/CNV-001",
    initiative: SPRINT.W1_S3,
    boardType: "Conversion",
    fricewType_code: "Conversion",
    description:
      "Historical backfill: BackfillService orchestration (parse via INT-002 → ENH-008 dedup → ENH-001 categorize → ImportLog), purchases-only + date-cutoff filters, halt-on-parse-error, supp-card attribution. Scenario test.",
    shipsUi: false,
    position: 40,
    derivedStatus: "backlog",
  },
] as const;

/** The type the board used for its two interfaces, which nothing may store. */
export const RETIRED_FRICEW_TYPE = "Integration";

/**
 * The one chain the load produces as a consequence of creating its one Backlog
 * story: the backend chain, with the two UI-only steps never materialised.
 */
export const EXPECTED_CHAIN = {
  REFERENCE: "financial-planner/CNV-001",
  TASK_COUNT: 8,
  SUBTASK_COUNT: 6,
  TASK_STATUS: "notStarted",
  SUBTASK_STATUS: "notStarted",
  ABSENT_STEP_CODES: ["ux-test", "smoke"],
} as const;

/**
 * The 27 Defects as the log records them. The log's own identifier is not a
 * stored column, so a suite matches a row by its verbatim description. An Open
 * row's Resolution cell is the log's placeholder for none, transcribed as null.
 */
export const EXPECTED_DEFECTS = [
  {
    logId: "D-001",
    initiative: SPRINT.W1_S2,
    severity: "High",
    status: "Closed",
    description:
      'Coverage harness never ran: `coveragePathIgnorePatterns` used glob strings but Jest treats them as regex (`**/...` → "Invalid regular expression"), `coverageThreshold` globs pointed at non-matching paths (`**/Validator.ts`, `./srv/util/**/*.ts`), and `generateTestReport.ts` read the wrong jest JSON shape (`testResults`/`testFilePath` vs `assertionResults`/`name`) — so `npm test` (jest --coverage) crashed before reporting. Root cause: W1-S1 config authored but never exercised with coverage.',
    resolution:
      "Fixed in `d5c2b5a`: valid regex patterns, repointed threshold globs (`**/*Validator.ts` + per-file utility gates), corrected report shape; added utility + logger unit tests to clear the 80% branch gate.",
  },
  {
    logId: "D-002",
    initiative: SPRINT.W1_S2,
    severity: "Medium",
    status: "Closed",
    description:
      "`tsc` and `cds build` failed with `TS2688: Cannot find type definition file for 'sap__cds'` — the `@cap-js/cds-types` postinstall (which creates the `node_modules/@types/sap__cds` junction) had not run in the resumed session. Recurs on a fresh `npm ci` if postinstall is skipped.",
    resolution:
      "Restored junction by running `@cap-js/cds-types/scripts/postinstall.js` with `INIT_CWD` set. Mitigation: ensure `npm install`/postinstall runs after clone; consider documenting in setup.",
  },
  {
    logId: "D-003",
    initiative: SPRINT.W1_S2,
    severity: "High",
    status: "Closed",
    description:
      "Seed `CsvFormatConfig` for TD and CIBC had off-by-one column indices vs the actual bank exports (`design/actual-csvs/`): both are headerless with layout `0=date, 1=description, 2=debit, 3=credit`, but the seed set `descriptionColumn`/`debitColumn`/`creditColumn` to `1`/`2`/`3`→`0`/`1`/`2` respectively (TD `descriptionColumn=0` pointed at the date; CIBC `debitColumn=1` collided with the description). Left uncorrected, every TD/CIBC CSV import would parse the wrong columns. Found while building the INT-002 parsing engine.",
    resolution:
      "Corrected the two seed rows to `debitColumn=2, creditColumn=3, descriptionColumn=1`. Scotia/Amex (name-based columns) were already correct. INT-002 unit tests pin the corrected configs; integration test parses real samples end-to-end.",
  },
  {
    logId: "D-004",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      '`bulkCategorize` reports `updatedCount` as the number of transaction IDs *requested*, not the number of rows actually written: `transactionService.ts:70` returns `{ updatedCount: command.transactionIds.length }`. Unknown IDs are silently skipped downstream — `CategorizationService.correctCategorization` returns early when the transaction is not found (`categorizationService.ts:69-70`) — so a bulk action over a stale selection (e.g. a row deleted since the list loaded) categorizes 3 rows but tells the user 4 were updated; a selection of only-missing IDs reports N updated with zero writes. Categorization of existing rows is correct — only the reported count and its toolbar toast mislead. Found by the `/test-quality` workflow; documented by a failing integration test (`test/integration/transaction/tests/transactionActions.test.ts` → "counts only the rows it actually updated"), left red on purpose per TDD.',
    resolution:
      'Fixed (Sandro chose option a, 2026-11-03): `updatedCount` counts real writes — `correctCategorization` returns whether it wrote, and `applyCategories` counts only `true`. Stale IDs are skipped silently. The red test ("counts only the rows it actually updated") passes on HEAD; this row was stale.',
  },
  {
    logId: "D-005",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      'Connection Manager and Transactions render blank when deep-linked: the shell router logs "no \'controlAggregation\'" and "There should be a sap.fe.core.AppComponent as owner". Reproduces on unchanged HEAD `4b6615e`, so it predates the 2026-10-30 lint refactor that surfaced it. Found during the `SPEC-01` Human Review sweep. Also blank when opened by clicking **SimpleFIN Connections** in the side nav, not only by deep link: the 2026-10-30 UX pass saw the same two console errors.',
    resolution:
      "Fixed 2026-10-30 in `0593065`. Root cause: Connection Manager's `Component.ts` extended plain `UIComponent`, but it hosts an FE custom page that needs FE's `AppComponent`. It now extends `AppComponent`, the manual router init and the manifest `rootView` are removed, and the accounts table binding in `ConnectionManager.view.xml` uses `contextPath` (it was a parentless 400 that also blocked the connections table). Verified with headless Playwright, by deep link and by side nav. Transactions was never blank, only empty (0 rows).",
  },
  {
    logId: "D-006",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      'CSV Import wizard step 1: the upload control is a native `<input type="file">`. "Choose Files" renders in Arial with the browser\'s default black-bordered button, and "No file chosen" is italic. It is the only control in the wizard outside the DM Sans and Default-button treatment (THEME.md §5.3, §5.11). Found by the 2026-10-30 `ux-tester` re-verification pass.',
    resolution:
      "Fixed 2026-10-30 in `6abcd76`. Misdiagnosed: the control was already `FileUploader`, and the Arial reading came from its invisible native input (opacity 0.01). The real leaks were fixed: default and transparent buttons turned Horizon blue on hover app-wide, and the uploader's hover, pressed and outline colours were hardcoded. All are now routed to button tokens in `theme-overrides.css`.",
  },
  {
    logId: "D-007",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      'Page headers are inconsistent, and admin lists never name their page. All 12 admin master-data lists use the static title "Master Data Maintenance" in `rgb(19,30,41)`, so only the table header ("Issuers (12)") identifies the page. The Transaction List heads with the Deep Gold variant title "Standard". CSV Import uses a plain 16px non-bold title. That gives three header patterns across one app (DESIGN_SYSTEM page-header consistency, IA journey placement). Found by the 2026-10-30 `ux-tester` passes.',
    resolution:
      'Fixed 2026-11-03 in `90dadf7`. All three header patterns are now one. CSV Import and Connection Manager moved from `sap.m.Page` to `sap.f.DynamicPage`, the container FE list reports use (24px bold heading). Every page is named by the shell instead of FE extension code (Sandro\'s ruling): the ToolHeader shows "Financial Planner › {page}", from a `label` i18n key on each `NAV_CONFIG` entry.',
  },
  {
    logId: "D-008",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      'Issuer object page: the only field is labelled "Short Name" but shows the combined "CIBC (CIBC)" (name plus short name), and the page title is the bare word "Issuer" with no record identity. The label does not match its value. Found by the 2026-10-30 `ux-tester` pass.',
    resolution:
      'Fixed 2026-10-30 in `0593065`. `issuers.cds`: `HeaderInfo.Description` is `name`, and `@Common.Text` moved from `shortName` to `name`. The header reads "Issuer / Amex (American Express Canada)" and Short Name shows plain "Amex".',
  },
  {
    logId: "D-009",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'Shell welcome page says "Select Master Data from the Admin menu", but the nav group is **Admin** and has no "Master Data" item, so the instruction names a menu that does not exist. Found by both 2026-10-30 UX passes.',
    resolution:
      'Fixed 2026-10-30 in `0593065`. Shell i18n welcome text now says "Choose a page from the side navigation to begin."',
  },
  {
    logId: "D-010",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'Terminology drift: the side-nav item is "Account Types" but its table header reads "Financial Account Types (12)". Found by the 2026-10-30 `ux-tester` pass.',
    resolution:
      'Fixed 2026-10-30 in `0593065`. Nav label renamed to "Financial Account Types" to match the entity. Four similar mismatches are tracked as D-016.',
  },
  {
    logId: "D-011",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'System Config descriptions show raw lowercase identifiers ("af_approaching", "cancel_reminder") instead of human-readable text. The UPPER_SNAKE config keys themselves are expected. Found by the 2026-10-30 `ux-tester` pass.',
    resolution:
      'Fixed 2026-10-30 in `0593065`. Two rows in `db/data/com.financialplanner-SystemConfig.csv` rewritten ("…an Annual Fee Approaching alert", "…a Cancel Reminder alert"). DATA_MODEL.md §-table updated to match.',
  },
  {
    logId: "D-012",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      "Horizon leftovers after the D-318 theme fix, both on the Transaction List. The empty-state `IllustratedMessage` artwork is Horizon blue (SVG, decorative, the only SAP blue left on screen), and the table's bottom border is Horizon grey-blue `rgb(168,179,189)`. THEME.md §3.1 says zero SAP blue, which arguably covers only interactive elements. Found by the 2026-10-30 `ux-tester` re-verification pass.",
    resolution:
      "Fixed 2026-10-30 in `6abcd76` (D-319). §3.1 now covers decorative artwork. 13 `--sapContent_Illustrative_ColorN` tokens were retinted to the amber ramp, and the five grey-blue rule tokens are now Taupe `#B3ABA3`. THEME.md v1.3.",
  },
  {
    logId: "D-013",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'Transaction List logs `storeInnerAppStateAsync is not a function` to the console on load, alongside FE `[FUTURE FATAL] PropertyInfo` warnings. There is no visible effect yet, but "future fatal" warnings become errors on a UI5 upgrade. Found by both 2026-10-30 UX passes.',
    resolution:
      "Won't fix (Sandro, 2026-11-02). Diagnosed 2026-10-30, not ours. Outside the Fiori Launchpad, FE 1.136.16 falls back to a stand-in navigation service that has no `storeInnerAppStateAsync`. FE catches the error and logs it. Only effect: filter state is not written to the URL. Admin Master Data logs it too. The fix would need the FLP sandbox or a patch to SAP code.",
  },
  {
    logId: "D-014",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      "After Transactions or Connection Manager loads, the URL hash empties, so a browser reload returns to the Welcome page instead of the open app. Found while verifying the D-005 fix (2026-10-30). The 2026-11-02 UX pass also found that hash deep links (`#SimpleFINConnections`, `#/SimpleFINConnections`) never navigate, on load or on hashchange.",
    resolution:
      "Fixed 2026-11-03 in `90dadf7`. Root cause: Transactions, CSV Import and Connection Manager used the empty route pattern `:?query:`, so their routers rewrote the hash to empty. They now use `Transactions`, `CsvImport` and `SimpleFINConnections`, the hashes the shell already maps. Connection Manager's FPM target gets `contextPattern: \"\"`; without it FE bound the page to `/SimpleFINConnections` and its tables 404'd. The shell now also listens to `hashChanged`, so a typed or pasted hash switches apps. Verified in Playwright: deep link, reload, and hash change.",
  },
  {
    logId: "D-015",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      "CSV Import: keyboard focus on the `FileUploader` shows no visible ring, because focus lands on the invisible native input. That fails WCAG 2.4.7 Focus Visible. Found while verifying the D-006 fix (2026-10-30).",
    resolution:
      "Closed 2026-11-03 — does not reproduce on HEAD. Tab and Shift+Tab both land on the uploader's button (`-fu_button`, not the native input), and its Dark Amber `::before` ring renders. Verified with keyboard focus in Playwright.",
  },
  {
    logId: "D-016",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      "Four more side-nav labels differ from their table titles: Application Rules / Issuer Application Rules, CSV Formats / CSV Format Configs, System Config / System Configs, Income Sources / Income Source Types. Same class as D-010. Found while fixing D-010 (2026-10-30).",
    resolution:
      "Fixed 2026-11-03 in `90dadf7`. As in D-010, the nav labels take the entity's `TypeNamePlural`: Issuer Application Rules, CSV Format Configs, System Configs, Income Source Types.",
  },
  {
    logId: "D-017",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Closed",
    description:
      'Transaction List, Adapt Filters dialog: a field is labelled with the raw property path "Transaction.hasSplit". The property has no `@Common.Label`. Found by the 2026-11-02 `ux-tester` pass.',
    resolution:
      'Fixed 2026-11-03 in `90dadf7`. `Transaction.hasSplit` existed only in the transactions app\'s UI5 bundle, not in `srv/_i18n/i18n.properties`, where CDS resolves annotation keys. Added it ("Split"); `$metadata` now carries the label.',
  },
  {
    logId: "D-018",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      "Field labels, dialog labels and the object-page subtitle use stock Horizon `--sapContent_LabelColor` `#556B82` (cool slate). It passes AA at 5.3:1 on Parchment, but it is the one cool-toned text colour beside the warm Obsidian palette, and THEME.md does not override it. Found by the 2026-11-02 `ux-tester` pass.",
    resolution:
      "Fixed 2026-11-03 in `90dadf7` (D-320). `--sapContent_LabelColor` → Driftwood `#6B6259`: 5.71:1 on Parchment, 5.12:1 on Warm Stone, 4.76:1 on Soft Ash, where the stock slate fell to 4.39:1. THEME.md §3.2 and §7.1.",
  },
  {
    logId: "D-019",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'Issuers list Name column shows redundant parentheticals ("BMO (BMO)", "CIBC (CIBC)", "RBC (RBC)", "MBNA (MBNA)") when the short name equals the name. Found by the 2026-11-02 `ux-tester` pass.',
    resolution:
      "Fixed 2026-11-03 in `90dadf7`. The seed names are now full legal names: Bank of Montreal, Canadian Imperial Bank of Commerce, Royal Bank of Canada, MBNA Canada, Tangerine Bank. Updated in `SPEC-06` and `test/shared/data/reference.ts`.",
  },
  {
    logId: "D-020",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Closed",
    description:
      'Table header polish. The Transaction List column header truncates to "Categorization S…". SimpleFIN Connections headers are misaligned: "Last Sync" is right-aligned and the first header is indented. Found by the 2026-11-02 `ux-tester` pass.',
    resolution:
      'Fixed 2026-11-03 in `90dadf7`. Transaction List: the status column takes the short label "Status", and the filter keeps the full one. SimpleFIN Connections: "Last Sync" end-alignment is FE\'s type-derived default for a timestamp — won\'t fix (a `controlConfiguration` begin-align override was reverted in Human Review 2026-11-04; no design doc asks for it). The "indented" first header is the Single-selection radio column (DESIGN_SYSTEM §9.1), so that stays.',
  },
  {
    logId: "D-021",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Open",
    description:
      "FRM-001 list has 8 columns where SPEC-02 §4.3 specifies 11: Split, Source and Notes are missing (`app/transactions/annotations/transactions.cds` `@UI.LineItem`). BR-21 / D-121 make Notes inline-editable on the list, so it has nowhere to edit. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-022",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Open",
    description:
      "FRM-001 opens with no default filter. SPEC-02 BR-20 specifies `uncategorized` + last 7 days; neither `manifest.json` nor the annotations carry a SelectionVariant or default value. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-023",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Open",
    description:
      "FRM-001 object-page header title is `rawDescription`; SPEC-02 §4.3 specifies the vendor name, falling back to the raw description. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-024",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Open",
    description:
      "FRM-001 object-page Suggestions section (SPEC-02 §4.3 Section 3, BR-27) should show the matched pattern, confidence and alternatives; `FieldGroup #Suggestions` holds only `categorizationStatus` and `hasSplit`. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-025",
    initiative: SPRINT.W1_S3,
    severity: "Low",
    status: "Open",
    description:
      "FRM-001 Purchase Type dropdown is a flat `ValueListWithFixedValues`; SPEC-02 §4.3 specifies subtypes indented under their category. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-026",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Open",
    description:
      "FRM-001 on-the-fly vendor creation is unbuilt: SPEC-02 §4.3 and §6 keys `transaction.vendor.createNew` and `transaction.vendor.duplicateName` are absent from `srv/_i18n/messages.properties`. Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
  {
    logId: "D-027",
    initiative: SPRINT.W1_S3,
    severity: "Medium",
    status: "Open",
    description:
      "Vendor merge (SPEC-02 BR-28/29, FUT-014, D-122) is unbuilt: no merge action in `srv/admin-service.cds`, keys `admin.vendor.mergeSameVendor` / `admin.vendor.mergeEmpty` absent, and the SPEC-06 amendment was never applied (SPEC-06 still defers merge to SPEC-04). Found by the 2026-11-04 `/refresh-docs` SPEC-02 sweep; Sandro ruled build gaps, not spec changes.",
    resolution: null,
  },
] as const;

/** The log's placeholder for an empty Resolution cell, which must never be stored. */
export const RESOLUTION_PLACEHOLDER = "—";

/** The register totals the log implies, for the count-shaped assertions. */
export const DEFECT_TOTALS = {
  CLOSED: 20,
  OPEN: 7,
  BY_SEVERITY: { High: 2, Medium: 13, Low: 12 },
} as const;

/** The five Decisions, as far as the checkpoint fixes them. */
export const EXPECTED_DECISIONS = {
  COUNT: 5,
  INITIATIVE: SPRINT.W1_S2,
  NULL_RATIONALE_COUNT: 1,
  // The one decision the checkpoint records without a reason.
  NULL_RATIONALE_SUBJECT: "multi-file same-card",
} as const;

/** The one TestRun, with the Lines figure rather than the Statements one beside it. */
export const EXPECTED_TEST_RUN = {
  initiative: SPRINT.W1_S2,
  total: 174,
  passed: 174,
  failed: 0,
  pending: null,
  durationMs: null,
  linesPct: 98.71,
  branchesPct: 89.37,
  executedOn: CHECKPOINT_DATE,
} as const;

/** The checkpoint's Statements figure, which must not be stored as linesPct. */
export const STATEMENTS_PCT = 98.73;

/** The two Activity rows the whole load writes, by kind. */
export const ACTIVITY_KIND = {
  MIGRATION: "migration",
  CHECKPOINT: "checkpoint",
} as const;

/**
 * Every line of the checkpoint prose no other register holds — its scope note,
 * sprint checks, Definition of Done and next-sprint section — verbatim. Each one
 * must appear in the checkpoint Activity's payload, however the lines are joined.
 */
export const CHECKPOINT_PROSE_LINES = [
  "**Sprint scope note:** INT-001 and INT-002 arrived in the earlier integration commits; FRM-003 landed last (`5fc1877`) and folded in pre-existing branch work — the `db/integration` → `db/ingestion` folder rename, a shared `formatAmount` extraction, and companion edits to CLAUDE.md / TECHNICAL_STANDARDS.md / TECH_STACK.md / `package.json` / `admin-service.cds` / `db/alerts/schema.cds` / lint scripts. Everything is green as a whole; the entanglement was left as-is by design.",
  "- ✅ INT-001: SimpleFIN sync creates Transaction records with `source = 'simplefin'`.",
  "- ✅ INT-002: CSV parsing works for all 4 issuer formats (Scotia, TD, CIBC, Amex).",
  "- ✅ ENH-008: Dedup correctly categorizes new / duplicate / potential-duplicate.",
  "- ✅ FRM-003: CSV wizard end-to-end — upload → review tabs → save (Playwright-verified).",
  "- ✅ FRM-010: Connection list shows health status; manual sync trigger works.",
  "- ✅ Provider Connection access URL stored encrypted (AES-256-GCM via EncryptionUtility).",
  "- ✅ Alert generation works for `connection_error`, `stale_data`, `unmapped_account`.",
  "- ✅ TransactionService integration tests pass.",
  "- ✅ `npm test` — all tests pass",
  "- ✅ `npm run lint` — zero errors (full 19-check suite, exit 0)",
  "- ✅ Coverage gates met (overall ≥ 85% line / ≥ 80% branch; validators & utilities 100%)",
  "- ✅ No Critical / High defects open against delivered stories",
  "- ✅ TDD followed — Validators, Services, engines, and the `saveCsvImport` handler written test-first",
  "- ✅ `_enc` fields only via EncryptionUtility; no decrypted sensitive data in logs or responses; `.env` gitignored",
  "- ✅ i18n keys for all user-visible strings (three-tier)",
  "- ✅ Sprint board updated — all five stories in Done",
  "- ✅ Defect log updated — D-001/D-002/D-003 logged and closed",
  "- ✅ Commits on `sprint/W1-S2`, Conventional Commit format, FRICEW IDs in bodies, Co-Authored-By on agent commits",
  "- ✅ Ready for `--no-ff` merge + `v1.2` tag",
  "**W1-S3 — Transaction Processing** (off `main` as `sprint/W1-S3`)",
  "Stories: **ENH-001** (categorization engine), **ENH-009** (split logic), **FRM-001** (Transaction List), **CNV-001** (historical backfill).",
  "Sync point #4 — categorization engine trained. ENH-001 consumes the Vendor entity and CSV/SimpleFIN ingestion delivered here; CNV-001 reuses the INT-002 parsing path for backfill.",
] as const;

/** The tie-out reconciliation must report, entity by entity. */
export const EXPECTED_COUNTS = [
  { entity: "Area", expected: 1 },
  { entity: "Engagement", expected: 1 },
  { entity: "Workspace", expected: 1 },
  { entity: "Initiative", expected: 3 },
  { entity: "Milestone", expected: 12 },
  { entity: "Defect", expected: 27 },
  { entity: "Decision", expected: 5 },
  { entity: "TestRun", expected: 1 },
  { entity: "Activity", expected: 2 },
] as const;

/**
 * The mismatches reconciliation must report after the hierarchy load alone:
 * no registers, and only the load's own Activity row.
 */
export const HIERARCHY_ONLY_MISMATCHES = [
  { entity: "Defect", expected: 27, actual: 0 },
  { entity: "Decision", expected: 5, actual: 0 },
  { entity: "TestRun", expected: 1, actual: 0 },
  { entity: "Activity", expected: 2, actual: 1 },
] as const;

/** The keys the migration refuses or fails under. */
export const MIGRATION_KEYS = {
  ALREADY_LOADED: "cnv.migration.alreadyLoaded",
  LIBRARY_MISSING: "cnv.migration.libraryMissing",
  HIERARCHY_MISSING: "cnv.migration.hierarchyMissing",
  VALUE_NOT_IN_CODE_LIST: "verb.value.notInCodeList",
  DEFECT_TARGET_MISSING: "cnv.defect.targetMissing",
  TEST_RUN_TARGET_MISSING: "cnv.testrun.targetMissing",
  DEFECT_RESOLUTION_ON_OPEN: "cnv.defect.resolutionOnOpen",
  DEFECT_RESOLUTION_MISSING: "cnv.defect.resolutionMissing",
  COUNT_MISMATCH: "cnv.reconcile.countMismatch",
  CHAIN_MISMATCH: "cnv.reconcile.chainMismatch",
  PROVENANCE_MISMATCH: "cnv.reconcile.provenanceMismatch",
} as const;

/** The status each refusal carries. */
export const MIGRATION_STATUS = {
  CONFLICT: 409,
  BAD_INPUT: 400,
} as const;
