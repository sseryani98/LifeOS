/// <reference types="qunit" />
import formatter from "com/financialplanner/csvimportwizard/model/formatter";

import { IMPORT_SUMMARY } from "../data/constants";

QUnit.module("formatter — formatClearedState", () => {
  /** A confirmed row reads as done (Success) so the user sees what is left to review. */
  QUnit.test("marks a cleared row Success and an open row None", assert => {
    assert.strictEqual(formatter.formatClearedState(true), "Success");
    assert.strictEqual(formatter.formatClearedState(false), "None");
  });
});

QUnit.module("formatter — formatVendorName", () => {
  /** The post-import summary names the batch's top vendor. */
  QUnit.test("shows the top vendor name when the batch had one", assert => {
    assert.strictEqual(formatter.formatVendorName(IMPORT_SUMMARY.topVendorName), "Amazon");
  });

  /** An all-uncategorized batch has no top vendor; the summary shows a dash, not "null". */
  QUnit.test("falls back to a dash when there is no top vendor", assert => {
    assert.strictEqual(formatter.formatVendorName(null), "—");
    assert.strictEqual(formatter.formatVendorName(undefined), "—");
    assert.strictEqual(formatter.formatVendorName(""), "—");
  });
});
