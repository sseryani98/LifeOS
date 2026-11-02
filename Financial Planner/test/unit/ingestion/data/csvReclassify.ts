// reclassifyCsvRow action payloads: an Excluded row re-sent with the user's
// correction for the field that failed to parse.

import {
  BAD_AMOUNT_CSV,
  BAD_DATE_CSV,
  CSV_CARD_ID,
  SCOTIA_CSV,
  TD_NO_AMOUNT_CSV,
} from "../../../shared/data/ingestion/csv.js";

/** BAD_DATE_CSV's row 2 with its date fixed — amount and description must come from the file. */
export const DATE_CORRECTION = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: BAD_DATE_CSV,
  rowNumber: 2,
  correctedValue: "2026-02-14",
};

/** BAD_AMOUNT_CSV's row 2 with its amount fixed — Scotia is positive-is-debit, so it lands negative. */
export const AMOUNT_CORRECTION = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: BAD_AMOUNT_CSV,
  rowNumber: 2,
  correctedValue: "12.50",
};

/** TD_NO_AMOUNT_CSV's only row given an amount — an empty credit cell makes it a debit. */
export const SPLIT_AMOUNT_CORRECTION = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "td.csv",
  fileContent: TD_NO_AMOUNT_CSV,
  rowNumber: 1,
  correctedValue: "42.00",
};

/** A date correction that is still not in the file's YYYY-MM-DD format. */
export const STILL_BAD_DATE_CORRECTION = { ...DATE_CORRECTION, correctedValue: "14/02/2026" };

/** A row number past the end of the file. */
export const MISSING_ROW_CORRECTION = { ...DATE_CORRECTION, rowNumber: 9 };

/** A correction request with nothing entered. */
export const BLANK_CORRECTION = { ...DATE_CORRECTION, correctedValue: "  " };

/** Row numbers are 1-based lines; zero and fractions point at no row. */
export const ZERO_ROW_CORRECTION = { ...DATE_CORRECTION, rowNumber: 0 };
export const FRACTIONAL_ROW_CORRECTION = { ...DATE_CORRECTION, rowNumber: 1.5 };

/** A request for a row that parses cleanly already — the correction is ignored. */
export const CLEAN_ROW_CORRECTION = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: SCOTIA_CSV,
  rowNumber: 2,
  correctedValue: "1999-01-01",
};
