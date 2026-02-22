# SPEC-16: Issuer Eligibility Engine

**Spec ID:** SPEC-16
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Approved
**Sprint:** W2-S1

---

## 1. Change History

| Date | Author | Description |
|------|--------|-------------|
| 2026-02-20 | Sandro & Claude | Initial creation — workshop output. |

---

## 2. Overview

### 2.1 Scope

Runtime computation engine that evaluates issuer application rules against card history to determine per-issuer eligibility status and per-rule detail. No persisted eligibility state — computed on every read.

### 2.2 FRICEW Objects

| ID | Name | Type | Wave |
|----|------|------|------|
| ENH-004 | Issuer Eligibility Engine | Enhancement | 2 |

### 2.3 CDS Service & Module

| | |
|---|---|
| **CDS Service** | ChurningService (`/service/churningSvcs`) |
| **Module** | `srv/modules/eligibility/` |
| **Files** | `EligibilityFacade.ts`, `EligibilityService.ts`, `EligibilityValidator.ts` |

### 2.4 Consumers

| Consumer | Usage |
|----------|-------|
| SPEC-19 Churnboard (RPT-001) §4.1.10 | Binds to `IssuerEligibility` entity for the Issuer Eligibility table |
| SPEC-07 Card Recommendation (ENH-002) | Consumes per-issuer status to feature cards from eligible issuers |
| SPEC-15 Weekly Review (WFL-001) | Triggers eligibility alert evaluation |

---

## 3. Data Model References

### 3.1 Entities Used

| Entity | Section | Usage |
|--------|---------|-------|
| Issuer Application Rule | DM §3.5 | Rule definitions — input to engine |
| Card Instance | DM §4.4 | Card history — input to engine |
| Market Card | DM §4.1 | Card type, segment, program tier, eligibility group |
| Issuer | DM §3.1 | Issuer identity |
| Program Tier | DM §3.16 | Aeroplan tier tracking for TIER_LIFETIME_LIMIT |
| Rewards Program | DM §3.15 | Family-level rule scoping |
| Alert | DM §6.1 | Eligibility window alerts |
| System Config | DM §7.1 | ELIGIBILITY_ALERT_DAYS parameter |

### 3.2 DM Amendments (DM-001)

| Entity | Change | Decision |
|--------|--------|----------|
| Issuer Application Rule | + `reference_date` : enum (`application` · `closure` · `latest_activity`), nullable | D-232 |
| Issuer Application Rule | + `market_card_id` : FK → Market Card, nullable | D-233 |
| Market Card | + `eligibility_group` : String, nullable | D-234 |
| System Config | + `ELIGIBILITY_ALERT_DAYS` : Integer, default 30 | D-235 |

### 3.3 Amended Seed Data — Issuer Application Rules

| Issuer | Rule Type | count | days | Card Type | Segment | rewards_program_id | market_card_id | reference_date | Description |
|--------|-----------|-------|------|-----------|---------|--------------------|----------------|----------------|-------------|
| Amex | `MAX_CONCURRENT` | 4 | — | credit | — | — | — | — | Max 4 credit cards held at once |
| Amex | `APPS_IN_WINDOW` | 2 | 90 | credit | — | — | — | `application` | Max 2 credit card approvals per 90 days |
| Amex | `ONCE_PER_LIFETIME` | — | — | — | — | — | — | — | Welcome bonus once per lifetime per product |
| TD | `PRODUCT_COOLDOWN` | — | 365 | — | — | Aeroplan | — | `application` | 12-month Aeroplan family cooldown |
| TD | `PRODUCT_COOLDOWN` | — | 180 | — | — | — | TD First Class Travel | `application` | 6-month FCT-specific cooldown |
| CIBC | `PRODUCT_COOLDOWN` | — | 365 | — | — | — | — | `application` | 12-month product cooldown |
| Scotia | `ISSUER_COOLDOWN` | — | 730 | — | — | — | — | `closure` | 2-year issuer-wide cooldown (from closure) |
| RBC | `APPS_IN_WINDOW` | 1 | 90 | — | — | — | — | `application` | Max 1 application per 90 days |
| — | `TIER_LIFETIME_LIMIT` | 5 | — | — | — | Aeroplan | — | — | Max 5 Aeroplan tier bonuses cross-issuer |

---

## 4. Functional Description

### 4.1 CDS Exposure

