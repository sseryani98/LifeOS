import { CurrencyUtility } from "../../../srv/modules/shared/currencyUtility.js";

describe("CurrencyUtility", () => {
  /** User-facing money must always show the CAD symbol, thousands separators, and exactly two decimals; a locale-driven format shift would mislead the single Canadian user reading balances. */
  it("formats a number as Canadian dollars", () => {
    expect(CurrencyUtility.formatCAD(1234.56)).toBe("$1,234.56");
  });

  /** Zero is a common balance and must render as $0.00, not an empty string or bare 0, so cleared/empty amounts still read as currency. */
  it("formats zero", () => {
    expect(CurrencyUtility.formatCAD(0)).toBe("$0.00");
  });
});
