// Shared UI constants for all Financial Planner UI5 apps. Group related
// values into a single `as const` object so importers pull one namespace
// (e.g. OBJECT_PAGE.FORM_COLUMNS) instead of a wall of loose names.

/** ObjectPage form layout configuration shared across the Fiori Elements apps. */
export const OBJECT_PAGE = {
  /** Columns forced on the object-page forms at L/XL (M derives to cols-1). */
  FORM_COLUMNS: 3,
} as const;

/** Percentage math: the UI captures 0–100, backends store the 0–1 fraction. */
export const PERCENT = {
  /** Divisor converting an entered 0–100 percentage to its 0–1 fraction. */
  DIVISOR: 100,
} as const;
