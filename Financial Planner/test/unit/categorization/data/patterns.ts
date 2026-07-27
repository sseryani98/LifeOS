// Named test data for the categorization engine.
// UPPER_SNAKE_CASE constants — no inline payloads in tests.

import type {
  CategoryCombo,
  LearnedPatternParams,
  MerchantPatternRecord,
} from "../../../../srv/modules/categorization/types.js";

// ─── Vendor ids ──────────────────────────────────────────────────────────────
export const NETFLIX_VENDOR_ID = "beef0001-0000-0000-0000-000000000001";
export const AMAZON_VENDOR_ID = "beef0001-0000-0000-0000-000000000002";
export const APPLE_VENDOR_ID = "beef0001-0000-0000-0000-000000000003";
export const YOUTUBE_VENDOR_ID = "beef0001-0000-0000-0000-000000000004";
export const ICLOUD_VENDOR_ID = "beef0001-0000-0000-0000-000000000005";
export const UBER_EATS_VENDOR_ID = "beef0001-0000-0000-0000-000000000006";

// ─── Category ids (PT = budget taxonomy, EC = churning taxonomy) ──────────────
export const SUBSCRIPTIONS_PT = "beef0002-0000-0000-0000-000000000001";
export const STREAMING_EC = "beef0003-0000-0000-0000-000000000001";
export const SHOPPING_PT = "beef0002-0000-0000-0000-000000000002";
export const EVERYTHING_ELSE_EC = "beef0003-0000-0000-0000-000000000002";
export const RECURRING_BILLS_PT = "beef0002-0000-0000-0000-000000000003";
export const DINING_PT = "beef0002-0000-0000-0000-000000000004";
export const DINING_EC = "beef0003-0000-0000-0000-000000000003";

// ─── Merchant patterns ────────────────────────────────────────────────────────
/** Exact, high-confidence Netflix pattern. */
export const NETFLIX_EXACT_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000001",
  vendor_ID: NETFLIX_VENDOR_ID,
  vendorName: "Netflix",
  pattern: "NETFLIX.COM",
  matchType: "exact",
  confidenceName: "high",
  amount: null,
};

/** Contains, high-confidence Amazon pattern (matches "AMZN MKTP US*..."). */
export const AMAZON_CONTAINS_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000002",
  vendor_ID: AMAZON_VENDOR_ID,
  vendorName: "Amazon",
  pattern: "AMZN MKTP",
  matchType: "contains",
  confidenceName: "high",
  amount: null,
};

/** Generic, amount-agnostic Apple pattern (contains). */
export const APPLE_GENERIC_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000003",
  vendor_ID: APPLE_VENDOR_ID,
  vendorName: "Apple",
  pattern: "APPLE.COM/BILL",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** Amount-specific YouTube Premium pattern ($13.99). */
export const YOUTUBE_AMOUNT_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000004",
  vendor_ID: YOUTUBE_VENDOR_ID,
  vendorName: "YouTube Premium",
  pattern: "APPLE.COM/BILL",
  matchType: "contains",
  confidenceName: "medium",
  amount: 13.99,
};

/** Amount-specific iCloud pattern ($3.99). */
export const ICLOUD_AMOUNT_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000005",
  vendor_ID: ICLOUD_VENDOR_ID,
  vendorName: "iCloud",
  pattern: "APPLE.COM/BILL",
  matchType: "contains",
  confidenceName: "medium",
  amount: 3.99,
};

/** Starts-with Shell pattern used for tier-priority tests. */
export const SHELL_STARTS_WITH_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000006",
  vendor_ID: "beef0001-0000-0000-0000-000000000007",
  vendorName: "Shell",
  pattern: "SHELL",
  matchType: "starts_with",
  confidenceName: "high",
  amount: null,
};

/** Contains pattern that also matches "SHELL ..." — loses to starts-with by tier. */
export const GENERIC_STATION_CONTAINS_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000007",
  vendor_ID: "beef0001-0000-0000-0000-000000000008",
  vendorName: "Generic Station",
  pattern: "STATION",
  matchType: "contains",
  confidenceName: "high",
  amount: null,
};

// ─── Tie-break patterns (chain: confidence → pattern length → vendor count) ───
/** High-confidence "COFFEE" contains pattern — beats the low one on confidence. */
export const COFFEE_HIGH_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000008",
  vendor_ID: "beef0001-0000-0000-0000-000000000009",
  vendorName: "Coffee High",
  pattern: "COFFEE",
  matchType: "contains",
  confidenceName: "high",
  amount: null,
};

/** Low-confidence "COFFEE" contains pattern — loses the confidence tie-break. */
export const COFFEE_LOW_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000009",
  vendor_ID: "beef0001-0000-0000-0000-00000000000a",
  vendorName: "Coffee Low",
  pattern: "COFFEE",
  matchType: "contains",
  confidenceName: "low",
  amount: null,
};

/** Short "BOOK" contains pattern — loses the length tie-break to the longer one. */
export const BOOK_SHORT_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-00000000000b",
  vendor_ID: "beef0001-0000-0000-0000-00000000000b",
  vendorName: "Book Short",
  pattern: "BOOK",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** Long "BOOKSTORE" contains pattern — wins on longer pattern at equal confidence. */
