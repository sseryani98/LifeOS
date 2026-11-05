// Named inputs for the CategorizationActions and SplitActions unit tests: selected-row ids and the
// values a user enters in the Apply Categories and Split dialogs. Dialog inputs
// are strings because the fragments bind `type="Number"` Inputs, which yield text.

/** Transaction row ids the fake ListReport selection returns. */
export const TRANSACTION_ID = {
  COFFEE: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a01",
  GROCERIES: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a02",
  PADEL: "6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a03",
} as const;

/**
 * Each fake row's signed amount as the list's OData V4 context holds it (Decimals
 * as strings): the Padel charge is the $120 every percentage suggestion is computed on.
 */
export const ROW_AMOUNT: Readonly<Record<string, string>> = {
  [TRANSACTION_ID.PADEL]: "-120.00",
};

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
  AMOUNT_EDITED_ON_PERCENT_SUGGESTION: {
    mySharePct: 20,
    myShareAmount: "30",
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  BOTH_SHARES: {
    mySharePct: "25",
    myShareAmount: "12.50",
    splitDescription: "",
    isRecurring: false,
  },
  PERCENT_EDITED_ON_PERCENT_SUGGESTION: {
    mySharePct: "30",
    myShareAmount: 24,
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  THREE_DECIMAL_AMOUNT: {
    mySharePct: null,
    myShareAmount: 12.345,
    splitDescription: "",
    isRecurring: false,
  },
  THREE_DECIMAL_PERCENT: {
    mySharePct: "12.345",
    myShareAmount: "",
    splitDescription: "",
    isRecurring: false,
  },
  OVER_HUNDRED_PERCENT: {
    mySharePct: "150",
    myShareAmount: null,
    splitDescription: "",
    isRecurring: false,
  },
  NEGATIVE_PERCENT: {
    mySharePct: "-5",
    myShareAmount: null,
    splitDescription: "",
    isRecurring: false,
  },
} as const;

/**
 * The reasons a dialog refusal states, read from the app's i18n bundle: the same
 * text fills the refusal message and the flagged field's state text.
 */
export const REFUSAL_TEXT = {
  VENDOR_REQUIRED: "Choose a vendor",
  PERCENT_RANGE: "Enter a percentage between 0 and 100",
  AMOUNT_DECIMALS: "Enter an amount with no more than 2 decimal places",
  PERCENT_DECIMALS: "Enter a percentage with no more than 2 decimal places",
} as const;

/** A flagged field's valueState pair, as the dialog's JSON model holds it. */
export const FIELD_STATE = {
  ERROR: "Error",
  NONE: "None",
} as const;

/** What the Split dialog's entries must reach the backend as. */
/** Every two-decimal percentage the dialog accepts, in hundredths (0.01–100.00), and the fraction shape Decimal(5,4) takes. */
export const PERCENT_SWEEP = {
  FIRST_HUNDREDTHS: 1,
  LAST_HUNDREDTHS: 10000,
  HUNDREDTHS_PER_PERCENT: 100,
  FRACTION_SHAPE: /^\d(\.\d{1,4})?$/,
} as const;

export const SPLIT_EXPECTED = {
  PERCENT_FRACTION: 0.25,
  AMOUNT: 12.5,
  EDITED_AMOUNT: 30,
  EDITED_PERCENT_FRACTION: 0.3,
  AMOUNT_AT_EDITED_PERCENT: 36,
  AMOUNT_AT_PERCENT_SHARE: 30,
  SUGGESTED_PERCENT_FRACTION: 0.2,
} as const;

/** The rejection a failed OData action surfaces to the caller. */
export const SERVICE_FAILURE = {
  MESSAGE: "TransactionService action rejected",
  AMOUNT_TOO_HIGH: "Your share cannot exceed the transaction amount",
  AMOUNT_TARGET: "$Parameter/myShareAmount",
} as const;

/** A multi-row ListReport selection, as the service receives it from the action handler. */
export const SELECTION: { COFFEE_AND_GROCERIES: string[] } = {
  COFFEE_AND_GROCERIES: [TRANSACTION_ID.COFFEE, TRANSACTION_ID.GROCERIES],
};

/**
 * A vendor's recurring split template as the suggestion function returns it on the
 * wire (Decimals as strings): a 20% share recomputed on a $120 row, and a fixed $15.
 */
export const SUGGESTION_PAYLOAD = {
  PERCENT_BASED: {
    mySharePct: "0.2000",
    myShareAmount: "24.00",
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  DOLLAR_BASED: {
    mySharePct: null,
    myShareAmount: "15.00",
    splitDescription: "Court booking share",
    isRecurring: true,
  },
} as const;

/** The same templates once the service has turned the Decimals into numbers. */
export const SUGGESTION = {
  PERCENT_BASED: {
    mySharePct: 0.2,
    myShareAmount: 24,
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  DOLLAR_BASED: {
    mySharePct: null,
    myShareAmount: 15,
    splitDescription: "Court booking share",
    isRecurring: true,
  },
  PERCENT_FLOAT_NOISE: {
    mySharePct: 0.07,
    myShareAmount: 8.4,
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
} as const;

/** What the Split dialog's model must open with for each suggestion; the % field takes 0–100. */
export const SUGGESTED_SEED = {
  PERCENT_BASED: {
    mySharePct: 20,
    myShareAmount: 24,
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
  DOLLAR_BASED: {
    mySharePct: null,
    myShareAmount: 15,
    splitDescription: "Court booking share",
    isRecurring: true,
  },
  PERCENT_FLOAT_NOISE: {
    mySharePct: 7,
    myShareAmount: 8.4,
    splitDescription: "Padel with friends",
    isRecurring: true,
  },
} as const;

/** A suggestion confirmed untouched reaches the backend as the template's own terms. */
export const SUGGESTED_SPLIT_EXPECTED = {
  PERCENT_FRACTION: 0.2,
  AMOUNT: 15,
} as const;

/** Where the journey enters the Transaction List, and the ids FE derives for it. */
export const JOURNEY_PAGE = {
  SHELL_ROUTE: "/index.html#/TransactionsList",
  SHELL_HOME: "/index.html",
  LIST_HASH: "TransactionsList",
  LIST_PAGE_ID:
    "com.financialplanner.transactions::TransactionsList--fe::ListReport",
  FILTER_BAR_ID:
    "com.financialplanner.transactions::TransactionsList--fe::FilterBar::Transactions",
  TABLE_ID:
    "com.financialplanner.transactions::TransactionsList--fe::table::Transactions::LineItem",
  SPLIT_ACTION_ID:
    "com.financialplanner.transactions::TransactionsList--fe::table::Transactions::LineItem::CustomAction::Split",
  APPLY_ACTION_ID:
    "com.financialplanner.transactions::TransactionsList--fe::table::Transactions::LineItem::CustomAction::ApplyCategories",
  EDIT_ACTION_ID:
    "com.financialplanner.transactions::TransactionsObjectPage--fe::StandardAction::Edit",
  AMOUNT_EDIT_INPUT_SUFFIX: "DataField::myShareAmount::Field-edit-inner-inner",
} as const;

/** The dialog controls the journey drives, by their ExtensionAPI-namespaced ids. */
export const JOURNEY_DIALOG = {
  SPLIT: "SplitDialog--idSplitDialog",
  SPLIT_PCT: "SplitDialog--idMySharePctSplitInput",
  SPLIT_AMOUNT: "SplitDialog--idMyShareAmountSplitInput",
  SPLIT_DESCRIPTION: "SplitDialog--idSplitDescriptionInput",
  SPLIT_RECURRING: "SplitDialog--idSplitRecurringCheckBox",
  SPLIT_CANCEL: "SplitDialog--idCancelSplitButton",
  APPLY: "ApplyCategoriesDialog--idApplyCategoriesDialog",
  APPLY_CANCEL: "ApplyCategoriesDialog--idCancelApplyButton",
} as const;

/**
 * The journey seed (test/journey/data): a new $120 Padel Haus charge whose vendor
 * has a 20% recurring split, so the Split dialog opens on 20 / 24, and a September
 * charge split by a $30 amount alone, so its percentage is empty.
 */
export const JOURNEY_SEED = {
  NEW_PADEL_DESCRIPTION: "PADEL HAUS TORONTO NOV",
  SPLIT_PADEL_DESCRIPTION: "PADEL HAUS TORONTO OCT",
  SPLIT_PADEL_SHARE_PCT: "20",
  DOLLAR_SPLIT_PADEL_DESCRIPTION: "PADEL HAUS TORONTO SEP",
  SUGGESTED_PCT: "20",
  SUGGESTED_AMOUNT: "24.00",
  SUGGESTED_DESCRIPTION: "Padel with friends",
} as const;

/**
 * Edits the journey makes in the NOV Split dialog ($120 row): an amount, which
 * must clear the percentage, then a percentage, whose amount must be recomputed.
 */
export const JOURNEY_SPLIT_EDIT = {
  AMOUNT: "30",
  CLEARED_PCT: "",
  PCT: "50",
  RECOMPUTED_AMOUNT: "60.00",
  OUT_OF_RANGE_PCT: "150",
  ERROR_STATE: "Error",
} as const;

/**
 * Labels the page shows in two places and must word alike: the default filter's
 * status, and the dialog wording the object page and the toolbar already use.
 */
export const JOURNEY_LABEL = {
  DEFAULT_STATUS_TOKEN: "Uncategorized",
  SPLIT_DESCRIPTION: "Split Description",
  APPLY_CATEGORIES: "Apply Categories",
  SAVE_SPLIT: "Save Split",
  VENDOR: "Vendor",
  EMPTY_INDICATOR: "–",
  PERCENT_UNIT: "%",
  DATE_COLUMN: "Date",
  TRANSACTION_DATE: "Transaction Date",
  SPLIT_ICON: "sap-icon://split",
  LABEL_TYPE: "sap.m.Label",
  BUTTON_TYPE: "sap.m.Button",
} as const;

/** How a numeric share input must look on both surfaces: aligned as FE aligns My Share Amount, dashed when empty. */
export const JOURNEY_SHARE_INPUT = {
  TEXT_ALIGN: "End",
  EMPTY_LOOK: { textAlign: "End", placeholder: JOURNEY_LABEL.EMPTY_INDICATOR },
} as const;

/**
 * How each Split dialog share input must read beside the object page: the amount
 * affixed CAD as FE affixes it, the percentage affixed % with a dash when empty.
 */
export const JOURNEY_SPLIT_INPUT_LOOK = {
  PCT: { description: "%", placeholder: JOURNEY_LABEL.EMPTY_INDICATOR },
  AMOUNT: { description: "CAD", placeholder: "" },
} as const;

/** The two desktop widths the object page's Details layout must hold at: the responsive form reflows between them. */
export const JOURNEY_FRAME = {
  DESKTOP: { width: 1440, height: 900 },
  WIDE: { width: 1920, height: 1080 },
} as const;

/** The one control Recurring renders as on both surfaces: FE renders a Boolean in a FieldGroup only as a CheckBox. */
export const JOURNEY_RECURRING = {
  PROPERTY: "isRecurring",
  CONTROL_TYPE: "sap.m.CheckBox",
} as const;

/** The Transaction Details sub-groups' headings in order, found from a field the section holds. */
export const JOURNEY_DETAILS_GROUPS = {
  ANCHOR_LABEL: "Purchase Type",
  TITLES: ["Vendor & Category", "Posting", "Your Input"],
  SECTION_TYPE: "sap.uxap.ObjectPageSection",
} as const;

/** The one width both label-over-field list dialogs open at, in px (24rem). */
export const JOURNEY_DIALOG_WIDTH = {
  PX: 384,
} as const;

/** What the Split dialog's first load logged when FE's templating could not see the fragment's core:require. */
export const JOURNEY_LOG = {
  UNRESOLVED_TYPE: "Failed to resolve type",
} as const;

/** The header status of a user-corrected row: Information blue (THEME §3.3), never the neutral it was reported as. */
export const JOURNEY_HEADER_STATUS = {
  FACET_ID_PART: "HeaderFacet::Form::StatusHeader",
  USER_CORRECTED: {
    text: "User Corrected",
    state: "Information",
    icon: "sap-icon://information",
  },
} as const;

/** Two seeded user-corrected rows (SEP, OCT): one criticality, so a hash move between them is the case FE never re-states. */
export const JOURNEY_RECORD = {
  SEP_ID: "7e5d0002-0000-4000-8000-000000000003",
  OCT_ID: "7e5d0002-0000-4000-8000-000000000001",
  OCT_HASH:
    "Transactions(ID=7e5d0002-0000-4000-8000-000000000001,IsActiveEntity=true)",
} as const;

/** The share property an object-page My Share % edit must re-read: the backend recomputes it. */
export const SPLIT_SHARE_REFRESH = {
  AMOUNT_PATH: "myShareAmount",
} as const;

/** The row's own split as the active entity's split navigation returns it (Decimals as strings): one-off, with a description. */
export const EXISTING_SPLIT_PAYLOAD = {
  mySharePct: "0.2000",
  myShareAmount: "22.00",
  splitDescription: "Padel with friends",
  isRecurring: false,
} as const;

/** The row's own split once the service has turned the Decimals into numbers. */
export const EXISTING_SPLIT = {
  PERCENT_BASED: {
    mySharePct: 0.2,
    myShareAmount: 22,
    splitDescription: "Padel with friends",
    isRecurring: false,
  },
} as const;

/** The Split dialog's opening values on a re-split: the existing terms, description and recurring flag kept. */
export const EXISTING_SPLIT_SEED = {
  PERCENT_BASED: {
    mySharePct: 20,
    myShareAmount: 22,
    splitDescription: "Padel with friends",
    isRecurring: false,
  },
} as const;

/** Where a row's existing split is read: the active entity's split navigation. */
export const EXISTING_SPLIT_PATH = {
  PADEL:
    "/Transactions(ID=6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a03,IsActiveEntity=true)/split",
} as const;

/** What a refused object-page edit must re-read once its pending change is dropped: both split shares. */
export const REFUSED_EDIT_REFRESH = {
  SPLIT_SHARES: [
    { $PropertyPath: "split/mySharePct" },
    { $PropertyPath: "split/myShareAmount" },
  ],
} as const;

/** The object page's headings and its section cards, which must share one left edge at every width. */
export const JOURNEY_OBJECT_PAGE_EDGE = {
  HEADINGS:
    ".sapUxAPObjectPageHeaderTitle .sapFDynamicPageTitleMainHeadingInner .sapMTitle, .sapUxAPObjectPageSectionTitle, .sapUxAPObjectPageSubSectionTitle",
  CARDS: ".sapUxAPBlockContainer",
} as const;

/** The object page's anchor bar, whose items, overflow buttons and expand icons carry no radius (THEME §4). */
export const JOURNEY_ANCHOR_BAR = {
  ID_SUFFIX: "fe::ObjectPage-anchBar",
  EXPAND_ICON: ".sapMITBFilterExpandIcon",
  PSEUDOS: ["::before", "::after"],
} as const;

/** FE's local annotation model keys for two records, and the computed states it holds per record. */
export const VIRTUAL_STATES = {
  LEFT_PATH:
    "/Transactions(ID=6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a03,IsActiveEntity=true)",
  OPENED_PATH:
    "/Transactions(ID=6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a01,IsActiveEntity=true)",
  UNSTATED_PATH:
    "/Transactions(ID=6b1f0c52-0d4e-4c7a-9a51-1f2e7d3c0a02,IsActiveEntity=true)",
  HEADER_KEY:
    "TransactionService.Transactions@com.sap.vocabularies.UI.v1.DataPoint#Status@$ui5.fe.virtual.criticality",
  GROUP_KEY:
    "TransactionService.Transactions@com.sap.vocabularies.UI.v1.FieldGroup#Suggestions",
  FIELD_KEY: "2@$ui5.fe.virtual.criticality",
  MESSAGE_KEY: "amount@$ui5.fe.messageType",
  INFORMATION: "UI.CriticalityType/Information",
  POSITIVE: "UI.CriticalityType/Positive",
  MESSAGE_TYPE: "Error",
} as const;

/** The left record's node: a header state, a nested field-group state and a non-computed message entry. */
export const LEFT_RECORD_STATES = {
  [VIRTUAL_STATES.HEADER_KEY]: VIRTUAL_STATES.INFORMATION,
  [VIRTUAL_STATES.GROUP_KEY]: {
    Data: { [VIRTUAL_STATES.FIELD_KEY]: VIRTUAL_STATES.INFORMATION },
  },
  [VIRTUAL_STATES.MESSAGE_KEY]: VIRTUAL_STATES.MESSAGE_TYPE,
} as const;

/** The app's i18n bundle the fake ExtensionAPI serves, so refusal texts resolve as on the page. */
export const I18N_BUNDLE = {
  NAME: "com.financialplanner.transactions.i18n.i18n",
} as const;
