// New-tab rows for the CSV Import Wizard's Clear/Undo bookkeeping. Rows are
// mutated by the class under test, so every spec builds a fresh batch.

import type { NewRow } from "../../../../app/csv-import-wizard/webapp/model/types.js";

export const AMAZON_DESCRIPTION = "AMZN MKTP US";
export const OTHER_DESCRIPTION = "TIM HORTONS #1234";

export const AMAZON_VENDOR_ID = "c1ea0001-0000-0000-0000-000000000001";
export const SHOPPING_PURCHASE_TYPE_ID = "c1ea0002-0000-0000-0000-000000000001";
export const ONLINE_EARNING_CATEGORY_ID = "c1ea0003-0000-0000-0000-000000000001";
export const COFFEE_VENDOR_ID = "c1ea0001-0000-0000-0000-000000000002";
export const CARD_INSTANCE_ID = "c1ea0004-0000-0000-0000-000000000001";

/** The categorization the user gives the first Amazon row before clearing it. */
export const AMAZON_CATEGORIZATION = {
  vendor_ID: AMAZON_VENDOR_ID,
  purchaseType_ID: SHOPPING_PURCHASE_TYPE_ID,
  earningCategory_ID: ONLINE_EARNING_CATEGORY_ID,
} as const;

/**
 * Builds one uncategorized, uncleared New-tab row.
 * @param rowNumber 1-based CSV row number
 * @param rawDescription the bank description
 * @returns a fresh row
 */
export const buildNewRow = (rowNumber: number, rawDescription: string): NewRow => ({
  rowNumber,
  postedAt: "2026-06-01",
  amount: -25,
  rawDescription,
  cardInstance_ID: CARD_INSTANCE_ID,
  cardholderName: null,
  dedupOutcome: "new",
  matchedTransactionId: null,
  suggestedVendor_ID: null,
  suggestedVendorName: null,
  suggestedPurchaseType_ID: null,
  suggestedEarningCategory_ID: null,
  suggestionConfidence: null,
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
  cleared: false,
});

/**
 * Builds the FUT batch: 8 rows, 5 sharing the Amazon description, the first
 * of them already categorized by the user.
 * @returns the rows, Amazon rows first
 */
export const buildAmazonBatch = (): NewRow[] => {
  const rows = [1, 2, 3, 4, 5].map(rowNumber => buildNewRow(rowNumber, AMAZON_DESCRIPTION));
  Object.assign(rows[0], AMAZON_CATEGORIZATION);
  return [...rows, ...[6, 7, 8].map(rowNumber => buildNewRow(rowNumber, OTHER_DESCRIPTION))];
};
