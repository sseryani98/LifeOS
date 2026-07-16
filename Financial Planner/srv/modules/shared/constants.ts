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
