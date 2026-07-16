// Integration test for the transaction actions (cds.test + SQLite): the split
// and bulk-categorize engines run against the real in-memory DB, proving the
// split round-trips the schema and bulk categorize classifies the selection while
// learning one pattern. Custom logic only. Fixtures in data/, harness in support/.

import cds from "@sap/cds";

import {
  BULK_CATEGORIZE_PAYLOAD,
  BULK_TXN_1_ID,
  BULK_TXN_2_ID,
  MISSING_SPLIT_TXN_ID,
  SPLIT_TXN_ID,
  STARBUCKS_VENDOR_ID,
} from "../data/transaction.js";
import {
  actionRequest,
  buildTransactionService,
  countLearnedPatternsForVendor,
  readSplitByTransaction,
  readTransactionState,
  seedTransactionProcessing,
} from "../support/transaction.js";

const { expect } = cds.test("serve", "--with-mocks", "--in-memory");

beforeAll(seedTransactionProcessing);

describe("Transaction actions against SQLite", () => {
  /** A percentage split must round-trip the schema — myShareAmount is amount × pct, computed and persisted for the budget engine. */
  it("splits a transaction by percentage and stores the computed share", async () => {
    const service = buildTransactionService();

    const result = await service.splitTransaction(
      actionRequest({
        transactionId: SPLIT_TXN_ID,
        mySharePct: 0.2,
        splitDescription: "Padel with friends",
        isRecurring: true,
      }) as never,
    );

    expect(result?.myShareAmount).to.equal(22);
    const split = await readSplitByTransaction(SPLIT_TXN_ID);
    expect(split?.myShareAmount).to.equal(22);
    expect(split?.mySharePct).to.equal(0.2);
    expect(split?.isRecurring).to.equal(true);
  });

  /** Re-splitting must replace the single split, not add a second — a transaction has at most one split. */
  it("replaces the existing split on a second call", async () => {
    const service = buildTransactionService();

    await service.splitTransaction(
      actionRequest({
        transactionId: SPLIT_TXN_ID,
        myShareAmount: 40,
        isRecurring: false,
      }) as never,
    );

    const split = await readSplitByTransaction(SPLIT_TXN_ID);
    expect(split?.myShareAmount).to.equal(40);
    expect(split?.mySharePct).to.equal(null);
  });

  /** Splitting a non-existent transaction must report an error and write nothing — the data layer's not-found path must degrade safely, not throw. */
  it("reports an error when the transaction does not exist", async () => {
    const service = buildTransactionService();
    const request = actionRequest({
      transactionId: MISSING_SPLIT_TXN_ID,
      mySharePct: 0.5,
      isRecurring: false,
    });

    const result = await service.splitTransaction(request as never);

    expect(result).to.equal(undefined);
    const split = await readSplitByTransaction(MISSING_SPLIT_TXN_ID);
    expect(split).to.equal(null);
  });

  /** Bulk categorize must classify every selected row and learn a single pattern for the shared description — proving dedup-by-description over the real learning gate. */
  it("categorizes the selection and learns one pattern per description", async () => {
    const service = buildTransactionService();

    const result = await service.applyCategories(
      actionRequest(BULK_CATEGORIZE_PAYLOAD) as never,
    );

    expect(result?.updatedCount).to.equal(2);
    const first = await readTransactionState(BULK_TXN_1_ID);
    const second = await readTransactionState(BULK_TXN_2_ID);
    expect(first?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    expect(first?.categorizationStatus).to.equal("user_corrected");
    expect(second?.vendor_ID).to.equal(STARBUCKS_VENDOR_ID);
    const learned = await countLearnedPatternsForVendor(STARBUCKS_VENDOR_ID);
    expect(learned).to.equal(1);
  });
});
