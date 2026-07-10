// Harnesses for the categorization unit tests: a context builder over a pattern
// list (default counts + stats) and a service wired to a fully mocked data
// layer. Kept out of the test files so each reads as arrange-act-assert.

import { CategorizationContext } from "../../../../srv/modules/categorization/categorizationContextService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { STATS_BY_VENDOR, VENDOR_COUNTS } from "../data/patterns.js";

import type { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import type { MerchantPatternRecord } from "../../../../srv/modules/categorization/types.js";

export interface CategorizationMocks {
  loadActivePatterns: jest.Mock;
  loadVendorCounts: jest.Mock;
  loadStatsByVendor: jest.Mock;
  loadTransactionForCorrection: jest.Mock;
  updateTransactionCategorization: jest.Mock;
  insertMerchantPattern: jest.Mock;
  resolvePatternSourceId: jest.Mock;
  resolveConfidenceLevelId: jest.Mock;
  service: CategorizationService;
}

/**
 * Builds a matching context over the given patterns, reusing the canonical
 * vendor counts and category stats.
 */
export function buildCategorizationContext(
  patterns: MerchantPatternRecord[],
): CategorizationContext {
  return new CategorizationContext(patterns, VENDOR_COUNTS, STATS_BY_VENDOR);
}

/** Builds a CategorizationService with its data layer fully mocked. */
export function buildCategorizationMocks(): CategorizationMocks {
  const loadActivePatterns = jest.fn().mockResolvedValue([]);
  const loadVendorCounts = jest.fn().mockResolvedValue(new Map());
  const loadStatsByVendor = jest.fn().mockResolvedValue(new Map());
  const loadTransactionForCorrection = jest.fn().mockResolvedValue(null);
  const updateTransactionCategorization = jest.fn().mockResolvedValue(undefined);
  const insertMerchantPattern = jest.fn().mockResolvedValue(undefined);
  const resolvePatternSourceId = jest.fn().mockResolvedValue("source-learned");
  const resolveConfidenceLevelId = jest.fn().mockResolvedValue("confidence-medium");
  const dataService = {
    loadActivePatterns,
    loadVendorCounts,
    loadStatsByVendor,
    loadTransactionForCorrection,
    updateTransactionCategorization,
    insertMerchantPattern,
    resolvePatternSourceId,
    resolveConfidenceLevelId,
  } as unknown as CategorizationDataService;
  const service = new CategorizationService(dataService);
  return {
    loadActivePatterns,
    loadVendorCounts,
    loadStatsByVendor,
    loadTransactionForCorrection,
    updateTransactionCategorization,
    insertMerchantPattern,
    resolvePatternSourceId,
    resolveConfidenceLevelId,
    service,
  };
}
