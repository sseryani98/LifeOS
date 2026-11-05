// Named fixtures for the Life OS shared-library unit tests.

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

/** Fragment names and the dialog control ids they declare. */
export const FRAGMENT = {
  EDIT: "com.lifeos.sample.fragment.EditDialog",
  EDIT_SHORT_NAME: "EditDialog",
  EDIT_DIALOG_ID: "idEditDialog",
  OTHER_DIALOG_ID: "idOtherDialog",
  APPLY: "com.lifeos.sample.fragment.ApplyDialog",
  APPLY_SHORT_NAME: "ApplyDialog",
  APPLY_DIALOG_ID: "idApplyDialog",
  VIEW_PREFIX: "application-view",
} as const;

/** The MessageBox close actions a confirmation can end with. */
export const CONFIRM_ACTION = {
  OK: "OK",
  CANCEL: "CANCEL",
} as const;

/** The i18n bundle the helpers resolve against: one known key. */
export const I18N_TEXTS = {
  [I18N.KEY]: I18N.TEXT,
  [I18N.PARAM_KEY]: I18N.PARAM_TEXT,
} as const;

/** Instance ids an ExtensionAPI host gives each fragment dialog: namespace, then the declared id. */
export const FRAGMENT_INSTANCE_IDS = {
  [FRAGMENT.EDIT]: `${FRAGMENT.EDIT_SHORT_NAME}--${FRAGMENT.EDIT_DIALOG_ID}`,
  [FRAGMENT.APPLY]: `${FRAGMENT.APPLY_SHORT_NAME}--${FRAGMENT.APPLY_DIALOG_ID}`,
} as const;

/** A dialog's JSON model: its name, the data it opens with, and the data a reopen resets it to. */
export const DIALOG_MODEL = {
  NAME: "edit",
  FIRST_DATA: { name: "Groceries" },
  RESET_DATA: { name: "" },
} as const;