**Read-only entity — `IssuerEligibility`** (D-231)

| Field | Type | Description |
|-------|------|-------------|
| issuerId | UUID | FK → Issuer |
| issuerName | String | Display name |
| status | enum | `Eligible` · `Cooldown` · `AtLimit` |
| activeCards | Integer | Count of held primary cards (Focus/Active/To Cancel) |
| nextEligible | Date | Next eligible date (null if Eligible or At Limit with no time-based failures) |

Computed on-read — the service handler intercepts the `READ` event, runs the engine, and returns the result set.

**Function — `getEligibilityDetail(issuerId: UUID)`** (D-231)

Returns an array of per-rule evaluation results:

| Field | Type | Description |
|-------|------|-------------|
| ruleId | UUID | FK → Issuer Application Rule |
| ruleType | String | Rule type enum value |
| description | String | Human-readable rule description |
| status | enum | `Pass` · `Fail` |
| detail | String | E.g., "2 of 4 credit cards held", "3 / 5 tiers used" |
| nextEligible | Date | Null if Pass or permanent |
| productName | String | Market Card name (for product-level rules), null for issuer-level |

### 4.2 Engine Logic — Per-Issuer Summary

The per-issuer status evaluates only **issuer-level rules**: `MAX_CONCURRENT`, `APPS_IN_WINDOW`, `ISSUER_COOLDOWN` (D-236).

Product/program-level rules (`PRODUCT_COOLDOWN`, `ONCE_PER_LIFETIME`, `TIER_LIFETIME_LIMIT`) appear only in `getEligibilityDetail`.

**Status resolution:** If multiple issuer-level rules fail, the most restrictive wins: `AtLimit` > `Cooldown` > `Eligible`. The `nextEligible` date is the latest date among all failing time-based rules.

### 4.3 Card Filtering

All rule evaluations filter to **primary cards only** (`parent_card_instance_id IS NULL`) (D-237).

Rules with `applies_to_card_type` filter Card Instances by their Market Card's `card_type`. Rules with `applies_to_segment` filter by `card_segment`. Null = all.

### 4.4 Rule Evaluation

#### MAX_CONCURRENT

Count primary Card Instances in (Focus, Active, To Cancel) matching card_type/segment filters. If count ≥ `parameter_count` → At Limit.

#### APPS_IN_WINDOW

Count primary Card Instances with `application_date` within (today − `parameter_days`, today], matching card_type/segment filters. All lifecycle states count — the application happened regardless of current state. If count ≥ `parameter_count` → Cooldown. `nextEligible` = earliest `application_date` in the window + `parameter_days`. Cards with null `application_date` are excluded.

#### ISSUER_COOLDOWN

Reference date is `closure`. If any primary card at the issuer is still in (Focus, Active, To Cancel), use `today` as the reference date — represents the hypothetical "if you closed today" (D-238). Otherwise, use `MAX(closed_date)` across all Closed primary cards. If reference_date + `parameter_days` > today → Cooldown. Cards with all null `closed_date` values cause the rule to be skipped.

#### PRODUCT_COOLDOWN

Scoping hierarchy (D-233):

1. `market_card_id` set → match only that specific product
2. `rewards_program_id` set (and `market_card_id` null) → match all cards in that rewards program family
3. Neither set → evaluate per-product (group by `market_card_id`)

Reference date determined by the rule's `reference_date` field. Find the most recent reference date among matching Card Instances. If reference_date + `parameter_days` > today → Cooldown for that product/family. Cards with null reference date are excluded.

#### ONCE_PER_LIFETIME

For each Market Card from the rule's issuer: if a Card Instance exists (any lifecycle state) for that `market_card_id` OR any `market_card_id` sharing the same non-null `eligibility_group` (D-234) → lifetime used. Detail-only — does not affect per-issuer summary (D-236).

#### TIER_LIFETIME_LIMIT

Count Card Instances (any lifecycle state) whose Market Card has a non-null `program_tier_id` linked to the rule's `rewards_program_id` (D-239). If count ≥ `parameter_count` → limit reached. Detail-only (D-236).

### 4.5 UX Enhancements (D-242)

