import { CsvRowReaderService } from "../../../../srv/modules/ingestion/csvRowReaderService.js";

import {
  AMEX_CONFIG,
  CSV_ATTRIBUTION_CARDS,
  CSV_CARD_ID,
  CSV_SINGLE_CARD,
  P1_SUPP_ID,
  SCOTIA_CONFIG,
  TD_CONFIG,
} from "../../../shared/data/ingestion/csv.js";
import {
  AMEX_BLANK_MEMBER_CELLS,
  AMEX_PRIMARY_CELLS,
  AMEX_READER_ROWS,
  AMEX_SUPP_CELLS,
  AMEX_UNKNOWN_MEMBER_CELLS,
  NO_ROWS,
  SCOTIA_BAD_AMOUNT_CELLS,
  SCOTIA_BAD_DATE_CELLS,
  SCOTIA_CREDIT_CELLS,
  SCOTIA_DEBIT_CELLS,
  SCOTIA_EMPTY_CELLS,
  SCOTIA_HEADER_NO_AMOUNT_ROWS,
  SCOTIA_HEADER_ROWS,
  SCOTIA_NEG_CONFIG,
  SCOTIA_NO_AMOUNT_COL_CONFIG,
  SCOTIA_NO_SKIP_CONFIG,
  SCOTIA_PADDED_DESC_CELLS,
  SCOTIA_PENDING_CELLS,
  TD_CREDIT_CELLS,
  TD_DEBIT_CELLS,
  TD_NO_AMOUNT_CELLS,
  TD_SHORT_ROW_CELLS,
} from "../data/csvRowReader.js";

/** Builds a reader for a headerless (index-column) config; no header rows needed. */
function readerForIndexConfig(): CsvRowReaderService {
  return new CsvRowReaderService(TD_CONFIG, NO_ROWS, CSV_SINGLE_CARD, CSV_CARD_ID);
}

/** Builds a reader for the Scotia (named-column, single-amount) config. */
function readerForScotia(): CsvRowReaderService {
  return new CsvRowReaderService(
    SCOTIA_CONFIG,
    SCOTIA_HEADER_ROWS,
    CSV_SINGLE_CARD,
    CSV_CARD_ID,
  );
}

