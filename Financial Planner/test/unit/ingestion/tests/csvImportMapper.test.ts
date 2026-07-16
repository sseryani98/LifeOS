import { CsvImportMapper } from "../../../../srv/modules/ingestion/csvImportMapper.js";

import {
  CSV_CARD_ID,
  DEDUP_NEW,
  DEDUP_POTENTIAL,
  MATCHED_TX_ID,
  PARSED_FIELDS_NEW,
  SUGGESTION_NONE,
} from "../../../shared/data/ingestion/csv.js";

describe("CsvImportMapper", () => {
  describe("toCandidate", () => {
    /** CSV rows have no external id, so the candidate must carry source=csv and a null externalId to force dedup down the natural-key tier. */
    it("builds a natural-key candidate tagged source=csv", () => {
      const candidate = CsvImportMapper.toCandidate(PARSED_FIELDS_NEW);

      expect(candidate).toEqual({
        externalId: null,
        cardInstance_ID: CSV_CARD_ID,
        amount: -27.67,
        postedAt: "2026-02-12",
        rawDescription: "cineplex #7115 qp",
        source: "csv",
      });
    });
  });

  describe("toClassifiedRow", () => {
    /** A new row must carry outcome "new" and a null match id so the wizard files it under the New tab. */
    it("carries the new outcome with no match id", () => {
      const row = CsvImportMapper.toClassifiedRow(
        3,
        PARSED_FIELDS_NEW,
        DEDUP_NEW,
        SUGGESTION_NONE,
      );

      expect(row).toMatchObject({
        rowNumber: 3,
        dedupOutcome: "new",
        matchedTransactionId: null,
        amount: -27.67,
        suggestedVendor_ID: null,
      });
    });

    /** A potential duplicate must surface the matched transaction id so the wizard can render the side-by-side comparison. */
    it("preserves the matched id for a potential duplicate", () => {
      const row = CsvImportMapper.toClassifiedRow(
        5,
        PARSED_FIELDS_NEW,
        DEDUP_POTENTIAL,
        SUGGESTION_NONE,
      );

      expect(row.dedupOutcome).toBe("potential_duplicate");
      expect(row.matchedTransactionId).toBe(MATCHED_TX_ID);
    });
  });

  describe("toExcludedRow", () => {
    /** An excluded row must flag the offending field and echo the bad value so the user can correct it in place. */
    it("captures the failed field, message key, and raw value", () => {
      const excluded = CsvImportMapper.toExcludedRow(
        7,
        ["not-a-date", "broken row"],
        "date",
        "ingestion.csv.parseErrorDate",
        "not-a-date",
      );

      expect(excluded).toEqual({
        rowNumber: 7,
        rawCells: ["not-a-date", "broken row"],
        errorField: "date",
        errorMessageKey: "ingestion.csv.parseErrorDate",
        errorValue: "not-a-date",
      });
    });
  });
});
