// Named cell/config fixtures for the CsvRowReaderService decoder unit test.
// The reader decodes one row's cells against a resolved format config, so these
// fixtures are single rows (not whole files). Configs + card ids are reused from
// the shared CSV fixtures; sign/header variants are derived here.

import type { CsvFormatConfigRecord } from "../../../../srv/modules/ingestion/types.js";
import { SCOTIA_CONFIG } from "../../../shared/data/ingestion/csv.js";

// ─── Scotia — named columns, single amount (POSITIVE_IS_DEBIT), status filter ──

/** The Scotia header row — the reader builds its name→index map from this. */
export const SCOTIA_HEADER_CELLS: string[] = [
  "Filter",
  "Date",
  "Description",
  "Sub-description",
  "Status",
  "Type of Transaction",
  "Amount",
];

/** Rows passed at construction so the header map resolves the named columns. */
export const SCOTIA_HEADER_ROWS: string[][] = [SCOTIA_HEADER_CELLS];

/** A posted debit — POSITIVE_IS_DEBIT must flip 28.80 to -28.80. */
export const SCOTIA_DEBIT_CELLS: string[] = [
  "",
  "2026-02-15",
  "interest charges-purchase",
  "",
  "posted",
  "Debit",
  "28.80",
];

/** A posted credit stored negative — POSITIVE_IS_DEBIT must flip it positive. */
export const SCOTIA_CREDIT_CELLS: string[] = [
  "",
  "2026-02-09",
  "payment - thank you",
  "",
  "posted",
  "Credit",
  "-500.00",
];

/** A padded description — the decoder must trim it before dedup. */
export const SCOTIA_PADDED_DESC_CELLS: string[] = [
  "",
  "2026-02-12",
  "cineplex #7115     qp    ",
  "",
  "posted",
  "Debit",
  "27.67",
];

/** A non-posted row — the status filter must discard it. */
export const SCOTIA_PENDING_CELLS: string[] = [
  "",
  "2026-02-08",
  "pending charge",
  "",
  "pending",
  "Debit",
  "10.00",
];

/** An unparseable date — decode must fail on the date field. */
export const SCOTIA_BAD_DATE_CELLS: string[] = [
  "",
  "not-a-date",
  "broken row",
  "",
  "posted",
  "Debit",
  "9.99",
];

/** A non-numeric amount — decode must fail on the amount field. */
export const SCOTIA_BAD_AMOUNT_CELLS: string[] = [
  "",
  "2026-02-15",
  "broken amount",
  "",
  "posted",
  "Debit",
  "N/A",
];

/** An all-blank row — isEmptyRow must report it as a spacer to skip. */
export const SCOTIA_EMPTY_CELLS: string[] = ["", "", "", "", "", "", ""];

/** Scotia's inverse sign rule: NEGATIVE_IS_DEBIT keeps the raw sign as-is. */
export const SCOTIA_NEG_CONFIG: CsvFormatConfigRecord = {
  ...SCOTIA_CONFIG,
  amountSign: "NEGATIVE_IS_DEBIT",
};

/** Named config with no header rows — no column name can resolve to an index. */
export const SCOTIA_NO_SKIP_CONFIG: CsvFormatConfigRecord = {
  ...SCOTIA_CONFIG,
  headerRowsSkip: 0,
};

/** A header row missing the Amount column — the named amount must resolve to "". */
export const SCOTIA_HEADER_NO_AMOUNT_CELLS: string[] = [
  "Filter",
  "Date",
  "Description",
  "Sub-description",
  "Status",
  "Type of Transaction",
];

/** Construction rows for the amount-column-missing header case. */
export const SCOTIA_HEADER_NO_AMOUNT_ROWS: string[][] = [
  SCOTIA_HEADER_NO_AMOUNT_CELLS,
];

/** Empty construction rows — the header row is absent for a named config. */
export const NO_ROWS: string[][] = [];

// ─── TD — headerless (index columns), split debit/credit ─────────────────────

/** A debit row — the split rule must flip 13.50 to -13.50. */
export const TD_DEBIT_CELLS: string[] = ["09/02/2025", "AIRALO", "13.50", "", "5109.12"];

/** A credit row — the split rule must keep 901.30 positive. */
export const TD_CREDIT_CELLS: string[] = [
  "09/02/2025",
  "AIR CANADA",
  "",
  "901.30",
  "5095.62",
];

/** Neither debit nor credit populated — decode must fail on the amount field. */
export const TD_NO_AMOUNT_CELLS: string[] = ["09/02/2025", "MYSTERY ROW", "", "", "5109.12"];

/** A ragged row shorter than the configured credit index — the cell reads as "". */
export const TD_SHORT_ROW_CELLS: string[] = ["09/02/2025", "desc", ""];

/** A config with no amount column at all — the single-amount read resolves to "". */
export const SCOTIA_NO_AMOUNT_COL_CONFIG: CsvFormatConfigRecord = {
  ...SCOTIA_CONFIG,
  amountColumn: null,
};

// ─── Amex — named columns, cardmember attribution, 11-row preamble ────────────

/** The Amex header row (sits at index 11 in the file). */
export const AMEX_HEADER_CELLS: string[] = [
  "Date",
  "Date Processed",
  "Description",
  "Cardmember",
  "Amount",
  "Foreign Spend Amount",
  "Commission",
  "Exchange Rate",
  "Merchant",
  "Merchant Address",
  "Additional Information",
];

/** Construction rows: 11 preamble lines then the header at index 11. */
export const AMEX_READER_ROWS: string[][] = [
  ...Array.from({ length: 11 }, () => [""]),
  AMEX_HEADER_CELLS,
];

/** Primary cardholder (matches "Sandro Seryani") — attributes to the selected card. */
export const AMEX_PRIMARY_CELLS: string[] = [
  "14 Feb. 2026",
  "14 Feb. 2026",
  "PARK HYATT TORONTO",
  "SANDRO SERYANI",
  "$406.69",
  "",
  "",
  "",
  "",
  "",
  "PARK HYATT TORONTO",
];

/** Supplementary cardholder (Person 1) — attributes to the supp card. */
export const AMEX_SUPP_CELLS: string[] = [
  "11 Feb. 2026",
  "11 Feb. 2026",
  "UBER EATS",
  "PERSON 1",
  "$49.79",
  "",
  "",
  "",
  "",
  "",
  "UBER EATS",
];

/** Unknown cardholder — falls back to the selected card, name preserved. */
export const AMEX_UNKNOWN_MEMBER_CELLS: string[] = [
  "10 Feb. 2026",
  "10 Feb. 2026",
  "GUEST CHARGE",
  "UNKNOWN PERSON",
  "$20.00",
  "",
  "",
  "",
  "",
  "",
  "GUEST CHARGE",
];

/** Blank cardholder — falls back to the selected card, no name. */
export const AMEX_BLANK_MEMBER_CELLS: string[] = [
  "09 Feb. 2026",
  "09 Feb. 2026",
  "NO NAME CHARGE",
  "",
  "$30.00",
  "",
  "",
  "",
  "",
  "",
  "NO NAME CHARGE",
];
