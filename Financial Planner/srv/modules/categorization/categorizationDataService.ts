import { ENTITIES } from "./constants.js";
import type {
  CategoryCombo,
  MerchantPatternInsert,
  MerchantPatternRecord,
  TransactionCategorizationPatch,
  TransactionCategorizationRow,
  TransactionRecategorizationRow,
} from "./types.js";

/**
 * Data-access layer for the categorization engine. Loads the pattern/stats
 * snapshot the matcher runs on, and persists learned patterns and corrected
 * transactions. 
 */
export class CategorizationDataService {
  /**
   * Loads all active merchant patterns with their vendor name and confidence
   * level, coercing the decimal amount to a number.
   * @returns Active patterns in matcher shape.
   */
  async loadActivePatterns(): Promise<MerchantPatternRecord[]> {
    const rows = (await SELECT.from(ENTITIES.MERCHANT_PATTERN)
      .columns(
        "ID",
        "vendor_ID",
        "pattern",
        "matchType",
        "amount",
        "vendor.name as vendorName",
        "confidenceLevel.name as confidenceName",
      )
      .where({ isActive: true })) as Array<{
        ID: string;
        vendor_ID: string;
        pattern: string;
        matchType: string;
        amount: number | string | null;
        vendorName: string;
        confidenceName: string;
      }>;
    return rows.map(row => ({
      ID: row.ID,
      vendor_ID: row.vendor_ID,
      vendorName: row.vendorName,
      pattern: row.pattern,
      matchType: row.matchType,
      confidenceName: row.confidenceName,
      amount: row.amount === null ? null : Number(row.amount),
    }));
  }

  /**
   * Counts categorized transactions per vendor — the final matching tie-breaker.
   * @returns Vendor id → transaction count.
   */
  async loadVendorCounts(): Promise<Map<string, number>> {
    const rows = (await SELECT.from(ENTITIES.TRANSACTION)
      .columns("vendor_ID", "count(*) as usageCount")
      .where("vendor_ID is not null")
      .groupBy("vendor_ID")) as Array<{
        vendor_ID: string;
        usageCount: number | string;
      }>;
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.vendor_ID, Number(row.usageCount));
    }
    return counts;
  }

  /**
   * Loads the (PT, EC) usage combos per vendor from the stats view, grouped by
   * vendor and ranked by count descending.
   * @returns Vendor id → ranked category combos.
   */
  async loadStatsByVendor(): Promise<Map<string, CategoryCombo[]>> {
    const rows = (await SELECT.from(ENTITIES.VENDOR_CATEGORY_STATS)
      .columns("vendor_ID", "purchaseType_ID", "earningCategory_ID", "usageCount")
      .orderBy("usageCount desc")) as Array<{
        vendor_ID: string;
        purchaseType_ID: string | null;
        earningCategory_ID: string | null;
        usageCount: number | string;
      }>;
    const byVendor = new Map<string, CategoryCombo[]>();
    for (const row of rows) {
      const combos = byVendor.get(row.vendor_ID) ?? [];
      combos.push({
        purchaseType_ID: row.purchaseType_ID,
        earningCategory_ID: row.earningCategory_ID,
        usageCount: Number(row.usageCount),
      });
      byVendor.set(row.vendor_ID, combos);
    }
    return byVendor;
  }

  /**
   * Loads the fields a correction reads before learning a pattern.
   * @param transactionId The transaction being corrected.
   * @returns The transaction row, or null when it does not exist.
   */
  async loadTransactionForCorrection(
    transactionId: string,
  ): Promise<TransactionCategorizationRow | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID", "rawDescription", "amount")
      .where({ ID: transactionId })) as
      | { ID: string; rawDescription: string; amount: number | string }
      | undefined;
    if (!row) {
      return null;
    }
    return {
      ID: row.ID,
      rawDescription: row.rawDescription,
      amount: Number(row.amount),
    };
  }

  /**
   * Loads the selected transactions the re-categorize batch re-matches, with
   * the status that decides whether each row is skipped.
   * @param transactionIds The selected transaction ids.
   * @returns The rows in re-categorization shape.
   */
  async loadTransactionsForRecategorization(
    transactionIds: string[],
  ): Promise<TransactionRecategorizationRow[]> {
    const rows = (await SELECT.from(ENTITIES.TRANSACTION)
      .columns("ID", "rawDescription", "amount", "categorizationStatus")
      .where({ ID: { in: transactionIds } })) as Array<{
        ID: string;
        rawDescription: string;
        amount: number | string;
        categorizationStatus: string;
      }>;
    return rows.map(row => ({
      ID: row.ID,
      rawDescription: row.rawDescription,
      amount: Number(row.amount),
      categorizationStatus: row.categorizationStatus,
    }));
  }

  /**
   * Applies a categorization patch to a transaction.
   * @param transactionId The transaction to update.
   * @param patch The categorization fields to write.
   * @returns Resolves once the update completes.
   */
  async updateTransactionCategorization(
    transactionId: string,
    patch: TransactionCategorizationPatch,
  ): Promise<void> {
    await UPDATE(ENTITIES.TRANSACTION).set(patch).where({ ID: transactionId });
  }

  /**
   * Inserts a learned merchant pattern.
   * @param pattern The pattern insert row.
   * @returns Resolves once the insert completes.
   */
  async insertMerchantPattern(pattern: MerchantPatternInsert): Promise<void> {
    await INSERT.into(ENTITIES.MERCHANT_PATTERN).entries(pattern);
  }

  /**
   * Resolves a pattern-source id by its seeded name. The reference row is a
   * deploy invariant (seeded reference data), so absence is a fatal misconfig.
   * @param name The pattern-source name (e.g. `Learned`).
   * @returns The pattern-source id.
   */
  async resolvePatternSourceId(name: string): Promise<string> {
    const row = (await SELECT.one
      .from(ENTITIES.PATTERN_SOURCE)
      .columns("ID")
      .where({ name })) as { ID: string };
    return row.ID;
  }

  /**
   * Resolves a confidence-level id by its seeded name. The reference row is a
   * deploy invariant (seeded reference data), so absence is a fatal misconfig.
   * @param name The confidence-level name (e.g. `Medium`).
   * @returns The confidence-level id.
   */
  async resolveConfidenceLevelId(name: string): Promise<string> {
    const row = (await SELECT.one
      .from(ENTITIES.CONFIDENCE_LEVEL)
      .columns("ID")
      .where({ name })) as { ID: string };
    return row.ID;
  }
}
