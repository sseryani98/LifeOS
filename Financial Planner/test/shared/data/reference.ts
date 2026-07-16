/**
 * Named test data constants for reference entities.
 * UPPER_SNAKE_CASE naming convention.
 * IDs match the CSV seed files in db/data/ for consistency
 * between unit tests (no DB) and integration tests (cds.test + SQLite).
 *
 * See TEST_STRATEGY.md for naming pattern and canonical test world.
 */

// ─── Issuers ────────────────────────────────────────────────────────────────
export const TD_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000001",
  name: "TD Canada Trust",
  shortName: "TD",
} as const;

export const AMEX_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000002",
  name: "American Express Canada",
  shortName: "Amex",
} as const;

export const CIBC_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000003",
  name: "CIBC",
  shortName: "CIBC",
} as const;

export const SCOTIA_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000004",
  name: "Scotiabank",
  shortName: "Scotia",
} as const;

export const BMO_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000005",
  name: "BMO",
  shortName: "BMO",
} as const;

export const RBC_ISSUER = {
  ID: "a1b2c3d4-0001-4000-8000-000000000006",
  name: "RBC",
  shortName: "RBC",
} as const;

// ─── Rewards Programs ───────────────────────────────────────────────────────
export const AEROPLAN_PROGRAM = {
  ID: "a1b2c3d4-0002-4000-8000-000000000001",
  name: "Aeroplan",
  currencyType_code: "points",
  cppValuation: 2.0,
} as const;

export const AMEX_MR_PROGRAM = {
  ID: "a1b2c3d4-0002-4000-8000-000000000002",
  name: "Amex Membership Rewards",
  currencyType_code: "mrPoints",
  cppValuation: 2.0,
} as const;

export const BONVOY_PROGRAM = {
  ID: "a1b2c3d4-0002-4000-8000-000000000003",
  name: "Marriott Bonvoy",
  currencyType_code: "points",
  cppValuation: 0.6,
} as const;

export const SCENE_PLUS_PROGRAM = {
  ID: "a1b2c3d4-0002-4000-8000-000000000004",
  name: "Scene+",
  currencyType_code: "points",
  cppValuation: 1.0,
} as const;

export const CASH_BACK_PROGRAM = {
  ID: "a1b2c3d4-0002-4000-8000-00000000000e",
  name: "Cash Back",
  currencyType_code: "dollars",
  cppValuation: 1.0,
} as const;

// ─── Card Networks ──────────────────────────────────────────────────────────
export const VISA_NETWORK = {
  ID: "a1b2c3d4-0003-4000-8000-000000000001",
  name: "Visa",
} as const;

export const MASTERCARD_NETWORK = {
  ID: "a1b2c3d4-0003-4000-8000-000000000002",
  name: "Mastercard",
} as const;

export const AMEX_NETWORK = {
  ID: "a1b2c3d4-0003-4000-8000-000000000003",
  name: "Amex",
} as const;

// ─── Purchase Categories (subset for tests) ────────────────────────────────
export const GROCERIES_CATEGORY = {
  ID: "a1b2c3d4-000d-4000-8000-000000000001",
  name: "Groceries",
  excludesFromBudget: false,
} as const;

export const DINING_CATEGORY = {
  ID: "a1b2c3d4-000d-4000-8000-000000000002",
  name: "Dining",
  excludesFromBudget: false,
} as const;

export const TRANSPORTATION_CATEGORY = {
  ID: "a1b2c3d4-000d-4000-8000-000000000003",
  name: "Transportation",
  excludesFromBudget: false,
} as const;

export const CREDIT_CARD_FEES_CATEGORY = {
  ID: "a1b2c3d4-000d-4000-8000-00000000000b",
  name: "Credit Card Fees",
  excludesFromBudget: false,
} as const;

export const REIMBURSABLE_CATEGORY = {
  ID: "a1b2c3d4-000d-4000-8000-00000000000c",
  name: "Reimbursable",
  excludesFromBudget: true,
} as const;

// ─── Purchase Types (subtypes, subset for tests) ───────────────────────────
export const RESTAURANTS_PURCHASE_TYPE = {
  ID: "a1b2c3d4-000d-4000-8000-100000000001",
  name: "Restaurants",
  category_ID: DINING_CATEGORY.ID,
} as const;

export const FAST_FOOD_PURCHASE_TYPE = {
  ID: "a1b2c3d4-000d-4000-8000-100000000002",
  name: "Fast Food",
  category_ID: DINING_CATEGORY.ID,
} as const;

// ─── Earning Categories (subset for tests) ──────────────────────────────────
export const GROCERIES_EARNING_CATEGORY = {
  ID: "a1b2c3d4-000c-4000-8000-000000000001",
  name: "Groceries",
} as const;

