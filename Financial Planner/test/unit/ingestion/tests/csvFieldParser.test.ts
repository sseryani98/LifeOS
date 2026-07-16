import { CsvFieldParser } from "../../../../srv/modules/ingestion/csvFieldParser.js";

describe("CsvFieldParser", () => {
  describe("parseAmount", () => {
    /** Amex/Scotia amounts carry a leading "$"; leaving it in makes Number() return NaN and drops the row. */
    it("strips a dollar sign", () => {
      expect(CsvFieldParser.parseAmount("$406.69")).toBe(406.69);
    });

    /** Thousands separators appear on large statement charges; an un-stripped comma parses as NaN. */
    it("strips thousands separators", () => {
      expect(CsvFieldParser.parseAmount("$1,234.56")).toBe(1234.56);
    });

    /** A negative money string (Amex credit "-$67.37") must keep its sign so refunds normalize to a positive transaction. */
    it("preserves a negative sign", () => {
      expect(CsvFieldParser.parseAmount("-$67.37")).toBe(-67.37);
    });

    /** A plain positive value must parse unchanged so bare TD/CIBC debit/credit cells work. */
    it("parses a plain decimal", () => {
      expect(CsvFieldParser.parseAmount("28.80")).toBe(28.8);
    });

    /** An empty cell is the split debit/credit "not this side" marker — it must be null, not 0, so the sibling column wins. */
    it("returns null for an empty cell", () => {
      expect(CsvFieldParser.parseAmount("")).toBeNull();
    });

    /** Non-numeric junk must be null so the row goes to Excluded instead of silently importing garbage. */
    it("returns null for non-numeric text", () => {
      expect(CsvFieldParser.parseAmount("N/A")).toBeNull();
    });
  });

  describe("parseDate", () => {
    /** Scotia/CIBC dates are already ISO; they must round-trip so posted dates line up with dedup. */
    it("parses YYYY-MM-DD", () => {
      expect(CsvFieldParser.parseDate("2026-02-15", "YYYY-MM-DD")).toBe(
        "2026-02-15",
      );
    });

    /** TD exports MM/DD/YYYY; without reordering, months and days swap and the transaction lands on the wrong day. */
    it("parses MM/DD/YYYY into ISO", () => {
      expect(CsvFieldParser.parseDate("09/02/2025", "MM/DD/YYYY")).toBe(
        "2025-09-02",
      );
    });

    /** Amex writes "14 Feb. 2026"; the month abbreviation and trailing dot must map to a numeric month. */
    it("parses DD MMM. YYYY into ISO", () => {
      expect(CsvFieldParser.parseDate("14 Feb. 2026", "DD MMM. YYYY")).toBe(
        "2026-02-14",
      );
    });

    /** Surrounding whitespace from a padded cell must not defeat the format match. */
    it("trims surrounding whitespace", () => {
      expect(CsvFieldParser.parseDate("  2026-02-15  ", "YYYY-MM-DD")).toBe(
        "2026-02-15",
      );
    });

    /** A malformed date must be null so the row is Excluded and editable rather than crashing the import. */
    it("returns null for a malformed date", () => {
      expect(CsvFieldParser.parseDate("not-a-date", "YYYY-MM-DD")).toBeNull();
    });

    /** An impossible calendar date (month 13) must be rejected, or Date rollover would silently shift it into next year. */
    it("returns null for an out-of-range date", () => {
      expect(CsvFieldParser.parseDate("2026-13-40", "YYYY-MM-DD")).toBeNull();
    });

    /** An unknown month abbreviation has no numeric mapping and must fail rather than default to a wrong month. */
    it("returns null for an unknown month name", () => {
      expect(CsvFieldParser.parseDate("14 Zzz. 2026", "DD MMM. YYYY")).toBeNull();
    });

    /** Text that doesn't fit the Amex shape at all (no day/month/year) must fail the format regex rather than throw. */
    it("returns null for text not matching the Amex date shape", () => {
      expect(CsvFieldParser.parseDate("garbage", "DD MMM. YYYY")).toBeNull();
    });

    /** An unrecognised format token is a config error; returning null keeps one bad config from importing wrong dates. */
    it("returns null for an unsupported format", () => {
      expect(CsvFieldParser.parseDate("2026-02-15", "DD-MM-YYYY")).toBeNull();
    });
  });
});