| # | Enhancement | Description |
|---|-------------|-------------|
| 1 | "Why blocked?" popover | Clicking a Cooldown/At Limit status on the Churnboard (SPEC-19) opens a popover showing `getEligibilityDetail` results. Cross-spec: SPEC-19. |
| 2 | Tier usage indicator | Detail view shows Aeroplan tier count as "3 / 5 used" with clear visual. |
| 3 | "Close to clear" hint | When MAX_CONCURRENT triggers At Limit, detail view suggests cards in "To Cancel" state as close candidates. |
| 4 | Hypothetical date clarification | When ISSUER_COOLDOWN shows Cooldown with an active card, display italic text *"If closed today"* before the nextEligible date. |

### 4.6 Alerts

Eligibility window alerts fire when a time-based rule's `nextEligible` falls within `ELIGIBILITY_ALERT_DAYS` (System Config, default 30) of today (D-235). Alert type: `eligibility_window` (seeded in SPEC-06).

Applies to: `APPS_IN_WINDOW`, `PRODUCT_COOLDOWN`, `ISSUER_COOLDOWN` only. Not applicable to `MAX_CONCURRENT` (requires action, not time), `ONCE_PER_LIFETIME` (permanent), `TIER_LIFETIME_LIMIT` (permanent).

Alert evaluation occurs during the weekly review session (WFL-001 / SPEC-15) (D-241).

---

## 5. Business Rules

| # | Rule |
|---|------|
| BR-01 | ENH-004 exposes a read-only CDS entity `IssuerEligibility` on ChurningService. Computed on-read — no persisted state. |
| BR-02 | ENH-004 exposes a CDS function `getEligibilityDetail(issuerId)` returning per-rule evaluation results. |
| BR-03 | Only issuers where the user has or has had at least one primary Card Instance are returned. |
| BR-04 | Per-issuer status evaluates issuer-level rules only: `MAX_CONCURRENT`, `APPS_IN_WINDOW`, `ISSUER_COOLDOWN`. |
| BR-05 | Status values: Eligible = all issuer-level rules pass. Cooldown = a time-based rule will clear. At Limit = MAX_CONCURRENT hit. |
| BR-06 | Multiple failures → most restrictive wins: At Limit > Cooldown > Eligible. |
| BR-07 | `nextEligible` = latest date among failing time-based rules. Null if Eligible. Null if At Limit with no concurrent time-based failures. |
| BR-08 | `activeCards` = primary Card Instances at the issuer in (Focus, Active, To Cancel). |
| BR-09 | Only primary cards evaluated (`parent_card_instance_id IS NULL`). Supplementary cards excluded. |
| BR-10 | `applies_to_card_type` on rule filters by Market Card `card_type`. Null = all. |
| BR-11 | `applies_to_segment` on rule filters by Market Card `card_segment`. Null = all. |
| BR-12 | MAX_CONCURRENT: count primary cards in (Focus, Active, To Cancel) matching filters. Count ≥ `parameter_count` → At Limit. |
| BR-13 | APPS_IN_WINDOW: count primary cards with `application_date` in (today − days, today] matching filters. All lifecycle states count. |
| BR-14 | APPS_IN_WINDOW: count ≥ `parameter_count` → Cooldown. `nextEligible` = earliest app date in window + days. |
| BR-15 | APPS_IN_WINDOW: null `application_date` → card excluded from count. |
| BR-16 | ISSUER_COOLDOWN: reference is `closure`. Use MAX(closed_date) across Closed primary cards. |
| BR-17 | ISSUER_COOLDOWN: if any primary card still held (Focus/Active/To Cancel), use today as reference (hypothetical). |
| BR-18 | ISSUER_COOLDOWN: reference + days > today → Cooldown. Otherwise Eligible. |
| BR-19 | ISSUER_COOLDOWN: all Closed cards have null closed_date → rule skipped. |
| BR-20 | PRODUCT_COOLDOWN scoping: market_card_id set → product. rewards_program_id set → family. Neither → per-product grouping. |
| BR-21 | PRODUCT_COOLDOWN: reference date from rule's `reference_date` field. Use most recent among matching cards. |
| BR-22 | PRODUCT_COOLDOWN: reference + days > today → Cooldown. `nextEligible` = reference + days. |
| BR-23 | PRODUCT_COOLDOWN: null reference date → card excluded. |
| BR-24 | ONCE_PER_LIFETIME: Card Instance exists for market_card_id or same `eligibility_group` → lifetime used. |
| BR-25 | ONCE_PER_LIFETIME: detail-only, does not affect per-issuer summary. |
| BR-26 | TIER_LIFETIME_LIMIT: count Card Instances with non-null `program_tier_id` linked to rule's rewards program. |
| BR-27 | TIER_LIFETIME_LIMIT: count ≥ `parameter_count` → limit reached. |
| BR-28 | TIER_LIFETIME_LIMIT: detail-only, does not affect per-issuer summary. |
| BR-29 | `eligibility_window` alert fires when nextEligible is within ELIGIBILITY_ALERT_DAYS of today. |
| BR-30 | Alert evaluation during weekly review session (WFL-001). |
| BR-31 | ELIGIBILITY_ALERT_DAYS: System Config parameter, default 30. |
| BR-32 | Alerts apply to APPS_IN_WINDOW, PRODUCT_COOLDOWN, ISSUER_COOLDOWN only. |