export const DINING_EARNING_CATEGORY = {
  ID: "a1b2c3d4-000c-4000-8000-000000000002",
  name: "Dining",
} as const;

export const GAS_EARNING_CATEGORY = {
  ID: "a1b2c3d4-000c-4000-8000-000000000003",
  name: "Gas",
} as const;

export const TRAVEL_EARNING_CATEGORY = {
  ID: "a1b2c3d4-000c-4000-8000-000000000005",
  name: "Travel",
} as const;

export const EVERYTHING_ELSE_EARNING_CATEGORY = {
  ID: "a1b2c3d4-000c-4000-8000-00000000000e",
  name: "Everything Else",
} as const;

// ─── Alert Types (full set — used across many specs) ────────────────────────
export const ALERT_TYPE_MSR_DEADLINE = {
  ID: "a1b2c3d4-000e-4000-8000-000000000001",
  name: "msr_deadline",
} as const;
export const ALERT_TYPE_BONUS_MET = {
  ID: "a1b2c3d4-000e-4000-8000-000000000002",
  name: "bonus_met",
} as const;
export const ALERT_TYPE_BONUS_MISSED = {
  ID: "a1b2c3d4-000e-4000-8000-000000000003",
  name: "bonus_missed",
} as const;
export const ALERT_TYPE_AF_RENEWAL = {
  ID: "a1b2c3d4-000e-4000-8000-000000000004",
  name: "af_renewal",
} as const;
export const ALERT_TYPE_FIRST_AF = {
  ID: "a1b2c3d4-000e-4000-8000-000000000005",
  name: "first_af",
} as const;
export const ALERT_TYPE_AF_APPROACHING = {
  ID: "a1b2c3d4-000e-4000-8000-000000000006",
  name: "af_approaching",
} as const;
export const ALERT_TYPE_CANCEL_REMINDER = {
  ID: "a1b2c3d4-000e-4000-8000-000000000007",
  name: "cancel_reminder",
} as const;
export const ALERT_TYPE_CONNECTION_ERROR = {
  ID: "a1b2c3d4-000e-4000-8000-000000000009",
  name: "connection_error",
} as const;
export const ALERT_TYPE_STALE_DATA = {
  ID: "a1b2c3d4-000e-4000-8000-00000000000a",
  name: "stale_data",
} as const;
export const ALERT_TYPE_BUDGET_WARNING = {
  ID: "a1b2c3d4-000e-4000-8000-00000000000d",
  name: "budget_category_warning",
} as const;
export const ALERT_TYPE_BUDGET_OVERSPEND = {
  ID: "a1b2c3d4-000e-4000-8000-00000000000f",
  name: "budget_overspend",
} as const;
export const ALERT_TYPE_REVIEW_OVERDUE = {
  ID: "a1b2c3d4-000e-4000-8000-000000000017",
  name: "review_overdue",
} as const;

// ─── Alert Severities ───────────────────────────────────────────────────────
export const INFO_SEVERITY = {
  ID: "a1b2c3d4-0004-4000-8000-000000000001",
  name: "info",
} as const;
export const WARNING_SEVERITY = {
  ID: "a1b2c3d4-0004-4000-8000-000000000002",
  name: "warning",
} as const;
export const CRITICAL_SEVERITY = {
  ID: "a1b2c3d4-0004-4000-8000-000000000003",
  name: "critical",
} as const;

// ─── System Config Keys ─────────────────────────────────────────────────────
export const SYSCONFIG_SIMPLEFIN_SYNC_TIME = {
  ID: "a1b2c3d4-0012-4000-8000-000000000001",
  key: "SIMPLEFIN_SYNC_TIME",
  value: "20:00",
} as const;
export const SYSCONFIG_SIMPLEFIN_LOOKBACK = {
  ID: "a1b2c3d4-0012-4000-8000-000000000002",
  key: "SIMPLEFIN_LOOKBACK_DAYS",
  value: "7",
} as const;
export const SYSCONFIG_BUDGET_WARNING_PCT = {
  ID: "a1b2c3d4-0012-4000-8000-000000000005",
  key: "BUDGET_WARNING_THRESHOLD_PCT",
  value: "80",
} as const;
export const SYSCONFIG_AF_ALERT_DAYS = {
  ID: "a1b2c3d4-0012-4000-8000-00000000000d",
  key: "AF_ALERT_DAYS",
  value: "30",
} as const;
export const SYSCONFIG_LAST_REVIEW_DATE = {
  ID: "a1b2c3d4-0012-4000-8000-000000000010",
  key: "LAST_REVIEW_DATE",
  value: null,
} as const;

