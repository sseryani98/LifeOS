// Named test data for the CSV import engine.
// Config records mirror the corrected seed; CSV samples are trimmed from the
// real exports in design/actual-csvs/. Builders live in a support/ folder.

import type {
  AttributionCard,
  CsvFormatConfigRecord,
  CsvParseRequest,
  CsvSaveRequest,
  CsvSaveRow,
  DedupResult,
  ParsedCsvFields,
} from "../../../../srv/modules/ingestion/types.js";

// ─── Card instances ─────────────────────────────────────────────────────────

/** Selected (primary) card the CSV is imported against. */
export const CSV_CARD_ID = "a1b2c3d4-0023-4000-8000-0000000000c1";

/** Supplementary cardholders on the primary card (Amex attribution). */
export const P1_SUPP_ID = "a1b2c3d4-0023-4000-8000-0000000000c2";
export const P2_SUPP_ID = "a1b2c3d4-0023-4000-8000-0000000000c3";

/** Primary card only — no supplementary cards. */
export const CSV_SINGLE_CARD: AttributionCard[] = [
  { ID: CSV_CARD_ID, cardholderName: "Sandro Seryani" },
];

/** Primary + two supplementary cards, for Amex cardmember attribution. */
export const CSV_ATTRIBUTION_CARDS: AttributionCard[] = [
  { ID: CSV_CARD_ID, cardholderName: "Sandro Seryani" },
  { ID: P1_SUPP_ID, cardholderName: "Person 1" },
  { ID: P2_SUPP_ID, cardholderName: "Person 2" },
];

// ─── Format configs (corrected — match design/actual-csvs/) ─────────────────

/** Scotiabank: header, single amount (positive = debit), status column. */
export const SCOTIA_CONFIG: CsvFormatConfigRecord = {
  ID: "a1b2c3d4-0011-4000-8000-000000000001",
  configName: "Scotiabank CSV Export",
  dateColumn: "Date",
  dateFormat: "YYYY-MM-DD",
  amountColumn: "Amount",
  amountSign: "POSITIVE_IS_DEBIT",
  debitColumn: null,
  creditColumn: null,
  descriptionColumn: "Description",
  statusColumn: "Status",
  statusPostedValue: "posted",
  cardmemberColumn: null,
  headerRowsSkip: 1,
  delimiter: ",",
};

/** TD: headerless, split debit/credit, MM/DD/YYYY. */
export const TD_CONFIG: CsvFormatConfigRecord = {
  ID: "a1b2c3d4-0011-4000-8000-000000000002",
  configName: "TD CSV Export",
  dateColumn: "0",
  dateFormat: "MM/DD/YYYY",
  amountColumn: null,
  amountSign: null,
  debitColumn: "2",
  creditColumn: "3",
  descriptionColumn: "1",
  statusColumn: null,
  statusPostedValue: null,
  cardmemberColumn: null,
  headerRowsSkip: 0,
  delimiter: ",",
};

/** CIBC: headerless, split debit/credit, ISO dates. */
export const CIBC_CONFIG: CsvFormatConfigRecord = {
  ID: "a1b2c3d4-0011-4000-8000-000000000003",
  configName: "CIBC CSV Export",
  dateColumn: "0",
  dateFormat: "YYYY-MM-DD",
  amountColumn: null,
  amountSign: null,
  debitColumn: "2",
  creditColumn: "3",
  descriptionColumn: "1",
  statusColumn: null,
  statusPostedValue: null,
  cardmemberColumn: null,
  headerRowsSkip: 0,
  delimiter: ",",
};

/** Amex: 11 preamble rows + header, single amount, cardmember column. */
export const AMEX_CONFIG: CsvFormatConfigRecord = {
  ID: "a1b2c3d4-0011-4000-8000-000000000004",
  configName: "Amex CSV Export",
  dateColumn: "Date",
  dateFormat: "DD MMM. YYYY",
  amountColumn: "Amount",
  amountSign: "POSITIVE_IS_DEBIT",
  debitColumn: null,
  creditColumn: null,
  descriptionColumn: "Description",
  statusColumn: null,
  statusPostedValue: null,
  cardmemberColumn: "Cardmember",
  headerRowsSkip: 12,
  delimiter: ",",
};

// ─── CSV file samples ───────────────────────────────────────────────────────

/** Scotia: two charges, one credit, one pending (status-filtered out). */
export const SCOTIA_CSV = [
  "Filter,Date,Description,Sub-description,Status,Type of Transaction,Amount",
  '"","2026-02-15","interest charges-purchase","","posted","Debit","28.80"',
  '"","2026-02-12","cineplex #7115     qp    ","Toronto 020","posted","Debit","27.67"',
  '"","2026-02-09","payment - thank you","K Of Montreal","posted","Credit","-500.00"',
  '"","2026-02-08","pending charge","","pending","Debit","10.00"',
].join("\n");

