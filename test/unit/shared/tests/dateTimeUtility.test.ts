import { DateTimeUtility } from "../../../../srv/modules/shared/dateTimeUtility.js";

describe("DateTimeUtility", () => {
  /** A stable ISO date string is the contract other layers parse and store; drifting off yyyy-mm-dd (or a timezone shift moving the day) would corrupt persisted dates. */
  it("formats a date as an ISO yyyy-mm-dd string", () => {
    expect(DateTimeUtility.formatDate(new Date(Date.UTC(2026, 5, 15)))).toBe(
      "2026-06-15",
    );
  });

  /** Budget periods are bucketed by month boundary, so an off-by-one on the first day would misattribute transactions to the wrong period. */
  it("returns the first day of the month", () => {
    expect(DateTimeUtility.startOfMonth(new Date(2026, 5, 15))).toBe(
      "2026-06-01",
    );
  });

  /** Month length varies (here June has 30 days), so the end-of-month calc must derive the real last day rather than assume a fixed 30/31. */
  it("returns the last day of the month", () => {
    expect(DateTimeUtility.getEndOfMonth(new Date(2026, 5, 15))).toBe(
      "2026-06-30",
    );
  });

  /** The lookback window subtracts whole days in ms; an off-by-a-day here would pull the wrong transaction range on every sync. */
  it("subtracts whole days from a millisecond instant", () => {
    expect(DateTimeUtility.getMillisDaysBefore(864_000_000, 3)).toBe(
      604_800_000,
    );
  });

  /** SimpleFIN's start-date query is epoch seconds, so the ms→s conversion must floor rather than round to avoid nudging the window forward. */
  it("floors the days-before instant to epoch seconds", () => {
    expect(DateTimeUtility.getEpochSecondsDaysBefore(604_800_500, 0)).toBe(
      604_800,
    );
  });
});
