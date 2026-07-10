import {
  AMEX_CONFIG,
  AMEX_CSV,
  AMEX_FALLBACK_CSV,
  BAD_AMOUNT_CSV,
  BAD_DATE_CSV,
  CIBC_CONFIG,
  CIBC_CSV,
  CSV_ATTRIBUTION_CARDS,
  CSV_CARD_ID,
  DUP_BATCH_CSV,
  P1_SUPP_ID,
  P2_SUPP_ID,
  MISSING_AMOUNT_HEADER_CSV,
  PARSE_ACTION_DATA,
  PARSE_ACTION_DATA_EMPTY,
  SCOTIA_CSV,
  TD_CONFIG,
  TD_CSV,
  TD_NO_AMOUNT_CSV,
} from "../../../shared/data/ingestion/csv.js";
import { buildCsvImportMocks } from "../support/csvImportMocks.js";

/** Wraps raw CSV text in a parse request for the selected primary card. */
function requestFor(fileContent: string) {
  return { cardInstance_ID: CSV_CARD_ID, fileName: "import.csv", fileContent };
}

describe("CsvImportService", () => {
  describe("Scotia — single amount + status filter", () => {
    /** Positive-is-debit means a charge must land negative and a credit positive; getting the sign wrong inverts every balance downstream. */
    it("normalizes single-column amounts by sign", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV));

      expect(result.newRows[0].amount).toBe(-28.8);
      expect(result.newRows[2].amount).toBe(500);
    });

    /** Pending rows are not yet final; the status filter must discard them (not review them) so a later posted import isn't a duplicate. */
    it("discards rows failing the status filter", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV));

      expect(result.newRows).toHaveLength(3);
      expect(result.skippedCount).toBe(1);
    });

    /** Bank descriptions carry padding; trimming keeps the natural-key dedup from treating "todoist" and "todoist  " as different merchants. */
    it("trims whitespace on the description", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV));

      const cineplex = result.newRows[1];
      expect(cineplex.rawDescription).toMatch(/^cineplex/);
      expect(cineplex.rawDescription).toBe(cineplex.rawDescription.trim());
    });
  });

  describe("TD / CIBC — split debit/credit + index columns", () => {
    /** Headerless TD maps by index and splits debit/credit; a debit must go negative and a credit positive, and MM/DD/YYYY must reorder to ISO. */
    it("parses split debit/credit with index columns", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...TD_CONFIG });

      const result = await mocks.service.parseFile(requestFor(TD_CSV));

      expect(result.newRows[0].amount).toBe(-13.5);
      expect(result.newRows[0].postedAt).toBe("2025-09-02");
      expect(result.newRows[1].amount).toBe(901.3);
    });

    /** CIBC uses the same split style with ISO dates; a credit payment must be positive and a debit interest negative. */
    it("parses CIBC credit and debit rows", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...CIBC_CONFIG });

      const result = await mocks.service.parseFile(requestFor(CIBC_CSV));

      expect(result.newRows[0].amount).toBe(1);
      expect(result.newRows[1].amount).toBe(-1.12);
    });
  });

  describe("Amex — cardmember attribution", () => {
    /** Supp-card charges must attribute to the matching cardholder's instance (not the primary), or per-card spend and earning are wrong. */
    it("attributes rows to supplementary cardholders", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...AMEX_CONFIG });
      mocks.data.getAttributionCards.mockResolvedValue([
        ...CSV_ATTRIBUTION_CARDS,
      ]);

      const result = await mocks.service.parseFile(requestFor(AMEX_CSV));

      expect(result.newRows).toHaveLength(3);
      expect(result.newRows[0].cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.newRows[1].cardInstance_ID).toBe(P1_SUPP_ID);
      expect(result.newRows[2].cardInstance_ID).toBe(P2_SUPP_ID);
      expect(result.newRows[0].amount).toBe(-406.69);
    });

    /** The header sits after 11 preamble rows; miscounting the skip either eats the first charge or parses a summary line as a transaction. */
    it("skips the preamble and parses from the header row", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...AMEX_CONFIG });
      mocks.data.getAttributionCards.mockResolvedValue([
        ...CSV_ATTRIBUTION_CARDS,
      ]);

      const result = await mocks.service.parseFile(requestFor(AMEX_CSV));

      expect(result.newRows[0].postedAt).toBe("2026-02-14");
      expect(result.excludedRows).toHaveLength(0);
    });
  });

  describe("parse errors and dedup routing", () => {
    /** An unparseable date can't be silently dropped or guessed; the row must go to Excluded with the date flagged so the user fixes it. */
    it("routes an unparseable row to the Excluded bucket", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(BAD_DATE_CSV));

      expect(result.newRows).toHaveLength(0);
      expect(result.excludedRows).toHaveLength(1);
      expect(result.excludedRows[0].errorField).toBe("date");
    });

    /** A non-numeric amount can't be trusted as zero or guessed; the row must be Excluded with the amount field flagged so the user corrects it. */
    it("routes a non-numeric amount to the Excluded bucket", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(BAD_AMOUNT_CSV));

      expect(result.newRows).toHaveLength(0);
      expect(result.excludedRows).toHaveLength(1);
      expect(result.excludedRows[0].errorField).toBe("amount");
    });

    /** A split row with neither debit nor credit populated has no amount at all and must be Excluded, not imported as zero. */
    it("excludes a split row missing both debit and credit", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...TD_CONFIG });

      const result = await mocks.service.parseFile(requestFor(TD_NO_AMOUNT_CSV));

      expect(result.excludedRows).toHaveLength(1);
      expect(result.excludedRows[0].errorField).toBe("amount");
    });

    /** An unknown or blank cardmember must fall back to the primary card, never drop the charge or crash attribution. */
    it("falls back to the primary card for unknown or blank cardmembers", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue({ ...AMEX_CONFIG });
      mocks.data.getAttributionCards.mockResolvedValue([
        ...CSV_ATTRIBUTION_CARDS,
      ]);

      const result = await mocks.service.parseFile(
        requestFor(AMEX_FALLBACK_CSV),
      );

      expect(result.newRows).toHaveLength(2);
      expect(result.newRows[0].cardInstance_ID).toBe(CSV_CARD_ID);
      expect(result.newRows[1].cardInstance_ID).toBe(CSV_CARD_ID);
    });

    /** Natural-key matches against existing data are for human review, never auto-dropped, so a false positive can be overridden. */
    it("routes a natural-key match to Potential Duplicates", async () => {
      const mocks = buildCsvImportMocks();
      mocks.dedup.evaluate.mockResolvedValue({
        outcome: "potential_duplicate",
        matchedTransactionId: "existing",
      });

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV));

      expect(result.newRows).toHaveLength(0);
      expect(result.potentialDuplicates).toHaveLength(3);
    });

    /** Rows within one file are never deduped against each other — three identical charges are three real transactions (BR within-batch). */
    it("keeps byte-identical rows within a batch as separate new rows", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(DUP_BATCH_CSV));

      expect(result.newRows).toHaveLength(2);
    });
  });

  describe("robustness", () => {
    /** A trailing blank line (common in bank exports) must be skipped, not parsed into a bogus zero-amount row. */
    it("ignores a trailing blank data row", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV + "\n"));

      expect(result.newRows).toHaveLength(3);
      expect(result.excludedRows).toHaveLength(0);
    });

    /** A config naming a column absent from the header must resolve to an empty cell and Exclude the row, never read a neighbouring column by accident. */
    it("excludes a row when a named column is missing from the header", async () => {
      const mocks = buildCsvImportMocks();

      const result = await mocks.service.parseFile(
        requestFor(MISSING_AMOUNT_HEADER_CSV),
      );

      expect(result.excludedRows).toHaveLength(1);
      expect(result.excludedRows[0].errorField).toBe("amount");
    });
  });

  describe("config resolution", () => {
    /** No issuer config means the parse can't know the columns; the import must be blocked, not guessed at. */
    it("blocks the import when no format config resolves", async () => {
      const mocks = buildCsvImportMocks();
      mocks.data.getFormatConfigForCard.mockResolvedValue(null);

      const result = await mocks.service.parseFile(requestFor(SCOTIA_CSV));

      expect(result.configResolved).toBe(false);
      expect(result.newRows).toHaveLength(0);
      expect(result.excludedRows).toHaveLength(0);
    });
  });

  describe("parse — action entry point", () => {
    /** A well-formed action request must pass validation and return a result the wizard can render. */
    it("returns a result for a valid request", async () => {
      const mocks = buildCsvImportMocks();
      const error = jest.fn();

      const result = await mocks.service.parse({
        data: PARSE_ACTION_DATA,
        error,
      } as never);

      expect(error).not.toHaveBeenCalled();
      expect(result?.configResolved).toBe(true);
    });

    /** A request missing the card must be rejected up front with a field error and never reach the parser. */
    it("reports validation errors and returns undefined", async () => {
      const mocks = buildCsvImportMocks();
      const error = jest.fn();

      const result = await mocks.service.parse({
        data: PARSE_ACTION_DATA_EMPTY,
        error,
      } as never);

      expect(result).toBeUndefined();
      expect(error).toHaveBeenCalled();
      expect(mocks.data.getFormatConfigForCard).not.toHaveBeenCalled();
    });
  });
});
