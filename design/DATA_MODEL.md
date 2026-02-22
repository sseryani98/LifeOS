# Data Model

**Document ID:** DM-001
**Version:** 1.0
**Date:** 2026-02-13
**Status:** Approved

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-13 | Sandro & Claude | Initial creation — 39 entities across 4 classifications. D-36 through D-45 logged. OI-08 resolved. |
| 2026-02-16 | Sandro & Claude | SPEC-01 amendments: +System Config (§3.17), +Import Log (§5.7), CSV Format Config expansion (§3.6), Card Instance cardholder_name (§4.4). 39→41 entities. |
| 2026-02-17 | Sandro & Claude | SPEC-08 amendment: §8 Card Profitability formula updated (D-142) — remove Redemptions, add per-card-year scope, Annual Fee subtype only. |
| 2026-02-17 | Sandro & Claude | SPEC-11 amendment: +Points Transfer (§5.8) — atomic program-to-program transfer entity (D-168). 41→42 entities. |
| 2026-02-20 | Claude | SPEC-06 amendments: +Redemption Type (§3.18), +redemption_type_id FK on Redemption (§5.4), Purchase Type +excludes_from_budget (§3.3), Issuer Application Rule rule_type enum updated (§3.5). 42→43 entities. |
| 2026-02-20 | Claude | SPEC-09 amendments: Goal is_active→status enum (§4.11), +GoalForecastItem (§4.17) composition entity, System Config +2 keys, Alert Type +4 seeds. 43→44 entities. |
| 2026-02-20 | Claude | SPEC-10 amendments: Financial Account +5 fields (§4.16), +Financial Contribution (§5.9) composition entity, Financial Account Type seeds 6→12. 44→45 entities. |
| 2026-02-20 | Claude | SPEC-13 amendments: +ScrapeRun (§5.10), +ScrapeQueueItem (§5.11), +ScrapeMapping (§3.19), Market Card +source_url +last_scrape_hash (§4.1), System Config +4 keys, Alert Type +offers_pending_approval. 45→48 entities. |
| 2026-02-20 | Claude | SPEC-03 amendments: Card Instance cvv_enc→cvv_front_enc+cvv_back_enc (§4.4), Offer +fee_amount (§4.2), Earning Multiplier +card_instance_id (§4.5), Soft Perk Definition +card_instance_id (§4.6), System Config +2 keys, Alert Type +af_approaching +cancel_reminder. |
| 2026-02-20 | Claude | SPEC-16 amendments: Issuer Application Rule +reference_date +market_card_id (§3.5), Market Card +eligibility_group (§4.1), System Config +ELIGIBILITY_ALERT_DAYS. |
| 2026-02-20 | Claude | SPEC-17 amendment: Transaction.source enum +manual (§5.1). |
| 2026-02-20 | Claude | SPEC-18 amendments: Market Card +status (§4.1), Offer +is_current +offer_url (§4.2). |
| 2026-02-20 | Claude | SPEC-02 amendments: Remove usage_count from Purchase Type (§3.3), Earning Category (§3.4), Vendor (§4.8). Vendor Category Stats (§4.15) converted from stored entity to CDS view. Merchant Pattern +amount (§4.9). 48→47 stored entities. |

---

## 2. Summary

| Classification | Count | Description |
|----------------|-------|-------------|
| **Reference Data** | 19 | SM30-style config tables. System-wide, rarely changed, seeded at conversion (CNV-002). |
| **Master Data** | 16 | Core business objects. User-maintained, changes occasionally. |
| **Transactional Data** | 11 | High volume, append-mostly, event-driven. |
| **Cross-cutting** | 1 | Spans multiple domains. |
| **Total** | **47** | |

### Entity Index

| # | Entity | Classification | Key Decisions |
|---|--------|----------------|---------------|
| 1 | Issuer | Reference | D-22 |
| 2 | Rewards Program | Reference | D-09 |
| 3 | Purchase Type | Reference | D-05, D-36 |
| 4 | Earning Category | Reference | D-05 |
| 5 | Issuer Application Rule | Reference | D-22 |
| 6 | CSV Format Config | Reference | D-31, INT-002 |
| 7 | Financial Account Type | Reference | D-45 |
| 8 | Income Source Type | Reference | D-45 |
| 9 | Perk Type | Reference | D-45 |
| 10 | Adjustment Type | Reference | D-45 |
| 11 | Alert Type | Reference | D-38, D-45 |
| 12 | Alert Severity | Reference | D-45 |
| 13 | Card Network | Reference | D-29, D-45 |
| 14 | Pattern Source | Reference | D-45 |
| 15 | Confidence Level | Reference | D-45 |
| 16 | Program Tier | Reference | D-29, D-45 |
| 17 | System Config | Reference | D-87, SPEC-01 |
| 18 | Market Card | Master | D-25, D-28, D-29 |
| 19 | Offer | Master | D-24, D-37, D-41 |
| 20 | Offer Tranche | Master | D-24 |
| 21 | Card Instance | Master | D-27, D-29, D-39, D-91, WFL-002 |
| 22 | Earning Multiplier | Master | D-40, ENH-006 |
| 23 | Soft Perk Definition | Master | D-21, D-23, D-40 |
| 24 | Card Perk | Master | D-23 |
| 25 | Vendor | Master | D-32, D-43, ENH-001 |
| 26 | Merchant Pattern | Master | D-32, ENH-001 |
| 27 | Recurrent Expense | Master | D-40, ENH-007 |
| 28 | Goal | Master | D-11 |
| 29 | Provider Connection | Master | D-30, D-34 |
| 30 | Provider Account | Master | D-30, D-33 |
| 31 | Budget Allocation | Master | D-40 |
| 32 | ~~Vendor Category Stats~~ | ~~Master~~ | D-43, D-117 — converted to CDS view (SPEC-02) |
| 33 | Financial Account | Master | PSV Problem 4 |
| 34 | Transaction | Transactional | D-42, INT-001, INT-002 |
| 35 | Transaction Split | Transactional | D-08, ENH-009 |
| 36 | Points Adjustment | Transactional | D-09, D-26 |
| 37 | Redemption | Transactional | D-10 |
| 38 | Income Entry | Transactional | D-15 |
| 39 | Financial Snapshot | Transactional | PSV Problem 4 |
| 40 | Import Log | Transactional | D-89, SPEC-01 |
| 41 | Points Transfer | Transactional | D-168, SPEC-11 |
| 42 | Alert | Cross-cutting | D-38, D-44 |
| 43 | Redemption Type | Reference | D-102, SPEC-06 |
| 44 | GoalForecastItem | Master | D-150, SPEC-09 |
| 45 | Financial Contribution | Transactional | D-162, SPEC-10 |
| 46 | Scrape Run | Transactional | D-181, SPEC-13 |
| 47 | Scrape Queue Item | Transactional | D-181, SPEC-13 |
| 48 | Scrape Mapping | Reference | D-182, SPEC-13 |