export const BOOK_LONG_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-00000000000c",
  vendor_ID: "beef0001-0000-0000-0000-00000000000c",
  vendorName: "Book Long",
  pattern: "BOOKSTORE",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** "GYM" contains pattern on a high-count vendor — wins the final count tie-break. */
export const GYM_BUSY_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-00000000000d",
  vendor_ID: "beef0001-0000-0000-0000-00000000000d",
  vendorName: "Gym Busy",
  pattern: "GYM",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** "GYM" contains pattern on a low-count vendor — loses only on vendor count. */
export const GYM_QUIET_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-00000000000e",
  vendor_ID: "beef0001-0000-0000-0000-00000000000e",
  vendorName: "Gym Quiet",
  pattern: "GYM",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** "COFFEE" pattern with an unrecognised confidence name — ranks last on confidence. */
export const COFFEE_UNKNOWN_CONF_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000010",
  vendor_ID: "beef0001-0000-0000-0000-000000000011",
  vendorName: "Coffee Unknown",
  pattern: "COFFEE",
  matchType: "contains",
  confidenceName: "unverified",
  amount: null,
};

/** "SPA" pattern on a vendor absent from the counts map — used for a full-tie test. */
export const SPA_FIRST_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000012",
  vendor_ID: "beef0001-0000-0000-0000-000000000012",
  vendorName: "Spa First",
  pattern: "SPA",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** Second "SPA" pattern, also on an uncounted vendor — ties the first entirely. */
export const SPA_SECOND_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-000000000013",
  vendor_ID: "beef0001-0000-0000-0000-000000000013",
  vendorName: "Spa Second",
  pattern: "SPA",
  matchType: "contains",
  confidenceName: "medium",
  amount: null,
};

/** Pattern with an unrecognised match type — never matches (defensive fall-through). */
export const UNKNOWN_MATCHTYPE_PATTERN: MerchantPatternRecord = {
  ID: "beefaaaa-0000-0000-0000-00000000000f",
  vendor_ID: "beef0001-0000-0000-0000-00000000000f",
  vendorName: "Unknown",
  pattern: "REGEXVENDOR",
  matchType: "regex",
  confidenceName: "high",
  amount: null,
};

// ─── Category stats (ranked by usage count desc) ──────────────────────────────
export const NETFLIX_COMBOS: CategoryCombo[] = [
  { purchaseType_ID: SUBSCRIPTIONS_PT, earningCategory_ID: STREAMING_EC, usageCount: 12 },
];

export const AMAZON_COMBOS: CategoryCombo[] = [
  { purchaseType_ID: SHOPPING_PT, earningCategory_ID: EVERYTHING_ELSE_EC, usageCount: 8 },
  { purchaseType_ID: SUBSCRIPTIONS_PT, earningCategory_ID: EVERYTHING_ELSE_EC, usageCount: 2 },
];

export const YOUTUBE_COMBOS: CategoryCombo[] = [
  { purchaseType_ID: SUBSCRIPTIONS_PT, earningCategory_ID: STREAMING_EC, usageCount: 4 },
];

/** Stats map covering the vendors used across the matcher tests. */
export const STATS_BY_VENDOR = new Map<string, CategoryCombo[]>([
  [NETFLIX_VENDOR_ID, NETFLIX_COMBOS],
  [AMAZON_VENDOR_ID, AMAZON_COMBOS],
  [YOUTUBE_VENDOR_ID, YOUTUBE_COMBOS],
]);

/** Vendor transaction counts — the final matching tie-breaker. */
export const VENDOR_COUNTS = new Map<string, number>([
  [NETFLIX_VENDOR_ID, 12],
  [AMAZON_VENDOR_ID, 10],
  [YOUTUBE_VENDOR_ID, 4],
  ["beef0001-0000-0000-0000-00000000000d", 30],
  ["beef0001-0000-0000-0000-00000000000e", 2],
]);

// ─── Learned-pattern params (mapper inputs) ───────────────────────────────────
export const LEARNED_SOURCE_ID = "source-learned";
export const MEDIUM_CONFIDENCE_ID = "confidence-medium";

/** Params for a from-scratch correction — expects an exact, amount-agnostic pattern. */
export const SCRATCH_LEARNED_PARAMS: LearnedPatternParams = {
  vendorId: AMAZON_VENDOR_ID,
  pattern: "PADEL HAUS TORONTO",
  amount: -110,
  isDiscriminator: false,
  patternSourceId: LEARNED_SOURCE_ID,
  confidenceLevelId: MEDIUM_CONFIDENCE_ID,
};

/** Params for a discriminating correction — expects a contains, amount-specific pattern. */
export const DISCRIMINATOR_LEARNED_PARAMS: LearnedPatternParams = {
  vendorId: AMAZON_VENDOR_ID,
  pattern: "APPLE.COM/BILL",
  amount: -3.99,
  isDiscriminator: true,
  patternSourceId: LEARNED_SOURCE_ID,
  confidenceLevelId: MEDIUM_CONFIDENCE_ID,
};
