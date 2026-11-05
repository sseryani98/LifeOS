// Wires both transaction engines to a mocked data layer and categorization engine
// with the real validator and mapper; the request helpers carry a spy error() so
// specs stay arrange-act-assert.

import { TransactionService } from "../../../../srv/modules/transaction/transactionService.js";
import { TransactionSplitService } from "../../../../srv/modules/transaction/transactionSplitService.js";

import type { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import type { TransactionDataService } from "../../../../srv/modules/transaction/transactionDataService.js";

export interface TransactionMocks {
  data: jest.Mocked<TransactionDataService>;
  categorization: jest.Mocked<CategorizationService>;
  service: TransactionService;
  splitService: TransactionSplitService;
}

/** Builds fresh transaction engines with their data and categorization layers mocked. */
export const buildTransactionMocks = (): TransactionMocks => {
  const data = {
    loadTransactionAmount: jest.fn(async () => null),
    loadDraftSplitTransactionId: jest.fn(async () => null),
    loadDraftSplitPct: jest.fn(async () => null),
    findSplitByTransaction: jest.fn(async () => null),
    insertSplit: jest.fn(async () => undefined),
    updateSplit: jest.fn(async () => undefined),
    loadStoredCategorization: jest.fn(async () => null),
    loadDraftCategorization: jest.fn(async () => null),
    loadTopCategoryCombo: jest.fn(async () => null),
    loadTransactionMatchSource: jest.fn(async () => null),
    loadTransactionForSuggestion: jest.fn(async () => null),
    findLatestRecurringSplit: jest.fn(async () => null),
    findMissingReferences: jest.fn(async () => []),
  } as unknown as jest.Mocked<TransactionDataService>;

  const categorization = {
    buildContext: jest.fn(async () => ({ findMatch: jest.fn(() => null) })),
    correctCategorization: jest.fn(async () => true),
    applyAssignmentLearning: jest.fn(async () => undefined),
    applyReCategorization: jest.fn(async () => ({
      recategorizedCount: 0,
      skippedCount: 0,
    })),
  } as unknown as jest.Mocked<CategorizationService>;

  const service = new TransactionService(data, categorization);
  const splitService = new TransactionSplitService(data);
  return { data, categorization, service, splitService };
};

/** Wraps an action payload as a request with a spy error() collaborator. */
export const requestOf = (data: unknown): { data: unknown; error: jest.Mock } => {
  return { data, error: jest.fn() };
};

/** Wraps an UPDATE patch as a request with a keyed params entry (the row id). */
export const requestWithKey = (
  data: Record<string, unknown>,
  id: string,
): { data: Record<string, unknown>; params: unknown[]; error: jest.Mock } => {
  return { data, params: [{ ID: id }], error: jest.fn() };
};

/** Wraps a READ result's request: the columns the client selected. */
export const requestSelecting = (
  columns: Array<{ ref: string[] }>,
): { query: { SELECT: { columns: Array<{ ref: string[] }> } } } => {
  return { query: { SELECT: { columns } } };
};

/** Builds a matching context whose matcher always returns the given pattern. */
export const buildMatchContext = (
  pattern: unknown,
): { findMatch: jest.Mock } => {
  return { findMatch: jest.fn(() => pattern) };
};
