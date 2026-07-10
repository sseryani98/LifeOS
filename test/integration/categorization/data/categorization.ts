// Named seed data for the categorization integration test (cds.test + SQLite).
// Reference ids come from the seeded db/data CSVs; vendors/patterns/transactions
// are seeded per-test.

import {
  DINING_EARNING_CATEGORY,
  FAST_FOOD_PURCHASE_TYPE,
  GROCERIES_EARNING_CATEGORY,
  HIGH_CONFIDENCE,
  RESTAURANTS_PURCHASE_TYPE,
  SEED_PATTERN_SOURCE,
} from "../../../shared/data/reference.js";

export const UBER_EATS_VENDOR_ID = "d00d0001-0000-0000-0000-000000000001";
export const PADEL_HAUS_VENDOR_ID = "d00d0001-0000-0000-0000-000000000002";
export const ICLOUD_VENDOR_ID = "d00d0001-0000-0000-0000-000000000003";
export const UBER_PATTERN_ID = "d00d0002-0000-0000-0000-000000000001";
export const ICLOUD_PATTERN_ID = "d00d0002-0000-0000-0000-000000000002";
export const PADEL_TXN_ID = "d00d0003-0000-0000-0000-000000000009";
export const MISSING_TXN_ID = "d00d0003-0000-0000-0000-0000000000ff";

/** Vendors seeded before the categorization run. */
export const CATEGORIZATION_VENDORS = [
  { ID: UBER_EATS_VENDOR_ID, name: "Uber Eats" },
  { ID: PADEL_HAUS_VENDOR_ID, name: "Padel Haus" },
  { ID: ICLOUD_VENDOR_ID, name: "iCloud" },
];

/** Amount-discriminated pattern: APPLE.COM/BILL at $3.99 resolves to iCloud. */
export const ICLOUD_PATTERN = {
  ID: ICLOUD_PATTERN_ID,
  vendor_ID: ICLOUD_VENDOR_ID,
  pattern: "APPLE.COM/BILL",
  matchType: "contains",
  patternSource_ID: SEED_PATTERN_SOURCE.ID,
  confidenceLevel_ID: HIGH_CONFIDENCE.ID,
  amount: 3.99,
  isActive: true,
};

/** One categorized iCloud transaction so the matched vendor has a stats combo. */
export const ICLOUD_TRANSACTION = {
  ID: "d00d0003-0000-0000-0000-000000000003",
  source: "csv",
  amount: -3.99,
  postedAt: "2026-01-20",
  rawDescription: "APPLE.COM/BILL",
  vendor_ID: ICLOUD_VENDOR_ID,
  purchaseType_ID: RESTAURANTS_PURCHASE_TYPE.ID,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
  categorizationStatus: "auto",
  isExcluded: false,
};

/** A seeded contains pattern that resolves "UBER EATS ..." to Uber Eats. */
export const UBER_EATS_PATTERN = {
  ID: UBER_PATTERN_ID,
  vendor_ID: UBER_EATS_VENDOR_ID,
  pattern: "UBER EATS",
  matchType: "contains",
  patternSource_ID: SEED_PATTERN_SOURCE.ID,
  confidenceLevel_ID: HIGH_CONFIDENCE.ID,
  amount: null,
  isActive: true,
};

/** Two already-categorized Uber Eats transactions — feed stats + vendor count. */
export const UBER_EATS_TRANSACTIONS = [
  {
    ID: "d00d0003-0000-0000-0000-000000000001",
    source: "csv",
    amount: -24.5,
    postedAt: "2026-01-05",
    rawDescription: "UBER EATS CA 1",
    vendor_ID: UBER_EATS_VENDOR_ID,
    purchaseType_ID: RESTAURANTS_PURCHASE_TYPE.ID,
    earningCategory_ID: DINING_EARNING_CATEGORY.ID,
    categorizationStatus: "auto",
    isExcluded: false,
  },
  {
    ID: "d00d0003-0000-0000-0000-000000000002",
    source: "csv",
    amount: -31.75,
    postedAt: "2026-01-12",
    rawDescription: "UBER EATS CA 2",
    vendor_ID: UBER_EATS_VENDOR_ID,
    purchaseType_ID: RESTAURANTS_PURCHASE_TYPE.ID,
    earningCategory_ID: DINING_EARNING_CATEGORY.ID,
    categorizationStatus: "auto",
    isExcluded: false,
  },
  {
    // A second, less-common combo for Uber Eats — makes the stats view rank two
    // combinations, exercising the alternatives path.
    ID: "d00d0003-0000-0000-0000-000000000004",
    source: "csv",
    amount: -12.0,
    postedAt: "2026-01-18",
    rawDescription: "UBER EATS CA 3",
    vendor_ID: UBER_EATS_VENDOR_ID,
    purchaseType_ID: FAST_FOOD_PURCHASE_TYPE.ID,
    earningCategory_ID: GROCERIES_EARNING_CATEGORY.ID,
    categorizationStatus: "auto",
    isExcluded: false,
  },
];

/** An uncategorized transaction the correction flow classifies from scratch. */
export const PADEL_UNCATEGORIZED_TRANSACTION = {
  ID: PADEL_TXN_ID,
  source: "csv",
  amount: -110,
  postedAt: "2026-02-01",
  rawDescription: "PADEL HAUS TORONTO",
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/** Correction assigning the Padel transaction to the Padel Haus vendor. */
export const PADEL_CORRECTION = {
  transactionId: PADEL_TXN_ID,
  vendor_ID: PADEL_HAUS_VENDOR_ID,
  purchaseType_ID: RESTAURANTS_PURCHASE_TYPE.ID,
  earningCategory_ID: DINING_EARNING_CATEGORY.ID,
};
