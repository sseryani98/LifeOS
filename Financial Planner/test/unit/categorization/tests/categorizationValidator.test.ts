import { CategorizationValidator } from "../../../../srv/modules/categorization/categorizationValidator.js";
import {
  APPLE_TO_ICLOUD_CORRECTION,
  EMPTY_CORRECTION,
} from "../data/corrections.js";

describe("CategorizationValidator", () => {
  /** A valid correction (transaction + vendor) must pass so the learning flow can run. */
  it("accepts a correction that targets a transaction and a vendor", () => {
    const errors = CategorizationValidator.validateCorrection(
      APPLE_TO_ICLOUD_CORRECTION,
    );

    expect(errors).toHaveLength(0);
  });

  /** A correction with no transaction and no vendor must accumulate both errors — the engine cannot correct nothing. */
  it("rejects a correction missing the transaction and vendor", () => {
    const errors = CategorizationValidator.validateCorrection(EMPTY_CORRECTION);

    expect(errors).toEqual([
      { field: "transactionId", messageKey: "categorization.transactionRequired" },
      { field: "vendor_ID", messageKey: "categorization.vendorRequired" },
    ]);
  });

  /** The dual taxonomy is independent: a correction may set a vendor without any purchase type or earning category. */
  it("accepts a vendor-only correction (no taxonomy required)", () => {
    const errors = CategorizationValidator.validateCorrection({
      transactionId: "txn-1",
      vendor_ID: "vendor-1",
    });

    expect(errors).toHaveLength(0);
  });
});
