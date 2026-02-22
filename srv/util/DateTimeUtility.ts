/**
 * Date and time utility functions.
 * All dates handled as ISO 8601 strings (YYYY-MM-DD) for CDS compatibility.
 */
export class DateTimeUtility {
  /** Formats a Date object to ISO date string (YYYY-MM-DD). */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /** Returns the first day of the month for the given date. */
  static startOfMonth(date: Date): string {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    return DateTimeUtility.formatDate(start);
  }

  /** Returns the last day of the month for the given date. */
  static endOfMonth(date: Date): string {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return DateTimeUtility.formatDate(end);
  }
}
