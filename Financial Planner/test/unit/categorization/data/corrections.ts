// Named test data for categorization corrections (the learning flow).

import {
  ICLOUD_VENDOR_ID,
  NETFLIX_VENDOR_ID,
  RECURRING_BILLS_PT,
  SUBSCRIPTIONS_PT,
} from "./patterns.js";

import type {
  CorrectionRequest,
  TransactionCategorizationRow,
} from "../../../../srv/modules/categorization/types.js";

export const PADEL_TXN_ID = "cafe0001-0000-0000-0000-000000000001";
export const PADEL_HAUS_VENDOR_ID = "cafe0002-0000-0000-0000-000000000001";
export const APPLE_BILL_TXN_ID = "cafe0001-0000-0000-0000-000000000002";
export const NETFLIX_TXN_ID = "cafe0001-0000-0000-0000-000000000003";

/** A Netflix transaction whose description the Netflix exact pattern already matches. */
export const NETFLIX_TRANSACTION: TransactionCategorizationRow = {
  ID: NETFLIX_TXN_ID,
  rawDescription: "NETFLIX.COM",
  amount: -22.99,
};

/** Correction re-confirming Netflix on its own transaction — must not learn a duplicate. */
export const NETFLIX_SELF_CORRECTION: CorrectionRequest = {
  transactionId: NETFLIX_TXN_ID,
  vendor_ID: NETFLIX_VENDOR_ID,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** An uncategorized transaction the user is about to classify from scratch. */
export const PADEL_TRANSACTION: TransactionCategorizationRow = {
  ID: PADEL_TXN_ID,
  rawDescription: "PADEL HAUS TORONTO",
  amount: -110,
};

/** An APPLE.COM/BILL transaction that matched a different vendor generically. */
export const APPLE_BILL_TRANSACTION: TransactionCategorizationRow = {
  ID: APPLE_BILL_TXN_ID,
  rawDescription: "APPLE.COM/BILL",
  amount: -3.99,
};

/** Correction assigning a brand-new vendor to the Padel transaction. */
export const PADEL_CORRECTION: CorrectionRequest = {
  transactionId: PADEL_TXN_ID,
  vendor_ID: PADEL_HAUS_VENDOR_ID,
  purchaseType_ID: SUBSCRIPTIONS_PT,
  earningCategory_ID: null,
};

/** Correction reassigning the APPLE.COM/BILL transaction to iCloud. */
export const APPLE_TO_ICLOUD_CORRECTION: CorrectionRequest = {
  transactionId: APPLE_BILL_TXN_ID,
  vendor_ID: ICLOUD_VENDOR_ID,
  purchaseType_ID: RECURRING_BILLS_PT,
  earningCategory_ID: null,
};
