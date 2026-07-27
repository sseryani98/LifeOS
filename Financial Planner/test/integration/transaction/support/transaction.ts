// Harness for the transaction-processing integration test: seeds vendors and
// transactions, and reads split + categorization state so the spec stays free of
// CQL. Actions are invoked through the connected TransactionService.

import { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { TransactionDataService } from "../../../../srv/modules/transaction/transactionDataService.js";
import { TransactionFacade } from "../../../../srv/modules/transaction/transactionFacade.js";
import { TransactionService } from "../../../../srv/modules/transaction/transactionService.js";

import cds from "@sap/cds";

import { LEARNED_PATTERN_SOURCE } from "../../../shared/data/reference.js";
import {
  BULK_TRANSACTIONS,
  EXISTING_SPLIT,
  INLINE_EDIT_TRANSACTION,
  RECAT_CORRECTED_TRANSACTIONS,
  RECAT_UNCATEGORIZED_TRANSACTIONS,
  RESPLIT_TRANSACTION,
  SPLIT_TRANSACTION,
  STARBUCKS_VENDOR,
  UBER_EATS_PATTERN,
  UBER_EATS_VENDOR,
} from "../data/transaction.js";

const VENDOR = "com.financialplanner.Vendor";
const TRANSACTION = "com.financialplanner.Transaction";
const TRANSACTION_SPLIT = "com.financialplanner.TransactionSplit";
const MERCHANT_PATTERN = "com.financialplanner.MerchantPattern";
const SERVICE_PATH = "/service/transactionSvcs";
const SERVICE_NAME = "TransactionService";
const SERVICE_TRANSACTIONS = "TransactionService.Transactions";

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

/** The calculated elements the Transactions projection derives for the UI. */
export interface TransactionProjectionRow {
  hasSplit: boolean;
  statusCriticality: number;
}

/** The splitTransaction action's OData response. */
export interface SplitActionResponse {
  status: number;
  data: {
    transactionId: string;
    mySharePct: number | null;
    myShareAmount: number;
    isRecurring: boolean;
  };
}

/** The bulkCategorize action's OData response. */
export interface BulkActionResponse {
  status: number;
  data: { updatedCount: number };
}

type PostFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

type PatchFn = <TResponse>(
  url: string,
  data: Record<string, unknown>,
) => Promise<TResponse>;

/** The transaction actions invoked over OData, as the UI invokes them. */
export interface TransactionActions {
  postSplitTransaction: (
    payload: Record<string, unknown>,
  ) => Promise<SplitActionResponse>;
  postBulkCategorize: (
    payload: Record<string, unknown>,
  ) => Promise<BulkActionResponse>;
}

/**
 * Binds the action callers to a cds.test POST handle so the spec exercises the
 * real facade bindings and the CDS action signatures, not the engine directly.
 */
export function buildTransactionActions(post: PostFn): TransactionActions {
  /** Invokes splitTransaction over OData. */
  async function postSplitTransaction(
    payload: Record<string, unknown>,
  ): Promise<SplitActionResponse> {
    return post<SplitActionResponse>(
      `${SERVICE_PATH}/splitTransaction`,
      payload,
    );
  }

  /** Invokes bulkCategorize over OData. */
  async function postBulkCategorize(
    payload: Record<string, unknown>,
  ): Promise<BulkActionResponse> {
    return post<BulkActionResponse>(`${SERVICE_PATH}/bulkCategorize`, payload);
  }

  return { postSplitTransaction, postBulkCategorize };
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

/**
 * Seeds the bulk vendor, the split transaction, the bulk transactions, and the
 * re-split + inline-edit rows that own their own state.
 */
export async function seedTransactionProcessing(): Promise<void> {
  await INSERT.into(VENDOR).entries(STARBUCKS_VENDOR);
  await INSERT.into(TRANSACTION).entries(SPLIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(BULK_TRANSACTIONS);
  await INSERT.into(TRANSACTION).entries(RESPLIT_TRANSACTION);
  await INSERT.into(TRANSACTION).entries(INLINE_EDIT_TRANSACTION);
  await INSERT.into(TRANSACTION_SPLIT).entries(EXISTING_SPLIT);
}

/**
 * Registers the production facade on the served CDS service. cds.test cannot
 * load the TypeScript service impl, so the facade is bound here to put the real
 * srv.on/srv.before wiring and the CDS action signatures under test.
 */
export async function registerTransactionHandlers(): Promise<void> {
  const srv = (await cds.connect.to(SERVICE_NAME)) as cds.ApplicationService;
  new TransactionFacade(srv, buildTransactionService()).registerHandlers();
}

/**
 * Drives the draft edit → patch vendor → activate flow for an existing
 * transaction, firing the real before-SAVE learning hook the inline-edit UI
 * relies on. Bound to the cds.test POST/PATCH handles.
 */
export function buildInlineEditFlow(
  post: PostFn,
  patch: PatchFn,
): (transactionId: string, vendorId: string) => Promise<void> {
  const draftUrl = (transactionId: string, active: boolean): string =>
    `${SERVICE_PATH}/Transactions(ID=${transactionId},IsActiveEntity=${active})`;

  return async function assignVendorViaDraft(
    transactionId: string,
    vendorId: string,
  ): Promise<void> {
    await post(
      `${draftUrl(transactionId, true)}/${SERVICE_NAME}.draftEdit`,
      { PreserveChanges: true },
    );
    await patch(draftUrl(transactionId, false), { vendor_ID: vendorId });
    await post(
      `${draftUrl(transactionId, false)}/${SERVICE_NAME}.draftActivate`,
      {},
    );
  };
}

/** Reads the projection's calculated elements for a transaction. */
export async function readTransactionProjection(
  transactionId: string,
): Promise<TransactionProjectionRow | null> {
  const srv = await cds.connect.to(SERVICE_NAME);
  const row = (await srv.run(
    SELECT.one
      .from(SERVICE_TRANSACTIONS)
      .columns("hasSplit", "statusCriticality")
      .where({ ID: transactionId }),
  )) as { hasSplit: boolean | number; statusCriticality: number } | undefined;
  if (!row) {
    return null;
  }
  return {
    hasSplit: !!row.hasSplit,
    statusCriticality: Number(row.statusCriticality),
  };
}

/** Counts the split rows a transaction has — the at-most-one invariant. */
export async function countSplitsForTransaction(
  transactionId: string,
): Promise<number> {
  const rows = (await SELECT.from(TRANSACTION_SPLIT)
    .columns("ID")
    .where({ transaction_ID: transactionId })) as Array<{ ID: string }>;
  return rows.length;
}

/**
 * Seeds the re-categorize scenario: the Uber Eats vendor, a pattern added after
 * ingestion, three uncategorized rows, and two user-corrected rows.
 */
export async function seedReCategorizeScenario(): Promise<void> {
  await INSERT.into(VENDOR).entries(UBER_EATS_VENDOR);
  await INSERT.into(MERCHANT_PATTERN).entries(UBER_EATS_PATTERN);
  await INSERT.into(TRANSACTION).entries(RECAT_UNCATEGORIZED_TRANSACTIONS);
  await INSERT.into(TRANSACTION).entries(RECAT_CORRECTED_TRANSACTIONS);
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

/** Reads the pattern strings a vendor has learned. */
export async function readLearnedPatternTextsForVendor(
  vendorId: string,
): Promise<string[]> {
  const rows = (await SELECT.from(MERCHANT_PATTERN)
    .columns("pattern")
    .where({
      vendor_ID: vendorId,
      patternSource_ID: LEARNED_PATTERN_SOURCE.ID,
    })) as Array<{ pattern: string }>;
  return rows.map(row => row.pattern);
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
