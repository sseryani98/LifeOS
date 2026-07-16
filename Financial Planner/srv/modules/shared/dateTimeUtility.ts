import { TIME } from "./constants.js";

/**
 * Date and time utility functions.
 * All dates handled as ISO 8601 strings (YYYY-MM-DD) for CDS compatibility.
 */
export class DateTimeUtility {
  /**
   * UNIX epoch seconds for the instant `days` before `nowMs`.
   * @param nowMs Reference instant in milliseconds.
   * @param days Number of days to look back.
   * @returns The lookback window start as epoch seconds.
   */
  static getEpochSecondsDaysBefore(nowMs: number, days: number): number {
    return Math.floor(
      DateTimeUtility.getMillisDaysBefore(nowMs, days) / TIME.MS_PER_SECOND,
    );
  }

  /**
   * Millisecond timestamp for the instant `days` before `nowMs`.
   * @param nowMs Reference instant in milliseconds.
   * @param days Number of days to look back.
   * @returns The instant `days` before `nowMs`, in milliseconds.
   */
  static getMillisDaysBefore(nowMs: number, days: number): number {
    return nowMs - days * TIME.SECONDS_PER_DAY * TIME.MS_PER_SECOND;
  }
  /**
   * Formats a Date object to ISO date string (YYYY-MM-DD).
   * @param date Date to format.
   * @returns The date as an ISO 8601 calendar date (YYYY-MM-DD).
   */
  static formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Returns the first day of the month for the given date.
   * @param date Any date within the target month.
   * @returns The month's first day as an ISO date string.
   */
  static startOfMonth(date: Date): string {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    return DateTimeUtility.formatDate(start);
  }

  /**
   * Returns the last day of the month for the given date.
   * @param date Any date within the target month.
   * @returns The month's last day as an ISO date string.
   */
  static getEndOfMonth(date: Date): string {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return DateTimeUtility.formatDate(end);
  }
}
