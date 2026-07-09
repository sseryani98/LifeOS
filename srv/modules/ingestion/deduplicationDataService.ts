import { ENTITIES } from "./constants.js";
import type { MatchedTransaction } from "./types.js";

/**
 * Data-access layer for the deduplication engine.
 */
export class DeduplicationDataService {
  /**
   * Finds an existing transaction with the same SimpleFIN external id on the same card.
   * @param externalId SimpleFIN-assigned identifier of the incoming transaction.
   * @param cardInstanceId Card the transaction belongs to; null matches uncarded rows.
   * @returns The matching transaction's ID projection, or null when none exists.
   */
  async findByExternalId(
    externalId: string,
    cardInstanceId: string | null | undefined,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID")
      .where({ externalId, cardInstance_ID: cardInstanceId ?? null });
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
    cardInstanceId: string | null | undefined,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from(ENTITIES.TRANSACTION)
      .columns("ID")
      .where({
        rawDescription,
        postedAt,
        amount,
        cardInstance_ID: cardInstanceId ?? null,
      });
    return (match as MatchedTransaction | undefined) ?? null;
  }
}
