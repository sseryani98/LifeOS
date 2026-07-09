// Integration test for SimpleFIN sync (cds.test + SQLite). The sync engine and
// its data layer run against the real in-memory database with only the SimpleFIN
// network call stubbed. We test custom behaviour (sync ingests simplefin
// transactions, dedup, auto-mapping, backfill, encrypted access URL) — never CAP
// CRUD/draft machinery. Fixtures live in test/data/, the harness in test/support/.

import cds from "@sap/cds";

import { DeduplicationDataService } from "../../srv/modules/integration/deduplicationDataService.js";
import { SimpleFINDataService } from "../../srv/modules/integration/simpleFinDataService.js";

import {
  AMEX_COBALT_INSTANCE,
} from "../data/cards.js";
import {
  ACCESS_URL_PLAINTEXT,
  CONNECTION_ID,
  EMPTY_RESPONSE,
  EXTERNAL_ACCOUNT_UNKNOWN,
  MISSING_ID,
  RESPONSE_TWO_NEW,
  RESPONSE_UNMAPPED_ACCOUNT,
  RESYNC_ONE_DUP_ONE_NEW,
  SETUP_TOKEN,
  TX_AMAZON,
  TX_UNMAPPED,
} from "../data/integration/simplefin.js";
import {
  buildSimpleFinService,
  httpReturning,
  seedSimpleFin,
} from "../support/integration/simplefinSync.js";

// A valid 32-byte key (64 hex chars) for the encryption utility.
process.env["ENCRYPTION_KEY"] = "a".repeat(64);

const { expect } = cds.test("serve", "--with-mocks", "--in-memory");

const CONNECTION = "com.financialplanner.ProviderConnection";
const ACCOUNT = "com.financialplanner.ProviderAccount";
const TRANSACTION = "com.financialplanner.Transaction";
const ALERT = "com.financialplanner.Alert";

beforeAll(seedSimpleFin);

describe("SimpleFIN sync against SQLite", () => {
  /** Access URLs carry bank credentials — storing plaintext would leak them if the DB is read. */
  it("seeds the access URL encrypted, never in plaintext", async () => {
    const conn = await SELECT.one.from(CONNECTION).where({ ID: CONNECTION_ID });
    expect(conn.accessUrlEnc).to.not.contain(ACCESS_URL_PLAINTEXT);
    expect(conn.accessUrlEnc).to.match(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
  });

  /** End-to-end proof against real SQLite that ingested rows land tagged simplefin, attributed to the mapped card, and record success — the core contract the mocked units can't exercise. */
  it("Sync Now ingests simplefin transactions on a mapped account", async () => {
    const service = buildSimpleFinService(httpReturning(RESPONSE_TWO_NEW));

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.created).to.equal(2);
    expect(result.status).to.equal("success");
    const txns = await SELECT.from(TRANSACTION).where({ source: "simplefin" });
    expect(txns).to.have.length(2);
    expect(
      txns.every(
        (txn: { cardInstance_ID: string }) =>
          txn.cardInstance_ID === AMEX_COBALT_INSTANCE.ID,
      ),
    ).to.equal(true);
    const conn = await SELECT.one.from(CONNECTION).where({ ID: CONNECTION_ID });
    expect(conn.lastSyncStatus).to.equal("success");
    expect(conn.lastSyncAt).to.not.equal(null);
  });

  /** Overlapping re-sync windows must not double-insert; deduping against already-persisted rows keeps reported spend accurate. */
  it("silently skips external-id duplicates on re-sync", async () => {
    const service = buildSimpleFinService(
      httpReturning(RESYNC_ONE_DUP_ONE_NEW),
    );

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.duplicates).to.equal(1);
    expect(result.created).to.equal(1);
    const all = await SELECT.from(TRANSACTION).where({ source: "simplefin" });
    expect(all).to.have.length(3);
  });

  /** Transactions from an unknown account must be retained under a null-card placeholder and surfaced via alert, never silently dropped. */
  it("auto-creates an unmapped account and raises an alert", async () => {
    const service = buildSimpleFinService(
      httpReturning(RESPONSE_UNMAPPED_ACCOUNT),
    );

    const result = await service.syncConnection(CONNECTION_ID);

    expect(result.unmapped).to.equal(1);
    const account = await SELECT.one
      .from(ACCOUNT)
      .where({ externalAccountId: EXTERNAL_ACCOUNT_UNKNOWN });
    expect(account).to.not.equal(undefined);
    expect(account.cardInstance_ID).to.equal(null);
    const txn = await SELECT.one
      .from(TRANSACTION)
      .where({ externalId: TX_UNMAPPED });
    expect(txn.cardInstance_ID).to.equal(null);
    const alerts = await SELECT.from(ALERT).where({
      providerConnection_ID: CONNECTION_ID,
    });
    expect(alerts.length).to.be.greaterThan(0);
  });

  /** Mapping the account afterward must retroactively attribute its orphaned transactions to the card so historical spend is correct. */
  it("backfills null-card transactions when the account is later mapped", async () => {
    // The unmapped account + its transaction were created by the prior test.
    const account = await SELECT.one
      .from(ACCOUNT)
      .where({ externalAccountId: EXTERNAL_ACCOUNT_UNKNOWN });
    await UPDATE(ACCOUNT)
      .set({ cardInstance_ID: AMEX_COBALT_INSTANCE.ID })
      .where({ ID: account.ID });

    const service = buildSimpleFinService(httpReturning(EMPTY_RESPONSE));
    const count = await service.backfillCardMapping(account.ID);

    expect(count).to.be.greaterThan(0);
    const txn = await SELECT.one
      .from(TRANSACTION)
      .where({ externalId: TX_UNMAPPED });
    expect(txn.cardInstance_ID).to.equal(AMEX_COBALT_INSTANCE.ID);
  });

  /** Transactions without a stable external id fall back to a natural key (description+date+amount+card); the lookup must catch true dupes yet reject non-matches, or dedup either misses dupes or falsely merges distinct charges. */
  it("dedup natural-key lookup matches an ingested transaction", async () => {
    const existing = await SELECT.one
      .from(TRANSACTION)
      .where({ externalId: TX_AMAZON });
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

  /** A newly claimed connection must persist its access URL encrypted and start in never_synced, so bank credentials aren't leaked at rest. */
  it("claimConnection stores the access URL encrypted", async () => {
    const service = buildSimpleFinService(httpReturning(EMPTY_RESPONSE));

    const id = await service.claimConnection(SETUP_TOKEN, "Claimed Connection");

    const created = await SELECT.one.from(CONNECTION).where({ ID: id });
    expect(created.lastSyncStatus).to.equal("never_synced");
    expect(created.accessUrlEnc).to.not.contain(ACCESS_URL_PLAINTEXT);
    expect(created.accessUrlEnc).to.match(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
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
