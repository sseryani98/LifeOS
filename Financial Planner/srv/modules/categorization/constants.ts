// Categorization-module constants. Grouped into `as const` objects so importers
// reference one namespace (e.g. CONFIDENCE.MEDIUM) instead of loose names.

/** Fully-qualified entity names — string refs per the project CQL convention. */
export const ENTITIES = {
  TRANSACTION: "com.financialplanner.Transaction",
  MERCHANT_PATTERN: "com.financialplanner.MerchantPattern",
  VENDOR_CATEGORY_STATS: "com.financialplanner.VendorCategoryStats",
  VENDOR: "com.financialplanner.Vendor",
  PATTERN_SOURCE: "com.financialplanner.PatternSource",
  CONFIDENCE_LEVEL: "com.financialplanner.ConfidenceLevel",
} as const;

/** MatchType values, mirroring enums.cds. */
export const MATCH_TYPE = {
  EXACT: "exact",
  STARTS_WITH: "starts_with",
  CONTAINS: "contains",
} as const;

/** Priority of each match tier — lower wins (exact beats contains). */
export const TIER_RANK: Record<string, number> = {
  exact: 0,
  starts_with: 1,
  contains: 2,
};

/** ConfidenceLevel names — Title Case to match the seeded reference rows. */
export const CONFIDENCE = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

/** Confidence tie-break order (lower wins) — keyed on the lower-cased name. */
export const CONFIDENCE_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** PatternSource names — Title Case to match the seeded reference rows. */
export const PATTERN_SOURCE = {
  SEED: "Seed",
  LEARNED: "Learned",
} as const;

/** categorizationStatus values written by the engine, mirroring enums.cds. */
export const CATEGORIZATION_STATUS = {
  AUTO: "auto",
  USER_CORRECTED: "user_corrected",
  UNCATEGORIZED: "uncategorized",
} as const;
