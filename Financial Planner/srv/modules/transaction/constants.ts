// Transaction-module constants.

/** Fully-qualified entity names — string refs per the project CQL convention. */
export const ENTITIES = {
  TRANSACTION: "com.financialplanner.Transaction",
  TRANSACTION_SPLIT: "com.financialplanner.TransactionSplit",
  VENDOR: "com.financialplanner.Vendor",
  PURCHASE_TYPE: "com.financialplanner.PurchaseType",
  EARNING_CATEGORY: "com.financialplanner.EarningCategory",
  VENDOR_CATEGORY_STATS: "com.financialplanner.VendorCategoryStats",
  TRANSACTION_DRAFT: "TransactionService.Transactions.drafts",
} as const;

/** i18n message keys for split validation and lookup failures. */
export const SPLIT_MESSAGE = {
  ENTER_ONE_INPUT: "transaction.split.enterOneInput",
  NO_INPUT: "transaction.split.noInput",
  AMOUNT_NEGATIVE: "transaction.split.amountNegative",
  AMOUNT_EXCEEDS_TOTAL: "transaction.split.amountExceedsTotal",
  TRANSACTION_NOT_FOUND: "transaction.split.transactionNotFound",
} as const;

/** i18n message keys for the bulk categorization / re-categorization actions. */
export const BULK_MESSAGE = {
  NO_SELECTION: "transaction.recategorize.noSelection",
} as const;

/** i18n message keys shared by bulk apply and single-row correction. */
export const CATEGORIZE_MESSAGE = {
  UNKNOWN_REFERENCE: "transaction.categorize.unknownReference",
} as const;

/** i18n message keys for a single-transaction categorization correction. */
export const CORRECT_MESSAGE = {
  TRANSACTION_REQUIRED: "transaction.correct.transactionRequired",
  VENDOR_REQUIRED: "transaction.correct.vendorRequired",
  TRANSACTION_NOT_FOUND: "transaction.correct.transactionNotFound",
} as const;

/** The virtual columns the object page's suggestions section reads from the matcher. */
export const MATCH_SUGGESTION = {
  COLUMNS: ["matchedPattern", "matchConfidence"],
} as const;
