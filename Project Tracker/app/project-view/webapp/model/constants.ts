/** The project view's OData entry point and its page-level UI state. */
export const PROJECT_VIEW = {
  PATH: "/ProjectView",
  UI_MODEL: "ui",
} as const;

/** How a stage status code renders: its i18n text key, value state and icon. */
export const TASK_STATUS = {
  TEXT_KEY: {
    inProgress: "statusInProgress",
    notStarted: "statusNotStarted",
  } as Record<string, string>,
  STATE: { inProgress: "Information" } as Record<string, string>,
  ICON: {
    inProgress: "sap-icon://process",
    notStarted: "sap-icon://pending",
  } as Record<string, string>,
} as const;

/** How a step kind code renders: its i18n text key, value state and icon. */
export const STEP_KIND = {
  TEXT_KEY: {
    Required: "kindRequired",
    Conditional: "kindConditional",
    Recommended: "kindRecommended",
  } as Record<string, string>,
  STATE: { Recommended: "Information" } as Record<string, string>,
  ICON: { Recommended: "sap-icon://hint" } as Record<string, string>,
} as const;

/** The i18n text key naming each next-action tier. */
export const TIER = {
  TEXT_KEY: {
    1: "tierResuming",
    2: "tierFresh",
    3: "tierOptionalOnly",
  } as Record<string, string>,
} as const;
