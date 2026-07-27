// Harness for the TransactionService unit test: wires the split/categorize
// engine to a mocked data layer and a mocked categorization engine, using the
// real validator and mapper. A helper wraps a payload as an action request with
// a spy error() so specs stay arrange-act-assert.

import { TransactionService } from "../../../../srv/modules/transaction/transactionService.js";

import type { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import type { TransactionDataService } from "../../../../srv/modules/transaction/transactionDataService.js";

export interface TransactionMocks {
  data: jest.Mocked<TransactionDataService>;
  categorization: jest.Mocked<CategorizationService>;
  service: TransactionService;
}

/** Builds a fresh TransactionService with its data and categorization layers mocked. */
export function buildTransactionMocks(): TransactionMocks {
  const data = {
    loadTransactionAmount: jest.fn(async () => null),
    findSplitByTransaction: jest.fn(async () => null),
    insertSplit: jest.fn(async () => undefined),
    updateSplit: jest.fn(async () => undefined),
    loadStoredVendor: jest.fn(async () => null),
  } as unknown as jest.Mocked<TransactionDataService>;

  const categorization = {
    correctCategorization: jest.fn(async () => true),
    applyAssignmentLearning: jest.fn(async () => undefined),
    applyReCategorization: jest.fn(async () => ({
      recategorizedCount: 0,
      skippedCount: 0,
    })),
  } as unknown as jest.Mocked<CategorizationService>;

  const service = new TransactionService(data, categorization);
  return { data, categorization, service };
}

/** Wraps an action payload as a request with a spy error() collaborator. */
export function requestOf(data: unknown): { data: unknown; error: jest.Mock } {
  return { data, error: jest.fn() };
}

/** Wraps an UPDATE patch as a request with a keyed params entry (the row id). */
export function requestWithKey(
  data: Record<string, unknown>,
  id: string,
): { data: Record<string, unknown>; params: unknown[]; error: jest.Mock } {
  return { data, params: [{ ID: id }], error: jest.fn() };
}
