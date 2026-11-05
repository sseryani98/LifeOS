// Named inputs for the Connection Manager unit tests: what the user types into the
// Add Connection dialog, the OData operation paths the service must bind, and the
// sync statuses the connections table formats.

/** What the user pastes and names in the Add Connection dialog. */
export const CLAIM_INPUT = {
  TOKEN: "aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw==",
  DISPLAY_NAME: "Main SimpleFIN",
  PADDED_TOKEN:
    "  aHR0cHM6Ly9icmlkZ2Uuc2ltcGxlZmluLm9yZy9zaW1wbGVmaW4vY2xhaW0vZGVtbw==\n",
  PADDED_DISPLAY_NAME: "  Main SimpleFIN  ",
  BLANK: "   ",
  EMPTY: "",
} as const;

/** The OData V4 operation paths ConnectionService must bind. */
export const OPERATION_PATH = {
  CLAIM_SETUP_TOKEN: "/AdminService.claimSetupToken(...)",
  SYNC_NOW: "AdminService.syncNow(...)",
} as const;

/** SimpleFIN pages the Connection Manager opens in a new tab. */
export const SIMPLEFIN_PAGE = {
  SETUP: "https://bridge.simplefin.org/simplefin/create",
  DASHBOARD: "https://bridge.simplefin.org/",
} as const;

/** The Add Connection dialog, as the controller addresses it. */
export const ADD_DIALOG = {
  FRAGMENT: "com.financialplanner.connectionmanager.view.AddConnectionDialog",
  ID: "idAddConnectionDialog",
} as const;

/** Provider Connection `lastSyncStatus` codes. */
export const SYNC_STATUS_CODE = {
  SUCCESS: "success",
  ERROR: "error",
  NEVER_SYNCED: "never_synced",
  UNKNOWN: "paused",
} as const;

/** The rejection a failed OData operation surfaces to the caller. */
export const OPERATION_FAILURE = {
  MESSAGE: "AdminService operation rejected",
} as const;

/** Paths of the selected Provider Connection rows the fake table hands out. */
export const CONNECTION_PATH = {
  MAIN: "/ProviderConnections(ID=1,IsActiveEntity=true)",
  SECOND: "/ProviderConnections(ID=2,IsActiveEntity=true)",
} as const;

/** The Connection Manager page as the contract journey finds it through the shell. */
export const JOURNEY_PAGE = {
  SHELL_ROUTE: "/index.html#/SimpleFINConnections",
  VIEW_NAME: "com.financialplanner.connectionmanager.view.ConnectionManager",
  CONNECTIONS_TABLE_HEADER: "Connections",
  ADD_DIALOG_TITLE: "Add SimpleFIN Connection",
} as const;

/** The connections table's declared columns: the LineItem fields, then the custom columns. */
export const CONNECTIONS_COLUMNS = [
  "Display Name",
  "Last Sync",
  "Error Message",
  "Status",
  "Active",
] as const;

/** The custom actions the view declares on the connections table. */
export const CONNECTIONS_ACTION = {
  ADD_CONNECTION: "Add Connection",
  SYNC_NOW: "Sync Now",
  REAUTHENTICATE: "Re-authenticate",
} as const;
