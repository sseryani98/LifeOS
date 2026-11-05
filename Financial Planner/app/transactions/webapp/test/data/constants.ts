// Named inputs for the TransactionActions unit tests: selected-row ids and the
// values a user enters in the Apply Categories and Split dialogs. Dialog inputs
// are strings because the fragments bind `type="Number"` Inputs, which yield text.

/** Transaction row ids the fake ListReport selection returns. */
export const TRANSACTION_ID = {
  COFFEE: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a01",
  GROCERIES: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a02",
  PADEL: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a03",
} as const;

/** The dialog fragments the ListReport actions must load, by module name. */
export const FRAGMENT_NAME = {
  APPLY_CATEGORIES:
    "com.financialplanner.transactions.ext.fragment.ApplyCategoriesDialog",
  SPLIT: "com.financialplanner.transactions.ext.fragment.SplitDialog",
} as const;

/** Taxonomy ids the Apply Categories dialog's value helps would return. */
export const TAXONOMY_ID = {
  VENDOR_COFFEE_SHOP: "a7c3e1d0-5b2f-4e8a-8c11-0d9f6e4b2a10",
  PURCHASE_TYPE_DINING: "a7c3e1d0-5b2f-4e8a-8c11-0d9f6e4b2a20",
  EARNING_CATEGORY_DINING: "a7c3e1d0-5b2f-4e8a-8c11-0d9f6e4b2a30",
} as const;

/** What the user has entered in the Apply Categories dialog at confirm time. */
export const APPLY_INPUT = {
  FULL: {
    vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP,
    purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_DINING,
    earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_DINING,
  },
  VENDOR_ONLY: {
    vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP,
    purchaseType_ID: "",
    earningCategory_ID: "",
  },
  NO_VENDOR: {
    vendor_ID: "",
    purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_DINING,
    earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_DINING,
  },
} as const;

/** What the user has entered in the Split dialog at confirm time. */
export const SPLIT_INPUT = {
  PERCENT_SHARE: {
    mySharePct: "25",
    myShareAmount: "",
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  AMOUNT_SHARE: {
    mySharePct: "",
    myShareAmount: "12.50",
    splitDescription: "",
    isRecurring: false,
  },
  ZERO_PERCENT_SHARE: {
    mySharePct: "0",
    myShareAmount: "",
    splitDescription: "",
    isRecurring: false,
  },
} as const;

/** What the Split dialog's entries must reach the backend as. */
export const SPLIT_EXPECTED = {
  PERCENT_FRACTION: 0.25,
  AMOUNT: 12.5,
} as const;

/** The rejection a failed OData action surfaces to the caller. */
export const SERVICE_FAILURE = {
  MESSAGE: "TransactionService action rejected",
} as const;
