// Named test data for the re-categorize batch (a re-run over a selection).

import type { TransactionRecategorizationRow } from "../../../../srv/modules/categorization/types.js";

import {
  NETFLIX_VENDOR_ID,
  STREAMING_EC,
  SUBSCRIPTIONS_PT,
} from "./patterns.js";

export const RECAT_UNCATEGORIZED_ID = "dead0001-0000-0000-0000-000000000001";
export const RECAT_AUTO_ID = "dead0001-0000-0000-0000-000000000002";
export const RECAT_USER_CORRECTED_ID = "dead0001-0000-0000-0000-000000000003";
export const RECAT_UNMATCHED_ID = "dead0001-0000-0000-0000-000000000004";
export const RECAT_AUTO_CURRENT_ID = "dead0001-0000-0000-0000-000000000005";

/** An uncategorized Netflix row — a newly-added pattern should re-match it to auto. */
export const RECAT_UNCATEGORIZED_ROW: TransactionRecategorizationRow = {
  ID: RECAT_UNCATEGORIZED_ID,
  rawDescription: "NETFLIX.COM",
  amount: -22.99,
  categorizationStatus: "uncategorized",
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** An already-auto Netflix row — re-run refreshes it (auto rows are eligible). */
export const RECAT_AUTO_ROW: TransactionRecategorizationRow = {
  ID: RECAT_AUTO_ID,
  rawDescription: "NETFLIX.COM",
  amount: -22.99,
  categorizationStatus: "auto",
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** A user-corrected Netflix row — the user's decision wins, must be skipped. */
export const RECAT_USER_CORRECTED_ROW: TransactionRecategorizationRow = {
  ID: RECAT_USER_CORRECTED_ID,
  rawDescription: "NETFLIX.COM",
  amount: -22.99,
  categorizationStatus: "user_corrected",
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** A row no pattern matches — stays uncategorized, counted as skipped. */
export const RECAT_UNMATCHED_ROW: TransactionRecategorizationRow = {
  ID: RECAT_UNMATCHED_ID,
  rawDescription: "XYZ UNKNOWN MERCHANT 12345",
  amount: -5,
  categorizationStatus: "uncategorized",
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** An auto Netflix row already holding the match a re-run would write — nothing to change. */
export const RECAT_AUTO_CURRENT_ROW: TransactionRecategorizationRow = {
  ID: RECAT_AUTO_CURRENT_ID,
  rawDescription: "NETFLIX.COM",
  amount: -22.99,
  categorizationStatus: "auto",
  vendor_ID: NETFLIX_VENDOR_ID,
  purchaseType_ID: SUBSCRIPTIONS_PT,
  earningCategory_ID: STREAMING_EC,
};
