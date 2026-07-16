# SPEC-13: Market Intelligence

**Spec ID:** SPEC-13
**Name:** Market Intelligence
**FRICEW Objects:** INT-003, WFL-003, CNV-004
**Wave:** 4
**Sprint:** W4-S1
**CDS Services:** ChurningService (D-49)
**Status:** Approved

---

## 1. Change History

| Date       | Author          | Description                                                       |
| ---------- | --------------- | ----------------------------------------------------------------- |
| 2026-02-18 | Sandro & Claude | Initial creation — workshop complete. D-177 through D-187 logged. |
| 2026-02-18 | Sandro          | Approved.                                                         |

---

## 2. Overview

Market Intelligence keeps the broader Canadian credit card database current by scraping Prince of Travel for card data, offer changes, earning rates, and soft perks. INT-003 is the scraper that discovers and extracts data from PoT's paginated card index and individual card detail pages. WFL-003 is the human approval gate — all scraped data is staged in a queue for review before entering the production database. CNV-004 is the initial bulk population of the market card database, executed as INT-003's first run in bulk mode against the full PoT catalog.

Key decisions: D-14 (market card offer database), D-48 (cheerio + axios), D-49 (ChurningService), D-177 (CNV-004 = bulk INT-003), D-178 (PoT as sole source), D-179 (weekly + on-demand), D-180 (content hash detection), D-181 (staging entities), D-182 (single mapping table), D-183 (standalone approval view), D-184 (bulk approve + mandatory card_segment), D-185 (offer end-dating), D-186 (2023 historical cutoff), D-187 (approval alert type).

---

## 3. Data Model References

| Entity                | Role                                         | DM-001 Ref | Amendment?                                                             |
| --------------------- | -------------------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Market Card           | Target for scraped card data                 | §4.1       | Add `source_url` (text, optional), `last_scrape_hash` (text, optional) |
| Offer                 | Target for scraped/historical offers         | §4.2       | —                                                                      |
| Offer Tranche         | Target for offer tranche details             | §4.3       | —                                                                      |
| Earning Multiplier    | Target for scraped earning rates             | §4.5       | —                                                                      |
| Soft Perk Definition  | Target for scraped perks                     | §4.6       | —                                                                      |
| Issuer                | FK lookup for scraped issuer names           | §3.1       | —                                                                      |
| Rewards Program       | FK lookup for scraped program names          | §3.2       | —                                                                      |
| Earning Category      | FK lookup for scraped earning labels         | §3.4       | —                                                                      |
| Card Network          | FK lookup for scraped network                | §3.13      | —                                                                      |
| Perk Type             | FK lookup for scraped perk labels            | §3.9       | —                                                                      |
| Program Tier          | FK lookup for Aeroplan tier                  | §3.16      | —                                                                      |
| Alert                 | OFFERS_PENDING_APPROVAL alert                | §6.1       | —                                                                      |
| Alert Type            | New seed value                               | §3.11      | Add `offers_pending_approval` to seed                                  |
| System Config         | Scraper configuration parameters             | §3.17      | Add 4 new parameters                                                   |
| **Scrape Run**        | **NEW** — One row per scraper execution      | —          | New entity (D-181)                                                     |
| **Scrape Queue Item** | **NEW** — Staged change pending approval     | —          | New entity (D-181)                                                     |
| **Scrape Mapping**    | **NEW** — PoT label → internal FK resolution | —          | New entity (D-182)                                                     |

### Scrape Run (NEW — D-181)

| Attribute        | Type      | Required | Notes                                         |
| ---------------- | --------- | -------- | --------------------------------------------- |
| id               | PK        | yes      |                                               |
| started_at       | timestamp | yes      |                                               |
| completed_at     | timestamp | no       | Null while running                            |
| mode             | enum      | yes      | `scheduled` · `manual` · `bulk`               |
| status           | enum      | yes      | `running` · `completed` · `failed`            |
| cards_discovered | integer   | no       | Total cards found on PoT index                |
| cards_scraped    | integer   | no       | Cards where detail page was fetched           |
| cards_changed    | integer   | no       | Cards with detected changes                   |
| cards_skipped    | integer   | no       | Cards skipped (unchanged hash or fetch error) |

