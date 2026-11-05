/// <reference types="qunit" />
import formatter from "com/financialplanner/shared/util/formatter";

import { AMOUNT, CURRENCY, DATE, SHARE_INPUT, STATUS } from "../data/constants";

QUnit.module("formatter — formatAmount", () => {
  /** The post-import summary total renders to two decimals, so cents never drop or run long. */
  QUnit.test("fixes a numeric amount to two decimals", assert => {
    assert.strictEqual(
      formatter.formatAmount(AMOUNT.NUMBER),
      AMOUNT.NUMBER_FIXED,
    );
  });

  /** OData V4 serialises Decimal as text; the formatter must coerce it, not concatenate it. */
  QUnit.test("coerces an amount sent as text", assert => {
    assert.strictEqual(formatter.formatAmount(AMOUNT.TEXT), AMOUNT.TEXT_FIXED);
  });

  /** A zero total is a real amount; treating 0 as blank would hide a fully reimbursed import. */
  QUnit.test("renders a zero amount rather than blanking it", assert => {
    assert.strictEqual(formatter.formatAmount(AMOUNT.ZERO), AMOUNT.ZERO_FIXED);
  });

  /** An absent amount shows nothing; Number(null) would print a misleading "0.00". */
  QUnit.test("renders null, undefined and blank as empty", assert => {
    assert.deepEqual(
      [
        formatter.formatAmount(null),
        formatter.formatAmount(undefined),
        formatter.formatAmount(""),
      ],
      ["", "", ""],
    );
  });
});

QUnit.module("formatter — formatCurrency", () => {
  /** Amounts are Canadian dollars; a locale default would render USD or a foreign grouping. */
  QUnit.test("formats an amount as en-CA Canadian dollars", assert => {
    assert.strictEqual(
      formatter.formatCurrency(CURRENCY.AMOUNT),
      CURRENCY.FORMATTED,
    );
  });

  /** An absent amount shows nothing rather than "$0.00", which would read as a real balance. */
  QUnit.test("renders null and undefined as empty", assert => {
    assert.deepEqual(
      [formatter.formatCurrency(null), formatter.formatCurrency(undefined)],
      ["", ""],
    );
  });
});

QUnit.module("formatter — formatDate", () => {
  /** Dates display as "Mon D, YYYY" in en-CA, the one date format the apps show. */
  QUnit.test("formats a timestamp as a short en-CA date", assert => {
    assert.strictEqual(
      formatter.formatDate(DATE.LOCAL_TIMESTAMP),
      DATE.FORMATTED,
    );
  });

  /** A date-only string parses as UTC midnight; formatted in a zone west of UTC it would show the day before. */
  QUnit.test("formats a date-only string as that calendar day", assert => {
    assert.strictEqual(formatter.formatDate(DATE.DATE_ONLY), DATE.FORMATTED);
  });

  /** A missing date shows nothing; new Date(null) would render the 1970 epoch. */
  QUnit.test("renders null and blank as empty", assert => {
    assert.deepEqual(
      [formatter.formatDate(null), formatter.formatDate("")],
      ["", ""],
    );
  });
});

QUnit.module("formatter — formatStatus", () => {
  /** A camelCase status code must reach the user as words, not as the raw code. */
  QUnit.test("maps a known status code to its display text", assert => {
    assert.strictEqual(
      formatter.formatStatus(STATUS.TO_CANCEL),
      STATUS.TO_CANCEL_TEXT,
    );
  });

  /** A code added to the backend before the map shows as itself, never as blank. */
  QUnit.test("falls back to the raw code for an unmapped status", assert => {
    assert.strictEqual(formatter.formatStatus(STATUS.UNKNOWN), STATUS.UNKNOWN);
  });

  /** An absent status shows nothing. */
  QUnit.test("renders null and blank as empty", assert => {
    assert.deepEqual(
      [formatter.formatStatus(null), formatter.formatStatus("")],
      ["", ""],
    );
  });
});

QUnit.module("formatter — toNumber", () => {
  /** A split takes a share % or an amount, never both: the untouched field goes as absent so the backend can tell which. */
  QUnit.test("treats blank, undefined and null input as absent", assert => {
    assert.deepEqual(
      [
        formatter.toNumber(""),
        formatter.toNumber(undefined),
        formatter.toNumber(null),
      ],
      [null, null, null],
    );
  });

  /** An entered split share reaches the backend as a number, not text. */
  QUnit.test("parses entered text to a number", assert => {
    assert.strictEqual(
      formatter.toNumber(SHARE_INPUT.PERCENT),
      SHARE_INPUT.PERCENT_NUMBER,
    );
  });

  /** A 0% share marks a reimbursed transaction, so "0" must stay 0, never absent. */
  QUnit.test("keeps an entered zero as zero", assert => {
    assert.strictEqual(formatter.toNumber(SHARE_INPUT.ZERO), 0);
  });
});
