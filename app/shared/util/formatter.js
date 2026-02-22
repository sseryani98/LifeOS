sap.ui.define([], function () {
  "use strict";

  /**
   * Formatter functions for display logic.
   * Used in XML view bindings: { formatter: '.formatter.formatCurrency' }
   */
  return {
    /**
     * Formats a numeric amount as Canadian dollars.
     * @param {number} fAmount - the amount to format
     * @returns {string} formatted currency string (e.g., "$1,234.56")
     */
    formatCurrency: function (fAmount) {
      if (fAmount === null || fAmount === undefined) {
        return "";
      }
      return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD"
      }).format(fAmount);
    },

    /**
     * Formats an ISO date string to a user-friendly display format.
     * @param {string} sDate - ISO date string (YYYY-MM-DD or full ISO)
     * @returns {string} formatted date string (e.g., "Feb 21, 2026")
     */
    formatDate: function (sDate) {
      if (!sDate) {
        return "";
      }
      var oDate = new Date(sDate);
      return oDate.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    },

    /**
     * Maps a status code to a display-friendly text.
     * @param {string} sStatus - the status code
     * @returns {string} human-readable status text
     */
    formatStatus: function (sStatus) {
      if (!sStatus) {
        return "";
      }
      var mStatusMap = {
        focus: "Focus",
        active: "Active",
        toCancel: "To Cancel",
        closed: "Closed",
        pending: "Pending",
        approved: "Approved",
        excluded: "Excluded"
      };
      return mStatusMap[sStatus] || sStatus;
    }
  };
});
