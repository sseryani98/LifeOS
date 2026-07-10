import type { EncryptionFactory, HttpClient, SleepFn } from "../shared/types.js";

/** Deduplication outcomes for the two-tier strategy. */
export type DedupOutcome = "new" | "duplicate" | "potential_duplicate";

/**
 * A transaction candidate handed to the deduplication engine before it is
 * persisted. Mirrors the ingestion-relevant fields of the Transaction entity.
 */
export interface IncomingTransaction {
  /** SimpleFIN stable id; null/undefined for CSV and manual sources. */
  externalId?: string | null;
  /** Mapped card instance id; null for unmapped provider accounts. */
  cardInstance_ID?: string | null;
  /** Signed amount — negative = charge, positive = credit/refund. */
  amount: number;
  /** Posting date (date only, ISO format). */
  postedAt: string;
  /** Original, unmodified bank description. */
  rawDescription: string;
  /** Ingestion source (simplefin | csv | manual). */
  source: string;
}

/** Result of evaluating an incoming transaction for duplication. */
export interface DedupResult {
  outcome: DedupOutcome;
  /** Id of the existing transaction matched, when the outcome is not "new". */
  matchedTransactionId?: string;
}

/** A single validation failure produced by DeduplicationValidator. */
export interface DedupValidationError {
  field: string;
  messageKey: string;
}

/** Minimal projection returned by deduplication lookups. */
export interface MatchedTransaction {
  ID: string;
}

/** A single transaction in the SimpleFIN Bridge `/accounts` response. */
export interface SimpleFINTransaction {
  /** Stable id, unique within the account — the dedup key. */
  id: string;
  /** Posting time as UNIX epoch seconds; 0 when pending. */
  posted: number;
  /** Numeric string; negative = charge, positive = credit/refund. */
  amount: string;
  /** Raw bank description, never normalized. */
  description: string;
  /** Opt-in pending flag; pending rows are discarded. */
  pending?: boolean;
  /** Actual transaction time as UNIX epoch seconds, if provided. */
  transacted_at?: number;
}

/** One account block in the SimpleFIN Bridge `/accounts` response. */
export interface SimpleFINAccount {
  /** Provider account id, matched to ProviderAccount.externalAccountId. */
  id: string;
  /** Display name from the provider. */
  name: string;
  /** ISO currency code, if provided. */
  currency?: string;
  /** Current balance as a numeric string, if provided. */
  balance?: string;
  /** Transactions within the requested window. */
  transactions: SimpleFINTransaction[];
}

/** The SimpleFIN Bridge `/accounts` response envelope. */
export interface SimpleFINResponse {
  /** Non-empty when a bank connection needs attention. */
  errors: string[];
  /** Accounts and their transactions. */
  accounts: SimpleFINAccount[];
}

/** Summary returned by a single-connection sync. */
export interface SimpleFINSyncResult {
  /** Transactions inserted this run. */
  created: number;
  /** Transactions silently skipped as external-id duplicates. */
  duplicates: number;
  /** Accounts seen in the response. */
  accountsProcessed: number;
  /** Accounts auto-created because they were unmapped. */
  unmapped: number;
  /** Final sync status written to the connection. */
  status: "success" | "error";
}

/** Inputs for claiming a SimpleFIN setup token (Add Connection). */
export interface ClaimRequest {
  setupToken?: string | null;
  displayName?: string | null;
}

/** A single validation failure produced by SimpleFINValidator. */
export interface SimpleFINValidationError {
  field: string;
  messageKey: string;
}

/** Provider Connection projection used by the sync engine. */
export interface ConnectionRecord {
  ID: string;
  displayName: string;
  accessUrlEnc: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
}

/** Provider Account projection used by the sync engine. */
export interface AccountRecord {
  ID: string;
  cardInstance_ID: string | null;
  externalAccountId: string;
  isActive: boolean;
}

/** Fields written when updating a connection after a sync. */
export interface ConnectionSyncPatch {
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastErrorMessage: string | null;
}

/** Optional, test-friendly collaborators for the sync engine. */
export interface SimpleFINServiceOptions {
  http?: HttpClient;
  sleep?: SleepFn;
  encryptionFactory?: EncryptionFactory;
  now?: () => number;
}

