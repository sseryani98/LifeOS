// Integration-module constants. Grouped into `as const` objects so importers
// reference one namespace (e.g. ALERTS.TYPE.STALE_DATA) instead of loose names.

/** Fully-qualified entity names — string refs per the project CQL convention. */
export const ENTITIES = {
  CONNECTION: "com.financialplanner.ProviderConnection",
  ACCOUNT: "com.financialplanner.ProviderAccount",
  TRANSACTION: "com.financialplanner.Transaction",
  ALERT: "com.financialplanner.Alert",
  ALERT_TYPE: "com.financialplanner.AlertType",
  ALERT_SEVERITY: "com.financialplanner.AlertSeverity",
  SYSTEM_CONFIG: "com.financialplanner.SystemConfig",
} as const;

/** AlertType / AlertSeverity display names (seeded reference data). */
export const ALERTS = {
  TYPE: {
    CONNECTION_ERROR: "Connection Error",
    STALE_DATA: "Stale Data",
    UNMAPPED_ACCOUNT: "Unmapped Account",
  },
  SEVERITY: {
    CRITICAL: "Critical",
    WARNING: "Warning",
    INFO: "Info",
  },
} as const;

/** Fallback tuning for the SimpleFIN sync engine when SystemConfig is missing. */
export const SYNC_DEFAULTS = {
  LOOKBACK_DAYS: 7,
  RETRY_ATTEMPTS: 3,
  STALE_DAYS: 3,
  /** Base backoff in ms — doubles each retry: 2s, 4s, 8s. */
  BACKOFF_BASE_MS: 2000,
} as const;

/** Daily-sync schedule bounds and default fire time (HH:MM, 24h). */
export const SCHEDULE = {
  DEFAULT_TIME: "20:00",
  TIME_PARTS: 2,
  MAX_HOUR: 23,
  MAX_MINUTE: 59,
} as const;

/** Recognised ingestion sources — mirrors enums.cds TransactionSource. */
export const SOURCES: readonly string[] = ["simplefin", "csv", "manual"];
