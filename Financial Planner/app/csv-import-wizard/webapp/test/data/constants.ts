// Named inputs for the CSV Import Wizard unit tests: the selected card, the files a
// user uploads, the taxonomy ids a categorization carries, and what the parse,
// reclassify and save actions answer with. Row shapes are built in ./rows.

/** The card instance the user picks in step 1. */
export const CARD_INSTANCE_ID = {
  SCOTIA_GOLD: "3d9e2c41-7a5b-4f60-9b1e-2c8d4a6f0b01",
} as const;

/** Taxonomy ids a New-tab row's categorization points at. */
export const TAXONOMY_ID = {
  VENDOR_AMAZON: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f10",
  VENDOR_COFFEE_SHOP: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f11",
  PURCHASE_TYPE_SHOPPING: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f20",
  PURCHASE_TYPE_DINING: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f21",
  EARNING_CATEGORY_ONLINE: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f30",
  EARNING_CATEGORY_DINING: "c41a7e20-3b6d-4f95-8a02-6e1d9b3c5f31",
} as const;

/** Existing transaction ids a potential duplicate matched. */
export const MATCHED_ID = {
  AMAZON: "8f2b6d13-1c4e-4a7b-9d30-5e6f7a8b9c01",
  COFFEE: "8f2b6d13-1c4e-4a7b-9d30-5e6f7a8b9c02",
  UNREADABLE: "8f2b6d13-1c4e-4a7b-9d30-5e6f7a8b9c03",
} as const;

/** Raw descriptions — repeated ones are what Clear propagation keys on. */
export const DESCRIPTION = {
  AMAZON: "AMZN MKTP US",
  COFFEE: "TIM HORTONS #1123",
  TODOIST: "todoist",
} as const;

/** Uploaded CSV files, as the step-1 reader yields them. */
export const CSV_FILE = {
  JANUARY: {
    name: "scotia-2026-01.csv",
    content: "Date,Description,Amount\n2026-01-03,AMZN MKTP US,-42.10",
  },
  FEBRUARY: {
    name: "scotia-2026-02.csv",
    content: "Date,Description,Amount\n2026-02-07,TIM HORTONS #1123,-4.25",
  },
} as const;

/** The combined file-name label the wizard records for an import. */
export const FILE_NAMES_LABEL = {
  BOTH: "scotia-2026-01.csv, scotia-2026-02.csv",
} as const;

/** The format config the card's issuer resolves to. */
export const CONFIG_NAME = {
  SCOTIA: "Scotiabank Gold Amex",
} as const;

/** Cardholder names the Amex cardmember column carries (BR-33). */
export const CARDHOLDER = {
  SUPPLEMENTARY: "SUPPLEMENTARY CARDMEMBER",
} as const;

/** A value the user corrects a failed Excluded cell to. */
export const CORRECTION = {
  DATE: "2026-01-15",
  BLANK: "   ",
} as const;

/** Names typed into the create-reference dialog. */
export const REFERENCE_NAME = {
  TYPED: "  Amazon Marketplace  ",
  TRIMMED: "Amazon Marketplace",
  BLANK: "   ",
} as const;

/** OData paths the service binds — mirrors the app's ODATA_PATH, asserted as the contract. */
export const ODATA_PATH = {
  PARSE: "/parseCsvImport(...)",
  RECLASSIFY: "/reclassifyCsvRow(...)",
  SAVE: "/saveCsvImport(...)",
  VENDORS: "/Vendors",
  EARNING_CATEGORIES: "/EarningCategories",
  AMAZON_TRANSACTION: "/Transactions(8f2b6d13-1c4e-4a7b-9d30-5e6f7a8b9c01)",
  COFFEE_TRANSACTION: "/Transactions(8f2b6d13-1c4e-4a7b-9d30-5e6f7a8b9c02)",
} as const;

/** Stable control ids and the fragment the controller addresses. */
export const WIZARD_CONTROL = {
  NEW_TABLE: "idNewRowsTable",
  WIZARD: "idImportWizard",
  DROP_ZONE: "idDropZoneVBox",
  CREATE_DIALOG: "idCreateReferenceDialog",
  CREATE_FRAGMENT: "com.financialplanner.csvimportwizard.view.CreateReferenceDialog",
} as const;

/** The created-reference row the backend answers a create with. */
export const CREATED_VENDOR = {
  ID: TAXONOMY_ID.VENDOR_AMAZON,
  name: "Amazon Marketplace",
} as const;

/** The post-import summary saveCsvImport returns. */
export const IMPORT_SUMMARY = {
  importLogId: "5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c01",
  transactionCount: 2,
  totalAmount: -46.35,
  topVendorName: "Amazon",
} as const;

/** The rejection a failed OData call surfaces. */
export const SERVICE_FAILURE = {
  MESSAGE: "TransactionService action rejected",
} as const;
