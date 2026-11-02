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

/** The persist spec's own request: distinct descriptions so it reads back only its rows. */
export const SAVE_REQUEST_PERSIST: CsvSaveRequest = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc-persist.csv",
  skippedCount: 0,
  rows: [
    {
      postedAt: "2026-02-12",
      amount: -9.99,
      rawDescription: "AMZN MKTP PERSIST",
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      vendor_ID: SAVE_VENDOR.ID,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
    {
      postedAt: "2026-02-13",
      amount: -4,
      rawDescription: "todoist persist",
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
  ],
};

/** Descriptions the persist spec reads back. */
export const SAVE_REQUEST_PERSIST_DESCRIPTIONS = [
  "AMZN MKTP PERSIST",
  "todoist persist",
];

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

/** The import-log spec's own write — read back by this file name only. */
export const SAVE_REQUEST_LOG: CsvSaveRequest = {
  ...SAVE_REQUEST_INTEGRATION,
  fileName: "cibc-log.csv",
};

/** The saveCsvImport body posted over OData, under its own file name. */
export const SAVE_ODATA_PAYLOAD = {
  ...SAVE_REQUEST_INTEGRATION,
  fileName: "cibc-odata.csv",
};

/** A saveCsvImport body with no rows — the validator must turn it into a 400. */
export const SAVE_ODATA_NO_ROWS = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc-empty.csv",
  skippedCount: 0,
  rows: [],
};