### Scrape Queue Item (NEW — D-181)

| Attribute               | Type             | Required | Notes                                                             |
| ----------------------- | ---------------- | -------- | ----------------------------------------------------------------- |
| id                      | PK               | yes      |                                                                   |
| scrape_run_id           | FK → Scrape Run  | yes      |                                                                   |
| source_url              | text             | yes      | PoT card detail page URL                                          |
| change_type             | enum             | yes      | `new_card` · `offer_change` · `multiplier_change` · `perk_change` |
| status                  | enum             | yes      | `queued` · `approved` · `rejected`                                |
| proposed_data           | text (JSON)      | yes      | Scraped values as structured JSON                                 |
| existing_data           | text (JSON)      | no       | Current DB values for diff (null for new cards)                   |
| market_card_id          | FK → Market Card | no       | Set for changes to existing cards; null for new cards             |
| card_segment            | enum             | no       | `personal` · `business` — user sets during approval               |
| rejection_reason        | text             | no       | User-provided on reject                                           |
| resolved_at             | timestamp        | no       | When approved or rejected                                         |
| has_unresolved_mappings | boolean          | yes      | True if any scraped labels couldn't be auto-mapped                |

### Scrape Mapping (NEW — D-182)

| Attribute   | Type | Required | Notes                                                                        |
| ----------- | ---- | -------- | ---------------------------------------------------------------------------- |
| id          | PK   | yes      |                                                                              |
| entity_type | enum | yes      | `EarningCategory` · `Issuer` · `RewardsProgram` · `PerkType` · `CardNetwork` |
| source_text | text | yes      | PoT label (e.g., "Hotels & Car Rentals")                                     |
| target_id   | UUID | yes      | FK to the corresponding reference data entity                                |

Unique constraint on (`entity_type`, `source_text`).

### Market Card Amendments

| New Attribute    | Type | Required | Notes                                                                                                                          |
| ---------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| source_url       | text | no       | PoT detail page URL (e.g., `https://princeoftravel.com/credit-cards/amex-cobalt/`). Used as matching key for change detection. |
| last_scrape_hash | text | no       | SHA-256 hash of last scraped page content. Null = never scraped.                                                               |

### System Config — New Parameters

| Key                    | Default | Description                                               |
| ---------------------- | ------- | --------------------------------------------------------- |
| SCRAPER_ENABLED        | true    | Enable/disable weekly scheduled scraping                  |
| SCRAPER_DAY_OF_WEEK    | 0       | Day of week for scheduled scrape (0=Sunday, 6=Saturday)   |
| SCRAPER_DELAY_MS       | 1500    | Milliseconds delay between page fetches (polite scraping) |
| SCRAPER_RETRY_ATTEMPTS | 3       | HTTP retry count per individual card page                 |

---

## 4. Functional Description

### 4.1 INT-003 — Offer Data Web Scraper [Interface]

**Data Source:**

| Element    | Detail                                                                             |
| ---------- | ---------------------------------------------------------------------------------- |
| Source     | Prince of Travel (princeoftravel.com) — sole V1 source (D-178)                     |
| Index URL  | `https://princeoftravel.com/credit-cards/` — paginated, ~98 cards across ~13 pages |
| Detail URL | `https://princeoftravel.com/credit-cards/{slug}/` — full card data                 |
| Libraries  | cheerio + axios (D-48). Puppeteer fallback if PoT adds JS-rendered content.        |
| Protocol   | HTTPS GET, no authentication                                                       |

**Discovery Process:**