---

## 3. Reference Data Entities

Simple config/lookup tables maintained via FRM-009. Unless noted, all share the base pattern: `id` (PK), `name` (text, required), `sort_order` (integer, required).

### 3.1 Issuer

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "American Express Canada" |
| short_name | text | yes | "Amex" — display/filter label |

### 3.2 Rewards Program

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Aeroplan", "Membership Rewards", "Bonvoy" |
| currency_name | text | yes | "points", "miles", "MR" — display label |
| cpp_valuation | decimal | yes | User-adjustable cents-per-point (D-09). Updated in place (D-40). |

Not linked to Issuer — programs span issuers (Aeroplan: TD, CIBC, Amex).

### 3.3 Purchase Type

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Groceries", "Subscriptions" |
| parent_id | FK → Purchase Type | no | Null = top-level type. Set = subtype (D-36). One level only. |
| sort_order | integer | yes | |
| excludes_from_budget | boolean | yes | Default `false`. When `true`, transactions skip budget but still count for churning (D-97, SPEC-06). |

Budget ratios live in the separate Budget Allocation entity (D-40), not on this table.

### 3.4 Earning Category

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Groceries", "Dining", "Travel", "Streaming" |
| sort_order | integer | yes | |

Flat — no hierarchy. These are the multiplier buckets cards earn against.

### 3.5 Issuer Application Rule

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| issuer_id | FK → Issuer | no | Null for cross-issuer rules (Aeroplan 5-tier) |
| rewards_program_id | FK → Rewards Program | no | For cross-issuer rules |
| rule_type | enum | yes | `MAX_CONCURRENT` · `APPS_IN_WINDOW` · `PRODUCT_COOLDOWN` · `ISSUER_COOLDOWN` · `ONCE_PER_LIFETIME` · `TIER_LIFETIME_LIMIT` (SPEC-06: removed MIN_DAYS_BETWEEN, added ISSUER_COOLDOWN) |
| parameter_count | integer | no | "4" for Amex max, "2" for 2-in-90, "5" for tier limit |
| parameter_days | integer | no | "5" for 1-in-5, "90" for 2-in-90, "365" for TD cooldown |
| applies_to_card_type | enum | no | `credit` · `charge` · null=all (D-25) |
| applies_to_segment | enum | no | `personal` · `business` · null=all |
| reference_date | enum | no | `application` · `closure` · `latest_activity`. Determines which date to count from for cooldown rules (D-232, SPEC-16). |
| market_card_id | FK → Market Card | no | Product-specific rules. Scoping hierarchy: market_card > rewards_program > issuer (D-233, SPEC-16). |
| description | text | yes | Human-readable: "Max 4 Amex credit cards held at once" |

Updated in place (D-40). ENH-004 evaluates these rules against card history at runtime.

### 3.6 CSV Format Config

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| issuer_id | FK → Issuer | yes | |
| config_name | text | yes | "TD Visa CSV Export" |
| date_column | text | yes | Column name or index |
| date_format | text | yes | e.g., "YYYY-MM-DD", "MM/DD/YYYY", "DD MMM. YYYY" |
| amount_column | text | no | For single-column formats (Scotia). Null when debit/credit split. |
| amount_sign | enum | no | `NEGATIVE_IS_DEBIT` · `POSITIVE_IS_DEBIT`. Null when debit/credit split. |
| debit_column | text | no | For split debit/credit formats (TD, CIBC). Null when single amount column. |
| credit_column | text | no | For split debit/credit formats (TD, CIBC). Null when single amount column. |
| description_column | text | yes | |
| status_column | text | no | Column for posted/pending status (Scotia). Null if not available. |
| status_posted_value | text | no | Value meaning "posted" (e.g., "posted"). Required if status_column set. |
| cardmember_column | text | no | For supplementary card attribution (Amex). Null if not available. |
| header_rows_skip | integer | yes | Default 1 |
| delimiter | text | yes | Default "," |

Updated in place (D-40). Either `amount_column`/`amount_sign` OR `debit_column`/`credit_column` must be set — never both (D-90).

### 3.7–3.15 Simple Config Tables

These all follow the base pattern: `id`, `name`, `sort_order`.

| Entity | Seed Values | Extra Attributes |
|--------|-------------|------------------|
| **Financial Account Type** | RRSP, TFSA, FHSA, RIF, Crypto, Vehicle, Non-Registered, Savings Account (assets); Car Loan, Student Loan, Mortgage, Line of Credit (liabilities). 12 total (D-159, SPEC-10). | `is_asset` (boolean) — true = asset, false = liability |
| **Income Source Type** | Salary, Bonus, Churn Reward | — |
| **Perk Type** | lounge_pass, travel_credit, portal_rebate, insurance, status | — |
| **Adjustment Type** | signup_bonus, referral, transfer_in, transfer_out, correction | — |
| **Alert Type** | msr_deadline, bonus_met, bonus_missed, af_renewal, first_af, af_approaching, cancel_reminder, perk_expiration, connection_error, stale_data, unmapped_account, eligibility_window, budget_category_warning, budget_category_overspend, budget_overspend, budget_goals_exceed_income, goal_deadline_approaching, goal_completed, goal_spending_warning, goal_spending_overspend, financial_picture_stale, offers_pending_approval, review_overdue. 23 total — see specs for per-type details. | — |
| **Alert Severity** | info, warning, critical | — |
| **Card Network** | Visa, Mastercard, Amex | — |
| **Pattern Source** | seed, learned, manual | — |
| **Confidence Level** | high, medium, low | — |