/** TD: one debit (charge), one credit (refund), headerless. */
export const TD_CSV = [
  "09/02/2025,AIRALO,13.50,,5109.12",
  "09/02/2025,AIR CANADA,,901.30,5095.62",
].join("\n");

/** CIBC: one credit (payment), one debit (interest), headerless. */
export const CIBC_CSV = [
  "2025-11-20,PAYMENT THANK YOU,,1.00,4500********7927",
  "2025-07-24,PURCHASE INTEREST,1.12,,4500********7927",
].join("\n");

/** Amex: 11 preamble rows, a header, then rows for three cardmembers. */
export const AMEX_CSV = [
  ...Array.from({ length: 11 }, () => ""),
  "Date,Date Processed,Description,Cardmember,Amount,Foreign Spend Amount,Commission,Exchange Rate,Merchant,Merchant Address,Additional Information",
  "14 Feb. 2026,14 Feb. 2026,PARK HYATT TORONTO,SANDRO SERYANI,$406.69,,,,,,PARK HYATT TORONTO",
  "11 Feb. 2026,11 Feb. 2026,UBER EATS,PERSON 1,$49.79,,,,,,UBER EATS",
  "01 Feb. 2026,01 Feb. 2026,TESLA MOTORS,PERSON 2,$11.73,,,,,,TESLA MOTORS",
].join("\n");

/** Scotia format, one row with an unparseable date → Excluded tab. */
export const BAD_DATE_CSV = [
  "Filter,Date,Description,Sub-description,Status,Type of Transaction,Amount",
  '"","not-a-date","broken row","","posted","Debit","9.99"',
].join("\n");

/** Scotia format, two byte-identical rows — within-batch: both stay New. */
export const DUP_BATCH_CSV = [
  "Filter,Date,Description,Sub-description,Status,Type of Transaction,Amount",
  '"","2026-01-10","todoist","","posted","Debit","10.00"',
  '"","2026-01-10","todoist","","posted","Debit","10.00"',
].join("\n");

/** Scotia format, one posted row whose amount cell is non-numeric → Excluded. */
export const BAD_AMOUNT_CSV = [
  "Filter,Date,Description,Sub-description,Status,Type of Transaction,Amount",
  '"","2026-02-15","broken amount","","posted","Debit","N/A"',
].join("\n");

/** TD format, one row with neither a debit nor a credit value → Excluded. */
export const TD_NO_AMOUNT_CSV = ["09/02/2025,MYSTERY ROW,,,5109.12"].join("\n");

/** Scotia format whose header omits the Amount column — the named column resolves to nothing → Excluded. */
export const MISSING_AMOUNT_HEADER_CSV = [
  "Filter,Date,Description,Sub-description,Status,Type of Transaction",
  '"","2026-02-15","no amount column","","posted","Debit"',
].join("\n");

/** Amex: one unknown cardmember and one blank cardmember — both fall back to the primary card. */
export const AMEX_FALLBACK_CSV = [
  ...Array.from({ length: 11 }, () => ""),
  "Date,Date Processed,Description,Cardmember,Amount,Foreign Spend Amount,Commission,Exchange Rate,Merchant,Merchant Address,Additional Information",
  "10 Feb. 2026,10 Feb. 2026,GUEST CHARGE,UNKNOWN PERSON,$20.00,,,,,,GUEST CHARGE",
  "09 Feb. 2026,09 Feb. 2026,NO NAME CHARGE,,$30.00,,,,,,NO NAME CHARGE",
].join("\n");

// ─── Parse requests (validator) ─────────────────────────────────────────────

export const VALID_PARSE_REQUEST: CsvParseRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: SCOTIA_CSV,
};

export const REQUEST_MISSING_CARD: CsvParseRequest = {
  cardInstance_ID: null,
  fileName: "scotia.csv",
  fileContent: SCOTIA_CSV,
};

export const REQUEST_MISSING_FILE: CsvParseRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "",
  fileContent: SCOTIA_CSV,
};

export const REQUEST_EMPTY_CONTENT: CsvParseRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: "   ",
};

// ─── Mapper fixtures ────────────────────────────────────────────────────────

/** Parsed scalar fields for a new (non-duplicate) row. */
export const PARSED_FIELDS_NEW: ParsedCsvFields = {
  postedAt: "2026-02-12",
  amount: -27.67,
  rawDescription: "cineplex #7115 qp",
  cardInstance_ID: CSV_CARD_ID,
  cardholderName: null,
};

/** Id of the existing transaction a potential duplicate matches. */
export const MATCHED_TX_ID = "eeeeeeee-0000-0000-0000-000000000001";

/** Dedup verdicts the mapper turns into classified rows. */
export const DEDUP_NEW: DedupResult = { outcome: "new" };
export const DEDUP_POTENTIAL: DedupResult = {
  outcome: "potential_duplicate",
  matchedTransactionId: MATCHED_TX_ID,
};

// ─── Action-request payloads (parse entry point) ────────────────────────────

