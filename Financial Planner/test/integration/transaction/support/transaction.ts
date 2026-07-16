// Harness for the transaction-processing integration test: seeds vendors and
// transactions, and reads split + categorization state so the spec stays free of
// CQL. Actions are invoked through the connected TransactionService.

import { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { TransactionDataService } from "../../../../srv/modules/transaction/transactionDataService.js";
import { TransactionService } from "../../../../srv/modules/transaction/transactionService.js";

import { LEARNED_PATTERN_SOURCE } from "../../../shared/data/reference.js";
import {
  BULK_TRANSACTIONS,
  SPLIT_TRANSACTION,
  STARBUCKS_VENDOR,
} from "../data/transaction.js";

const VENDOR = "com.financialplanner.Vendor";
const TRANSACTION = "com.financialplanner.Transaction";
const TRANSACTION_SPLIT = "com.financialplanner.TransactionSplit";
const MERCHANT_PATTERN = "com.financialplanner.MerchantPattern";

/** A persisted split's values, in the shape the spec asserts on. */
export interface SplitRow {
  mySharePct: number | null;
  myShareAmount: number;
  splitDescription: string | null;
  isRecurring: boolean;
}

/** A transaction's categorization state, in the shape the spec asserts on. */
export interface TransactionStateRow {
  vendor_ID: string | null;
  categorizationStatus: string;
}

/** The real transaction engine wired to the in-memory DB and categorization. */
export function buildTransactionService(): TransactionService {
  return new TransactionService(
    new TransactionDataService(),
    new CategorizationService(new CategorizationDataService()),
  );
}

/** Wraps an action payload as a request with a no-op error() collaborator. */
export function actionRequest(data: unknown): { data: unknown; error: () => void } {
  return { data, error: () => undefined };
}

/** Seeds the bulk vendor, the split transaction, and the two bulk transactions. */
export async function seedTransactionProcessing(): Promise<void> {
  await INSERT.into(VENDOR).entries(STARBUCKS_VENDOR);
  await INSERT.into(TRANSACTION).entries(SPLIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(BULK_TRANSACTIONS);
}

/** Reads the single split for a transaction. */
export async function readSplitByTransaction(
  transactionId: string,
): Promise<SplitRow | null> {
  const row = (await SELECT.one
    .from(TRANSACTION_SPLIT)
    .columns("mySharePct", "myShareAmount", "splitDescription", "isRecurring")
    .where({ transaction_ID: transactionId })) as
    | {
        mySharePct: number | string | null;
        myShareAmount: number | string;
        splitDescription: string | null;
        isRecurring: boolean;
      }
    | undefined;
  if (!row) {
    return null;
  }
  return {
    mySharePct: row.mySharePct === null ? null : Number(row.mySharePct),
    myShareAmount: Number(row.myShareAmount),
    splitDescription: row.splitDescription,
    isRecurring: row.isRecurring,
  };
}

/** Reads a transaction's categorization state by id. */
export async function readTransactionState(
  transactionId: string,
): Promise<TransactionStateRow | null> {
  const row = (await SELECT.one
    .from(TRANSACTION)
    .columns("vendor_ID", "categorizationStatus")
    .where({ ID: transactionId })) as TransactionStateRow | undefined;
  return row ?? null;
}

/** Counts the learned patterns a vendor has accumulated. */
export async function countLearnedPatternsForVendor(
  vendorId: string,
): Promise<number> {
  const rows = (await SELECT.from(MERCHANT_PATTERN)
    .columns("ID")
    .where({
      vendor_ID: vendorId,
      patternSource_ID: LEARNED_PATTERN_SOURCE.ID,
    })) as Array<{ ID: string }>;
  return rows.length;
}
