import ClearPropagation from "../../../../app/csv-import-wizard/webapp/model/ClearPropagation.js";

import {
  AMAZON_CATEGORIZATION,
  AMAZON_VENDOR_ID,
  COFFEE_VENDOR_ID,
  buildAmazonBatch,
} from "../data/clearPropagation.js";

describe("ClearPropagation", () => {
  /** Clearing one categorized row must fill its uncategorized siblings, and only those — a description mismatch must never inherit a vendor. */
  it("propagates a cleared row's categorization to rows with the same description", () => {
    const clearing = new ClearPropagation();
    const rows = buildAmazonBatch();

    clearing.clearRow(rows[0], rows);

    expect(rows[0].cleared).toBe(true);
    rows.slice(1, 5).forEach(row => expect(row).toMatchObject(AMAZON_CATEGORIZATION));
    rows.slice(5).forEach(row => expect(row.vendor_ID).toBeNull());
  });

  /** Undo must take back what the Clear wrote, or the 4 auto-filled rows stay categorized and get saved under a vendor the user just rejected. */
  it("restores every propagated row when the clear is undone", () => {
    const clearing = new ClearPropagation();
    const rows = buildAmazonBatch();
    clearing.clearRow(rows[0], rows);

    clearing.restoreRow(rows[0]);

    expect(rows[0].cleared).toBe(false);
    expect(rows[0]).toMatchObject(AMAZON_CATEGORIZATION);
    rows.slice(1, 5).forEach(row =>
      expect(row).toMatchObject({ vendor_ID: null, purchaseType_ID: null, earningCategory_ID: null }),
    );
  });

  /** A propagated row the user re-categorized after the Clear is their decision now; Undo must not wipe it. */
  it("leaves a propagated row the user has since re-categorized", () => {
    const clearing = new ClearPropagation();
    const rows = buildAmazonBatch();
    clearing.clearRow(rows[0], rows);
    rows[1].vendor_ID = COFFEE_VENDOR_ID;

    clearing.restoreRow(rows[0]);

    expect(rows[1].vendor_ID).toBe(COFFEE_VENDOR_ID);
  });

  /** A propagated row that was cleared on its own is queued for save; Undo on the source must not empty it out from under the user. */
  it("leaves a propagated row that has since been cleared", () => {
    const clearing = new ClearPropagation();
    const rows = buildAmazonBatch();
    clearing.clearRow(rows[0], rows);
    clearing.clearRow(rows[1], rows);

    clearing.restoreRow(rows[0]);

    expect(rows[1]).toMatchObject({ cleared: true, vendor_ID: AMAZON_VENDOR_ID });
  });

  /** A new parse replaces every row; a stale fill record must not restore values onto rows from the previous file. */
  it("forgets recorded fills on reset", () => {
    const clearing = new ClearPropagation();
    const rows = buildAmazonBatch();
    clearing.clearRow(rows[0], rows);

    clearing.reset();
    clearing.restoreRow(rows[0]);

    expect(rows[1]).toMatchObject(AMAZON_CATEGORIZATION);
  });
});
