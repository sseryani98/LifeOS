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
