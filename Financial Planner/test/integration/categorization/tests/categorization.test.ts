// Runs the categorization engine against the real in-memory DB to prove what the
// mocked units can't: the pattern join, the VendorCategoryStats view, and
// correction learning. Custom logic only.

import cds from "@sap/cds";

import {
  DINING_EARNING_CATEGORY,
  FAST_FOOD_PURCHASE_TYPE,
  GROCERIES_EARNING_CATEGORY,
  RESTAURANTS_PURCHASE_TYPE,
} from "../../../shared/data/reference.js";
import {
  ICLOUD_VENDOR_ID,
  MISSING_TXN_CORRECTION,
  MISSING_TXN_ID,
  PADEL_CORRECTION,
  PADEL_HAUS_VENDOR_ID,
  PADEL_TXN_ID,
  UBER_EATS_VENDOR_ID,
} from "../data/categorization.js";
import {
  buildCategorizationService,
  readLearnedPatternsForVendor,
  readTransactionState,
  seedCategorization,
} from "../support/categorization.js";

const { expect } = cds.test("serve", "--with-mocks", "--in-memory");

beforeAll(seedCategorization);

describe("Categorization against SQLite", () => {
  /** Proves the real stats query ranks combos by usage count — the majority combo sorts after the minority by key, so only the orderBy can put it first. */
  it("categorizes a description via the seeded pattern and stats view", async () => {
    const service = buildCategorizationService();

    const result = await service.categorize({
      rawDescription: "UBER EATS CA 3",
      amount: -18.25,
    });

    expect(result.vendor_ID).to.equal(UBER_EATS_VENDOR_ID);
    expect(result.purchaseType_ID).to.equal(FAST_FOOD_PURCHASE_TYPE.ID);
    expect(result.earningCategory_ID).to.equal(GROCERIES_EARNING_CATEGORY.ID);
    expect(result.status).to.equal("auto");
    expect(result.alternatives).to.have.length(1);
    expect(result.alternatives[0].purchaseType_ID).to.equal(RESTAURANTS_PURCHASE_TYPE.ID);
  });

  /** A pattern the user deactivated must never match — otherwise their fix keeps mis-booking rows as auto, hidden from the uncategorized review. */
  it("ignores an inactive pattern when matching", async () => {
    const service = buildCategorizationService();

    const result = await service.categorize({
      rawDescription: "UBER EATS TORONTO",
      amount: -21.4,
    });

    expect(result.vendor_ID).to.equal(UBER_EATS_VENDOR_ID);
  });

  /** Proves a from-scratch correction persists the assignment, learns an exact pattern, and that the pattern immediately auto-categorizes the next identical description. */
  it("applies a correction, learns a pattern, and reuses it", async () => {
    const service = buildCategorizationService();

    await service.correctCategorization(PADEL_CORRECTION);

    const state = await readTransactionState(PADEL_TXN_ID);
    expect(state?.vendor_ID).to.equal(PADEL_HAUS_VENDOR_ID);
    expect(state?.purchaseType_ID).to.equal(RESTAURANTS_PURCHASE_TYPE.ID);
    expect(state?.earningCategory_ID).to.equal(DINING_EARNING_CATEGORY.ID);
    expect(state?.categorizationStatus).to.equal("user_corrected");
    const learned = await readLearnedPatternsForVendor(PADEL_HAUS_VENDOR_ID);
    expect(learned).to.have.length(1);
    expect(learned[0].pattern).to.equal("PADEL HAUS TORONTO");
    expect(learned[0].matchType).to.equal("exact");
    expect(learned[0].amount).to.equal(null);

    const reused = await service.categorize({
      rawDescription: "PADEL HAUS TORONTO",
      amount: -95,
    });
    expect(reused.vendor_ID).to.equal(PADEL_HAUS_VENDOR_ID);
    expect(reused.status).to.equal("auto");
  });

  /** Proves an amount-discriminated pattern wins by amount — APPLE.COM/BILL at $3.99 resolves to iCloud, exercising the stored decimal amount path. */
  it("resolves an amount-discriminated pattern by amount", async () => {
    const service = buildCategorizationService();

    const result = await service.categorize({
      rawDescription: "APPLE.COM/BILL",
      amount: -3.99,
    });

    expect(result.vendor_ID).to.equal(ICLOUD_VENDOR_ID);
  });

  /** A correction against a missing row must report false and write nothing — bulk-categorize counts written rows from that boolean. */
  it("is a no-op when correcting a missing transaction", async () => {
    const service = buildCategorizationService();

    const written = await service.correctCategorization(MISSING_TXN_CORRECTION);

    expect(written).to.equal(false);
    expect(await readTransactionState(MISSING_TXN_ID)).to.equal(null);
    expect(await readLearnedPatternsForVendor(UBER_EATS_VENDOR_ID)).to.have.length(0);
  });
});