### 3.16 Program Tier

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| rewards_program_id | FK → Rewards Program | yes | V1: all rows link to Aeroplan |
| name | text | yes | "Entry", "Core", "Premium", "Core Business", "Premium Business" |
| sort_order | integer | yes | |

### 3.17 System Config

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| key | text | yes | Unique parameter name (UPPER_SNAKE_CASE) |
| value | text | yes | Parsed at runtime by consuming code |
| description | text | yes | Human-readable explanation |

TVARVC-style runtime parameters (D-87). Maintained via FRM-009. Initial parameters:

| Key | Default | Description |
|-----|---------|-------------|
| SIMPLEFIN_SYNC_TIME | 20:00 | Daily sync time (HH:MM, 24h) |
| SIMPLEFIN_LOOKBACK_DAYS | 7 | Days to look back on each sync |
| SIMPLEFIN_RETRY_ATTEMPTS | 3 | HTTP retry count on failure |
| SIMPLEFIN_STALE_DAYS | 3 | Days without sync before stale alert |
| BUDGET_WARNING_THRESHOLD_PCT | 80 | % of budget at which category warning alert fires (D-134, SPEC-05) |
| GOAL_DEADLINE_ALERT_DAYS | 30 | Days before target_date to fire goal_deadline_approaching alert (D-155, SPEC-09) |
| GOAL_SPENDING_WARNING_PCT | 80 | % of target_amount at which goal_spending_warning fires (D-155, SPEC-09) |
| FINANCIAL_PICTURE_STALE_DAYS | 45 | Days after which account snapshot data is considered stale (D-164, SPEC-10) |
| SCRAPER_ENABLED | true | Enable/disable weekly scheduled scraping (D-181, SPEC-13) |
| SCRAPER_DAY_OF_WEEK | 0 | Day of week for scheduled scrape — 0=Sunday (D-181, SPEC-13) |
| SCRAPER_DELAY_MS | 1500 | Milliseconds delay between page fetches (D-181, SPEC-13) |
| SCRAPER_RETRY_ATTEMPTS | 3 | HTTP retry count per card page (D-181, SPEC-13) |
| AF_ALERT_DAYS | 30 | Days before AF date to create af_approaching alert (D-195, SPEC-03) |
| CANCEL_REMINDER_DAYS | 2 | Days before tentative cancel date to create cancel_reminder alert (D-196, SPEC-03) |
| ELIGIBILITY_ALERT_DAYS | 30 | Days before eligibility window opens to fire alert (D-239, SPEC-16) |
| LAST_REVIEW_DATE | null | Datetime of last completed weekly review session (D-247, SPEC-15) |
| REVIEW_REMINDER_DAYS | 7 | Days threshold for review_overdue alert (D-249, SPEC-15) |
| CSV_IMPORT_REMINDER_DAYS | 7 | Days threshold for Scotia CSV import overdue flag (D-245, SPEC-15) |

### 3.18 Redemption Type

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Flight", "Hotel", "Gift Card", "Statement Credit", "Merchandise", "Experience" |
| sort_order | integer | yes | |

Follows base pattern. Lookup for Redemption.redemption_type_id (D-102, SPEC-06).

### 3.19 Scrape Mapping

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| entity_type | enum | yes | `EarningCategory` · `Issuer` · `RewardsProgram` · `PerkType` · `CardNetwork` |
| source_text | text | yes | PoT label (e.g., "Hotels & Car Rentals") |
| target_id | UUID | yes | FK to corresponding reference data entity |

Unique constraint on (`entity_type`, `source_text`). Maps scraped labels to internal reference data (D-182, SPEC-13).

---

## 4. Master Data Entities

### 4.1 Market Card

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| issuer_id | FK → Issuer | yes | |
| rewards_program_id | FK → Rewards Program | no | Null for no-rewards cards |
| name | text | yes | "TD Aeroplan Visa Infinite", "Amex Cobalt" |
| card_network_id | FK → Card Network | yes | |
| card_type | enum | yes | `credit` · `charge` (D-25) |
| card_segment | enum | yes | `personal` · `business` (D-25) |
| fee_structure | enum | yes | `annual` · `monthly` (D-28) |
| fee_amount | decimal | yes | Standard fee per fee_structure. Updated in place. |
| program_tier_id | FK → Program Tier | no | Null for non-Aeroplan cards (D-29) |
| source_url | text | no | PoT detail page URL. Matching key for scraper change detection (D-183, SPEC-13). |
| last_scrape_hash | text | no | SHA-256 hash of last scraped page content. Null = never scraped (D-183, SPEC-13). |
| eligibility_group | text | no | Groups cards for shared eligibility rules, e.g., "Amex Cobalt/Gold" (D-234, SPEC-16). |
| status | enum | yes | `active` · `discontinued`. Default `active` (D-270, SPEC-18). |

### 4.2 Offer

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| market_card_id | FK → Market Card | yes | A market card has many offers (D-37) |
| name | text | yes | "Jan 2026: 2,500 MR/month × 12" |
| fyf | boolean | yes | First Year Free (D-41, amends D-27) |
| offer_start_date | date | no | Null if unknown for historical offers |
| offer_end_date | date | no | |
| fee_amount | decimal | no | Defaults from Market Card's fee_amount during onboarding. Overridable per offer (D-191, SPEC-03). |
| is_current | boolean | yes | True = currently available offer. Only one per Market Card should be current (D-271, SPEC-18). |
| offer_url | text | no | Link to offer details page (D-271, SPEC-18). |
| source | text | no | "Prince of Travel", "Amex.ca", "targeted email" |
| notes | text | no | |

