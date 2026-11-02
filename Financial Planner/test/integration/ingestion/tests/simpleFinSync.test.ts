// Runs SimpleFIN sync against the real in-memory DB with only the network stubbed:
// ingestion, dedup, mapping, backfill, stale check, the AdminService OData seam.
// Every spec seeds its own rows. Custom behaviour only — never CAP CRUD/draft.

import cds from "@sap/cds";

import { DeduplicationDataService } from "../../../../srv/modules/ingestion/deduplicationDataService.js";
import { SimpleFINDataService } from "../../../../srv/modules/ingestion/simpleFinDataService.js";
import { MessagingUtility } from "../../../../srv/modules/shared/messagingUtility.js";

import { AMEX_COBALT_INSTANCE } from "../../../shared/data/cards.js";
import {
  ACCESS_URL_PLAINTEXT,
  CLAIM_MISSING_TOKEN,
  CONNECTION_ID,
  EMPTY_RESPONSE,
  EXTERNAL_ACCOUNT_UNKNOWN,
  MISSING_ID,
  RESPONSE_TWO_NEW,
  RESPONSE_UNMAPPED_ACCOUNT,
  SETUP_TOKEN,
  TX_AMAZON,
  TX_NETFLIX,
  TX_UNMAPPED,
} from "../../../shared/data/ingestion/simplefin.js";
import {
  BACKFILL_ACCOUNT_SEED,
  BACKFILL_ORPHAN_TRANSACTION,
  CONNECTION_INACTIVE_SEED,
  CONNECTION_STALE_SEED,
  MAP_TO_COBALT_PAYLOAD,
  NATURAL_KEY_TRANSACTION,
  PATCH_ACCOUNT_SEED,
  PATCH_ORPHAN_TRANSACTION,
  REMAP_ACCOUNT_SEED,
  REMAP_INGESTED_TRANSACTION,
  REMAP_TARGET_CARD_INSTANCE,
  RESPONSE_REMAP_RESYNC,
  RESPONSE_RESYNC,
  RESYNC_STORED_TRANSACTION,
  STALE_CHECK_NOW,
  TX_BACKFILL,
  TX_NATURAL_KEY,
  TX_PATCH_BACKFILL,
  TX_REMAP,
  TX_RESYNC_EXISTING,
  TX_RESYNC_NEW,
} from "../data/simplefinSync.js";
import {
  buildDefaultWiredSimpleFinService,
  buildSimpleFinActions,
  buildSimpleFinService,
  httpReturning,
  mapAccountToCard,
  readAccountByExternalId,
  readAlertsWithTypeForConnection,
  readConnection,
  readTransactionByExternalId,
  readTransactionsByExternalId,
  registerSimpleFinHandlers,
  seedAccountWithTransaction,
  seedConnections,
  seedSimpleFin,
  seedSyncedTransaction,
} from "../support/simplefinSync.js";

