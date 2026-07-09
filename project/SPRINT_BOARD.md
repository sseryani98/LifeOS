# Sprint Board

## Current Sprint: W1-S2 — Ingestion Pipeline

**Branch:** sprint/W1-S2
**Goal:** Transactions flow from SimpleFIN and CSV into the system. Connection health visible.

### Backlog

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| INT-002 | Integration | CSV parsing engine: per-issuer CSVFormatConfig (Scotia/TD/CIBC/Amex) | Backlog |
| FRM-003 | Form | CSV Import Wizard: 3-step freestyle wizard with review tabs | Backlog |

### In Progress

_None_

### Done

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| ENH-008 | Enhancement | Deduplication engine: evaluate() returns new/duplicate/potential_duplicate per SPEC-01 §4.3 | Done |
| INT-001 | Integration | SimpleFIN Bridge sync: 4-layer engine, ENH-008 dedup, node-cron scheduling, encrypted access URL, retry/backoff, connection_error/stale_data/unmapped_account alerts, null-card backfill | Done |
| FRM-010 | Form | Connection Manager: freestyle health page — status ObjectStatus colours, manual Sync Now, Add Connection (claim setup token), Re-authenticate, account→card mapping | Done |

---

## Previous Sprint: W1-S1 — Foundation & Seed Data (merged 0a9804f, tagged v1.1)

| Story | Type | Description | Status |
| --- | --- | --- | --- |
| CNV-002 | Conversion | Seed reference lookup tables from design specs | Done |
| CNV-003 | Conversion | Seed Sandro's card portfolio and historical data | Done |
| FRM-009 | Form | Master Data Maintenance: SM30-style CRUD for all config tables | Done |
