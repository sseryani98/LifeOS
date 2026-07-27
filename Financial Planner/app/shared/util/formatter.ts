/**
 * Formatter functions for display logic.
 */
const formatter = {
  /**
   * Formats a signed amount to two decimals for review tables and totals.
   * @param value the raw amount
   * @returns the amount fixed to two decimals, or "" when absent
   */
  formatAmount(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return Number(value).toFixed(2);
  },

  /**
   * Formats a numeric amount as Canadian dollars.
   * @param amount the amount to format
   * @returns formatted currency string (e.g. "$1,234.56"), or "" when empty
   */
  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return "";
    }
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  },

  /**
   * Formats an ISO date string to a user-friendly display format.
   * @param date ISO date string (YYYY-MM-DD or full ISO)
   * @returns formatted date string (e.g. "Feb 21, 2026"), or "" when empty
   */
  formatDate(date: string | null | undefined): string {
    if (!date) {
      return "";
    }
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  /**
   * Maps a status code to a display-friendly text.
   * @param status the status code
   * @returns human-readable status text, or "" when empty
   */
  formatStatus(status: string | null | undefined): string {
    if (!status) {
      return "";
    }
    const statusMap: Record<string, string> = {
      focus: "Focus",
      active: "Active",
      toCancel: "To Cancel",
      closed: "Closed",
      pending: "Pending",
      approved: "Approved",
      excluded: "Excluded",
    };
    return statusMap[status] || status;
  },

  /**
   * Coerces a text input to a number, treating blank as absent. Shared so
   * dialogs and forms parse numeric inputs one way instead of re-declaring it.
   * @param value the raw input value
   * @returns the number, or null when blank
   */
  toNumber(value: string | null | undefined): number | null {
    return value === "" || value === undefined || value === null ? null : Number(value);
  },
};

export default formatter;
