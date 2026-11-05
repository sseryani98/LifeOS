/// <reference types="qunit" />
import PercentFractionType from "com/financialplanner/shared/util/PercentFractionType";
import ParseException from "sap/ui/model/ParseException";

import { SHARE_FRACTION } from "../data/constants";

QUnit.module("PercentFractionType", () => {
  /** The split share is stored as a 0–1 fraction; shown raw, a 50% split reads "0.5000", as if it were half a percent. */
  QUnit.test("shows a stored fraction as a 0–100 percentage", assert => {
    const type = new PercentFractionType();

    assert.strictEqual(type.formatValue(SHARE_FRACTION.STORED), SHARE_FRACTION.SHOWN);
    assert.strictEqual(type.formatValue(SHARE_FRACTION.STORED_THIRD), SHARE_FRACTION.SHOWN_THIRD);
  });

  /** A dollar-based split has no percentage; it must show blank, never "0". */
  QUnit.test("shows an absent fraction as blank", assert => {
    const type = new PercentFractionType();

    assert.deepEqual(
      [type.formatValue(null), type.formatValue(undefined), type.formatValue("")],
      ["", "", ""],
    );
  });

  /** An entered percentage must reach the model as the fraction the backend stores, as text for Edm.Decimal. */
  QUnit.test("stores an entered percentage as its fraction", assert => {
    const type = new PercentFractionType();

    assert.strictEqual(type.parseValue(SHARE_FRACTION.ENTERED), SHARE_FRACTION.PARSED);
  });

  /** The column holds four decimals (Decimal(5,4)); a longer fraction would be refused by the database. */
  QUnit.test("rounds the fraction to the column's four decimals", assert => {
    const type = new PercentFractionType();

    assert.strictEqual(type.parseValue(SHARE_FRACTION.ENTERED_FINE), SHARE_FRACTION.PARSED_FINE);
  });

  /** Clearing the field clears the percentage; an empty string is not a 0% share. */
  QUnit.test("stores a cleared field as null", assert => {
    const type = new PercentFractionType();

    assert.strictEqual(type.parseValue(""), null);
  });

  /** Text that is not a number must raise a parse error the field shows, not write NaN. */
  QUnit.test("refuses text that is not a number", assert => {
    const type = new PercentFractionType();

    assert.throws(() => type.parseValue(SHARE_FRACTION.NOT_A_NUMBER), ParseException);
  });

  /** The 0–100 range is the backend's @assert.range; the type must let any number through to it. */
  QUnit.test("leaves range validation to the backend", assert => {
    const type = new PercentFractionType();

    assert.strictEqual(type.validateValue(SHARE_FRACTION.PARSED), undefined);
  });
});
