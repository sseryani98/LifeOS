/** SimpleFIN external pages opened in a new browser tab. */
export const SIMPLEFIN_URL = {
  SETUP: "https://bridge.simplefin.org/simplefin/create",
  DASHBOARD: "https://bridge.simplefin.org/",
} as const;

/** Add-Connection dialog fragment name and control ID. */
export const ADD_CONNECTION_DIALOG = {
  FRAGMENT: "com.financialplanner.connectionmanager.view.AddConnectionDialog",
  ID: "idAddConnectionDialog",
} as const;

/** Sync status → display attribute maps (icon, semantic state, i18n text key). */
export const SYNC_STATUS = {
  ICON: {
    success: "sap-icon://status-positive",
    error: "sap-icon://status-negative",
    never_synced: "sap-icon://status-inactive",
  } as Record<string, string>,

  STATE: {
    success: "Success",
    error: "Error",
    never_synced: "None",
  } as Record<string, string>,

  TEXT_KEY: {
    success: "statusSuccess",
    error: "statusError",
    never_synced: "statusNeverSynced",
  } as Record<string, string>,
};