1. Fetch paginated index pages (`/credit-cards/`, `/credit-cards/page/2/`, etc.)
2. Extract all card detail page URLs from listings
3. For each URL, check `Market Card.source_url` match in DB:
   - No match → new card, proceed to extraction
   - Match found → compare `last_scrape_hash` with current page hash
     - Hash unchanged → skip (no changes)
     - Hash changed → proceed to extraction and field comparison

**Extraction — Data Mapping (PoT → Data Model):**

| PoT Data             | Target Entity        | Target Field(s)                                                      | Transform                                    |
| -------------------- | -------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| Card name            | Market Card          | `name`                                                               | Direct                                       |
| Bank name            | Market Card          | `issuer_id`                                                          | ScrapeMapping lookup → Issuer FK             |
| Network              | Market Card          | `card_network_id`                                                    | ScrapeMapping lookup → Card Network FK       |
| Annual fee           | Market Card          | `fee_amount`                                                         | Parse number from "$599" format              |
| Fee period           | Market Card          | `fee_structure`                                                      | Default `annual`; detect "monthly" from text |
| Card name keywords   | Market Card          | `card_type`                                                          | "charge" if detected, else `credit`          |
| Rewards program name | Market Card          | `rewards_program_id`                                                 | ScrapeMapping lookup → Rewards Program FK    |
| PoT URL              | Market Card          | `source_url`                                                         | Full detail page URL                         |
| —                    | Market Card          | `card_segment`                                                       | Not scraped. Set by user during approval.    |
| Welcome bonus total  | Offer                | `name`                                                               | Descriptive label                            |
| FYF indicator        | Offer                | `fyf`                                                                | Boolean parse                                |
| Offer dates          | Offer                | `offer_start_date`, `offer_end_date`                                 | From historical section when available       |
| "Prince of Travel"   | Offer                | `source`                                                             | Constant                                     |
| Tranche spend/bonus  | Offer Tranche        | `msr_amount`, `bonus_amount`, `msr_window_months`, `msr_window_type` | Parse multi-tranche structure                |
| Tranche ordering     | Offer Tranche        | `tranche_number`                                                     | Sequential from top                          |
| Delayed start        | Offer Tranche        | `unlock_month`                                                       | Parse "month 13" style indicators            |
| Earning rate label   | Earning Multiplier   | `earning_category_id`                                                | ScrapeMapping lookup → Earning Category FK   |
| Multiplier value     | Earning Multiplier   | `multiplier`                                                         | Parse "3x" → 3.0                             |
| Perk name            | Soft Perk Definition | `perk_type_id`, `name`                                               | ScrapeMapping lookup → Perk Type FK          |
| Perk dollar value    | Soft Perk Definition | `dollar_value`                                                       | Parse when stated                            |
| Perk quantity        | Soft Perk Definition | `quantity`                                                           | Parse count (e.g., "4 lounge passes")        |
| Insurance items      | Soft Perk Definition | One row per type                                                     | Parse coverage name + dollar value           |

**Historical Offer Extraction:**

PoT card pages include a historical offers section with past bonus amounts, MSR, and date ranges. During extraction:

- Each historical offer becomes a separate Offer record with `offer_start_date` and `offer_end_date` set from PoT data
- Historical cutoff: 2023-01-01 (D-186). Offers dated before 2023 are ignored.
- Historical offers are only scraped during `bulk` mode (CNV-004). Subsequent scheduled/manual runs capture only the current offer.

**ScrapeMapping Resolution:**

For each scraped text label (issuer name, earning category, perk type, etc.):

1. Look up in ScrapeMapping by (`entity_type`, `source_text`)
2. Match found → use `target_id` as FK
3. No match → store raw text in `proposed_data` JSON, set `has_unresolved_mappings = true`
4. During approval, user maps unresolved labels; system auto-creates ScrapeMapping entry for future runs

**Change Detection:**

When a hash change is detected on an existing Market Card, the scraper compares scraped fields against current DB values:

