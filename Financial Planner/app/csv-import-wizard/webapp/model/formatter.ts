/**
 * Display formatters for the CSV Import Wizard. Object-literal module — no
 * UI5 class, so no @namespace is needed.
 */
const formatter = {
  /**
   * Maps a cleared flag to the row's ObjectStatus semantic state.
   * @param cleared whether the row has been cleared
   * @returns "Success" when cleared, "None" otherwise
   */
  formatClearedState(cleared: boolean): string {
    return cleared ? "Success" : "None";
  },

  /**
   * Renders a vendor name for the summary, falling back to a dash when the
   * batch had no categorized vendor.
   * @param name the top vendor name, or null
   * @returns the name, or an em dash when absent
   */
  formatVendorName(name: string | null | undefined): string {
    return name ? name : "—";
  },
};

export default formatter;
