// Harness for the categorization integration test: the real engine + data layer
// against the in-memory DB, plus seed and read helpers so the spec stays free of
// CQL. Kept out of the test file so the body reads as arrange-act-assert.

import { CategorizationDataService } from "../../../../srv/modules/categorization/categorizationDataService.js";
import { CategorizationService } from "../../../../srv/modules/categorization/categorizationService.js";
import { LEARNED_PATTERN_SOURCE } from "../../../shared/data/reference.js";
import {
  CATEGORIZATION_VENDORS,
  ICLOUD_PATTERN,
  ICLOUD_TRANSACTION,
  PADEL_UNCATEGORIZED_TRANSACTION,
  UBER_EATS_PATTERN,
  UBER_EATS_TRANSACTIONS,
} from "../data/categorization.js";

const VENDOR = "com.financialplanner.Vendor";
const MERCHANT_PATTERN = "com.financialplanner.MerchantPattern";
const TRANSACTION = "com.financialplanner.Transaction";

/** A learned merchant pattern row, in the shape the spec asserts on. */
export interface LearnedPatternRow {
  pattern: string;
  matchType: string;
  amount: number | null;
  isActive: boolean;
}

/** A transaction's categorization state, in the shape the spec asserts on. */
export interface TransactionStateRow {
  vendor_ID: string | null;
  categorizationStatus: string;
}

/** The real categorization engine wired to the in-memory DB. */
export function buildCategorizationService(): CategorizationService {
  return new CategorizationService(new CategorizationDataService());
}

/** Seeds vendors, contains + amount patterns, and categorized/uncategorized rows. */
export async function seedCategorization(): Promise<void> {
  await INSERT.into(VENDOR).entries(CATEGORIZATION_VENDORS);
  await INSERT.into(MERCHANT_PATTERN).entries([UBER_EATS_PATTERN, ICLOUD_PATTERN]);
  await INSERT.into(TRANSACTION).entries(UBER_EATS_TRANSACTIONS);
  await INSERT.into(TRANSACTION).entries([
    ICLOUD_TRANSACTION,
    PADEL_UNCATEGORIZED_TRANSACTION,
  ]);
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

/** Reads the learned patterns a vendor has accumulated. */
export async function readLearnedPatternsForVendor(
  vendorId: string,
): Promise<LearnedPatternRow[]> {
  return (await SELECT.from(MERCHANT_PATTERN)
    .columns("pattern", "matchType", "amount", "isActive")
    .where({
      vendor_ID: vendorId,
      patternSource_ID: LEARNED_PATTERN_SOURCE.ID,
    })) as LearnedPatternRow[];
}
