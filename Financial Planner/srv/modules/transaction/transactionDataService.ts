import type cds from "@sap/cds";

import { ENTITIES } from "./constants.js";
import type {
  CategoryPair,
  CategoryReferenceField,
  CategoryReferences,
  ExistingSplitRow,
  RecurringSplitTemplateRow,
  SplitPersistValues,
  SuggestionTransactionRow,
  TransactionAmountRow,
  TransactionMatchSource,
} from "./types.js";

/**
 * Data access for transaction splits, recurring-split templates, and the stored
 * vendor a draft save compares against.
 */
export class TransactionDataService {
  /**
   * Loads a transaction's id and amount for split validation.
   * @param transactionId The transaction being split.
   * @returns The amount row, or null when the transaction does not exist.
   */
  async loadTransactionAmount(
    transactionId: string,
  ): Promise<TransactionAmountRow | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID", "amount")
      .where({ ID: transactionId })) as
      | { ID: string; amount: number | string }
      | undefined;
    if (!row) {
      return null;
    }
    return { ID: row.ID, amount: Number(row.amount) };
  }

  /**
   * Loads the transaction a draft split belongs to.
   * @param subject The draft split row being patched.
   * @returns The parent transaction id, or null when the draft row is absent.
   */
  async loadDraftSplitTransactionId(
    subject: cds.Request["subject"],
  ): Promise<string | null> {
    const row = (await SELECT.one.from(subject).columns("transaction_ID")) as
      | { transaction_ID: string }
      | undefined;
    return row?.transaction_ID ?? null;
  }

  /**
   * Reads the percentage a draft split holds before the patch applies.
   * @param subject The draft split row the PATCH targets.
   * @returns The stored 0–1 fraction as read, or null when the split is dollar-based.
   */
  async loadDraftSplitPct(
    subject: cds.Request["subject"],
  ): Promise<number | string | null> {
    const row = (await SELECT.one.from(subject).columns("mySharePct")) as
      | { mySharePct: number | string | null }
      | undefined;
    return row?.mySharePct ?? null;
  }

  /**
   * Finds the vendor's most recently modified recurring split on any other
   * transaction — the template a recurring suggestion copies.
   * @param vendorId The vendor the suggestion matches on.
   * @param excludedTransactionId The transaction being suggested for.
   * @returns The template's raw share columns, or null when none exists.
   */
  async findLatestRecurringSplit(
    vendorId: string,
    excludedTransactionId: string,
  ): Promise<RecurringSplitTemplateRow | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION_SPLIT)
      .columns("mySharePct", "myShareAmount", "splitDescription")
      .where({
        isRecurring: true,
        "transaction.vendor_ID": vendorId,
        transaction_ID: { "!=": excludedTransactionId },
      })
      .orderBy("modifiedAt desc")) as RecurringSplitTemplateRow | undefined;
    return row ?? null;
  }

  /**
   * Finds which of a categorization's ids name no row, so a stale or forged id
   * is refused before the write rather than failing on the foreign key.
   * @param references The vendor and taxonomy ids being assigned.
   * @returns The fields whose id was given but matched no row.
   */
  async findMissingReferences(
    references: CategoryReferences,
  ): Promise<CategoryReferenceField[]> {
    const checks: Array<[CategoryReferenceField, string, string | null]> = [
      ["vendor_ID", ENTITIES.VENDOR, references.vendor_ID],
      ["purchaseType_ID", ENTITIES.PURCHASE_TYPE, references.purchaseType_ID],
      ["earningCategory_ID", ENTITIES.EARNING_CATEGORY, references.earningCategory_ID],
    ];
    const found = await Promise.all(
      checks.map(async ([, entity, id]) =>
        id ? SELECT.one.from(entity).columns("ID").where({ ID: id }) : true,
      ),
    );
    return checks
      .filter((_check, index) => !found[index])
      .map(([field]) => field);
  }

  /**
   * Finds the existing split for a transaction, if one has been created.
   * @param transactionId The parent transaction.
   * @returns The existing split's id, or null when none exists.
   */
  async findSplitByTransaction(
    transactionId: string,
  ): Promise<ExistingSplitRow | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION_SPLIT)
      .columns("ID")
      .where({ transaction_ID: transactionId })) as { ID: string } | undefined;
    return row ? { ID: row.ID } : null;
  }

  /**
   * Inserts a new split for a transaction.
   * @param transactionId The parent transaction.
   * @param values The computed split values.
   * @returns Resolves once the insert completes.
   */
  async insertSplit(
    transactionId: string,
    values: SplitPersistValues,
  ): Promise<void> {
    await INSERT.into(ENTITIES.TRANSACTION_SPLIT).entries({
      transaction_ID: transactionId,
      mySharePct: values.mySharePct,
      myShareAmount: values.myShareAmount,
      splitDescription: values.splitDescription,
      isRecurring: values.isRecurring,
    });
  }

  /**
   * Loads the transaction fields a recurring-split suggestion matches on.
   * @param transactionId The transaction the Split dialog opened on.
   * @returns The id, amount and vendor, or null when the transaction does not exist.
   */
  async loadTransactionForSuggestion(
    transactionId: string,
  ): Promise<SuggestionTransactionRow | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID", "amount", "vendor_ID")
      .where({ ID: transactionId })) as SuggestionTransactionRow | undefined;
    return row ?? null;
  }

  /**
   * Loads a transaction's stored vendor and taxonomy — the baseline a draft save
   * compares against to tell whether the categorization actually changed.
   * @param transactionId The transaction being saved.
   * @returns The stored ids, or null when the row is absent.
   */
  async loadStoredCategorization(
    transactionId: string,
  ): Promise<CategoryReferences | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("vendor_ID", "purchaseType_ID", "earningCategory_ID")
      .where({ ID: transactionId })) as CategoryReferences | undefined;
    return row ?? null;
  }

  /**
   * Loads the purchase type and earning category an open draft currently holds.
   * @param transactionId The transaction whose draft is being patched.
   * @returns The draft's taxonomy ids, or null when no draft exists.
   */
  async loadDraftCategorization(
    transactionId: string,
  ): Promise<CategoryPair | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION_DRAFT)
      .columns("purchaseType_ID", "earningCategory_ID")
      .where({ ID: transactionId })) as CategoryPair | undefined;
    return row ?? null;
  }

  /**
   * Loads the vendor's most-used (PT, EC) combo from the stats view, skipping
   * combos that carry neither id.
   * @param vendorId The vendor just picked.
   * @returns The top combo, or null when the vendor has none.
   */
  async loadTopCategoryCombo(vendorId: string): Promise<CategoryPair | null> {
    const row = (await SELECT.one
      .from(ENTITIES.VENDOR_CATEGORY_STATS)
      .columns("purchaseType_ID", "earningCategory_ID")
      .where({ vendor_ID: vendorId })
      .and("purchaseType_ID is not null or earningCategory_ID is not null")
      .orderBy("usageCount desc")) as CategoryPair | undefined;
    return row ?? null;
  }

  /**
   * Loads the description and amount the matcher explains a transaction from.
   * @param transactionId The transaction shown on the object page.
   * @returns The match inputs, or null when the row is absent.
   */
  async loadTransactionMatchSource(
    transactionId: string,
  ): Promise<TransactionMatchSource | null> {
    const row = (await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("rawDescription", "amount")
      .where({ ID: transactionId })) as
      | { rawDescription: string; amount: number | string }
      | undefined;
    return row
      ? { rawDescription: row.rawDescription, amount: Number(row.amount) }
      : null;
  }

  /**
   * Replaces an existing split's values.
   * @param id The split to update.
   * @param values The computed split values.
   * @returns Resolves once the update completes.
   */
  async updateSplit(id: string, values: SplitPersistValues): Promise<void> {
    await UPDATE(ENTITIES.TRANSACTION_SPLIT)
      .set({
        mySharePct: values.mySharePct,
        myShareAmount: values.myShareAmount,
        splitDescription: values.splitDescription,
        isRecurring: values.isRecurring,
      })
      .where({ ID: id });
  }
}