### 4.3 Offer Tranche

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| offer_id | FK → Offer | yes | |
| tranche_number | integer | yes | Ordering: 1, 2, 3… |
| msr_amount | decimal | yes | Minimum spend requirement per window |
| msr_window_type | enum | yes | `one_time` · `monthly_recurring` (D-24) |
| msr_window_months | integer | yes | Window length in months |
| bonus_amount | decimal | yes | Points awarded. Per-month payout for monthly recurring. |
| unlock_month | integer | no | Delayed start (e.g., Amex Plat tranche 2 at month 15) |

Defines the **terms**. Tranche progress (status, met date) is computed at runtime by ENH-003 from transaction data. Bonus points inherit the program from the chain: Offer → Market Card → Rewards Program.

### 4.4 Card Instance

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| market_card_id | FK → Market Card | yes | |
| offer_id | FK → Offer | yes | Which offer the user signed up under (D-37) |
| parent_card_instance_id | FK → Card Instance | no | Null = main card. Set = supplementary (D-39). |
| lifecycle_state | enum | yes | `Focus` · `Active` · `To Cancel` · `Closed` (WFL-002) |
| application_date | date | no | For D-22 eligibility rules |
| activation_date | date | no | Drives AF anniversary computation |
| tentative_cancel_date | date | no | Set when entering "To Cancel" |
| closed_date | date | no | Actual close date |
| credit_limit | decimal | no | D-29 |
| card_number_enc | text | no | Encrypted (D-29, OI-07) |
| cvv_front_enc | text | no | Front CVV — Amex 4-digit CID. Encrypted (D-190, SPEC-03). |
| cvv_back_enc | text | no | Back CVV — 3-digit. Encrypted (D-190, SPEC-03). |
| expiry_date_enc | text | no | Encrypted |
| cardholder_name | text | no | For CSV supplementary card attribution (D-91). Matched against cardmember_column. |
| notes | text | no | |

AF renewal date is computed from `activation_date` + card's fee structure, not stored.

### 4.5 Earning Multiplier

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| market_card_id | FK → Market Card | yes | |
| earning_category_id | FK → Earning Category | yes | |
| card_instance_id | FK → Card Instance | no | Instance-level override. Takes precedence over market card defaults (D-192, SPEC-03). |
| multiplier | decimal | yes | e.g., 5.0 for 5× |
| effective_from | date | yes | Time-bound (D-40) |
| effective_to | date | no | Null = current |

Natural key: (market_card_id, earning_category_id, effective_from). When card_instance_id is set, this is a per-instance override.

### 4.6 Soft Perk Definition

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| market_card_id | FK → Market Card | yes | |
| card_instance_id | FK → Card Instance | no | Instance-level override. Same pattern as Earning Multiplier (D-192, SPEC-03). |
| perk_type_id | FK → Perk Type | yes | |
| name | text | yes | "Priority Pass (4 visits)", "GCR Cashback" |
| quantity | integer | no | Null for monetary perks. Set for count-based. |
| dollar_value | decimal | yes | Total annual value |
| annual_reset | boolean | yes | |
| effective_from | date | yes | Time-bound (D-40) |
| effective_to | date | no | Null = current |
| notes | text | no | |

### 4.7 Card Perk

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| card_instance_id | FK → Card Instance | yes | |
| soft_perk_definition_id | FK → Soft Perk Definition | yes | |
| period_start | date | yes | Perk period start (activation anniversary for annual reset) |
| period_end | date | yes | Perk period end |
| quantity_used | integer | no | For count-based perks |
| dollar_value_realized | decimal | yes | Actual value claimed. Default 0. Partial OK. (D-23) |
| notes | text | no | |

Unrealized value = `soft_perk_definition.dollar_value - dollar_value_realized`.

### 4.8 Vendor

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Amazon", "Uber", "Loblaws" |
| notes | text | no | |

Category suggestions driven by Vendor Category Stats CDS view (§4.15), not stored defaults.

### 4.9 Merchant Pattern

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| vendor_id | FK → Vendor | yes | |
| pattern | text | yes | Raw description substring: "AMZN MKTP", "NETFLIX.COM" |
| match_type | enum | yes | `exact` · `contains` · `starts_with` |
| pattern_source_id | FK → Pattern Source | yes | |
| confidence_level_id | FK → Confidence Level | yes | For tie-breaking |
| amount | decimal | no | When set, pattern only matches if description AND amount match. Null = amount ignored (D-118, SPEC-02). |
| is_active | boolean | yes | |

Amount discriminator enables same-description-different-vendor matching (e.g., APPLE.COM/BILL at $13.99 = YouTube Premium, at $3.99 = iCloud). Matching logic is ENH-001's concern.

### 4.10 Recurrent Expense

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Netflix", "Car Loan Payment" |
| amount | decimal | yes | Monthly amount |
| purchase_type_id | FK → Purchase Type | no | Null for non-categorized |
| card_instance_id | FK → Card Instance | no | Null for non-CC expenses |
| effective_from | date | yes | Time-bound (D-40) |
| effective_to | date | no | Null = ongoing |
| notes | text | no | |

### 4.11 Goal

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| name | text | yes | "Japan Vacation", "FHSA Contribution" |
| direction | enum | yes | `saving` · `spending` (D-11) |
| target_amount | decimal | yes | |
| start_date | date | yes | |
| target_date | date | no | Null for open-ended |
| monthly_allocation | decimal | yes | Deducted from discretionary in ENH-007 |
| status | enum | yes | `active` · `completed` · `cancelled`. Default `active`. User-initiated transitions only (D-150, SPEC-09). |
| notes | text | no | |

