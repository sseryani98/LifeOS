# Sprint Checkpoint — W1-S2 Ingestion Pipeline

**Wave / Sprint:** W1-S2
**Branch:** `sprint/W1-S2`
**Goal:** Transactions flow from SimpleFIN and CSV into the system. Connection health visible.
**Date:** 2026-07-10
**Sync point validated:** #3 — Transaction ingestion operational
**Tag:** v1.2

---

## 1. Stories Delivered

| Story | Type | Summary | Status |
| --- | --- | --- | --- |
| INT-001 | Integration | SimpleFIN Bridge sync — 4-layer engine, encrypted access URL, node-cron scheduling, retry/backoff, ENH-008 dedup, null-card backfill, and `connection_error` / `stale_data` / `unmapped_account` alerts. Creates Transaction records with `source = 'simplefin'`, `externalId` populated. | Done |
| INT-002 | Integration | CSV parsing engine — 4-layer engine + field parser + mapper, per-issuer format-config resolution (Scotia / TD / CIBC / Amex), single & split debit/credit amounts, header-name & index columns, status filter, supplementary-card attribution, ENH-008 dedup classification, `parseCsvImport` action. | Done |
| ENH-008 | Enhancement | Deduplication engine — `evaluate()` returns `new` / `duplicate` / `potential_duplicate` per SPEC-01 §4.3. Shared by INT-001 and INT-002. | Done |
| FRM-010 | Form | Connection Manager — freestyle health page with status ObjectStatus colours, manual Sync Now, Add Connection (claim setup token), Re-authenticate, and account→card mapping. | Done |
| FRM-003 | Form | CSV Import Wizard — 3-step freestyle `sap.m.Wizard` (TypeScript) on TransactionService: drag-drop/picker multi-file upload with non-closed card selector, tabbed review (New / Potential Duplicates / Excluded) with per-row edit + categorization value helps and running totals, confirm + save with post-import summary. Backend: `saveCsvImport` action (4-file handler + mapper, TDD), Import Log entity, Vendor entity + Transaction categorization FKs. Playwright-verified end-to-end. | Done |

**Sprint scope note:** INT-001 and INT-002 arrived in the earlier integration commits; FRM-003 landed last (`b8e6ead`) and folded in pre-existing branch work — the `db/integration` → `db/ingestion` folder rename, a shared `formatAmount` extraction, and companion edits to CLAUDE.md / TECHNICAL_STANDARDS.md / TECH_STACK.md / `package.json` / `admin-service.cds` / `db/alerts/schema.cds` / lint scripts. Everything is green as a whole; the entanglement was left as-is by design.

### FRM-003 scope decisions (Sandro)

1. Added the **Vendor** entity + Transaction categorization FKs now (aligning the CDS with the documented data model) so categorization persists — rather than deferring the New-tab category columns.
2. Included **multi-file same-card** upload.
3. **Deferred to a later story:** ENH-001 fuzzy auto-suggestion pre-fill and the earning-yield computation. Category columns are manual value helps (with on-the-fly Vendor / Earning-Category creation); the Earning Yield column shows a placeholder until ENH-001 lands.

---

## 2. Test & Coverage Status

**Command:** `npm test` (Jest + ts-jest, coverage enabled) — **green**

| Metric | Result | Gate | Pass |
| --- | --- | --- | --- |
| Test suites | 20 passed / 20 | — | ✅ |
| Tests | 174 passed / 174 | — | ✅ |
| Statements | 98.73% (1016/1029) | — | ✅ |
| Lines | 98.71% (1001/1014) | ≥ 85% | ✅ |
| Branches | 89.37% (244/273) | ≥ 80% | ✅ |
| Functions | 94.17% (178/189) | — | ✅ |

Validators and utilities meet their 100% line / 100% branch gates; services clear the 90% / 85% gates via the Jest per-path thresholds (repaired in D-001).

