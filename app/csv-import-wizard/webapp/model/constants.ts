/** Dedup outcomes the parse action tags each classified row with. */
export const DEDUP_OUTCOME = {
  NEW: "new",
  POTENTIAL_DUPLICATE: "potential_duplicate",
} as const;

/** Per-row decision on a potential duplicate (Potential Duplicates tab). */
export const DUPLICATE_DECISION = {
  SKIP: "skip",
  IMPORT: "import",
} as const;

/** Lifecycle states a card instance can be in — the picker excludes closed ones. */
export const CARD_LIFECYCLE = {
  CLOSED: "closed",
} as const;

/** The three review tabs and the keys their badge counts bind to. */
export const REVIEW_TAB = {
  NEW: "new",
  DUPLICATES: "duplicates",
  EXCLUDED: "excluded",
} as const;

/** i18n keys for on-the-fly creation dialogs, keyed by the entity created. */
export const CREATE_DIALOG = {
  VENDOR: {
    ENTITY_SET: "/Vendors",
    TITLE_KEY: "newVendorTitle",
  },
  EARNING_CATEGORY: {
    ENTITY_SET: "/EarningCategories",
    TITLE_KEY: "newEarningCategoryTitle",
  },
} as const;

/** Stable control ids the controller resolves via byId for structural DOM ops. */
export const CONTROL_ID = {
  CREATE_DIALOG: "idCreateReferenceDialog",
  NEW_TABLE: "idNewTable",
  WIZARD: "idImportWizard",
  DROP_ZONE: "idDropZoneVBox",
} as const;

/** The create-reference dialog fragment, loaded on demand. */
export const CREATE_DIALOG_FRAGMENT =
  "com.financialplanner.csvimportwizard.view.CreateReferenceDialog";

/** Full-progress percentage for the clear-progress indicator. */
export const PERCENT_MAX = 100;