- Offer terms differ (bonus, MSR, tranches) → `offer_change` queue item
- Earning multiplier values differ → `multiplier_change` queue item
- Soft perk details differ → `perk_change` queue item
- Card-level fields differ (fee, name) → included in the most relevant queue item
- Multiple change types on one card → one ScrapeQueueItem per change type

**Scheduling:**

- **Weekly:** `node-cron` + `cds.spawn()`. Fires on `SCRAPER_DAY_OF_WEEK` (default Sunday). Enabled/disabled via `SCRAPER_ENABLED`.
- **Manual:** "Run Scraper" action in the Scraper Approvals view. Same pipeline as scheduled.
- **Bulk (CNV-004):** "Run Bulk Import" action. Scrapes all cards + historical offers. First-time population only.

**Polite Scraping:**

- Minimum delay of `SCRAPER_DELAY_MS` (default 1500ms) between page fetches
- Respect `robots.txt`
- User-Agent header identifies the scraper

**Error Handling:**

- Individual page HTTP error/timeout: retry up to `SCRAPER_RETRY_ATTEMPTS` (default 3) with exponential backoff (1.5s, 3s, 6s). All retries exhausted → skip card, increment `cards_skipped`.
- Abort threshold: if `cards_skipped / cards_discovered > 50%`, abort run, set `ScrapeRun.status = failed`. Items already queued remain.
- HTML parse failure (null/incomplete fields): card queued with partial data, `has_unresolved_mappings = true`. User completes during approval.

### 4.2 WFL-003 — Offer Approval [Workflow]

**State Diagram:**

```
                       ┌─────────────────────────────────────────┐
                       │                                         │
  INT-003 detects  ──► │  queued                                 │
  change               │  (staged in ScrapeQueueItem)            │
                       │                                         │
                       └──────────┬──────────────┬───────────────┘
                                  │              │
                          Approve │              │ Reject
                     (+ optional  │              │ (+ optional
                        edits)    │              │   reason)
                                  ▼              ▼
                       ┌──────────────┐  ┌──────────────┐
                       │  approved    │  │  rejected    │
                       │              │  │              │
                       │  → DB write  │  │  → no change │
                       │  → end-date  │  │  → audit     │
                       │    old data  │  │    trail     │
                       └──────────────┘  └──────────────┘
```

**Transitions:**

| From     | To         | Trigger             | Guard                                                                                                               | Side Effect                                                                                       |
| -------- | ---------- | ------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `queued` | `approved` | User clicks Approve | `card_segment` must be set (BR-16). All mandatory fields populated. No unresolved mappings (or user resolved them). | Write to target entities (BR-17–BR-20). Set `resolved_at`. Update `Market Card.last_scrape_hash`. |
| `queued` | `rejected` | User clicks Reject  | None                                                                                                                | Set `resolved_at`. Store `rejection_reason`. No DB changes.                                       |

No other transitions. Items cannot move from `approved`/`rejected` back to `queued`.

**Approval Side Effects by Change Type:**

| Change Type         | On Approve                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `new_card`          | Create Market Card + Offer(s) + Offer Tranche(s) + Earning Multiplier(s) + Soft Perk Definition(s). Single transaction. (BR-17) |
| `offer_change`      | End-date current Offer (`offer_end_date = today`). Create new Offer + Tranches. (BR-18)                                         |
| `multiplier_change` | End-date current Earning Multiplier rows (`effective_to = today`). Create new rows (`effective_from = today`). (BR-19)          |
| `perk_change`       | End-date current Soft Perk Definition rows (`effective_to = today`). Create new rows (`effective_from = today`). (BR-20)        |

**UI Surface — Scraper Approvals (Standalone View):**

**Location:** Standalone nav entry under "Churning—Analytics" group (D-183).

**List View:**

