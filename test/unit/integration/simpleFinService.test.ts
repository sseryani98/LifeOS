import {
  ACCESS_URL_PLAINTEXT,
  ACCOUNT_MAPPED,
  ACCOUNT_MAPPED_ID,
  ACCOUNT_UNMAPPED,
  ALERT_TYPE_ID,
  CARD_INSTANCE_ID,
  CONNECTION_ACTIVE,
  CONNECTION_FRESH,
  CONNECTION_ID,
  CONNECTION_STALE,
  EXTERNAL_ACCOUNT_UNKNOWN,
  RESPONSE_BANK_ERROR,
  RESPONSE_DUPLICATE,
  RESPONSE_TWO_NEW,
  RESPONSE_UNMAPPED_ACCOUNT,
  RESPONSE_WITH_PENDING,
  SETUP_TOKEN,
  TX_AMAZON,
  TX_POSTED,
} from "../../data/integration/simplefin.js";
import { buildSimpleFinMocks } from "../../support/integration/simplefinMocks.js";

describe("SimpleFINService", () => {
  describe("syncConnection — happy path", () => {
    /** Provider-fed rows must be tagged source=simplefin and tied to their mapped card/account, else reconciliation can't distinguish them and sync state is untrustworthy. */
    it("inserts new transactions with source=simplefin and marks success", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_TWO_NEW });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(result.created).toBe(2);
      expect(mocks.data.insertTransaction).toHaveBeenCalledTimes(2);
      const firstInsert = mocks.data.insertTransaction.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(firstInsert).toMatchObject({
        source: "simplefin",
        categorizationStatus: "uncategorized",
        isExcluded: false,
        externalId: TX_AMAZON,
        cardInstance_ID: CARD_INSTANCE_ID,
        providerAccount_ID: ACCOUNT_MAPPED_ID,
      });
      expect(mocks.data.updateConnectionSync).toHaveBeenCalledWith(
        CONNECTION_ID,
        expect.objectContaining({ lastSyncStatus: "success" }),
      );
    });

    /** The access URL is AES-encrypted at rest; without decrypting through the utility the engine would hit the bank with ciphertext and fetch nothing. */
    it("decrypts the access URL via the encryption utility", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_TWO_NEW });

      await mocks.service.syncConnection(CONNECTION_ID);

      expect(mocks.encryption.decrypt).toHaveBeenCalledWith(
        CONNECTION_ACTIVE.accessUrlEnc,
      );
      expect(mocks.httpGet).toHaveBeenCalledWith(
        expect.stringContaining(`${ACCESS_URL_PLAINTEXT}/accounts?start-date=`),
      );
    });
  });

  describe("deduplication", () => {
    /** Re-syncs re-fetch overlapping windows; without external-id dedup the same charge inserts twice and double-counts spend. */
    it("silently skips external-id duplicates", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_DUPLICATE });
      mocks.dedup.evaluate.mockResolvedValue({
        outcome: "duplicate",
        matchedTransactionId: "existing",
      });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(result.duplicates).toBe(1);
      expect(result.created).toBe(0);
      expect(mocks.data.insertTransaction).not.toHaveBeenCalled();
    });
  });

  describe("pending discard", () => {
    /** posted=0 marks a not-yet-final charge; importing it risks a duplicate once it settles under a real id. */
    it("discards transactions with posted=0 / pending=true", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_WITH_PENDING });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(result.created).toBe(1);
      expect(mocks.dedup.evaluate).toHaveBeenCalledTimes(1);
      const incoming = mocks.dedup.evaluate.mock.calls[0][0];
      expect(incoming.externalId).toBe(TX_POSTED);
    });
  });

  describe("unmapped account", () => {
    /** An unknown bank account must not silently drop its transactions; a null-card placeholder retains the data while the alert forces the user to map it. */
    it("auto-creates the account with null card and raises an alert", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getProviderAccount.mockResolvedValue(null);
      mocks.httpGet.mockResolvedValue({
        status: 200,
        data: RESPONSE_UNMAPPED_ACCOUNT,
      });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(mocks.data.createProviderAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          externalAccountId: EXTERNAL_ACCOUNT_UNKNOWN,
          cardInstance_ID: null,
        }),
      );
      expect(result.unmapped).toBe(1);
      expect(mocks.data.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({ alertType_ID: ALERT_TYPE_ID }),
      );
      const insert = mocks.data.insertTransaction.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(insert.cardInstance_ID).toBeNull();
    });
  });

  describe("connection errors[]", () => {
    /** One failing account in a multi-account response must not abort the sync — good accounts' transactions still land while the failure is surfaced, so a partial outage loses no data. */
    it("raises connection_error, marks error, still processes good accounts", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_BANK_ERROR });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(result.status).toBe("error");
      expect(result.created).toBe(1);
      expect(mocks.data.createAlert).toHaveBeenCalled();
      expect(mocks.data.updateConnectionSync).toHaveBeenCalledWith(
        CONNECTION_ID,
        expect.objectContaining({ lastSyncStatus: "error" }),
      );
    });
  });

  describe("retry / backoff", () => {
    /** Transient bank/network failures deserve retries at 2s/4s/8s before giving up; wrong backoff either hammers the API or fails too eagerly, and give-up must alert. */
    it("retries with exponential backoff then raises connection_error", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockRejectedValue(new Error("HTTP 500"));

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      // 1 initial + 3 retries = 4 calls
      expect(mocks.httpGet).toHaveBeenCalledTimes(4);
      expect(mocks.sleep.mock.calls.map(call => call[0])).toEqual([
        2000, 4000, 8000,
      ]);
      expect(result.status).toBe("error");
      expect(mocks.data.createAlert).toHaveBeenCalled();
      expect(mocks.data.updateConnectionSync).toHaveBeenCalledWith(
        CONNECTION_ID,
        expect.objectContaining({ lastSyncStatus: "error" }),
      );
    });
  });

  describe("checkStaleConnections", () => {
    /** A connection that quietly stops delivering data would starve unnoticed; the check must flag only the past-threshold one and leave fresh ones alone. */
    it("raises stale_data for a connection past the threshold", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getStaleCandidates.mockResolvedValue([
        { ...CONNECTION_STALE },
        { ...CONNECTION_FRESH },
      ]);

      await mocks.service.checkStaleConnections();

      expect(mocks.data.createAlert).toHaveBeenCalledTimes(1);
      expect(mocks.data.createAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          providerConnection_ID: CONNECTION_STALE.ID,
        }),
      );
    });

    /** Without suppression every scheduled run re-raises the same stale alert, spamming the user until the connection recovers. */
    it("suppresses a duplicate stale alert when one is already active", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getStaleCandidates.mockResolvedValue([{ ...CONNECTION_STALE }]);
      mocks.data.findActiveAlert.mockResolvedValue({ ID: "existing-alert" });

      await mocks.service.checkStaleConnections();

      expect(mocks.data.createAlert).not.toHaveBeenCalled();
    });

    /** A never-synced connection (null lastSyncAt) must be skipped, not NaN-compared into a false stale alert. */
    it("skips a candidate that has never synced", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getStaleCandidates.mockResolvedValue([
        { ...CONNECTION_STALE, lastSyncAt: null },
      ]);

      await mocks.service.checkStaleConnections();

      expect(mocks.data.createAlert).not.toHaveBeenCalled();
    });
  });

  describe("backfillCardMapping", () => {
    /** Once the user maps the account, its previously orphaned null-card transactions must retroactively pick up the card so historical spend attributes correctly. */
    it("backfills null-card transactions when the account is mapped", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getProviderAccountById.mockResolvedValue({
        ...ACCOUNT_MAPPED,
      });
      mocks.data.backfillTransactions.mockResolvedValue(10);

      const count = await mocks.service.backfillCardMapping(ACCOUNT_MAPPED_ID);

      expect(count).toBe(10);
      expect(mocks.data.backfillTransactions).toHaveBeenCalledWith(
        ACCOUNT_MAPPED_ID,
        CARD_INSTANCE_ID,
      );
    });

    /** Backfilling before a card exists would overwrite mappings with null; the guard prevents corrupting attribution on a still-unmapped account. */
    it("does nothing when the account is still unmapped", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getProviderAccountById.mockResolvedValue({ ...ACCOUNT_UNMAPPED });

      const count = await mocks.service.backfillCardMapping(ACCOUNT_MAPPED_ID);

      expect(count).toBe(0);
      expect(mocks.data.backfillTransactions).not.toHaveBeenCalled();
    });
  });

  describe("claimConnection", () => {
    /** The base64 setup token hides the claim URL; the engine must POST to claim, then persist the returned access URL encrypted, or bank credentials leak at rest. */
    it("decodes the token, claims the access URL, and stores it encrypted", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpPost.mockResolvedValue({
        status: 200,
        data: ACCESS_URL_PLAINTEXT,
      });

      const id = await mocks.service.claimConnection(SETUP_TOKEN, "Main SimpleFIN");

      expect(id).toBe(CONNECTION_ID);
      expect(mocks.httpPost).toHaveBeenCalledWith(
        "https://bridge.simplefin.org/simplefin/claim/abc123",
      );
      expect(mocks.encryption.encrypt).toHaveBeenCalledWith(ACCESS_URL_PLAINTEXT);
      expect(mocks.data.createConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: "Main SimpleFIN",
          accessUrlEnc: `enc(${ACCESS_URL_PLAINTEXT})`,
        }),
      );
    });
  });

  describe("syncAllActive", () => {
    /** The scheduled run must iterate every active connection; skipping one means its account silently stops importing. */
    it("syncs each active connection", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_TWO_NEW });

      await mocks.service.syncAllActive();

      expect(mocks.data.getActiveConnections).toHaveBeenCalled();
      expect(mocks.httpGet).toHaveBeenCalled();
    });
  });

  describe("syncConnection — connection not found", () => {
    /** A missing connection must fail fast without a network call, avoiding an API hit with undefined credentials. */
    it("returns an error result without calling the API", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getConnection.mockResolvedValue(null);

      const result = await mocks.service.syncConnection("missing");

      expect(result.status).toBe("error");
      expect(mocks.httpGet).not.toHaveBeenCalled();
    });
  });

  describe("HTTP non-2xx status", () => {
    /** Only 2xx counts as success; a 500 carrying a body must not be mistaken for data and ingested as garbage — it has to retry like a thrown error. */
    it("treats a 500 status as a failure and retries", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 500, data: RESPONSE_TWO_NEW });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(mocks.httpGet).toHaveBeenCalledTimes(4);
      expect(result.status).toBe("error");
    });
  });

  describe("config fallback", () => {
    /** Sync must run on a fresh install before any config row exists; a missing SystemConfig must not crash the whole pipeline. */
    it("falls back to defaults when SystemConfig is absent", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getConfig.mockResolvedValue(null);
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_TWO_NEW });

      const result = await mocks.service.syncConnection(CONNECTION_ID);

      expect(result.created).toBe(2);
    });
  });

  describe("alert reference data missing", () => {
    /** Missing alert reference data must degrade gracefully rather than throw a FK violation that aborts the whole sync. */
    it("skips alert creation when the alert type is not seeded", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getAlertTypeId.mockResolvedValue(null);
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_BANK_ERROR });

      await mocks.service.syncConnection(CONNECTION_ID);

      expect(mocks.data.createAlert).not.toHaveBeenCalled();
    });
  });

  describe("getSyncTime", () => {
    /** The daily scheduler reads this to time its run; honoring the stored value ensures the job fires when the user set it. */
    it("returns the configured time", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getConfig.mockResolvedValue("07:30");
      expect(await mocks.service.getSyncTime()).toBe("07:30");
    });

    /** Without a fallback time the scheduler would have nothing to fire on and the daily sync would never run. */
    it("defaults to 20:00 when unset", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.getConfig.mockResolvedValue(null);
      expect(await mocks.service.getSyncTime()).toBe("20:00");
    });
  });

  describe("facade entry points", () => {
    /** The manual-sync action must resolve the bound connection param and hand back a user-facing summary the UI can display. */
    it("runManualSync returns a summary string", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpGet.mockResolvedValue({ status: 200, data: RESPONSE_TWO_NEW });

      const summary = await mocks.service.runManualSync({
        params: [{ ID: CONNECTION_ID }],
      } as never);

      expect(typeof summary).toBe("string");
      expect(mocks.data.getConnection).toHaveBeenCalledWith(CONNECTION_ID);
    });

    /** The bound claim action must pass validated input through to the claim flow without surfacing spurious errors on a well-formed request. */
    it("claim creates a connection for a valid request", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.httpPost.mockResolvedValue({ status: 200, data: ACCESS_URL_PLAINTEXT });
      const error = jest.fn();

      const id = await mocks.service.claim({
        data: { setupToken: SETUP_TOKEN, displayName: "Main" },
        error,
      } as never);

      expect(id).toBe(CONNECTION_ID);
      expect(error).not.toHaveBeenCalled();
    });

    /** Empty token/name must be rejected up front (one error per bad field) so we never POST invalid credentials to the claim endpoint. */
    it("claim reports validation errors and does not claim", async () => {
      const mocks = buildSimpleFinMocks();
      const error = jest.fn();

      const id = await mocks.service.claim({
        data: { setupToken: "", displayName: "" },
        error,
      } as never);

      expect(id).toBeUndefined();
      expect(error).toHaveBeenCalledTimes(2);
      expect(mocks.httpPost).not.toHaveBeenCalled();
    });

    /** Mapping an account must trigger backfill of that account's orphaned null-card transactions so newly mapped spend attributes to the card. */
    it("handleAccountMapping backfills when an id is present", async () => {
      const mocks = buildSimpleFinMocks();
      mocks.data.backfillTransactions.mockResolvedValue(3);

      await mocks.service.handleAccountMapping({
        params: [{ ID: ACCOUNT_MAPPED_ID }],
      } as never);

      expect(mocks.data.getProviderAccountById).toHaveBeenCalledWith(
        ACCOUNT_MAPPED_ID,
      );
    });

    /** A mapping event lacking an id must not fire a backfill against an undefined key, which would issue a bad query. */
    it("handleAccountMapping is a no-op without an id", async () => {
      const mocks = buildSimpleFinMocks();

      await mocks.service.handleAccountMapping({ params: [{}] } as never);

      expect(mocks.data.getProviderAccountById).not.toHaveBeenCalled();
    });
  });
});
