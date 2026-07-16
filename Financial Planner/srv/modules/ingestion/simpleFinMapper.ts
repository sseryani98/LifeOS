import { TIME } from "../shared/constants.js";
import { DateTimeUtility } from "../shared/dateTimeUtility.js";

import type {
  AccountRecord,
  IncomingTransaction,
  SimpleFINTransaction,
} from "./types.js";

/**
 * Pure translation of SimpleFIN Bridge payloads into internal shapes.
 */
export class SimpleFINMapper {
  /**
   * Maps a SimpleFIN transaction to a dedup candidate.
   * @param sfTx Source transaction from the SimpleFIN response.
   * @param cardInstanceId Mapped card, or null for an unmapped account.
   * @returns The candidate handed to the deduplication engine.
   */
  static toIncoming(
    sfTx: SimpleFINTransaction,
    cardInstanceId: string | null,
  ): IncomingTransaction {
    return {
      externalId: sfTx.id,
      cardInstance_ID: cardInstanceId,
      amount: Number.parseFloat(sfTx.amount),
      postedAt: this._toDate(sfTx.posted),
      rawDescription: sfTx.description,
      source: "simplefin",
    };
  }

  /**
   * Maps a SimpleFIN transaction to a Transaction insert row.
   * @param sfTx Source transaction from the SimpleFIN response.
   * @param account Resolved provider account supplying the FK and card.
   * @returns The row to insert into the Transaction entity.
   */
  static toTransactionRow(
    sfTx: SimpleFINTransaction,
    account: AccountRecord,
  ): Record<string, unknown> {
    return {
      externalId: sfTx.id,
      providerAccount_ID: account.ID,
      cardInstance_ID: account.cardInstance_ID,
      amount: Number.parseFloat(sfTx.amount),
      postedAt: this._toDate(sfTx.posted),
      transactedAt: sfTx.transacted_at
        ? this._toDate(sfTx.transacted_at)
        : null,
      rawDescription: sfTx.description,
      source: "simplefin",
      categorizationStatus: "uncategorized",
      isExcluded: false,
    };
  }

  /**
   * Converts UNIX epoch seconds to an ISO date string (YYYY-MM-DD).
   * @param epochSeconds Timestamp in seconds since the epoch.
   * @returns The date portion in ISO format.
   */
  private static _toDate(epochSeconds: number): string {
    return DateTimeUtility.formatDate(
      new Date(epochSeconds * TIME.MS_PER_SECOND),
    );
  }
}