Spending goals can have linked transactions (via Transaction.goal_id).

### 4.12 Provider Connection

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| provider_type | enum | yes | `simplefin` · (future: `cdb`) |
| display_name | text | yes | "Main SimpleFIN", "Amex Supp SimpleFIN" |
| access_url_enc | text | yes | Encrypted SimpleFIN access URL |
| last_sync_at | timestamp | no | Last successful data pull |
| last_sync_status | enum | yes | `success` · `error` · `never_synced` |
| last_error_message | text | no | From SimpleFIN `errors` array (D-34) |
| is_active | boolean | yes | Whether to include in daily polling |

### 4.13 Provider Account

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| provider_connection_id | FK → Provider Connection | yes | |
| card_instance_id | FK → Card Instance | no | Null for unmapped accounts (SPEC-01). |
| external_account_id | text | yes | SimpleFIN account ID |
| account_name | text | no | Display name from provider |
| is_active | boolean | yes | |

One account per card in practice (app-enforced, not DB-enforced). Unmapped accounts (card_instance_id = null) hold transactions pending user mapping.

### 4.14 Budget Allocation

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| purchase_type_id | FK → Purchase Type | yes | Top-level types only |
| ratio | decimal | yes | % of discretionary budget |
| effective_from | date | yes | Time-bound (D-40) |
| effective_to | date | no | Null = current |

App enforces sum-to-100% for all active rows in a given period (OI-03).

### 4.15 Vendor Category Stats (CDS View)

**Not a stored entity.** Converted from stored table to CDS view (D-117, SPEC-02). Eliminates count drift risk — always accurate, zero maintenance.

```sql
SELECT vendor_id, purchase_type_id, earning_category_id, COUNT(*) as usage_count
FROM Transaction
WHERE vendor_id IS NOT NULL
GROUP BY vendor_id, purchase_type_id, earning_category_id
```

ENH-001 queries this view for category suggestions, ranking by count.

### 4.16 Financial Account

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| financial_account_type_id | FK → Financial Account Type | yes | |
| name | text | yes | "RRSP at Wealthsimple" |
| original_amount | decimal | no | Purchase price (assets) or loan principal (liabilities) (D-160, SPEC-10). |
| start_date | date | no | Acquisition date or loan origination (D-160, SPEC-10). |
| interest_rate | decimal | no | Annual rate — liabilities only (D-160, SPEC-10). |
| monthly_payment | decimal | no | Fixed payment — liabilities only (D-160, SPEC-10). |
| term_months | integer | no | Loan term in months — liabilities only (D-160, SPEC-10). |
| is_active | boolean | yes | |
| notes | text | no | |

### 4.17 GoalForecastItem

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| goal_id | FK → Goal | yes | Composition parent — cascade delete (D-150, SPEC-09) |
| description | text | yes | Line item name |
| estimated_amount | decimal | yes | Estimated cost |

When forecast items exist, Goal.target_amount = SUM(estimated_amount), computed and read-only on form. When no items exist, target_amount is directly editable.

---

## 5. Transactional Data Entities

### 5.1 Transaction

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | System-generated |
| card_instance_id | FK → Card Instance | no | Nullable for unmatched/queued transactions (D-03) |
| provider_account_id | FK → Provider Account | no | Null for CSV imports |
| external_id | text | no | SimpleFIN stable ID for dedup (ENH-008). Null for CSV. |
| amount | decimal | yes | Negative = charge, positive = credit/refund |
| posted_at | date | yes | Always set — system ignores pending transactions (D-42) |
| transacted_at | date | no | Actual transaction date if available |
| raw_description | text | yes | Original bank text, never modified |
| vendor_id | FK → Vendor | no | Assigned by ENH-001 or user |
| purchase_type_id | FK → Purchase Type | no | Budget category |
| earning_category_id | FK → Earning Category | no | Churning category |
| categorization_status | enum | yes | `auto` · `user_corrected` · `uncategorized` |
| source | enum | yes | `simplefin` · `csv` · `manual` (D-254, SPEC-17) |
| is_excluded | boolean | yes | Exclude from all computation |
| goal_id | FK → Goal | no | Links spending to a goal (D-11) |
| notes | text | no | |

Fee transactions identified by Purchase Type = "Subscriptions > Credit Card Fee" (D-04). Refunds are positive amounts (D-07).

### 5.2 Transaction Split

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| transaction_id | FK → Transaction | yes | 1:1 — at most one split per transaction |
| my_share_pct | decimal | no | e.g., 0.25 for 25%. Null if absolute amount entered. |
| my_share_amount | decimal | yes | The user's portion in dollars |
| split_description | text | no | "Padel with friends" |
| is_recurring | boolean | yes | ENH-009 suggests recurring splits for same vendor |
| notes | text | no | |

Reimbursed transactions: `my_share_pct` = 0, `my_share_amount` = 0. Full amount feeds churning; zero feeds budget (D-08).

### 5.3 Points Adjustment

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| rewards_program_id | FK → Rewards Program | yes | |
| card_instance_id | FK → Card Instance | no | Null for program-level adjustments |
| adjustment_type_id | FK → Adjustment Type | yes | |
| amount | integer | yes | Points. Positive = add, negative = subtract. |
| date | date | yes | |
| description | text | no | "Referred John to Amex Gold" |
| notes | text | no | |

Referral bonuses (D-26): adjustment_type = referral, card_instance = referring card.

### 5.4 Redemption

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| rewards_program_id | FK → Rewards Program | yes | |
| redemption_type_id | FK → Redemption Type | no | "Flight", "Hotel", etc. (D-102, SPEC-06) |
| card_instance_id | FK → Card Instance | no | Null for program-level redemptions |
| points_spent | integer | yes | |
| dollar_value | decimal | yes | Dollar value received |
| effective_cpp | decimal | yes | Stored per record (D-40). The "trophy case" value. |
| description | text | yes | "Business class YYZ→NRT" (D-10) |
| redemption_date | date | yes | |
| notes | text | no | |

