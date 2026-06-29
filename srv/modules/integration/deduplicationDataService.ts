/** Minimal projection returned by deduplication lookups. */
interface MatchedTransaction {
  ID: string;
}

/**
 * Data-access layer for the deduplication engine (ENH-008).
 * Pure CDS queries against the Transaction entity — no business logic.
 */
export class DeduplicationDataService {
  /** Finds an existing transaction with the same SimpleFIN external id on the same card. */
  async findByExternalId(
    externalId: string,
    cardInstanceId: string | null | undefined,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from("com.financialplanner.Transaction")
      .columns("ID")
      .where({ externalId, cardInstance_ID: cardInstanceId ?? null });
    return (match as MatchedTransaction | undefined) ?? null;
  }

  /** Finds an existing transaction matching the CSV natural key (description, date, amount, card). */
  async findByNaturalKey(
    rawDescription: string,
    postedAt: string,
    amount: number,
    cardInstanceId: string | null | undefined,
  ): Promise<MatchedTransaction | null> {
    const match = await SELECT.one
      .from("com.financialplanner.Transaction")
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