| Column      | Source                                                             |
| ----------- | ------------------------------------------------------------------ |
| Card Name   | `proposed_data.name`                                               |
| Change Type | `change_type` (badge: New / Offer / Multiplier / Perk)             |
| Scrape Date | `ScrapeRun.started_at`                                             |
| Status      | `status` (color-coded: blue=queued, green=approved, grey=rejected) |
| Warnings    | Unresolved mappings indicator                                      |

Default filter: `status = queued`. Toggle to show approved/rejected history.

**Actions:**

- **Approve** — single item. Opens detail panel. User reviews proposed vs existing values, sets `card_segment` (if new card), resolves any unresolved mappings, then confirms.
- **Edit + Approve** — user modifies any proposed field before confirming.
- **Reject** — single item. Optional rejection reason.
- **Approve Selected** — multi-select. All selected items must pass validation (BR-16). If any fail, entire batch blocked with error listing which items are incomplete (BR-07 in FUTs).
- **Reject Selected** — multi-select. No guards.
- **Run Scraper** — triggers manual scrape run.
- **Run Bulk Import** — triggers CNV-004 bulk mode. Visible only when no previous bulk run has completed.

**Detail Panel (per item):**

- **Proposed Values** — editable fields showing what the scraper extracted
- **Current Values** — read-only, showing what's in the DB (hidden for new cards)
- **Diff** — changed fields highlighted
- **Unresolved Mappings** — for each unresolved label, a dropdown to select the correct FK target. Selection auto-creates a ScrapeMapping entry.
- **Card Segment** — mandatory dropdown (personal / business), required before approve

### 4.3 CNV-004 — Market Card Database Build [Conversion]

**Execution:** CNV-004 is INT-003 executed in `bulk` mode (D-177). No separate code path.

**Source:** Prince of Travel full card catalog (~98 cards as of 2026).

**Process:**

1. User clicks "Run Bulk Import" in Scraper Approvals view
2. INT-003 runs in `bulk` mode:
   - Scrapes all paginated index pages
   - Fetches every card detail page
   - Extracts current offer + historical offers back to 2023-01-01 (D-186)
   - Creates ScrapeQueueItem per card (change_type = `new_card`)
3. User reviews and approves cards through WFL-003 (individually or bulk approve)

**Prerequisites:** CNV-002 reference data deployed (issuers, rewards programs, earning categories, perk types, card networks). ScrapeMapping entries seeded for known PoT labels (D-182).

**Re-run Safety:** If a bulk run fails (>50% parse failures), partial results remain queued. Re-triggering bulk mode skips cards already approved (matched by `source_url` on existing Market Cards) and cards already queued with `status = queued`. No duplicates (BR-26).

**Reconciliation:** After approval, verify:

- Market Card count matches expected (~98)
- Each Market Card has ≥1 Offer with ≥1 Tranche
- Earning Multipliers populated for cards with earning rate data
- No orphaned ScrapeQueueItems in `queued` status

---

## 5. Business Rules

### INT-003 — Offer Data Web Scraper

| Rule  | Description                                                                                                                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 | INT-003 SHALL scrape Prince of Travel as the sole data source. Discovery via paginated index (`/credit-cards/`), extraction via individual card detail pages (`/credit-cards/{slug}/`).                          |
| BR-02 | INT-003 SHALL run on a configurable weekly schedule (default: Sunday) AND support on-demand manual trigger via UI action.                                                                                        |
| BR-03 | INT-003 SHALL store a content hash per Market Card `source_url`. If the page hash is unchanged since the last scrape, the card is skipped without deep field comparison.                                         |
| BR-04 | When a hash change is detected, INT-003 SHALL compare scraped fields against existing DB records and create a ScrapeQueueItem for each detected change (new card, offer change, multiplier change, perk change). |
| BR-05 | INT-003 SHALL resolve scraped text labels to internal FK IDs using the ScrapeMapping table. Unresolved labels SHALL be stored as raw text and flagged on the ScrapeQueueItem for manual mapping during approval. |
| BR-06 | INT-003 SHALL insert a polite delay (minimum `SCRAPER_DELAY_MS`, default 1500ms) between page fetches and respect `robots.txt`.                                                                                  |
| BR-07 | On HTTP error or timeout for an individual card page, INT-003 SHALL retry up to `SCRAPER_RETRY_ATTEMPTS` (default 3) with exponential backoff, then skip and log. Other cards continue processing.               |
| BR-08 | If >50% of card pages fail during a single run, INT-003 SHALL abort the run and set ScrapeRun status to `failed`.                                                                                                |
| BR-09 | Each scraper execution SHALL create a ScrapeRun record with: timestamp, mode, status, cards_discovered, cards_scraped, cards_changed, cards_skipped.                                                             |
| BR-10 | During CNV-004 bulk mode, INT-003 SHALL import historical offers from PoT with a cutoff of 2023-01-01. Offers dated before 2023 are ignored.                                                                     |

