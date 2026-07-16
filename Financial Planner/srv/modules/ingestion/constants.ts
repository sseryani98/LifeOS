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
  CARD_INSTANCE: "com.financialplanner.CardInstance",
  CSV_FORMAT_CONFIG: "com.financialplanner.CsvFormatConfig",
  IMPORT_LOG: "com.financialplanner.ImportLog",
  VENDOR: "com.financialplanner.Vendor",
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

/** CSV date parsing — issuer format tokens, matching regexes, and month lookup. */
export const CSV_DATE = {
  /** Format tokens as stored in CsvFormatConfig.dateFormat. */
  FORMAT: {
    ISO: "YYYY-MM-DD",
    US: "MM/DD/YYYY",
    AMEX: "DD MMM. YYYY",
  },
  /** Regexes capturing the parts of each issuer date format. */
  PATTERN: {
    ISO: /^(\d{4})-(\d{2})-(\d{2})$/,
    US: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    AMEX: /^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})$/,
  },
  /** English month abbreviations → 1-based month number (Amex "DD MMM. YYYY"). */
  MONTHS: {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  } as Record<string, number>,
  /** Month abbreviations are keyed on their first three letters. */
  ABBREVIATION_LENGTH: 3,
} as const;

/** CSV import engine — amount-sign handling and the source tag it writes. */
export const CSV = {
  /** amountSign values, mirroring enums.cds AmountSign. */
  SIGN: {
    POSITIVE_IS_DEBIT: "POSITIVE_IS_DEBIT",
    NEGATIVE_IS_DEBIT: "NEGATIVE_IS_DEBIT",
  },
  /** Ingestion source written to every CSV-imported transaction. */
  SOURCE: "csv",
} as const;

/** categorizationStatus values written on save, mirroring enums.cds. */
export const CATEGORIZATION = {
  /** User assigned a vendor and/or categories in the wizard. */
  USER_CORRECTED: "user_corrected",
  /** Row cleared without categories — imported uncategorized. */
  UNCATEGORIZED: "uncategorized",
} as const;