---

## 6. Error Handling

| Scenario | Handling | Code |
|----------|----------|------|
| Issuer ID not found (getEligibilityDetail) | `req.reject(404, 'eligibility.issuerNotFound')` | 404 |
| No Card Instances exist for issuer | Issuer excluded from IssuerEligibility results (BR-03) | — |
| Null date on time-based rule | Card excluded from evaluation (BR-15, BR-19, BR-23) | — |
| No rules defined for issuer | Issuer returned as Eligible with activeCards count | — |
| Market Card missing card_type | Rule with applies_to_card_type skips the card (null ≠ filter value) | — |

---

## 7. Functional Unit Tests

### Happy Path — Per-Issuer Summary

| # | Covers | Scenario | Preconditions | Steps | Expected |
|---|--------|----------|---------------|-------|----------|
| FUT-001 | ENH-004 | Issuer with no rules → Eligible | 1 Active RBC card. Last app > 90 days ago. | Read `IssuerEligibility` | RBC: Eligible, activeCards=1, nextEligible=null |
| FUT-002 | ENH-004 | MAX_CONCURRENT at limit | 4 Active Amex credit cards | Read `IssuerEligibility` | Amex: At Limit, activeCards=4 |
| FUT-003 | ENH-004 | Charge cards exempt from MAX_CONCURRENT | 3 Amex credit + 1 charge card | Read `IssuerEligibility` | Amex: Eligible, activeCards=4 |
| FUT-004 | ENH-004 | APPS_IN_WINDOW cooldown | 2 Amex credit apps 45 and 20 days ago | Read `IssuerEligibility` | Amex: Cooldown, nextEligible = app(45d ago) + 90 |
| FUT-005 | ENH-004 | ISSUER_COOLDOWN eligible | Last Scotia card closed 25 months ago | Read `IssuerEligibility` | Scotia: Eligible, activeCards=0 |
| FUT-006 | ENH-004 | ISSUER_COOLDOWN still holding | 1 Active Scotia card | Read `IssuerEligibility` | Scotia: Cooldown, nextEligible = today + 730 |

### Happy Path — Per-Rule Detail

| # | Covers | Scenario | Preconditions | Steps | Expected |
|---|--------|----------|---------------|-------|----------|
| FUT-007 | ENH-004 | PRODUCT_COOLDOWN family-level | TD Aeroplan Infinite applied 8 months ago | `getEligibilityDetail(TD)` | Aeroplan PRODUCT_COOLDOWN: Fail, nextEligible = app + 365 |
| FUT-008 | ENH-004 | PRODUCT_COOLDOWN product-level | TD FCT applied 7 months ago | `getEligibilityDetail(TD)` | FCT PRODUCT_COOLDOWN: Pass (180d passed). Aeroplan: unaffected. |
| FUT-009 | ENH-004 | ONCE_PER_LIFETIME unused | Never held Amex Cobalt | `getEligibilityDetail(Amex)` | Cobalt: Pass |
| FUT-010 | ENH-004 | ONCE_PER_LIFETIME used | Closed Amex Cobalt exists | `getEligibilityDetail(Amex)` | Cobalt: Fail, lifetime used |
| FUT-011 | ENH-004 | TIER_LIFETIME_LIMIT under | 3 Aeroplan-tier cards across TD/CIBC | `getEligibilityDetail(TD)` | TIER_LIFETIME_LIMIT: 3 of 5 used |
| FUT-012 | ENH-004 | TIER_LIFETIME_LIMIT at limit | 5 Aeroplan-tier cards | `getEligibilityDetail(TD)` | TIER_LIFETIME_LIMIT: 5 of 5, Fail |

