/** Currency formatting locale for Canadian dollars. */
const LOCALE = "en-CA";

/** Currency code for Canadian dollars. */
const CURRENCY = "CAD";

/**
 * Currency formatting utility for Canadian dollar amounts.
 */
export class CurrencyUtility {
  /** Formats a numeric amount as Canadian dollars (e.g., "$1,234.56"). */
  static formatCAD(amount: number): string {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
    }).format(amount);
  }
}