### 5.5 Income Entry

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| month | date | yes | First of month (e.g., 2026-02-01) |
| income_source_type_id | FK → Income Source Type | yes | |
| amount | decimal | yes | |
| description | text | no | |
| notes | text | no | |

Multiple entries per month expected. ENH-007 sums them.

### 5.6 Financial Snapshot

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| financial_account_id | FK → Financial Account | yes | |
| balance | decimal | yes | Always positive. Sign from account type's `is_asset` flag. |
| snapshot_date | date | yes | Typically monthly |
| notes | text | no | |

Net worth = sum(asset snapshots) − sum(liability snapshots) for a given month.

### 5.7 Import Log

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| card_instance_id | FK → Card Instance | yes | Which card was imported to |
| file_name | text | yes | Original file name |
| import_date | timestamp | yes | When the import occurred |
| transaction_count | integer | yes | Number of transactions imported |
| total_amount | decimal | yes | Sum of imported amounts |

One row per CSV import. Enables duplicate detection and import history (D-89).

### 5.8 Points Transfer

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| from_program_id | FK → Rewards Program | yes | Source program |
| to_program_id | FK → Rewards Program | yes | Destination program |
| from_amount | integer | yes | Points debited from source |
| to_amount | integer | yes | Points credited to destination (supports non-1:1 ratios) |
| transfer_date | date | yes | When the transfer occurred |
| notes | text | no | Optional description |

Atomic: on save, creates two Points Adjustments — transfer_out on source (amount = −from_amount) and transfer_in on destination (amount = +to_amount). card_instance_id = null on both (program-level). Validation: from_program ≠ to_program, both amounts > 0 (D-168).

### 5.9 Financial Contribution

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| financial_account_id | FK → Financial Account | yes | Composition parent — cascade delete (D-162, SPEC-10) |
| amount | decimal | yes | Positive = deposit, negative = withdrawal |
| contribution_date | date | yes | When the contribution occurred |
| notes | text | no | |

### 5.10 Scrape Run

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| started_at | timestamp | yes | |
| completed_at | timestamp | no | Null while running |
| mode | enum | yes | `scheduled` · `manual` · `bulk` |
| status | enum | yes | `running` · `completed` · `failed` |
| cards_discovered | integer | no | Total cards found on PoT index |
| cards_scraped | integer | no | Cards where detail page was fetched |
| cards_changed | integer | no | Cards with detected changes |
| cards_skipped | integer | no | Cards skipped (unchanged hash or fetch error) |

### 5.11 Scrape Queue Item

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| scrape_run_id | FK → Scrape Run | yes | |
| source_url | text | yes | PoT card detail page URL |
| change_type | enum | yes | `new_card` · `offer_change` · `multiplier_change` · `perk_change` |
| status | enum | yes | `queued` · `approved` · `rejected` |
| proposed_data | text | yes | Scraped values as structured JSON |
| existing_data | text | no | Current DB values for diff. Null for new cards. |
| market_card_id | FK → Market Card | no | Set for changes to existing cards; null for new cards |
| card_segment | enum | no | `personal` · `business` — user sets during approval |
| rejection_reason | text | no | User-provided on reject |
| resolved_at | timestamp | no | When approved or rejected |
| has_unresolved_mappings | boolean | yes | True if any scraped labels couldn't be auto-mapped |

Approval queue for scraped changes. User reviews proposed vs existing data before applying (D-181, SPEC-13).

---

## 6. Cross-cutting Entities

### 6.1 Alert

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| id | PK | yes | |
| alert_type_id | FK → Alert Type | yes | |
| alert_severity_id | FK → Alert Severity | yes | |
| title | text | yes | Short display text |
| message | text | yes | Detail |
| card_instance_id | FK → Card Instance | no | For MSR, AF, bonus alerts (D-44) |
| provider_connection_id | FK → Provider Connection | no | For connection/stale data alerts |
| offer_tranche_id | FK → Offer Tranche | no | For MSR deadline alerts |
| card_perk_id | FK → Card Perk | no | For perk expiration alerts |
| due_date | date | no | When the alert is time-relevant |
| status | enum | yes | `active` · `dismissed` · `acknowledged` (D-38) |
| created_at | timestamp | yes | |
| dismissed_at | timestamp | no | |

Generated by periodic checks (daily sync or on-demand). Explicit nullable FKs for referential integrity (D-44).

---

## 7. Relationships

### 7.1 Self-References

| Entity | FK Column | Meaning | Cardinality |
|--------|-----------|---------|-------------|
| Purchase Type | parent_id | Subtype → top-level type | 1 parent : N subtypes (one level) |
| Card Instance | parent_card_instance_id | Supplementary → main card | 1 main : N supplementary |

### 7.2 Card Product Chain

```
Issuer ←(N:1)— Market Card —(N:1)→ Rewards Program
                    |                    |
                    ↓ (1:N)              ↓ (1:N)
                  Offer              Program Tier
                    |
                    ↓ (1:N)
              Offer Tranche
```

- Market Card → Issuer: N:1, required
- Market Card → Rewards Program: N:1, optional
- Market Card → Card Network: N:1, required
- Market Card → Program Tier: N:1, optional
- Offer → Market Card: N:1, required
- Offer Tranche → Offer: N:1, required
- Earning Multiplier → Market Card + Earning Category: N:1 each, required
- Earning Multiplier → Card Instance: N:1, optional (instance-level override, SPEC-03)
- Soft Perk Definition → Market Card: N:1, required
- Soft Perk Definition → Card Instance: N:1, optional (instance-level override, SPEC-03)
- Soft Perk Definition → Perk Type: N:1, required
- Issuer Application Rule → Market Card: N:1, optional (product-specific rules, SPEC-16)

### 7.3 User Portfolio