### Edge Cases

| # | Covers | Scenario | Preconditions | Steps | Expected |
|---|--------|----------|---------------|-------|----------|
| FUT-013 | ENH-004 | Multiple failures → most restrictive | Amex: 4 credit cards + 2 apps in 90 days | Read `IssuerEligibility` | Amex: At Limit (At Limit > Cooldown) |
| FUT-014 | ENH-004 | Null application_date excluded | 2 Amex cards in 90 days: 1 with date, 1 null | Read `IssuerEligibility` | Only 1 counted toward APPS_IN_WINDOW |
| FUT-015 | ENH-004 | Eligibility group linkage | Closed Amex Green. Green and Choice share eligibility_group. | `getEligibilityDetail(Amex)` | Choice: Fail, lifetime used |
| FUT-016 | ENH-004 | Supplementary cards excluded | 4 Amex credit cards + 1 supplementary | Read `IssuerEligibility` | activeCards=4, MAX_CONCURRENT against 4 not 5 |
| FUT-017 | ENH-004 | Eligibility window alert | Scotia nextEligible in 20 days. ELIGIBILITY_ALERT_DAYS=30. Weekly review runs. | Trigger alert evaluation | `eligibility_window` alert created |

---

## 8. Cross-Spec Notes

| Target Spec | Note |
|-------------|------|
| SPEC-19 (Churnboard) | "Why blocked?" popover on Cooldown/At Limit status → calls `getEligibilityDetail`. Hypothetical date italic text for ISSUER_COOLDOWN with active cards. |
| SPEC-07 (Card Recommendation) | ENH-002 consumes per-issuer status to feature cards from eligible issuers. |
| SPEC-15 (Weekly Review) | Eligibility alert evaluation triggered during weekly review session. |
| SPEC-06 (Reference Data) | Issuer Application Rule seed data amended with `reference_date`, `market_card_id`, `rewards_program_id` columns. |

---

## 9. Open Items

| ID | Description | Resolution |
|----|-------------|------------|
| OI-06 | Alert type resolution (incremental) | `eligibility_window` alert timing defined — fires within ELIGIBILITY_ALERT_DAYS of nextEligible. Evaluated during WFL-001. |

---

## 10. Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D-231 | Expose both per-issuer summary (IssuerEligibility entity) and per-rule detail (getEligibilityDetail function) | Per-issuer for Churnboard binding; per-rule for "why blocked?" and future consumers. Detail is free since engine evaluates individually. |
| D-232 | Add `reference_date` enum to Issuer Application Rule | TD uses different date fields for different product families. Keeps rules declarative and engine generic. |
| D-233 | Add `market_card_id` FK to Issuer Application Rule | Enables product-specific rules (TD FCT 180-day). Scoping hierarchy: market_card > rewards_program > issuer. |
| D-234 | Add `eligibility_group` to Market Card | Handles ONCE_PER_LIFETIME product renames/merges (Amex Green/Choice). Nullable — no cost for ungrouped cards. |
| D-235 | Add ELIGIBILITY_ALERT_DAYS System Config (default 30) | Configurable alert window for eligibility_window alerts. |
| D-236 | Per-issuer summary only reflects issuer-level rules | MAX_CONCURRENT, APPS_IN_WINDOW, ISSUER_COOLDOWN affect "can I apply?" Product/program rules are detail-only. |
| D-237 | Supplementary cards excluded from all rule evaluations | Supplementary cards are sub-accounts, not independent applications or holdings. |
| D-238 | ISSUER_COOLDOWN with active cards uses today as hypothetical | Shows "if closed today, eligible on [date]" — most useful info. Naturally transitions when card is closed. |
| D-239 | TIER_LIFETIME_LIMIT counts total cards, not distinct tiers | 2 Core-tier cards from different issuers = 2 of 5, not 1 of 5. |
| D-240 | Null date fields → card excluded from time-based evaluation | Can't evaluate without date. User can backfill for accuracy. |
| D-241 | Eligibility alerts evaluated during weekly review (WFL-001) | Natural timing — weekly review is when churning status is reviewed. No separate scheduler needed. |
| D-242 | 4 UX enhancements: popover, tier indicator, close hint, hypothetical label | Improves eligibility comprehension without adding complexity. |
