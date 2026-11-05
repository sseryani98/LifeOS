// Transactions app constants.

/**
 * Dialog fragment module names, the control id of each dialog (for close/byId),
 * and the JSON model names their inputs bind to.
 */
export const DIALOG = {
  APPLY_FRAGMENT:
    "com.financialplanner.transactions.ext.fragment.ApplyCategoriesDialog",
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
  SPLIT_REFUSED: "msgSplitRefused",
  APPLY_REFUSED: "msgApplyRefused",
  SPLIT_PERCENT_RANGE: "msgSplitPercentRange",
  SPLIT_AMOUNT_DECIMALS: "msgSplitAmountDecimals",
  SPLIT_PERCENT_DECIMALS: "msgSplitPercentDecimals",
} as const;

/** OData V4 operation paths the TransactionsService invokes. */
export const ODATA_OPERATION = {
  RECATEGORIZE: "/TransactionService.reCategorize(...)",
  SPLIT: "/TransactionService.splitTransaction(...)",
  BULK_CATEGORIZE: "/TransactionService.bulkCategorize(...)",
  SUGGEST_RECURRING_SPLIT: "/suggestRecurringSplit(...)",
} as const;

/** Precision of a suggested percentage seeded into the Split dialog (0–100 field). */
export const SPLIT_SEED = {
  PCT_DECIMALS: 2,
} as const;

/** Decimals an entered 0–100 share may carry, and its 0–1 fraction's, so the fraction fits Decimal(5,4). */
export const SPLIT_PERCENT = {
  DECIMALS: 2,
  FRACTION_DECIMALS: 4,
  MIN: 0,
  MAX: 100,
} as const;

/**
 * Dialog fields a refusal flags inline: each binds `{field}State` and
 * `{field}StateText` in its dialog's JSON model. An absent pair reads as no state.
 */
export const DIALOG_FIELD = {
  SPLIT_PERCENT: "mySharePct",
  SPLIT_AMOUNT: "myShareAmount",
  APPLY_VENDOR: "vendor",
  STATE_SUFFIX: "State",
  TEXT_SUFFIX: "StateText",
} as const;

/** The Split dialog's dollar share: cents precision (Decimal(15,2)) and the row property a percentage is computed on. */
export const SPLIT_AMOUNT = {
  DECIMALS: 2,
  ROW_PATH: "amount",
} as const;

/** The split property the backend recomputes when the object page edits My Share %. */
export const SPLIT_SHARE = {
  AMOUNT_PATH: "myShareAmount",
} as const;

/** Where a row's own split is read, for a re-split's opening terms: the active entity's split. */
export const EXISTING_SPLIT = {
  ENTITY_SET: "/Transactions",
  NAVIGATION: "split",
} as const;

/** What a refused object-page edit re-reads once its pending change is dropped. */
export const REFUSED_EDIT = {
  REFRESH: [
    { $PropertyPath: "split/mySharePct" },
    { $PropertyPath: "split/myShareAmount" },
  ],
} as const;

/** The key marker of the states FE computes per record (criticality) in its local annotation model. */
export const VIRTUAL_STATE = {
  MARKER: "@$ui5.fe.virtual.",
} as const;