/**
 * CsvFormatConfig projection used by the CSV import engine. Columns are stored
 * either as header names (Scotia, Amex) or numeric indices (TD, CIBC) — the
 * engine resolves both. Amount is single-column + sign OR split debit/credit,
 * never both (enforced by @assert on the entity).
 */
export interface CsvFormatConfigRecord {
  ID: string;
  configName: string;
  dateColumn: string;
  dateFormat: string;
  amountColumn: string | null;
  amountSign: string | null;
  debitColumn: string | null;
  creditColumn: string | null;
  descriptionColumn: string;
  statusColumn: string | null;
  statusPostedValue: string | null;
  cardmemberColumn: string | null;
  headerRowsSkip: number;
  delimiter: string;
}

/**
 * A card eligible for cardmember attribution — the selected card plus any
 * supplementary cards under it. `cardholderName` is matched against the CSV's
 * cardmember column.
 */
export interface AttributionCard {
  ID: string;
  cardholderName: string | null;
}

/** Inputs for a CSV parse request (wizard step 1 → review). */
export interface CsvParseRequest {
  cardInstance_ID?: string | null;
  fileName?: string | null;
  fileContent?: string | null;
}

/** Scalar fields extracted from one CSV row before classification. */
export interface ParsedCsvFields {
  postedAt: string;
  amount: number;
  rawDescription: string;
  cardInstance_ID: string | null;
  cardholderName: string | null;
}

/** A successfully parsed + deduped CSV row (New or Potential Duplicates tab). */
export interface CsvClassifiedRow extends ParsedCsvFields {
  rowNumber: number;
  dedupOutcome: DedupOutcome;
  matchedTransactionId: string | null;
}

/** A CSV row that failed to parse — surfaced on the Excluded tab. */
export interface CsvExcludedRow {
  rowNumber: number;
  rawCells: string[];
  errorField: string;
  errorMessageKey: string;
  errorValue: string;
}

/** Full outcome of parsing one CSV file for one card. */
export interface CsvParseResult {
  configResolved: boolean;
  configName: string | null;
  newRows: CsvClassifiedRow[];
  potentialDuplicates: CsvClassifiedRow[];
  excludedRows: CsvExcludedRow[];
  /** Rows discarded by status filtering — not surfaced for review. */
  skippedCount: number;
}

/** A single validation failure produced by CsvImportValidator. */
export interface CsvValidationError {
  field: string;
  messageKey: string;
}

/**
 * One reviewed row the wizard sends to saveCsvImport — a cleared New row or an
 * overridden potential duplicate. Categorization ids are null when the user
 * imported the row uncategorized.
 */
export interface CsvSaveRow {
  postedAt: string;
  amount: number;
  rawDescription: string;
  cardInstance_ID?: string | null;
  vendor_ID?: string | null;
  purchaseType_ID?: string | null;
  earningCategory_ID?: string | null;
}

/** Inputs for a CSV save request (wizard step 3 → persist). */
export interface CsvSaveRequest {
  cardInstance_ID?: string | null;
  fileName?: string | null;
  skippedCount?: number | null;
  rows?: CsvSaveRow[] | null;
}

/** A Transaction insert row assembled from a reviewed CSV row. */
export interface TransactionInsert {
  ID: string;
  cardInstance_ID: string | null;
  source: string;
  amount: number;
  postedAt: string;
  rawDescription: string;
  vendor_ID: string | null;
  purchaseType_ID: string | null;
  earningCategory_ID: string | null;
  categorizationStatus: string;
  isExcluded: boolean;
}

/** An ImportLog insert row recording one CSV import run. */
export interface ImportLogInsert {
  ID: string;
  cardInstance_ID: string;
  fileName: string;
  importDate: string;
  transactionCount: number;
  totalAmount: number;
  skippedCount: number;
}

/** Post-import summary returned to the wizard: counts, total, and top vendor. */
export interface CsvImportSummary {
  importLogId: string;
  transactionCount: number;
  totalAmount: number;
  topVendorName: string | null;
}

/** Buckets accumulated while classifying the rows of one CSV file. */
export interface RowBuckets {
  newRows: CsvClassifiedRow[];
  potentialDuplicates: CsvClassifiedRow[];
  excludedRows: CsvExcludedRow[];
  skippedCount: number;
}

/** Per-file parsing context threaded through the row loop. */
export interface ParseContext {
  config: CsvFormatConfigRecord;
  headerMap: Map<string, number>;
  attribution: Map<string, string>;
  selectedId: string;
}
