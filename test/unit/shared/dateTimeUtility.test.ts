import { DateTimeUtility } from "../../../srv/modules/shared/dateTimeUtility.js";

describe("DateTimeUtility", () => {
  it("formats a date as an ISO yyyy-mm-dd string", () => {
    expect(DateTimeUtility.formatDate(new Date(Date.UTC(2026, 5, 15)))).toBe(
      "2026-06-15",
    );
  });

  it("returns the first day of the month", () => {
    expect(DateTimeUtility.startOfMonth(new Date(2026, 5, 15))).toBe(
      "2026-06-01",
    );
  });

  it("returns the last day of the month", () => {
    expect(DateTimeUtility.endOfMonth(new Date(2026, 5, 15))).toBe("2026-06-30");
  });
});
