/** A CSV file the user added in step 1, read as text for the parse action. */
export interface ParsedFile {
  name: string;
  content: string;
}

/** A classified row as returned by the parseCsvImport action. */
export interface ClassifiedRow {
  rowNumber: number;
  postedAt: string;
  amount: number;
  rawDescription: string;
  cardInstance_ID: string;
  cardholderName: string | null;
  dedupOutcome: string;
  matchedTransactionId: string | null;
}

/** An excluded (parse-error) row as returned by the parseCsvImport action. */
export interface ExcludedRow {
  rowNumber: number;
  rawCells: string[];
  errorField: string;
  errorMessageKey: string;
  errorValue: string;
}

/** The parseCsvImport action result, merged across all uploaded files. */
export interface ParseResult {
  configResolved: boolean;
  configName: string | null;
  newRows: ClassifiedRow[];
  potentialDuplicates: ClassifiedRow[];
  excludedRows: ExcludedRow[];
  skippedCount: number;
}

/** The existing transaction a potential duplicate matched, for side-by-side view. */
export interface MatchedTransaction {
  ID: string;
  postedAt: string;
  amount: number;
  rawDescription: string;
}

/** One reviewed row sent to saveCsvImport. */
export interface SaveRow {
  postedAt: string;
  amount: number;
  rawDescription: string;
  cardInstance_ID: string;
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
}

/** The post-import summary returned by saveCsvImport. */
export interface ImportSummary {
  importLogId: string;
  transactionCount: number;
  totalAmount: number;
  topVendorName: string | null;
}

/** A reference entity created on the fly (vendor, earning category). */
export interface CreatedEntity {
  ID: string;
  name: string;
}

/** A New-tab row: a classified row plus the user's categorization and state. */
export interface NewRow extends ClassifiedRow {
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  cleared: boolean;
}

/** A Potential-Duplicates row pairing the CSV row with the matched existing one. */
export interface DuplicateRow {
  csv: ClassifiedRow;
  existingPostedAt: string;
  existingAmount: number;
  existingDescription: string;
  decision: string;
}

/** An Excluded-tab row with the offending value made editable for correction. */
export interface ExcludedEditRow extends ExcludedRow {
  editedValue: string;
  rawJoined: string;
}
