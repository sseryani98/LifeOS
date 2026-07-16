// Named seed data for the transaction-processing integration test (cds.test +
// SQLite). Reference ids come from the seeded db/data CSVs; vendors and
// transactions are seeded per-test.

import {
  DINING_EARNING_CATEGORY,
  RESTAURANTS_PURCHASE_TYPE,
} from "../../../shared/data/reference.js";

export const SPLIT_TXN_ID = "ab1e0003-0000-0000-0000-000000000001";
export const BULK_TXN_1_ID = "ab1e0003-0000-0000-0000-000000000002";
export const BULK_TXN_2_ID = "ab1e0003-0000-0000-0000-000000000003";
export const STARBUCKS_VENDOR_ID = "ab1e0001-0000-0000-0000-000000000001";
export const MISSING_SPLIT_TXN_ID = "ab1e0003-0000-0000-0000-0000000000ff";

/** The vendor the bulk-categorize action assigns to the selection. */
export const STARBUCKS_VENDOR = {
  ID: STARBUCKS_VENDOR_ID,
  name: "Starbucks",
};

/** A $110 charge the split action divides into the user's share. */
export const SPLIT_TRANSACTION = {
  ID: SPLIT_TXN_ID,
  source: "csv",
  amount: -110,
  postedAt: "2026-03-01",
  rawDescription: "PADEL HAUS TORONTO",
  categorizationStatus: "uncategorized",
  isExcluded: false,
};

/**
 * Two uncategorized rows sharing one raw description — bulk categorize must
 * classify both yet learn a single pattern (dedup by description).
 */
export const BULK_TRANSACTIONS = [
  {
    ID: BULK_TXN_1_ID,
    source: "csv",
    amount: -6.5,
    postedAt: "2026-03-02",
    rawDescription: "STARBUCKS #4021",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
  {
    ID: BULK_TXN_2_ID,
    source: "csv",
    amount: -6.5,
    postedAt: "2026-03-03",
    rawDescription: "STARBUCKS #4021",
    categorizationStatus: "uncategorized",
    isExcluded: false,
  },
];

/** The (PT, EC) pair applied by the bulk-categorize action. */
export const BULK_PURCHASE_TYPE_ID = RESTAURANTS_PURCHASE_TYPE.ID;
export const BULK_EARNING_CATEGORY_ID = DINING_EARNING_CATEGORY.ID;

/** The bulk-categorize action payload — both rows, one vendor + taxonomy. */
export const BULK_CATEGORIZE_PAYLOAD = {
  transactionIds: [BULK_TXN_1_ID, BULK_TXN_2_ID],
  vendor_ID: STARBUCKS_VENDOR_ID,
  purchaseType_ID: BULK_PURCHASE_TYPE_ID,
  earningCategory_ID: BULK_EARNING_CATEGORY_ID,
};