```
Market Card ←— Card Instance —→ Offer
                    |
        +-----------+-----------+
        |           |           |
   Card Perk  Provider Acct  Alert
                    |
              Provider Connection
```

- Card Instance → Market Card: N:1, required
- Card Instance → Offer: N:1, required
- Card Instance → Card Instance (parent): N:1, optional
- Card Perk → Card Instance: N:1, required
- Card Perk → Soft Perk Definition: N:1, required
- Provider Account → Provider Connection: N:1, required
- Provider Account → Card Instance: N:1, optional (1:1 in practice; null for unmapped accounts)
- Budget Allocation → Purchase Type: N:1, required

### 7.4 Transaction Pipeline

```
Merchant Pattern —→ Vendor ←— Vendor Category Stats
                      ↑
                  Transaction —→ Card Instance
                      |
                Transaction Split
```

- Merchant Pattern → Vendor: N:1, required
- Vendor Category Stats → Vendor + Purchase Type + Earning Category: N:1 each, required
- Transaction → Card Instance: N:1, optional
- Transaction → Provider Account: N:1, optional
- Transaction → Vendor: N:1, optional
- Transaction → Purchase Type: N:1, optional
- Transaction → Earning Category: N:1, optional
- Transaction → Goal: N:1, optional
- Transaction Split → Transaction: 1:1, required
- Import Log → Card Instance: N:1, required
- Points Adjustment → Rewards Program: N:1, required
- Points Adjustment → Card Instance: N:1, optional
- Points Adjustment → Adjustment Type: N:1, required

### 7.5 Budget, Goals & Financial

- Recurrent Expense → Purchase Type: N:1, optional
- Recurrent Expense → Card Instance: N:1, optional
- Income Entry → Income Source Type: N:1, required
- GoalForecastItem → Goal: N:1, required (composition, cascade delete, SPEC-09)
- Redemption → Rewards Program: N:1, required
- Redemption → Redemption Type: N:1, optional (SPEC-06)
- Redemption → Card Instance: N:1, optional
- Financial Account → Financial Account Type: N:1, required
- Financial Contribution → Financial Account: N:1, required (composition, cascade delete, SPEC-10)
- Financial Snapshot → Financial Account: N:1, required
- Points Transfer → Rewards Program (from): N:1, required (SPEC-11)
- Points Transfer → Rewards Program (to): N:1, required (SPEC-11)
- Scrape Queue Item → Scrape Run: N:1, required (SPEC-13)
- Scrape Queue Item → Market Card: N:1, optional (SPEC-13)

### 7.6 Alert References

- Alert → Alert Type: N:1, required
- Alert → Alert Severity: N:1, required
- Alert → Card Instance: N:1, optional
- Alert → Provider Connection: N:1, optional
- Alert → Offer Tranche: N:1, optional
- Alert → Card Perk: N:1, optional

### 7.7 Hub Entities

| Entity | Inbound FKs | Role |
|--------|------------|------|
| **Card Instance** | Transaction, Points Adjustment, Redemption, Recurrent Expense, Card Perk, Provider Account, Import Log, Alert, Card Instance (supp), Earning Multiplier (override), Soft Perk Definition (override) | Central hub — everything connects to "my card" |
| **Market Card** | Card Instance, Offer, Earning Multiplier, Soft Perk Definition, Scrape Queue Item, Issuer Application Rule | Product catalog hub |
| **Purchase Type** | Transaction, Vendor Category Stats, Budget Allocation, Recurrent Expense, Purchase Type (subtypes) | Budget taxonomy hub |
| **Rewards Program** | Market Card, Points Adjustment, Redemption, Program Tier, Issuer Application Rule, Points Transfer (from/to) | Points ecosystem hub |
| **Vendor** | Transaction, Merchant Pattern, Vendor Category Stats | Categorization hub |
| **Goal** | Transaction, GoalForecastItem | Goal tracking hub |
| **Financial Account** | Financial Snapshot, Financial Contribution | Financial tracking hub |

---

## 8. Computed at Runtime (Not Stored)

These values look like entities but are computed on demand by enhancement objects. No stored tables.

| Computed Value | Source Data | Computed By |
|----------------|------------|-------------|
| **Points Balance** | Transactions × Earning Multipliers + Points Adjustments | ENH-006 |
| **Budget Status** | Income − Goal Allocations = Total Budget; actual spend vs Budget Allocations | ENH-007 |
| **Issuer Eligibility** | Card Instance history + Issuer Application Rules | ENH-004 |
| **Card Profitability** | Points earned × CPP + realized Card Perks − Annual Fee Transactions. Computed per card, per card year (anniversary-based), and all-time. Redemptions excluded from card-level profitability — they are per-program. | ENH-005 |
| **Tranche Progress** | Sum Transactions for card within tranche window vs MSR. Status: pending/in-progress/met/missed. | ENH-003 |
| **AF Renewal Date** | Card Instance activation_date + Market Card fee_structure | Derived |

---

## 9. Enum Values

Enums are used where application logic branches on specific values (D-45). Adding a new enum value requires code changes.