**Command:** `npm run lint` — **green** (exit 0). All 19 checks pass, including the architectural linters (`lint:messaging`, `lint:frontend-data-access`, `lint:control-ids`, `lint:event-handlers`, `lint:mapper-methods`, `lint:test-structure`, `lint:tracking-ids`, …). The pre-commit hook runs the full suite.

---

## 3. Sprint-Specific Checks (BUILD_PLAN §5.2 — W1-S2)

- ✅ INT-001: SimpleFIN sync creates Transaction records with `source = 'simplefin'`.
- ✅ INT-002: CSV parsing works for all 4 issuer formats (Scotia, TD, CIBC, Amex).
- ✅ ENH-008: Dedup correctly categorizes new / duplicate / potential-duplicate.
- ✅ FRM-003: CSV wizard end-to-end — upload → review tabs → save (Playwright-verified).
- ✅ FRM-010: Connection list shows health status; manual sync trigger works.
- ✅ Provider Connection access URL stored encrypted (AES-256-GCM via EncryptionUtility).
- ✅ Alert generation works for `connection_error`, `stale_data`, `unmapped_account`.
- ✅ TransactionService integration tests pass.

---

## 4. Notable Decisions & Defects

### Decisions

- **`db/integration` → `db/ingestion` rename.** The ingestion domain is named `ingestion` (not `integration`) to avoid colliding with the `integration` test-type folder. Test tree, module folders, and docs updated to match.
- **`formatAmount` extracted to a shared helper** to remove duplication across the CSV and SimpleFIN paths.
- **Vendor entity brought forward** (see FRM-003 decision 1) so categorization can persist during import ahead of the ENH-001 categorization engine in W1-S3.

### Defects (see DEFECT_LOG.md)

| ID | Severity | Summary | Status |
| --- | --- | --- | --- |
| D-001 | High | Coverage harness never ran — glob-vs-regex `coveragePathIgnorePatterns`, mispointed `coverageThreshold` globs, and wrong Jest JSON shape in the report script crashed `npm test`. Root cause: W1-S1 config authored but never exercised with coverage. | Closed (`e691978`) |
| D-002 | Medium | `tsc` / `cds build` failed with `TS2688: Cannot find type definition file for 'sap__cds'` — the `@cap-js/cds-types` postinstall junction had not run in the resumed session. | Closed |
| D-003 | High | Seed `CsvFormatConfig` for TD and CIBC had off-by-one column indices vs the actual headerless bank exports — every TD/CIBC import would have parsed the wrong columns. | Closed |

No Critical or High severity defects remain open against delivered stories.

---

## 5. Definition of Done — Baseline Checklist (BUILD_PLAN §5.1)

- ✅ `npm test` — all tests pass
- ✅ `npm run lint` — zero errors (full 19-check suite, exit 0)
- ✅ Coverage gates met (overall ≥ 85% line / ≥ 80% branch; validators & utilities 100%)
- ✅ No Critical / High defects open against delivered stories
- ✅ TDD followed — Validators, Services, engines, and the `saveCsvImport` handler written test-first
- ✅ `_enc` fields only via EncryptionUtility; no decrypted sensitive data in logs or responses; `.env` gitignored
- ✅ i18n keys for all user-visible strings (three-tier)
- ✅ Sprint board updated — all five stories in Done
- ✅ Defect log updated — D-001/D-002/D-003 logged and closed
- ✅ Commits on `sprint/W1-S2`, Conventional Commit format, FRICEW IDs in bodies, Co-Authored-By on agent commits
- ✅ Ready for `--no-ff` merge + `v1.2` tag

---

## 6. Next Sprint

**W1-S3 — Transaction Processing** (off `main` as `sprint/W1-S3`)
Stories: **ENH-001** (categorization engine), **ENH-009** (split logic), **FRM-001** (Transaction List), **CNV-001** (historical backfill).
Sync point #4 — categorization engine trained. ENH-001 consumes the Vendor entity and CSV/SimpleFIN ingestion delivered here; CNV-001 reuses the INT-002 parsing path for backfill.
