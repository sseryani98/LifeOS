// Transaction-module constants.

/** Fully-qualified entity names — string refs per the project CQL convention. */
export const ENTITIES = {
  TRANSACTION: "com.financialplanner.Transaction",
  TRANSACTION_SPLIT: "com.financialplanner.TransactionSplit",
} as const;

/** i18n message keys for split validation and lookup failures. */
export const SPLIT_MESSAGE = {
  ENTER_ONE_INPUT: "transaction.split.enterOneInput",
  AMOUNT_EXCEEDS_TOTAL: "transaction.split.amountExceedsTotal",
  TRANSACTION_NOT_FOUND: "transaction.split.transactionNotFound",
} as const;

/** i18n message keys for the bulk categorization / re-categorization actions. */
export const BULK_MESSAGE = {
  NO_SELECTION: "transaction.recategorize.noSelection",
} as const;

/** i18n message keys for a single-transaction categorization correction. */
export const CORRECT_MESSAGE = {
  TRANSACTION_REQUIRED: "transaction.correct.transactionRequired",
  VENDOR_REQUIRED: "transaction.correct.vendorRequired",
} as const;