/** The `data` block of a valid parseCsvImport action request. */
export const PARSE_ACTION_DATA = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  fileContent: SCOTIA_CSV,
};

/** The `data` block of an invalid (empty) parseCsvImport action request. */
export const PARSE_ACTION_DATA_EMPTY = {
  cardInstance_ID: "",
  fileName: "",
  fileContent: "",
};

// ─── Save requests + rows (step 3 → persist) ────────────────────────────────

/** Vendor ids referenced by categorized save rows. */
export const VENDOR_AMAZON_ID = "d1d1d1d1-0000-4000-8000-00000000000a";
export const VENDOR_CINEPLEX_ID = "d1d1d1d1-0000-4000-8000-00000000000b";

/** Purchase-type + earning-category ids referenced by categorized save rows. */
export const PURCHASE_TYPE_ID = "d2d2d2d2-0000-4000-8000-000000000001";
export const EARNING_CATEGORY_ID = "d3d3d3d3-0000-4000-8000-000000000001";

/** A fully categorized row — saves as user_corrected. */
export const SAVE_ROW_CATEGORIZED: CsvSaveRow = {
  postedAt: "2026-02-12",
  amount: -27.67,
  rawDescription: "cineplex #7115 qp",
  cardInstance_ID: CSV_CARD_ID,
  vendor_ID: VENDOR_CINEPLEX_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** An uncategorized row — cleared with no vendor/categories. */
export const SAVE_ROW_UNCATEGORIZED: CsvSaveRow = {
  postedAt: "2026-02-15",
  amount: -28.8,
  rawDescription: "interest charges-purchase",
  cardInstance_ID: CSV_CARD_ID,
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
};

/** A second Amazon row so a top-vendor tally has a clear winner. */
export const SAVE_ROW_AMAZON: CsvSaveRow = {
  postedAt: "2026-02-10",
  amount: -19.99,
  rawDescription: "AMZN MKTP US",
  cardInstance_ID: CSV_CARD_ID,
  vendor_ID: VENDOR_AMAZON_ID,
  purchaseType_ID: PURCHASE_TYPE_ID,
  earningCategory_ID: EARNING_CATEGORY_ID,
};

/** A valid multi-row save request for the selected card. */
export const VALID_SAVE_REQUEST: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 1,
  rows: [SAVE_ROW_CATEGORIZED, SAVE_ROW_UNCATEGORIZED],
};

/** A save request whose row list is empty — nothing to persist. */
export const SAVE_REQUEST_NO_ROWS: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [],
};

/** A save request missing the target card. */
export const SAVE_REQUEST_MISSING_CARD: CsvSaveRequest = {
  cardInstance_ID: null,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [SAVE_ROW_CATEGORIZED],
};

/** A save request missing the file name. */
export const SAVE_REQUEST_MISSING_FILE: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "",
  skippedCount: 0,
  rows: [SAVE_ROW_CATEGORIZED],
};

/** A save request with a row carrying a non-numeric amount and no date. */
export const SAVE_REQUEST_BAD_ROW: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [
    {
      postedAt: "",
      amount: Number.NaN,
      rawDescription: "",
      cardInstance_ID: null,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
  ],
};

/** The `data` block of a valid saveCsvImport action request. */
export const SAVE_ACTION_DATA = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 1,
  rows: [SAVE_ROW_AMAZON, SAVE_ROW_CATEGORIZED, SAVE_ROW_UNCATEGORIZED],
};

/** The `data` block of an invalid (no rows) saveCsvImport action request. */
export const SAVE_ACTION_DATA_EMPTY = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [],
};

/** A save request where Amazon is the clear most-frequent vendor (top-vendor tally). */
export const SAVE_REQUEST_TOP_AMAZON: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 2,
  rows: [SAVE_ROW_AMAZON, { ...SAVE_ROW_AMAZON }, SAVE_ROW_UNCATEGORIZED],
};

/** A save request whose single row carries no vendor — no top vendor to name. */
export const SAVE_REQUEST_ALL_UNCATEGORIZED: CsvSaveRequest = {
  cardInstance_ID: CSV_CARD_ID,
  fileName: "scotia.csv",
  skippedCount: 0,
  rows: [
    {
      postedAt: "2026-02-15",
      amount: -5,
      rawDescription: "x",
      cardInstance_ID: CSV_CARD_ID,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
  ],
};

/** A save request whose every field (request + row) is invalid — error accumulation. */
export const SAVE_REQUEST_ALL_INVALID: CsvSaveRequest = {
  cardInstance_ID: null,
  fileName: null,
  skippedCount: 0,
  rows: [
    {
      postedAt: "",
      amount: Number.NaN,
      rawDescription: "",
      cardInstance_ID: null,
      vendor_ID: null,
      purchaseType_ID: null,
      earningCategory_ID: null,
    },
  ],
};

/** Generated Transaction id the save mapper stamps onto an insert row. */
export const SAVE_TX_ID = "aaaaaaaa-0000-4000-8000-000000000001";
