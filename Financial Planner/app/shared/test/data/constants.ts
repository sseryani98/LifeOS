// Named inputs and expected outputs for the shared-library unit tests.

/** Amounts as the review tables and import summary receive them. */
export const AMOUNT = {
  NUMBER: 12.5,
  NUMBER_FIXED: "12.50",
  TEXT: "-3.456",
  TEXT_FIXED: "-3.46",
  ZERO: 0,
  ZERO_FIXED: "0.00",
} as const;

/** A Canadian-dollar amount and its en-CA rendering. */
export const CURRENCY = {
  AMOUNT: 1234.56,
  FORMATTED: "$1,234.56",
} as const;

/**
 * A local timestamp, and the date-only ISO string OData sends for an Edm.Date.
 * Both must render as the same calendar day in any browser time zone.
 */
export const DATE = {
  LOCAL_TIMESTAMP: "2026-02-21T12:00:00",
  DATE_ONLY: "2026-02-21",
  FORMATTED: "Feb 21, 2026",
} as const;

/** Status codes the formatter maps, and one it does not know. */
export const STATUS = {
  TO_CANCEL: "toCancel",
  TO_CANCEL_TEXT: "To Cancel",
  UNKNOWN: "suspended",
} as const;

/** Share inputs as a `type="Number"` Input yields them: text. */
export const SHARE_INPUT = {
  PERCENT: "25",
  PERCENT_NUMBER: 25,
  ZERO: "0",
} as const;

/** A stored 0–1 share fraction (OData V4 sends Edm.Decimal as text) and its 0–100 rendering. */
export const SHARE_FRACTION = {
  STORED: "0.5000",
  SHOWN: "50",
  STORED_THIRD: "0.3333",
  SHOWN_THIRD: "33.33",
  ENTERED: "20",
  PARSED: "0.2",
  ENTERED_FINE: "12.345",
  PARSED_FINE: "0.1235",
  NOT_A_NUMBER: "half",
} as const;

/** An i18n key, its resolved text, and the model name the helpers must read. */
export const I18N = {
  KEY: "msgSaved",
  TEXT: "Changes saved",
  MISSING_KEY: "msgNotInBundle",
  MODEL_NAME: "i18n",
  PARAM_KEY: "msgNotSaved",
  PARAM_TEXT: "Not saved: {0}",
  ARG: "Enter one share only",
  FILLED_TEXT: "Not saved: Enter one share only",
} as const;

/** Routing inputs for back navigation. */
export const ROUTE = {
  FALLBACK: "home",
  PREVIOUS_HASH: "transactions",
  ROOT_HASH: "",
  BACK_ONE_STEP: -1,
} as const;

/** Column counts the ObjectPage form layout is set to. */
export const FORM_LAYOUT = {
  COLUMNS: 3,
  COLUMNS_M: 2,
  SINGLE: 1,
} as const;

/** UI5 class names the ObjectPage parser filters elements by. */
export const ELEMENT_TYPE = {
  FORM: "sap.ui.layout.form.Form",
  SUBSECTION: "sap.uxap.ObjectPageSubSection",
  BUTTON: "sap.m.Button",
} as const;

/** Fragment names and the dialog control ids they declare. */
export const FRAGMENT = {
  EDIT: "com.financialplanner.sample.fragment.EditDialog",
  EDIT_SHORT_NAME: "EditDialog",
  EDIT_DIALOG_ID: "idEditDialog",
  OTHER_DIALOG_ID: "idOtherDialog",
  APPLY: "com.financialplanner.sample.fragment.ApplyDialog",
  APPLY_SHORT_NAME: "ApplyDialog",
  APPLY_DIALOG_ID: "idApplyDialog",
  VIEW_PREFIX: "application-view",
} as const;

/** The MessageBox close actions a confirmation can end with. */
export const CONFIRM_ACTION = {
  OK: "OK",
  CANCEL: "CANCEL",
} as const;

/** Chart card sizing, style classes and declared defaults. */
export const CHART_CARD = {
  WIDTH: "50%",
  HEIGHT: "200px",
  DEFAULT_WIDTH: "100%",
  DEFAULT_HEIGHT: "300px",
  APEX_CLASS: "fpApexChartCard",
  APEX_DEFAULT_TYPE: "bar",
  VIZ_CLASS: "fpVizFrameCard",
  VIZ_DEFAULT_TYPE: "column",
  FIXTURE_ID: "qunit-fixture",
} as const;

/** The i18n bundle the helpers resolve against: one known key. */
export const I18N_TEXTS = {
  [I18N.KEY]: I18N.TEXT,
  [I18N.PARAM_KEY]: I18N.PARAM_TEXT,
} as const;

/** An ObjectPage element tree mixing forms with elements the parser must skip. */
export const ELEMENT_TREE = {
  MIXED: [
    ELEMENT_TYPE.FORM,
    ELEMENT_TYPE.SUBSECTION,
    ELEMENT_TYPE.BUTTON,
    ELEMENT_TYPE.FORM,
  ],
} as const;

/** A JSON model name a freestyle controller binds UI state to, apart from the default model. */
export const MODEL = {
  UI_NAME: "ui",
} as const;

/** Instance ids an ExtensionAPI host gives each fragment dialog: namespace, then the declared id. */
export const FRAGMENT_INSTANCE_IDS = {
  [FRAGMENT.EDIT]: `${FRAGMENT.EDIT_SHORT_NAME}--${FRAGMENT.EDIT_DIALOG_ID}`,
  [FRAGMENT.APPLY]: `${FRAGMENT.APPLY_SHORT_NAME}--${FRAGMENT.APPLY_DIALOG_ID}`,
} as const;
