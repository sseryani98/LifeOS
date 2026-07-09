/** Canadian-dollar formatting parameters. */
const CURRENCY = {
  LOCALE: "en-CA",
  CODE: "CAD",
} as const;

/**
 * Currency formatting utility for Canadian dollar amounts.
 */
export class CurrencyUtility {
  /**
   * Formats a numeric amount as Canadian dollars (e.g., "$1,234.56").
   * @param amount Monetary value in dollars.
   * @returns The amount rendered as a localized CAD currency string.
   */
  static formatCAD(amount: number): string {
    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      style: "currency",
      currency: CURRENCY.CODE,
    }).format(amount);
  }
}