const { PATCH, POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");
const { patchProviderAccount, postClaimSetupToken, postSyncNow } =
  buildSimpleFinActions(POST, PATCH);

beforeAll(registerSimpleFinHandlers);
beforeAll(seedSimpleFin);

describe("SimpleFIN sync against SQLite", () => {
  /** Access URLs carry bank credentials — storing plaintext would leak them if the DB is read. */
  it("seeds the access URL encrypted, never in plaintext", async () => {
    const conn = await readConnection(CONNECTION_ID);
    expect(conn.accessUrlEnc).to.not.contain(ACCESS_URL_PLAINTEXT);
    expect(conn.accessUrlEnc).to.match(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  /** End-to-end proof against real SQLite that ingested rows land tagged simplefin, attributed to the mapped card, and record success — the core contract the mocked units can't exercise. */
  it("Sync Now ingests simplefin transactions on a mapped account", async () => {
    const service = buildSimpleFinService(httpReturning(RESPONSE_TWO_NEW));

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.created).to.equal(2);
    expect(result.status).to.equal("success");
    const amazon = await readTransactionByExternalId(TX_AMAZON);
    const netflix = await readTransactionByExternalId(TX_NETFLIX);
    expect(amazon.cardInstance_ID).to.equal(AMEX_COBALT_INSTANCE.ID);
    expect(netflix.cardInstance_ID).to.equal(AMEX_COBALT_INSTANCE.ID);
    const conn = await readConnection(CONNECTION_ID);
    expect(conn.lastSyncStatus).to.equal("success");
    expect(conn.lastSyncAt).to.not.equal(null);
  });

  /** Overlapping re-sync windows must not double-insert; deduping against already-persisted rows keeps reported spend accurate. */
  it("silently skips external-id duplicates on re-sync", async () => {
    await seedSyncedTransaction(RESYNC_STORED_TRANSACTION);
    const service = buildSimpleFinService(httpReturning(RESPONSE_RESYNC));

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.duplicates).to.equal(1);
    expect(result.created).to.equal(1);
    expect(await readTransactionsByExternalId(TX_RESYNC_EXISTING)).to.have.length(1);
    expect(await readTransactionsByExternalId(TX_RESYNC_NEW)).to.have.length(1);
  });

  /** Transactions from an unknown account must be retained under a null-card placeholder and surfaced via the seeded Unmapped Account alert, never silently dropped. */
  it("auto-creates an unmapped account and raises an alert", async () => {
    const service = buildSimpleFinService(
      httpReturning(RESPONSE_UNMAPPED_ACCOUNT),
    );

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.unmapped).to.equal(1);
    const account = await readAccountByExternalId(EXTERNAL_ACCOUNT_UNKNOWN);
    expect(account).to.not.equal(undefined);
    expect(account.cardInstance_ID).to.equal(null);
    const txn = await readTransactionByExternalId(TX_UNMAPPED);
    expect(txn.cardInstance_ID).to.equal(null);
    const alerts = await readAlertsWithTypeForConnection(CONNECTION_ID);
    expect(
      alerts.map(alert => `${alert.alertTypeName}/${alert.alertSeverityName}`),
    ).to.include("Unmapped Account/Info");
  });

  /** Once an account is mapped, its earlier null-card rows must pick up the card in one UPDATE so historical spend attributes correctly. */
  it("backfills null-card transactions on a mapped account", async () => {
    await seedAccountWithTransaction(
      BACKFILL_ACCOUNT_SEED,
      BACKFILL_ORPHAN_TRANSACTION,
    );
    const service = buildSimpleFinService(httpReturning(EMPTY_RESPONSE));

    const count = await service.backfillCardMapping(BACKFILL_ACCOUNT_SEED.ID);

    expect(count).to.equal(1);
    const txn = await readTransactionByExternalId(TX_BACKFILL);
    expect(txn.cardInstance_ID).to.equal(AMEX_COBALT_INSTANCE.ID);
  });

  /** Transactions without a stable external id fall back to a natural key (description+date+amount+card); the lookup must catch true dupes yet reject non-matches, or dedup either misses dupes or falsely merges distinct charges. */
  it("dedup natural-key lookup matches an ingested transaction", async () => {
    await seedSyncedTransaction(NATURAL_KEY_TRANSACTION);
    const existing = await readTransactionByExternalId(TX_NATURAL_KEY);
    const dedupData = new DeduplicationDataService();

    const match = await dedupData.findByNaturalKey(
      existing.rawDescription,
      existing.postedAt,
      existing.amount,
      existing.cardInstance_ID,
    );
    expect(match).to.not.equal(null);

    const noMatch = await dedupData.findByNaturalKey(
      "NO SUCH DESCRIPTION",
      existing.postedAt,
      existing.amount,
      existing.cardInstance_ID,
    );
    expect(noMatch).to.equal(null);
  });

  /** After a remap, a charge already ingested under card A is the same charge when the account now points at card B, so the overlapping re-sync must not insert it again and double-count the week. */
  it("treats an already-ingested external id as a duplicate after a card remap", async () => {
    await seedAccountWithTransaction(
      REMAP_ACCOUNT_SEED,
      REMAP_INGESTED_TRANSACTION,
    );
    await mapAccountToCard(REMAP_ACCOUNT_SEED.ID, REMAP_TARGET_CARD_INSTANCE.ID);
    const service = buildSimpleFinService(httpReturning(RESPONSE_REMAP_RESYNC));

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.created).to.equal(0);
    expect(result.duplicates).to.equal(1);
    expect(await readTransactionsByExternalId(TX_REMAP)).to.have.length(1);
  });

  /** The stale check is the only alarm for a connection that silently stopped syncing; its query must pick active, previously-synced rows and its alert must resolve the seeded Stale Data / Warning names, or the alert is skipped without a trace. */
  it("raises one Stale Data alert for an active connection past the threshold", async () => {
    await seedConnections([
      { ...CONNECTION_STALE_SEED },
      { ...CONNECTION_INACTIVE_SEED },
    ]);
    const service = buildSimpleFinService(
      httpReturning(EMPTY_RESPONSE),
      () => STALE_CHECK_NOW,
    );

    await service.checkStaleConnections();

    const staleAlerts = await readAlertsWithTypeForConnection(
      CONNECTION_STALE_SEED.ID,
    );
    expect(staleAlerts).to.have.length(1);
    expect(staleAlerts[0]).to.include({
      status: "active",
      alertTypeName: "Stale Data",
      alertSeverityName: "Warning",
    });
    const inactiveAlerts = await readAlertsWithTypeForConnection(
      CONNECTION_INACTIVE_SEED.ID,
    );
    expect(inactiveAlerts).to.have.length(0);
  });

  /** AdminService builds the engine with no encryption seam; the default factory must decrypt what was stored encrypted, or every production sync throws before reaching the bank. */
  it("decrypts the stored access URL through the default encryption factory", async () => {
    const service = buildDefaultWiredSimpleFinService(httpReturning(EMPTY_RESPONSE));

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.status).to.equal("success");
  });

  /** A newly claimed connection must persist its access URL encrypted and start in never_synced, so bank credentials aren't leaked at rest. */
  it("claimConnection stores the access URL encrypted", async () => {
    const service = buildSimpleFinService(httpReturning(EMPTY_RESPONSE));

    const id = await service.claimConnection(SETUP_TOKEN, "Claimed Connection");

    const created = await readConnection(id);
    expect(created.lastSyncStatus).to.equal("never_synced");
    expect(created.accessUrlEnc).to.not.contain(ACCESS_URL_PLAINTEXT);
    expect(created.accessUrlEnc).to.match(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  describe("AdminService OData surface", () => {
    /** The Sync Now button posts the bound action; the handler must read the connection key from CAP's req.params, or it syncs "" and reports nothing. */
    it("syncNow syncs the bound connection and returns the summary", async () => {
      const response = await postSyncNow(CONNECTION_ID);

      expect(response.status).to.equal(200);
      expect(response.data.value).to.equal(
        MessagingUtility.getText("ingestion.simplefin.syncResult", ["2", "0"]),
      );
    });

    /** Mapping an account in the UI is a PATCH; the after-UPDATE hook must resolve the account key from req.params and backfill its null-card rows, or newly mapped spend stays unattributed. */
    it("backfills null-card rows when an account is mapped over OData", async () => {
      await seedAccountWithTransaction(PATCH_ACCOUNT_SEED, PATCH_ORPHAN_TRANSACTION);

      const response = await patchProviderAccount(
        PATCH_ACCOUNT_SEED.ID,
        MAP_TO_COBALT_PAYLOAD,
      );

      expect(response.status).to.equal(200);
      const txn = await readTransactionByExternalId(TX_PATCH_BACKFILL);
      expect(txn.cardInstance_ID).to.equal(AMEX_COBALT_INSTANCE.ID);
    });

    /** A claim without a setup token must come back a 400 from the action signature + validator, never reach the bridge or surface as a 500. */
    it("rejects claimSetupToken without a token with a 400", async () => {
      const response = await postClaimSetupToken({
        ...CLAIM_MISSING_TOKEN,
      }).catch((error: { status: number }) => error);

      expect(response.status).to.equal(400);
    });
  });

  describe("data-layer lookups return null for unknown keys", () => {
    const data = new SimpleFINDataService();

    /** A missing System Config key must resolve to null so callers fall back to defaults instead of reading undefined. */
    it("returns null for an unknown config key", async () => {
      expect(await data.getConfig(MISSING_ID)).to.equal(null);
    });

    /** A non-existent connection must be null, not throw — the sync engine branches on this to skip gracefully. */
    it("returns null for an unknown connection", async () => {
      expect(await data.getConnection(MISSING_ID)).to.equal(null);
    });

    /** An unmatched external account must be null so the engine auto-creates rather than mis-mapping to a stale row. */
    it("returns null for an unknown provider account", async () => {
      expect(await data.getProviderAccount(CONNECTION_ID, MISSING_ID)).to.equal(
        null,
      );
    });

    /** A provider-account id with no row must be null so backfill treats it as nothing-to-do. */
    it("returns null for an unknown provider account id", async () => {
      expect(await data.getProviderAccountById(MISSING_ID)).to.equal(null);
    });

    /** Unknown alert reference names must be null so alert creation is skipped rather than inserting a dangling FK. */
    it("returns null for unknown alert reference data", async () => {
      expect(await data.getAlertTypeId(MISSING_ID)).to.equal(null);
      expect(await data.getAlertSeverityId(MISSING_ID)).to.equal(null);
    });

    /** With no active alert on record, the dedupe lookup must be null so a first alert can be raised. */
    it("returns null when no active alert exists", async () => {
      expect(await data.findActiveAlert(MISSING_ID, MISSING_ID)).to.equal(null);
    });
  });
});