### WFL-003 — Offer Approval

| Rule  | Description                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-11 | WFL-003 SHALL present a standalone "Scraper Approvals" view in the main navigation.                                                                                                   |
| BR-12 | ScrapeQueueItem status transitions: `queued` → `approved` or `queued` → `rejected`. No other transitions allowed.                                                                     |
| BR-13 | The approval view SHALL display for each queued item: proposed values (scraped), current DB values (if existing card), and a diff highlighting changes.                               |
| BR-14 | User actions per item: Approve (write to DB as-is), Edit + Approve (modify proposed values then write), Reject (no DB change, item retained for audit).                               |
| BR-15 | The approval view SHALL support multi-select with bulk Approve and bulk Reject actions.                                                                                               |
| BR-16 | `card_segment` is mandatory on approval. The Approve action SHALL be blocked if `card_segment` is null. User must set it before approving.                                            |
| BR-17 | On Approve of a new card: create Market Card, Offer(s), Offer Tranche(s), Earning Multiplier(s), and Soft Perk Definition(s) in a single transaction.                                 |
| BR-18 | On Approve of an offer change: end-date the current Offer (`offer_end_date = today`), create a new Offer record with the scraped values. Tranches are created fresh on the new Offer. |
| BR-19 | On Approve of a multiplier change: end-date current Earning Multiplier row (`effective_to = today`), create new row with updated values (`effective_from = today`).                   |
| BR-20 | On Approve of a perk change: same end-date + create pattern as BR-19, applied to Soft Perk Definition.                                                                                |
| BR-21 | When a ScrapeRun produces ≥1 queued item, the system SHALL create an `OFFERS_PENDING_APPROVAL` alert.                                                                                 |
| BR-22 | Rejected items SHALL remain in the queue with status `rejected` and a user-provided rejection reason (optional). They are excluded from future duplicate detection.                   |

### CNV-004 — Market Card Database Build

| Rule  | Description                                                                                                                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-23 | CNV-004 SHALL be executed as INT-003 in `bulk` mode — same scraper, same approval workflow. No separate code path.                                                                                                         |
| BR-24 | CNV-004 bulk mode SHALL scrape all cards from the PoT index and all historical offers per card back to 2023-01-01.                                                                                                         |
| BR-25 | CNV-004 requires CNV-002 reference data (issuers, rewards programs, earning categories, perk types) to be deployed first.                                                                                                  |
| BR-26 | If bulk mode fails (>50% parse failures per BR-08), the partial results already queued SHALL remain in the approval queue. The user can re-run bulk mode; previously approved cards are skipped via `source_url` matching. |

---

## 6. Error Handling