| Entity | Field | Values |
|--------|-------|--------|
| Market Card | card_type | `credit` · `charge` |
| Market Card | card_segment | `personal` · `business` |
| Market Card | fee_structure | `annual` · `monthly` |
| Offer Tranche | msr_window_type | `one_time` · `monthly_recurring` |
| Card Instance | lifecycle_state | `Focus` · `Active` · `To Cancel` · `Closed` |
| Merchant Pattern | match_type | `exact` · `contains` · `starts_with` |
| Issuer Application Rule | rule_type | `MAX_CONCURRENT` · `APPS_IN_WINDOW` · `PRODUCT_COOLDOWN` · `ISSUER_COOLDOWN` · `ONCE_PER_LIFETIME` · `TIER_LIFETIME_LIMIT` |
| Issuer Application Rule | applies_to_card_type | `credit` · `charge` |
| Issuer Application Rule | applies_to_segment | `personal` · `business` |
| Issuer Application Rule | reference_date | `application` · `closure` · `latest_activity` |
| Market Card | status | `active` · `discontinued` |
| Transaction | categorization_status | `auto` · `user_corrected` · `uncategorized` |
| Transaction | source | `simplefin` · `csv` · `manual` |
| Goal | direction | `saving` · `spending` |
| Goal | status | `active` · `completed` · `cancelled` |
| Scrape Run | mode | `scheduled` · `manual` · `bulk` |
| Scrape Run | status | `running` · `completed` · `failed` |
| Scrape Queue Item | change_type | `new_card` · `offer_change` · `multiplier_change` · `perk_change` |
| Scrape Queue Item | status | `queued` · `approved` · `rejected` |
| Scrape Mapping | entity_type | `EarningCategory` · `Issuer` · `RewardsProgram` · `PerkType` · `CardNetwork` |
| Provider Connection | provider_type | `simplefin` |
| Provider Connection | last_sync_status | `success` · `error` · `never_synced` |
| CSV Format Config | amount_sign | `NEGATIVE_IS_DEBIT` · `POSITIVE_IS_DEBIT` |
| Alert | status | `active` · `dismissed` · `acknowledged` |

---

## 10. Design Decisions Reference

Decisions made during data model design (Step 5):

| ID | Title | Summary |
|----|-------|---------|
| D-36 | Two-Level Purchase Type Hierarchy | Parent/child self-reference for type/subtype |
| D-37 | Offer Ownership Model | Offer belongs to Market Card; Card Instance references one |
| D-38 | Stored Alerts | Persistent alerts with dismissible/acknowledgeable state |
| D-39 | Supplementary Card Self-Reference | Card Instance self-ref instead of separate entity |
| D-40 | Time-Bound vs Update-in-Place | Multipliers, allocations, perks, recurrents are time-bound; CPP, rules, configs update in place |
| D-41 | FYF on Offer | Moved from Card Instance to Offer (amends D-27) |
| D-42 | Ignore Pending Transactions | Only posted transactions ingested (resolves OI-08) |
| D-43 | Count-Based Categorization | Vendor Category Stats + usage_count for ranked suggestions |
| D-44 | Alert Explicit Nullable FKs | DB-enforced references instead of polymorphic |
| D-45 | Config Tables vs Enums | Config tables for user-extendable vocabulary; enums for logic-dependent values |
| D-87 | System Config Table | TVARVC-style key/value runtime parameters maintained via FRM-009 |
| D-88 | Two-Tier Deduplication | external_id auto-skip (SimpleFIN), fuzzy matching (CSV) with user review |
| D-89 | CSV Import Wizard UX | Batch categorization, clear/propagate workflow, Import Log history |
| D-90 | CSV Format Config Expansion | Split debit/credit columns, status filtering, cardmember column |
| D-91 | Amex Supplementary Card Attribution | cardmember_column matched to Card Instance.cardholder_name |
| D-97 | Purchase Type Budget Exclusion | excludes_from_budget flag — skip budget but still count for churning (SPEC-06) |
| D-102 | Redemption Type Entity | Lookup table for redemption classification (SPEC-06) |
| D-134 | Budget Alert Thresholds | 4 budget alert types with configurable warning threshold (SPEC-05) |
| D-142 | Card Profitability Formula | Remove Redemptions from card-level profitability — they are per-program (SPEC-08) |
| D-150 | Goal Status Enum | Replace is_active boolean with active/completed/cancelled enum (SPEC-09) |
| D-155 | Goal Alert Types | 4 goal-related alert types with configurable thresholds (SPEC-09) |
| D-159 | Financial Account Type Expansion | 6→12 seed values for broader financial tracking (SPEC-10) |
| D-160 | Financial Account Optional Fields | 5 fields for loan/investment details (SPEC-10) |
| D-162 | Financial Contribution Entity | Composition entity for deposit/withdrawal tracking (SPEC-10) |
| D-164 | Financial Picture Staleness | Stale snapshot detection with configurable threshold (SPEC-10) |
| D-168 | Points Transfer Entity | Atomic program-to-program transfer with ratio support, auto-creates paired Points Adjustments |
| D-181 | Scraper Entities | ScrapeRun, ScrapeQueueItem for PoT change detection pipeline (SPEC-13) |
| D-182 | Scrape Mapping Entity | Label-to-reference-data mapping for scraped values (SPEC-13) |
| D-183 | Market Card Scraper Fields | source_url + last_scrape_hash for change detection (SPEC-13) |
| D-190 | CVV Field Split | Front/back CVV for Amex 4-digit CID support (SPEC-03) |
| D-191 | Offer Fee Amount | Per-offer fee override, defaults from Market Card (SPEC-03) |
| D-192 | Instance-Level Overrides | card_instance_id on Earning Multiplier + Soft Perk Definition (SPEC-03) |
| D-232 | Eligibility Reference Date | reference_date enum on Issuer Application Rule (SPEC-16) |
| D-233 | Product-Specific Rules | market_card_id FK on Issuer Application Rule (SPEC-16) |
| D-234 | Eligibility Groups | eligibility_group on Market Card for shared rules (SPEC-16) |
| D-254 | Manual Transaction Source | Transaction.source + manual value (SPEC-17) |
| D-270 | Market Card Status | active/discontinued enum for catalog management (SPEC-18) |
| D-271 | Offer Current Flag + URL | is_current boolean and offer_url on Offer (SPEC-18) |

---

*This document is the single source of truth for the Financial Planner data model (47 stored entities + 1 CDS view). Every entity traces back to the [Problem Statement & Vision](PROBLEM_STATEMENT_AND_VISION.md), [Decisions Log](user-profile/DECISIONS_LOG.md), and [Business Architecture](BUSINESS_ARCHITECTURE.md). All spec amendments from Step 12 have been consolidated.*
