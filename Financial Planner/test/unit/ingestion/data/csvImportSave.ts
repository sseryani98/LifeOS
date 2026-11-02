// Unit-only CSV save fixtures. The shared rows live in
// test/shared/data/ingestion/csv.ts; this file only recombines them.

import type { CsvSaveRequest } from "../../../../srv/modules/ingestion/types.js";
import {
  CSV_CARD_ID,
  SAVE_ROW_AMAZON,
  SAVE_ROW_CATEGORIZED,
} from "../../../shared/data/ingestion/csv.js";

/**
 * Cineplex first, then Amazon twice: the most frequent vendor (Amazon) is not
 * the first one seen, so a first-seen shortcut names the wrong vendor.
 */
export const SAVE_REQUEST_TOP_VENDOR_CONTESTED: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [SAVE_ROW_CATEGORIZED, SAVE_ROW_AMAZON, { ...SAVE_ROW_AMAZON }],
};