| Condition                                       | Response                                                            | i18n Key Pattern                |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------------------------------- |
| PoT index unreachable (after retries)           | ScrapeRun status = `failed`. No queue items created.                | `scraper.pot.unreachable`       |
| Individual card page HTTP error (after retries) | Card skipped, `cards_skipped` incremented. Other cards continue.    | `scraper.pot.pageError`         |
| >50% card pages failed                          | ScrapeRun aborted, status = `failed`. Partial queue items retained. | `scraper.pot.abortThreshold`    |
| HTML structure changed (parser returns null)    | Card queued with partial data, `has_unresolved_mappings = true`.    | `scraper.pot.parseWarning`      |
| Unresolved ScrapeMapping label                  | Item flagged, user resolves during approval.                        | `scraper.mapping.unresolved`    |
| Approve without `card_segment`                  | Validation error, approve blocked.                                  | `approval.cardSegment.required` |
| Bulk approve with incomplete items              | Batch blocked, error lists which items need attention.              | `approval.bulk.incompleteItems` |
| Approval DB write failure                       | Transaction rolled back, item remains `queued`, error displayed.    | `approval.write.failed`         |

---

## 7. Open Items

| OI    | Resolution                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| OI-06 | One alert type defined: `offers_pending_approval`. Added to Alert Type seed (total now 11 across all specs). |

---

## 8. Functional Unit Tests

### FUT-1301: Manual scrape trigger — new card discovered

**Covers:** INT-003, WFL-003
**Preconditions:** CNV-002 deployed. ScrapeMapping seeded. No Market Cards in DB.

**Steps:**

1. Click "Run Scraper" in Scraper Approvals view.
2. Scraper fetches PoT index, discovers cards, fetches detail pages.

**Expected Result:** ScrapeRun created (mode = `manual`, status = `completed`). ScrapeQueueItems created for each discovered card with status `queued`. `OFFERS_PENDING_APPROVAL` alert raised.

---

### FUT-1302: Approve new card — all fields populated

**Covers:** WFL-003
**Preconditions:** FUT-1301 complete. One queued item for "Amex Aeroplan Reserve".

**Steps:**

1. Open Scraper Approvals. Select item. Set `card_segment` = "business". Click Approve.

**Expected Result:** Market Card created. Offer + Tranches created. Earning Multipliers created. Soft Perk Definitions created. ScrapeQueueItem status = `approved`.

---

### FUT-1303: Approve blocked — card_segment missing

**Covers:** WFL-003 (BR-16)
**Preconditions:** Queued item exists. `card_segment` is null.

**Steps:**

1. Select item. Click Approve without setting `card_segment`.

**Expected Result:** Validation error: "Card segment is required." Approve action blocked.

---

### FUT-1304: Edit + Approve — fix parsed field

