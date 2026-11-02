import { ENTITIES } from "./constants.js";
import type { MatchedTransaction } from "./types.js";

/**
 * Data-access layer for the deduplication engine.
 */
export class DeduplicationDataService {
  /**
   * Finds an existing transaction with the same SimpleFIN external id from the same provider account.
   * Scoped by account, not card: a remapped account keeps its ids, so a card scope re-inserts history.
   * @param externalId SimpleFIN-assigned identifier of the incoming transaction.
   * @param providerAccountId Provider account the transaction came from.
   * @returns The matching transaction's ID projection, or null when none exists.
   */
  async findByExternalId(
    externalId: string,
    providerAccountId: string | null,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID")
      .where({ externalId, providerAccount_ID: providerAccountId });
    return (match as MatchedTransaction | undefined) ?? null;
  }

  /**
   * Finds an existing transaction matching the CSV natural key (description, date, amount, card).
   * @param rawDescription Original, untrimmed transaction description.
   * @param postedAt Posting date of the transaction.
   * @param amount Signed transaction amount.
   * @param cardInstanceId Card the transaction belongs to; null matches uncarded rows.
   * @returns The matching transaction's ID projection, or null when none exists.
   */
  async findByNaturalKey(
    rawDescription: string,
    postedAt: string,
    amount: number,
    cardInstanceId: string | null,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID")
      .where({
        rawDescription,
        postedAt,
        amount,
        cardInstance_ID: cardInstanceId,
      });
    return (match as MatchedTransaction | undefined) ?? null;
  }
}
