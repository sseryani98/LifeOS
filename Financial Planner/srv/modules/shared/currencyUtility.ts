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

  /**
   * Rounds a monetary value to whole cents, clearing binary-float drift (e.g.
   * 110 × 0.2 → 22.00) so stored amounts reconcile exactly.
   * @param amount Monetary value in dollars.
   * @returns The amount rounded to two decimal places.
   */
  static roundToCents(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