**Covers:** WFL-003 (BR-14)
**Preconditions:** Queued item with `fee_amount = 0` (parser couldn't extract).

**Steps:**

1. Edit `fee_amount` to 599. Set `card_segment`. Click Approve.

**Expected Result:** Market Card created with `fee_amount = 599`. Item status = `approved`.

---

### FUT-1305: Reject item

**Covers:** WFL-003 (BR-14, BR-22)
**Preconditions:** Queued item exists.

**Steps:**

1. Select item. Click Reject. Enter reason: "Duplicate card listing."

**Expected Result:** Item status = `rejected`. Reason stored. No DB changes to Market Card/Offer.

---

### FUT-1306: Bulk approve

**Covers:** WFL-003 (BR-15)
**Preconditions:** 5 queued items, all with `card_segment` set.

**Steps:**

1. Select all 5. Click "Approve Selected".

**Expected Result:** All 5 items approved. 5 Market Cards + associated child records created.

---

### FUT-1307: Bulk approve blocked — one item missing card_segment

**Covers:** WFL-003 (BR-15, BR-16)
**Preconditions:** 5 queued items, 1 has null `card_segment`.

**Steps:**

1. Select all 5. Click "Approve Selected".

**Expected Result:** Error: "1 item missing required fields." Bulk approve blocked. No items approved.

---

### FUT-1308: Offer change detected and approved

**Covers:** INT-003, WFL-003 (BR-04, BR-18)
**Preconditions:** Market Card "Amex Aeroplan Reserve" exists with current offer (95k bonus). PoT page now shows 110k bonus.

**Steps:**

1. Trigger manual scrape. Scraper detects offer change.
2. Open Scraper Approvals. Approve the offer change item.

**Expected Result:** Old offer end-dated (`offer_end_date = today`). New offer created with 110k bonus and new tranches. Market Card unchanged.

---

### FUT-1309: No changes detected — skip

**Covers:** INT-003 (BR-03)
**Preconditions:** Market Card exists. PoT page content hash unchanged.

**Steps:**

1. Trigger manual scrape.

**Expected Result:** ScrapeRun created (status = `completed`, cards_changed = 0). No ScrapeQueueItems created. No alert.

---

### FUT-1310: Scrape failure — individual card

**Covers:** INT-003 (BR-07)
**Preconditions:** One card page returns HTTP 500.

**Steps:**

1. Trigger scrape.

**Expected Result:** Card retried 3 times, then skipped. Other cards processed normally. ScrapeRun status = `completed`, cards_skipped = 1.

---

### FUT-1311: Scrape abort — majority failure

**Covers:** INT-003 (BR-08)
**Preconditions:** >50% of card pages return errors.

**Steps:**

1. Trigger scrape.

**Expected Result:** ScrapeRun status = `failed`. Partial results (already-queued items before abort) remain in queue.

---

### FUT-1312: Unresolved mapping — flagged for manual resolution

**Covers:** INT-003 (BR-05)
**Preconditions:** PoT card has earning category "Streaming Services" with no ScrapeMapping entry.

**Steps:**

1. Trigger scrape.

**Expected Result:** ScrapeQueueItem created. Earning category stored as raw text "Streaming Services". Item flagged with unresolved mapping warning. User can map during approval.

---

### FUT-1313: CNV-004 bulk load

**Covers:** CNV-004 (BR-23, BR-24, BR-25)
**Preconditions:** CNV-002 deployed. Empty market card database. ScrapeMapping seeded.

**Steps:**

1. Trigger scrape in bulk mode.

**Expected Result:** All PoT cards scraped. Historical offers back to 2023 included. ScrapeQueueItems created for each card. ScrapeRun mode = `bulk`.

---

### FUT-1314: CNV-004 re-run after partial failure

**Covers:** CNV-004 (BR-26)
**Preconditions:** Previous bulk run failed. 30 cards already approved.

**Steps:**

1. Re-trigger bulk mode.

**Expected Result:** 30 approved cards skipped (matched by `source_url`). Remaining cards scraped and queued. No duplicates.

---

## 9. Cross-Spec Notes

| Target Spec                     | Note                                                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SPEC-06 (Reference Data & Seed) | ScrapeMapping entries seeded via CNV-002 for known PoT labels. Alert Type seed value added: `offers_pending_approval` (total now 11). System Config parameters added: `SCRAPER_ENABLED`, `SCRAPER_DAY_OF_WEEK`, `SCRAPER_DELAY_MS`, `SCRAPER_RETRY_ATTEMPTS`. |
| SPEC-07 (Card Recommendation)   | ENH-002 card recommendations now have access to broader market card data via CNV-004. Recommendations based on cards Sandro holds (per SPEC-07 scope), not market cards.                                                                                      |
| SPEC-08 (Card Profitability)    | ENH-004/ENH-005 profitability and eligibility calculations reference Market Card data that may be scraper-populated. No functional change — same entity, same fields.                                                                                         |
| FRM-005 (Market Cards)          | Market Cards app displays all cards including scraper-populated ones. No change needed — FRM-005 reads from Market Card entity regardless of data source.                                                                                                     |

---

_This spec is the single source of truth for INT-003, WFL-003, and CNV-004. Market card entity definitions are in [DATA_MODEL.md](../DATA_MODEL.md). Design decisions are in [DECISIONS_LOG.md](../user-profile/DECISIONS_LOG.md)._
