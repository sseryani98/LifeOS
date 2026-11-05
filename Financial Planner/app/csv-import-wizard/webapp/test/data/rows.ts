// Row factories for the CSV Import Wizard tests: a canonical classified row, a
// New-tab row, an Excluded row and a matched transaction, each overridable per test.

import type {
  ClassifiedRow,
  DuplicateRow,
  ExcludedEditRow,
  ExcludedRow,
  MatchedTransaction,
  NewRow,
  ParseResult,
} from "com/financialplanner/csvimportwizard/model/types";

import {
  CARD_INSTANCE_ID,
  CONFIG_NAME,
  CSV_FILE,
  DESCRIPTION,
  MATCHED_ID,
  TAXONOMY_ID,
} from "./constants";

/**
 * Builds a parsed, uncategorized "new" row from the January file.
 * @param overrides fields that differ from the canonical row
 * @returns the classified row
 */
export const buildClassifiedRow = (
  overrides: Partial<ClassifiedRow> = {},
): ClassifiedRow => ({
  rowNumber: 1,
  postedAt: "2026-01-03",
  amount: -42.1,
  rawDescription: DESCRIPTION.AMAZON,
  cardInstance_ID: CARD_INSTANCE_ID.SCOTIA_GOLD,
  cardholderName: null,
  dedupOutcome: "new",
  matchedTransactionId: null,
  suggestedVendor_ID: null,
  suggestedVendorName: null,
  suggestedPurchaseType_ID: null,
  suggestedEarningCategory_ID: null,
  suggestionConfidence: null,
  ...overrides,
});

/**
 * Builds a classified row the engine pre-categorized as Amazon shopping.
 * @param overrides fields that differ from the canonical suggested row
 * @returns the classified row
 */
export const buildSuggestedRow = (
  overrides: Partial<ClassifiedRow> = {},
): ClassifiedRow =>
  buildClassifiedRow({
    suggestedVendor_ID: TAXONOMY_ID.VENDOR_AMAZON,
    suggestedVendorName: "Amazon",
    suggestedPurchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_SHOPPING,
    suggestedEarningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_ONLINE,
    suggestionConfidence: "high",
    ...overrides,
  });

/**
 * Builds an uncleared, uncategorized New-tab row.
 * @param overrides fields that differ from the canonical row
 * @returns the New-tab row
 */
export const buildNewRow = (overrides: Partial<NewRow> = {}): NewRow => ({
  ...buildClassifiedRow(),
  vendor_ID: null,
  purchaseType_ID: null,
  earningCategory_ID: null,
  cleared: false,
  ...overrides,
});

/**
 * Builds a New-tab row the user categorized as Amazon shopping.
 * @param overrides fields that differ from the categorized row
 * @returns the New-tab row
 */
export const buildAmazonRow = (overrides: Partial<NewRow> = {}): NewRow =>
  buildNewRow({
    vendor_ID: TAXONOMY_ID.VENDOR_AMAZON,
    purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_SHOPPING,
    earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_ONLINE,
    ...overrides,
  });

/**
 * Builds a Potential-Duplicates row for a pre-categorized CSV row matching the Amazon transaction.
 * @param decision the user's decision so far ("", "skip" or "import")
 * @param csvAmount the CSV row's amount, which tells rows apart in the save payload
 * @returns the duplicate row
 */
export const buildDuplicateRow = (decision: string, csvAmount: number): DuplicateRow => ({
  csv: buildSuggestedRow({ amount: csvAmount, matchedTransactionId: MATCHED_ID.AMAZON }),
  existingPostedAt: "",
  existingAmount: 0,
  existingDescription: "",
  decision,
});

/**
 * Builds a parse-error row whose date failed to decode.
 * @param overrides fields that differ from the canonical row
 * @returns the excluded row
 */
export const buildExcludedRow = (
  overrides: Partial<ExcludedRow> = {},
): ExcludedRow => ({
  rowNumber: 3,
  rawCells: ["2026-13-45", DESCRIPTION.COFFEE, "-4.25"],
  errorField: "postedAt",
  errorMessageKey: "ingestion.csv.parseError",
  errorValue: "2026-13-45",
  ...overrides,
});

/**
 * Builds an Excluded-tab row as the wizard holds it after a merged parse.
 * @param overrides fields that differ from the canonical row
 * @returns the editable excluded row
 */
export const buildExcludedEditRow = (
  overrides: Partial<ExcludedEditRow> = {},
): ExcludedEditRow => ({
  ...buildExcludedRow(),
  fileName: CSV_FILE.JANUARY.name,
  sourceRowNumber: 3,
  editedValue: "2026-01-15",
  rawJoined: "2026-13-45, TIM HORTONS #1123, -4.25",
  ...overrides,
});

/**
 * Builds the existing transaction a potential duplicate matched.
 * @param overrides fields that differ from the canonical match
 * @returns the matched transaction
 */
export const buildMatchedTransaction = (
  overrides: Partial<MatchedTransaction> = {},
): MatchedTransaction => ({
  ID: MATCHED_ID.AMAZON,
  postedAt: "2026-01-03",
  amount: -42.1,
  rawDescription: DESCRIPTION.AMAZON,
  ...overrides,
});

/**
 * Builds a resolved parse result with empty buckets.
 * @param overrides fields that differ from the empty result
 * @returns the parse result
 */
export const buildParseResult = (
  overrides: Partial<ParseResult> = {},
): ParseResult => ({
  configResolved: true,
  configName: CONFIG_NAME.SCOTIA,
  newRows: [],
  potentialDuplicates: [],
  excludedRows: [],
  skippedCount: 0,
  ...overrides,
});

/**
 * Builds the January file's parse result: two new rows, a duplicate, an excluded row, numbered from 1.
 * @returns the parse result
 */
export const buildJanuaryParseResult = (): ParseResult =>
  buildParseResult({
    newRows: [buildClassifiedRow({ rowNumber: 1 }), buildClassifiedRow({ rowNumber: 2 })],
    potentialDuplicates: [buildClassifiedRow({ rowNumber: 3 })],
    excludedRows: [buildExcludedRow({ rowNumber: 4 })],
    skippedCount: 2,
  });

/**
 * Builds the February file's parse result, also numbered from 1 — what the merge must renumber.
 * @returns the parse result
 */
export const buildFebruaryParseResult = (): ParseResult =>
  buildParseResult({
    configName: CONFIG_NAME.SCOTIA,
    newRows: [buildClassifiedRow({ rowNumber: 1 })],
    potentialDuplicates: [buildClassifiedRow({ rowNumber: 2 })],
    excludedRows: [buildExcludedRow({ rowNumber: 3 })],
    skippedCount: 1,
  });
