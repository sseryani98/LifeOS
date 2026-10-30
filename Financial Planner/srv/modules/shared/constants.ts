// App-wide constants shared across modules. Group related values into a single
// `as const` object so importers pull one namespace (e.g. TIME.MS_PER_SECOND)
// instead of a wall of loose names.

/** Time-unit conversion factors used across epoch / date math. */
export const TIME = {
  MS_PER_SECOND: 1000,
  SECONDS_PER_DAY: 86_400,
} as const;

/** HTTP status-code success boundaries (min inclusive, max exclusive). */
export const HTTP = {
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 300,
} as const;

/** Canadian-dollar formatting parameters. */
export const CURRENCY = {
  LOCALE: "en-CA",
  CODE: "CAD",
} as const;

/** AES-256-GCM storage-format spec — {iv}:{authTag}:{ciphertext}, hex-encoded. */
export const ENCRYPTION = {
  ALGORITHM: "aes-256-gcm",
  IV_LENGTH: 12,
  AUTH_TAG_LENGTH: 16,
  KEY_LENGTH: 32,
  SEPARATOR: ":",
  ENCRYPTED_PARTS: 3,
} as const;

/** Log file locations (relative to the process cwd) and fields redacted at DEBUG. */
export const LOGGING = {
  DIR_NAME: "logs",
  APP_FILE: "app.log",
  ERROR_FILE: "error.log",
  SENSITIVE_FIELDS: [
    "card_number_enc",
    "cvv_enc",
    "expiry_date_enc",
    "access_url_enc",
    "password",
    "token",
  ] as readonly string[],
} as const;

/** Runtime messages properties file, as path segments under the process cwd. */
export const MESSAGES_FILE = {
  SEGMENTS: ["srv", "_i18n", "messages.properties"],
} as const;
