/**
 * Named test data constants for AdminService integration tests.
 * UPPER_SNAKE_CASE naming convention.
 *
 * These represent invalid, edge-case, and valid payloads used to test
 * cross-field rules, validation constraints, and uniqueness enforcement.
 *
 * See TEST_STRATEGY.md for naming pattern and canonical test world.
 */

import {
  TD_ISSUER,
  GROCERIES_CATEGORY,
  DINING_CATEGORY,
  REIMBURSABLE_CATEGORY,
  AEROPLAN_PROGRAM,
  GROCERIES_EARNING_CATEGORY,
  SCOTIA_CSV_CONFIG,
  RRSP_ACCOUNT_TYPE,
  SALARY_INCOME_TYPE,
  LOUNGE_PASS_PERK,
  SIGNUP_BONUS_ADJUSTMENT,
  FLIGHT_REDEMPTION,
  AMEX_ISSUER,
} from "./reference.js";

import { GROCERIES_ALLOCATION_CURRENT } from "./budget.js";

// ─── BudgetAllocation: cross-field rules ──────────────────────────────────────

/** Allocation referencing an excluded-from-budget category — should be rejected */
export const ALLOCATION_EXCLUDED_CATEGORY = {
  purchaseCategory_ID: REIMBURSABLE_CATEGORY.ID,
  ratio: 10,
  effectiveFrom: "2028-01-01",
  effectiveTo: "9999-12-31",
} as const;

/** Allocation with a closed effectiveTo — should be rejected (historical protection) */
export const ALLOCATION_HISTORICAL_EFFECTIVE_TO = {
  purchaseCategory_ID: GROCERIES_CATEGORY.ID,
  ratio: 25,
  effectiveFrom: "2028-01-01",
  effectiveTo: "2028-12-31",
} as const;

/** Allocation duplicating [purchaseCategory, effectiveFrom] of seeded data — should be rejected */
export const ALLOCATION_DUPLICATE_COMPOSITE = {
  purchaseCategory_ID: GROCERIES_CATEGORY.ID,
  ratio: 50,
  effectiveFrom: GROCERIES_ALLOCATION_CURRENT.effectiveFrom,
  effectiveTo: "9999-12-31",
} as const;

/** Allocation with same category but different effectiveFrom — should succeed */
export const ALLOCATION_DIFFERENT_EFFECTIVE_FROM = {
  purchaseCategory_ID: GROCERIES_CATEGORY.ID,
  ratio: 30,
  effectiveFrom: "2027-01-01",
  effectiveTo: "9999-12-31",
} as const;

/** Allocation with ratio above 100 — should be rejected */
export const ALLOCATION_RATIO_ABOVE_MAX = {
  purchaseCategory_ID: DINING_CATEGORY.ID,
  ratio: 150,
  effectiveFrom: "2028-01-01",
  effectiveTo: "9999-12-31",
} as const;

/** Allocation with negative ratio — should be rejected */
export const ALLOCATION_RATIO_NEGATIVE = {
  purchaseCategory_ID: DINING_CATEGORY.ID,
  ratio: -5,
  effectiveFrom: "2028-06-01",
  effectiveTo: "9999-12-31",
} as const;

/** Allocation missing ratio — should be rejected (@mandatory) */
export const ALLOCATION_MISSING_RATIO = {
  purchaseCategory_ID: DINING_CATEGORY.ID,
  effectiveFrom: "2029-01-01",
  effectiveTo: "9999-12-31",
} as const;

// ─── IssuerApplicationRule: cross-field rules ─────────────────────────────────

/** Rule with neither issuer nor rewards program — should be rejected */
export const ISSUER_RULE_ORPHAN = {
  ruleType: "MAX_CONCURRENT",
  referenceDate: "application",
  parameterCount: 5,
  description: "Max 5 concurrent applications",
} as const;

/** Rule with only issuer set — should succeed */
export const ISSUER_RULE_ISSUER_ONLY = {
  issuer_ID: TD_ISSUER.ID,
  ruleType: "MAX_CONCURRENT",
  referenceDate: "application",
  parameterCount: 4,
  description: "Max 4 concurrent applications for issuer",
} as const;

// ─── CsvFormatConfig: cross-field rules ───────────────────────────────────────

