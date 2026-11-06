// Named inputs for the Project View tests: the paths the service binds, the
// rows a stubbed store hands back, and what the contract journey expects the
// page to render over the journey seed in data/journey/.

/** The OData V4 entry point ProjectViewService must bind. */
export const SERVICE_PATH = {
  PROJECT_VIEW: "/ProjectView",
} as const;

/** The window of rows readWorkspace must request: the first row only. */
export const READ_WINDOW = {
  START: 0,
  LENGTH: 1,
} as const;

/** Binding paths of the workspace rows a stubbed store returns. */
export const WORKSPACE_ROW_PATH = {
  FIRST: "/ProjectView(ID=5e0d0003-0000-4000-8000-000000000001)",
  SECOND: "/ProjectView(ID=5e0d0003-0000-4000-8000-000000000002)",
} as const;

/** The failure a stubbed store raises on a read. */
export const READ_FAILURE = {
  MESSAGE: "Service unavailable",
} as const;

/** The page-level UI state the controller owns, under its named model. */
export const PAGE_STATE = {
  MODEL: "ui",
  BUSY: "/busy",
  READ_FAILED: "/readFailed",
} as const;

/** How the contract journey reaches the page and the controls it names. */
export const JOURNEY_PAGE = {
  COMPONENT: "com.lifeos.projecttracker.projectview",
  VIEW_NAME: "com.lifeos.projecttracker.projectview.view.ProjectView",
  TITLE_ID: "idNameTitle",
  NEXT_ACTION_CARD_ID: "idNextActionCard",
  NEXT_ACTION_HEADER_ID: "idNextActionLabelHeader",
  NEXT_ACTION_STATUS_ID: "idNextActionStatusObjectStatus",
  NEXT_ACTION_KIND_ID: "idNextActionKindObjectStatus",
  NEXT_ACTION_STAGE_ID: "idNextActionStepCodeObjectAttribute",
  NEXT_ACTION_DRIVER_ID: "idNextActionDriverObjectAttribute",
  EMPTY_STATE_ID: "idNothingLeftToDoText",
  READ_FAILED_STRIP_ID: "idCouldNotReadTheProjectViewMessageStrip",
  QUEUE_TABLE_ID: "idTaskQueueTable",
  COMPLETIONS_TABLE_ID: "idRecentCompletionsTable",
  QUEUE_TABLE_HEADER: "Open Task Queue",
  COMPLETIONS_TABLE_HEADER: "Recently Completed",
} as const;

/**
 * What the journey seed puts on the page: one workspace, one story closed and
 * one resumed, whose running build is the next action.
 */
export const JOURNEY_SEED = {
  WORKSPACE_NAME: "Journey Board",
  QUEUE_ROWS: 2,
  COMPLETED_ROWS: 2,
  /** Every status, kind and blocker cell of the queue, sorted, blanks dropped. */
  QUEUE_CELL_TEXTS: [
    "In Progress",
    "Not Started",
    "Recommended",
    "Required",
    "sprint-build",
  ],
  /** Every icon of the queue's status and kind cells, sorted, blanks dropped. */
  QUEUE_CELL_ICONS: [
    "sap-icon://hint",
    "sap-icon://pending",
    "sap-icon://process",
  ],
} as const;

/** The labels the formatters must put on the next-action card for the resumed build. */
export const NEXT_ACTION_LABELS = {
  STATUS: "In Progress",
  KIND: "Required",
  TIER: "Resume started work",
} as const;

/** The card's stage and driver lines, titled as the queue's columns are. */
export const NEXT_ACTION_ATTRIBUTES = {
  STAGE_TITLE: "Stage",
  STAGE_TEXT: "Sprint Build (sprint-build)",
  DRIVER_TITLE: "Driver",
} as const;

/** The open task queue's columns: its LineItem fields, then the view's custom columns. */
export const QUEUE_COLUMNS = [
  "Story",
  "Stage",
  "Driver",
  "Status",
  "Kind",
  "Blocked By",
] as const;

/** The recently completed table's columns, all from its LineItem. */
export const COMPLETIONS_COLUMNS = [
  "Story",
  "Stage",
  "Completed",
  "Completed By",
] as const;

/** The store's codes the formatters map, plus one no code list holds. */
export const DISPLAY_CODE = {
  KIND_REQUIRED: "Required",
  KIND_CONDITIONAL: "Conditional",
  KIND_RECOMMENDED: "Recommended",
  STATUS_NOT_STARTED: "notStarted",
  STATUS_IN_PROGRESS: "inProgress",
  STATUS_COMPLETE: "complete",
  UNKNOWN: "retired",
  TIER_RESUMING: 1,
  TIER_FRESH: 2,
} as const;

/** A stage as the next-action card receives it: its name and its code. */
export const STAGE = {
  NAME: "Sprint Build",
  CODE: "sprint-build",
} as const;
