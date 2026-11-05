/// <reference types="qunit" />
import formatter from "com/financialplanner/connectionmanager/model/formatter";

import { SYNC_STATUS_CODE } from "../data/constants";
import { formatStatusTextKey } from "../support/connectionFakes";

QUnit.module("formatter — connection status", () => {
  /** A healthy connection reads green with a positive icon. */
  QUnit.test("formats a successful sync as positive and green", assert => {
    assert.strictEqual(
      formatter.formatStatusIcon(SYNC_STATUS_CODE.SUCCESS),
      "sap-icon://status-positive",
    );
    assert.strictEqual(
      formatter.formatStatusState(SYNC_STATUS_CODE.SUCCESS),
      "Success",
    );
    assert.strictEqual(
      formatStatusTextKey(SYNC_STATUS_CODE.SUCCESS),
      "statusSuccess",
    );
  });

  /** An errored connection must read red, or a broken feed looks healthy. */
  QUnit.test("formats a failed sync as negative and red", assert => {
    assert.strictEqual(
      formatter.formatStatusIcon(SYNC_STATUS_CODE.ERROR),
      "sap-icon://status-negative",
    );
    assert.strictEqual(
      formatter.formatStatusState(SYNC_STATUS_CODE.ERROR),
      "Error",
    );
    assert.strictEqual(
      formatStatusTextKey(SYNC_STATUS_CODE.ERROR),
      "statusError",
    );
  });

  /** A just-claimed connection is never_synced and reads grey. */
  QUnit.test(
    "formats a never-synced connection as inactive and grey",
    assert => {
      assert.strictEqual(
        formatter.formatStatusIcon(SYNC_STATUS_CODE.NEVER_SYNCED),
        "sap-icon://status-inactive",
      );
      assert.strictEqual(
        formatter.formatStatusState(SYNC_STATUS_CODE.NEVER_SYNCED),
        "None",
      );
      assert.strictEqual(
        formatStatusTextKey(SYNC_STATUS_CODE.NEVER_SYNCED),
        "statusNeverSynced",
      );
    },
  );

  /** An unrecognised status must never claim health; it falls back to the neutral never-synced display. */
  QUnit.test("formats an unknown status as never synced", assert => {
    assert.strictEqual(
      formatter.formatStatusIcon(SYNC_STATUS_CODE.UNKNOWN),
      "sap-icon://status-inactive",
    );
    assert.strictEqual(
      formatter.formatStatusState(SYNC_STATUS_CODE.UNKNOWN),
      "None",
    );
    assert.strictEqual(
      formatStatusTextKey(SYNC_STATUS_CODE.UNKNOWN),
      "statusNeverSynced",
    );
  });
});
