import { ALERTS } from "../../../../srv/modules/ingestion/constants.js";

import {
  ACCOUNT_MAPPED_ID,
  CARD_INSTANCE_ID,
  CONNECTION_ACTIVE,
  CONNECTION_ID,
  EXTERNAL_ACCOUNT_UNKNOWN,
  RESPONSE_DUPLICATE,
  RESPONSE_TWO_NEW,
  RESPONSE_UNMAPPED_ACCOUNT,
  RESPONSE_WITH_PENDING,
  TX_AMAZON,
  TX_POSTED,
} from "../../../shared/data/ingestion/simplefin.js";
import { RESPONSE_PENDING_FLAG_ONLY, RESPONSE_UNPOSTED_ONLY } from "../data/simplefin.js";
import { buildSimpleFinIngestionMocks } from "../support/simplefinMocks.js";

describe("SimpleFINIngestionService", () => {
  describe("ingestAccounts — mapped account", () => {
    /** Every new posted row must land against its mapped account and card, or spend is unattributed. */
    it("inserts each new posted transaction and counts the account", async () => {
      const mocks = buildSimpleFinIngestionMocks();

      const result = await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_TWO_NEW.accounts,
      );

      expect(result).toEqual({
        created: 2,
        duplicates: 0,
        accountsProcessed: 1,
        unmapped: 0,
      });
      expect(mocks.data.insertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: TX_AMAZON,
          providerAccount_ID: ACCOUNT_MAPPED_ID,
          cardInstance_ID: CARD_INSTANCE_ID,
        }),
      );
      expect(mocks.alerts.raiseAlert).not.toHaveBeenCalled();
    });

    /** A row the dedup engine already holds must be counted, never re-inserted, or re-syncs double-count spend. */
    it("counts duplicates without inserting them", async () => {
      const mocks = buildSimpleFinIngestionMocks();
      mocks.dedup.evaluate.mockResolvedValue({
        outcome: "duplicate",
        matchedTransactionId: TX_AMAZON,
      });

      const result = await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_DUPLICATE.accounts,
      );

      expect(result.duplicates).toBe(1);
      expect(result.created).toBe(0);
      expect(mocks.data.insertTransaction).not.toHaveBeenCalled();
    });
  });

  describe("ingestAccounts — pending rows", () => {
    /** A pending row settles later under a new id; ingesting it now duplicates the charge. */
    it("never hands a posted=0 row to the dedup engine", async () => {
      const mocks = buildSimpleFinIngestionMocks();

      await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_WITH_PENDING.accounts,
      );

      expect(mocks.dedup.evaluate).toHaveBeenCalledTimes(1);
      expect(mocks.dedup.evaluate.mock.calls[0][0].externalId).toBe(TX_POSTED);
    });

    /** pending=true must discard on its own, since a provisional posted stamp is non-zero. */
    it("discards a pending-flagged row that carries a posted stamp", async () => {
      const mocks = buildSimpleFinIngestionMocks();

      const result = await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_PENDING_FLAG_ONLY.accounts,
      );

      expect(result.created).toBe(0);
      expect(mocks.dedup.evaluate).not.toHaveBeenCalled();
    });

    /** posted=0 must discard on its own, since the pending key is optional. */
    it("discards an unposted row without the pending flag", async () => {
      const mocks = buildSimpleFinIngestionMocks();

      const result = await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_UNPOSTED_ONLY.accounts,
      );

      expect(result.created).toBe(0);
      expect(mocks.dedup.evaluate).not.toHaveBeenCalled();
    });
  });

  describe("ingestAccounts — unknown account", () => {
    /** An unknown account keeps its rows on a null-card placeholder and alerts, so no data is lost while the user maps it. */
    it("auto-creates a null-card account and raises the unmapped alert", async () => {
      const mocks = buildSimpleFinIngestionMocks();
      mocks.data.getProviderAccount.mockResolvedValue(null);

      const result = await mocks.service.ingestAccounts(
        { ...CONNECTION_ACTIVE },
        RESPONSE_UNMAPPED_ACCOUNT.accounts,
      );

      expect(result.unmapped).toBe(1);
      expect(mocks.data.createProviderAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          providerConnection_ID: CONNECTION_ID,
          externalAccountId: EXTERNAL_ACCOUNT_UNKNOWN,
          cardInstance_ID: null,
        }),
      );
      expect(mocks.alerts.raiseAlert).toHaveBeenCalledWith(
        ALERTS.TYPE.UNMAPPED_ACCOUNT,
        ALERTS.SEVERITY.INFO,
        expect.any(String),
        expect.any(String),
        CONNECTION_ID,
      );
      expect(mocks.data.insertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ cardInstance_ID: null }),
      );
    });
  });
});
