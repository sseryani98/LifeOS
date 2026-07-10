import { ENTITIES } from "./constants.js";
import type {
  ExistingSplitRow,
  SplitPersistValues,
  TransactionAmountRow,
} from "./types.js";

/**
 * Data-access layer for transaction splitting. Reads the transaction amount the
 * split validates against and writes the single TransactionSplit (insert or
 * update) for a transaction.
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
   * @param id Generated split id.
   * @param transactionId The parent transaction.
   * @param values The computed split values.
   * @returns Resolves once the insert completes.
   */
  async insertSplit(
    id: string,
    transactionId: string,
    values: SplitPersistValues,
  ): Promise<void> {
    await INSERT.into(ENTITIES.TRANSACTION_SPLIT).entries({
      ID: id,
      transaction_ID: transactionId,
      mySharePct: values.mySharePct,
      myShareAmount: values.myShareAmount,
      splitDescription: values.splitDescription,
      isRecurring: values.isRecurring,
    });
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