/** Config with both amount styles set — should be rejected (XOR violation) */
export const CSV_CONFIG_XOR_BOTH = {
  issuer_ID: TD_ISSUER.ID,
  configName: "XOR Both Test",
  dateColumn: "Date",
  dateFormat: "YYYY-MM-DD",
  descriptionColumn: "Desc",
  amountColumn: "Amount",
  amountSign: "NEGATIVE_IS_DEBIT",
  debitColumn: "Debit",
  creditColumn: "Credit",
} as const;

/** Config with neither amount style set — should be rejected (XOR violation) */
export const CSV_CONFIG_XOR_NEITHER = {
  issuer_ID: TD_ISSUER.ID,
  configName: "XOR Neither Test",
  dateColumn: "Date",
  dateFormat: "YYYY-MM-DD",
  descriptionColumn: "Desc",
} as const;

/** Config with statusColumn but no statusPostedValue — should be rejected */
export const CSV_CONFIG_MISSING_STATUS_VALUE = {
  issuer_ID: TD_ISSUER.ID,
  configName: "Missing Status Value Test",
  dateColumn: "Date",
  dateFormat: "YYYY-MM-DD",
  descriptionColumn: "Desc",
  amountColumn: "Amount",
  amountSign: "NEGATIVE_IS_DEBIT",
  statusColumn: "Status",
} as const;

/** Duplicate of SCOTIA_CSV_CONFIG.configName — should be rejected */
export const CSV_CONFIG_DUPLICATE_NAME = {
  issuer_ID: TD_ISSUER.ID,
  configName: SCOTIA_CSV_CONFIG.configName,
  dateColumn: "Date",
  dateFormat: "YYYY-MM-DD",
  descriptionColumn: "Desc",
  amountColumn: "Amt",
  amountSign: "NEGATIVE_IS_DEBIT",
} as const;

// ─── ScrapeMapping: composite uniqueness ──────────────────────────────────────

/** First mapping — created to set up the duplicate test */
export const SCRAPE_MAPPING_FIRST = {
  entityType: "Issuer",
  sourceText: "Duplicate Source",
  targetId: TD_ISSUER.ID,
} as const;

/** Duplicate of SCRAPE_MAPPING_FIRST [entityType, sourceText] — should be rejected */
export const SCRAPE_MAPPING_DUPLICATE = {
  entityType: "Issuer",
  sourceText: "Duplicate Source",
  targetId: AMEX_ISSUER.ID,
} as const;

// ─── Simple uniqueness: duplicate payloads ────────────────────────────────────

export const ISSUER_DUPLICATE_NAME = {
  name: TD_ISSUER.name,
  shortName: "DUP",
} as const;

export const PROGRAM_DUPLICATE_NAME = {
  name: AEROPLAN_PROGRAM.name,
  currencyType_code: "points",
  cppValuation: 1.0,
} as const;

export const PURCHASE_CATEGORY_DUPLICATE_NAME = {
  name: GROCERIES_CATEGORY.name,
  excludesFromBudget: false,
} as const;

export const EARNING_CATEGORY_DUPLICATE_NAME = {
  name: GROCERIES_EARNING_CATEGORY.name,
} as const;

export const FINANCIAL_ACCOUNT_TYPE_DUPLICATE_NAME = {
  name: RRSP_ACCOUNT_TYPE.name,
  isAsset: true,
} as const;

export const INCOME_SOURCE_TYPE_DUPLICATE_NAME = {
  name: SALARY_INCOME_TYPE.name,
} as const;

export const PERK_TYPE_DUPLICATE_NAME = {
  name: LOUNGE_PASS_PERK.name,
} as const;

export const ADJUSTMENT_TYPE_DUPLICATE_NAME = {
  name: SIGNUP_BONUS_ADJUSTMENT.name,
} as const;

export const REDEMPTION_TYPE_DUPLICATE_NAME = {
  name: FLIGHT_REDEMPTION.name,
} as const;

// ─── Mandatory fields: missing-field payloads ─────────────────────────────────

export const ISSUER_MISSING_NAME = {
  shortName: "X",
} as const;

export const ISSUER_MISSING_SHORT_NAME = {
  name: "Some Issuer",
} as const;

export const PROGRAM_MISSING_CURRENCY = {
  name: "Missing Currency",
  cppValuation: 1.0,
} as const;

export const RECURRENT_EXPENSE_MISSING_NAME = {
  amount: 10.0,
  effectiveFrom: "2026-04-01",
  effectiveTo: "9999-12-31",
} as const;