// ─── CSV Format Configs ─────────────────────────────────────────────────────
export const SCOTIA_CSV_CONFIG = {
  ID: "a1b2c3d4-0011-4000-8000-000000000001",
  issuer_ID: SCOTIA_ISSUER.ID,
  configName: "Scotiabank CSV Export",
} as const;
export const TD_CSV_CONFIG = {
  ID: "a1b2c3d4-0011-4000-8000-000000000002",
  issuer_ID: TD_ISSUER.ID,
  configName: "TD CSV Export",
} as const;
export const CIBC_CSV_CONFIG = {
  ID: "a1b2c3d4-0011-4000-8000-000000000003",
  issuer_ID: CIBC_ISSUER.ID,
  configName: "CIBC CSV Export",
} as const;
export const AMEX_CSV_CONFIG = {
  ID: "a1b2c3d4-0011-4000-8000-000000000004",
  issuer_ID: AMEX_ISSUER.ID,
  configName: "Amex CSV Export",
} as const;

// ─── Program Tiers (Aeroplan) ───────────────────────────────────────────────
export const AEROPLAN_ENTRY_TIER = {
  ID: "a1b2c3d4-000f-4000-8000-000000000001",
  rewardsProgram_ID: AEROPLAN_PROGRAM.ID,
  name: "Entry",
} as const;
export const AEROPLAN_CORE_TIER = {
  ID: "a1b2c3d4-000f-4000-8000-000000000002",
  rewardsProgram_ID: AEROPLAN_PROGRAM.ID,
  name: "Core",
} as const;
export const AEROPLAN_PREMIUM_TIER = {
  ID: "a1b2c3d4-000f-4000-8000-000000000003",
  rewardsProgram_ID: AEROPLAN_PROGRAM.ID,
  name: "Premium",
} as const;

// ─── Perk Types ─────────────────────────────────────────────────────────────
export const LOUNGE_PASS_PERK = {
  ID: "a1b2c3d4-0008-4000-8000-000000000001",
  name: "Lounge Pass",
} as const;
export const TRAVEL_CREDIT_PERK = {
  ID: "a1b2c3d4-0008-4000-8000-000000000002",
  name: "Travel Credit",
} as const;

// ─── Adjustment Types ───────────────────────────────────────────────────────
export const SIGNUP_BONUS_ADJUSTMENT = {
  ID: "a1b2c3d4-0009-4000-8000-000000000001",
  name: "Sign-up Bonus",
} as const;
export const REFERRAL_ADJUSTMENT = {
  ID: "a1b2c3d4-0009-4000-8000-000000000002",
  name: "Referral",
} as const;

// ─── Pattern Sources ────────────────────────────────────────────────────────
export const SEED_PATTERN_SOURCE = {
  ID: "a1b2c3d4-0005-4000-8000-000000000001",
  name: "seed",
} as const;
export const LEARNED_PATTERN_SOURCE = {
  ID: "a1b2c3d4-0005-4000-8000-000000000002",
  name: "learned",
} as const;

// ─── Confidence Levels ──────────────────────────────────────────────────────
export const HIGH_CONFIDENCE = {
  ID: "a1b2c3d4-0006-4000-8000-000000000001",
  name: "high",
} as const;
export const MEDIUM_CONFIDENCE = {
  ID: "a1b2c3d4-0006-4000-8000-000000000002",
  name: "medium",
} as const;
export const LOW_CONFIDENCE = {
  ID: "a1b2c3d4-0006-4000-8000-000000000003",
  name: "low",
} as const;

// ─── Redemption Types ───────────────────────────────────────────────────────
export const FLIGHT_REDEMPTION = {
  ID: "a1b2c3d4-000a-4000-8000-000000000001",
  name: "Flight",
} as const;
export const HOTEL_REDEMPTION = {
  ID: "a1b2c3d4-000a-4000-8000-000000000002",
  name: "Hotel",
} as const;

// ─── Financial Account Types ───────────────────────────────────────────────
export const RRSP_ACCOUNT_TYPE = {
  ID: "a1b2c3d4-000b-4000-8000-000000000001",
  name: "RRSP",
  isAsset: true,
} as const;
export const CAR_LOAN_ACCOUNT_TYPE = {
  ID: "a1b2c3d4-000b-4000-8000-000000000009",
  name: "Car Loan",
  isAsset: false,
} as const;

// ─── Income Source Types ───────────────────────────────────────────────────
export const SALARY_INCOME_TYPE = {
  ID: "a1b2c3d4-0007-4000-8000-000000000001",
  name: "Salary",
} as const;
export const BONUS_INCOME_TYPE = {
  ID: "a1b2c3d4-0007-4000-8000-000000000002",
  name: "Bonus",
} as const;
