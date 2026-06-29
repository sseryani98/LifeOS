import { CurrencyUtility } from "../../../srv/modules/shared/currencyUtility.js";

describe("CurrencyUtility", () => {
  it("formats a number as Canadian dollars", () => {
    expect(CurrencyUtility.formatCAD(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(CurrencyUtility.formatCAD(0)).toBe("$0.00");
  });
});