describe("CsvRowReaderService", () => {
  describe("decodeRow — single-column amount + sign", () => {
    /** POSITIVE_IS_DEBIT means a charge must land negative; getting the sign wrong inverts every balance downstream. */
    it("flips a positive debit to a negative amount", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.amount).toBe(-28.8);
      expect(result.fields.postedAt).toBe("2026-02-15");
    });

    /** A negative credit under POSITIVE_IS_DEBIT must become a positive amount, or a payment reads as a charge. */
    it("flips a negative credit to a positive amount", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_CREDIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.amount).toBe(500);
    });

    /** The inverse rule (NEGATIVE_IS_DEBIT) must preserve the raw sign, not flip it — the two sign modes are mutually exclusive. */
    it("preserves the raw sign under NEGATIVE_IS_DEBIT", () => {
      const reader = new CsvRowReaderService(
        SCOTIA_NEG_CONFIG,
        SCOTIA_HEADER_ROWS,
        CSV_SINGLE_CARD,
        CSV_CARD_ID,
      );

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.amount).toBe(28.8);
    });

    /** No cardmember column means every row attributes to the selected card with no cardholder name. */
    it("attributes to the selected card when no cardmember column is configured", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.fields.cardholderName).toBeNull();
    });

    /** Bank descriptions carry padding; trimming keeps natural-key dedup from treating "x" and "x  " as different merchants. */
    it("trims whitespace off the description", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_PADDED_DESC_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.rawDescription).toMatch(/^cineplex/);
      expect(result.fields.rawDescription).toBe(result.fields.rawDescription.trim());
    });
  });

  describe("decodeRow — split debit/credit + index columns", () => {
    /** A debit under split columns must go negative and the MM/DD/YYYY date must reorder to ISO. */
    it("flips a split debit negative and reorders the date", () => {
      const reader = readerForIndexConfig();

      const result = reader.decodeRow(TD_DEBIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.amount).toBe(-13.5);
      expect(result.fields.postedAt).toBe("2025-09-02");
    });

    /** A credit under split columns must stay positive, or a refund reads as a charge. */
    it("keeps a split credit positive", () => {
      const reader = readerForIndexConfig();

      const result = reader.decodeRow(TD_CREDIT_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.amount).toBe(901.3);
    });
  });

  describe("decodeRow — parse failures returned as data", () => {
    /** An unparseable date must surface as ok:false with the date field flagged and the raw value echoed for correction. */
    it("fails on the date field with the raw value", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_BAD_DATE_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("date");
      expect(result.rawValue).toBe("not-a-date");
    });

    /** A non-numeric amount must surface as ok:false with the amount field flagged, never imported as zero. */
    it("fails on the amount field for a non-numeric cell", () => {
      const reader = readerForScotia();

      const result = reader.decodeRow(SCOTIA_BAD_AMOUNT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("amount");
      expect(result.rawValue).toBe("N/A");
    });

    /** A split row with neither debit nor credit has no amount at all — it must fail, not import as zero. */
    it("fails on the amount field when both split columns are empty", () => {
      const reader = readerForIndexConfig();

      const result = reader.decodeRow(TD_NO_AMOUNT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("amount");
    });

    /** A ragged row shorter than a configured column index must read that cell as empty, not crash, and fail the amount field. */
    it("fails on the amount field for a row shorter than the credit index", () => {
      const reader = readerForIndexConfig();

      const result = reader.decodeRow(TD_SHORT_ROW_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("amount");
    });

    /** A config that names no amount column must resolve the amount to empty and fail the row, not import a zero. */
    it("fails on the amount field when the config has no amount column", () => {
      const reader = new CsvRowReaderService(
        SCOTIA_NO_AMOUNT_COL_CONFIG,
        SCOTIA_HEADER_ROWS,
        CSV_SINGLE_CARD,
        CSV_CARD_ID,
      );

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("amount");
    });

    /** A named column absent from the header must resolve to an empty cell and fail the row, never read a neighbour by accident. */
    it("fails when a named column is missing from the header", () => {
      const reader = new CsvRowReaderService(
        SCOTIA_CONFIG,
        SCOTIA_HEADER_NO_AMOUNT_ROWS,
        CSV_SINGLE_CARD,
        CSV_CARD_ID,
      );

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("amount");
    });

    /** A named config that skips no header rows can resolve no column name, so even the date fails. */
    it("fails when a named config declares no header rows", () => {
      const reader = new CsvRowReaderService(
        SCOTIA_NO_SKIP_CONFIG,
        SCOTIA_HEADER_ROWS,
        CSV_SINGLE_CARD,
        CSV_CARD_ID,
      );

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("date");
    });

    /** When the header row itself is absent from the construction rows, no named column resolves and the date fails. */
    it("fails when the header row is missing from the file", () => {
      const reader = new CsvRowReaderService(
        SCOTIA_CONFIG,
        NO_ROWS,
        CSV_SINGLE_CARD,
        CSV_CARD_ID,
      );

      const result = reader.decodeRow(SCOTIA_DEBIT_CELLS);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.field).toBe("date");
    });
  });

  describe("decodeRow — cardmember attribution", () => {
    /** Builds an Amex reader (cardmember column + supp cards) resolving names to card ids. */
    function readerForAmex(): CsvRowReaderService {
      return new CsvRowReaderService(
        AMEX_CONFIG,
        AMEX_READER_ROWS,
        CSV_ATTRIBUTION_CARDS,
        CSV_CARD_ID,
      );
    }

    /** A primary-cardholder row must attribute to the selected card, matched case-insensitively against the cardholder name. */
    it("attributes a primary cardholder to the selected card", () => {
      const result = readerForAmex().decodeRow(AMEX_PRIMARY_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.fields.cardholderName).toBe("SANDRO SERYANI");
    });

    /** A supp-card charge must attribute to the matching cardholder's instance, or per-card spend and earning are wrong. */
    it("attributes a supplementary cardholder to the supp card", () => {
      const result = readerForAmex().decodeRow(AMEX_SUPP_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.cardInstance_ID).toBe(P1_SUPP_ID);
      expect(result.fields.cardholderName).toBe("PERSON 1");
    });

    /** An unknown cardmember must fall back to the selected card while preserving the raw name for review. */
    it("falls back to the selected card for an unknown cardmember", () => {
      const result = readerForAmex().decodeRow(AMEX_UNKNOWN_MEMBER_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.fields.cardholderName).toBe("UNKNOWN PERSON");
    });

    /** A blank cardmember must fall back to the selected card with no cardholder name. */
    it("falls back to the selected card for a blank cardmember", () => {
      const result = readerForAmex().decodeRow(AMEX_BLANK_MEMBER_CELLS);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.fields.cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.fields.cardholderName).toBeNull();
    });
  });

  describe("isEmptyRow", () => {
    /** An all-blank row is a preamble/spacer line and must be reported empty so it is skipped, not parsed as a zero row. */
    it("reports an all-blank row as empty", () => {
      expect(readerForScotia().isEmptyRow(SCOTIA_EMPTY_CELLS)).toBe(true);
    });

    /** A row carrying any data must not be reported empty, or real transactions would be dropped. */
    it("reports a data row as not empty", () => {
      expect(readerForScotia().isEmptyRow(SCOTIA_DEBIT_CELLS)).toBe(false);
    });
  });

  describe("isStatusFiltered", () => {
    /** A configured status column must discard non-posted rows so a later posted import is not a duplicate. */
    it("filters a non-posted row when a status column is configured", () => {
      expect(readerForScotia().isStatusFiltered(SCOTIA_PENDING_CELLS)).toBe(true);
    });

    /** A posted row must pass the status filter, or every valid transaction would be discarded. */
    it("passes a posted row through the status filter", () => {
      expect(readerForScotia().isStatusFiltered(SCOTIA_DEBIT_CELLS)).toBe(false);
    });

    /** With no status column configured, no row is ever status-filtered. */
    it("filters nothing when no status column is configured", () => {
      expect(readerForIndexConfig().isStatusFiltered(TD_DEBIT_CELLS)).toBe(false);
    });
  });
});
