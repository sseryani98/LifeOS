import { CSV_DATE } from "./constants.js";

/**
 * Converter for CSV cells: bank-formatted date strings → ISO dates
 * and money strings → signed numbers. A parse failure returns null so the 
 * caller can route the row to the Excluded tab rather than aborting the 
 * whole import.
 */
export class CsvFieldParser {
  /**
   * Parses a money cell to a number, stripping `$`, thousands separators, and
   * whitespace first. Sign is preserved; normalization is the caller's job.
   * @param raw Raw cell text (e.g. "$1,234.56", "-$67.37", "28.80").
   * @returns The numeric value, or null when the cell is empty or non-numeric.
   */
  static parseAmount(raw: string): number | null {
    const cleaned = raw.replace(/[$,\s]/g, "");
    if (cleaned === "") {
      return null;
    }
    const value = Number(cleaned);
    return Number.isNaN(value) ? null : value;
  }

  /**
   * Parses a date cell to an ISO calendar date (YYYY-MM-DD) per the config's
   * format token. Supports the four issuer formats; an unknown format or an
   * impossible calendar date returns null.
   * @param raw Raw cell text (e.g. "14 Feb. 2026", "09/02/2025").
   * @param format Format token from CsvFormatConfig.dateFormat.
   * @returns The ISO date string, or null when it cannot be parsed.
   */
  static parseDate(raw: string, format: string): string | null {
    const text = raw.trim();
    if (format === CSV_DATE.FORMAT.ISO) {
      const match = CSV_DATE.PATTERN.ISO.exec(text);
      return match ? this._buildDate(+match[1], +match[2], +match[3]) : null;
    }
    if (format === CSV_DATE.FORMAT.US) {
      const match = CSV_DATE.PATTERN.US.exec(text);
      return match ? this._buildDate(+match[3], +match[1], +match[2]) : null;
    }
    if (format === CSV_DATE.FORMAT.AMEX) {
      const match = CSV_DATE.PATTERN.AMEX.exec(text);
      if (!match) {
        return null;
      }
      const key = match[2].slice(0, CSV_DATE.ABBREVIATION_LENGTH).toLowerCase();
      const month = CSV_DATE.MONTHS[key];
      return month ? this._buildDate(+match[3], month, +match[1]) : null;
    }
    return null;
  }

  /**
   * Validates a year/month/day triple against the real calendar and formats it
   * as a zero-padded ISO date. Guards against overflow like 2026-13-40.
   * @param year Four-digit year.
   * @param month 1-based month.
   * @param day Day of month.
   * @returns The ISO date string, or null when the triple is not a real date.
   */
  private static _buildDate(
    year: number,
    month: number,
    day: number,
  ): string | null {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }
}
