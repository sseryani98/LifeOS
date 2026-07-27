// Transactions app constants.

/**
 * Dialog fragment module names, the control id of each dialog (for close/byId),
 * and the JSON model names their inputs bind to.
 */
export const DIALOG = {
  APPLY_FRAGMENT: "com.financialplanner.transactions.ext.fragment.ApplyCategoriesDialog",
  SPLIT_FRAGMENT: "com.financialplanner.transactions.ext.fragment.SplitDialog",
  APPLY_DIALOG_ID: "idApplyCategoriesDialog",
  SPLIT_DIALOG_ID: "idSplitDialog",
  APPLY_MODEL: "applyModel",
  SPLIT_MODEL: "splitModel",
} as const;

/** i18n keys for the toolbar-action toasts and guards. */
export const MESSAGE_KEY = {
  NO_SELECTION: "msgNoSelection",
  VENDOR_REQUIRED: "msgVendorRequired",
  SPLIT_ONE_ROW: "msgSplitOneRow",
  CATEGORIES_APPLIED: "msgCategoriesApplied",
  RECATEGORIZED: "msgRecategorized",
  SPLIT_SAVED: "msgSplitSaved",
} as const;
