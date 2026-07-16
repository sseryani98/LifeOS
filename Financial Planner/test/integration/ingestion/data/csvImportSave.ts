// Named fixtures for the CSV save integration test. The card resolves to the
// seeded CIBC config (see support/csvImport seed); the vendor lets the summary
// resolve a top-vendor name. Kept out of support so data lives in a data/ folder.

import { TO_CANCEL_CARD_INSTANCE } from "../../../shared/data/cards.js";
import type { CsvSaveRequest } from "../../../../srv/modules/ingestion/types.js";

/** A vendor the categorized save row points at, so the summary can name it. */
export const SAVE_VENDOR = {
  ID: "d1d1d1d1-0000-4000-8000-0000000000aa",
  name: "Amazon",
} as const;

/** A two-row save request: one categorized (Amazon), one cleared uncategorized. */
export const SAVE_REQUEST_INTEGRATION: CsvSaveRequest = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc.csv",
  skippedCount: 2,
  rows: [
    {
      postedAt: "2026-02-10",
      amount: -19.99,
      rawDescription: "AMZN MKTP US",
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      vendor_ID: SAVE_VENDOR.ID,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
    {
      postedAt: "2026-02-11",
      amount: -5,
      rawDescription: "todoist",
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
  ],
};
