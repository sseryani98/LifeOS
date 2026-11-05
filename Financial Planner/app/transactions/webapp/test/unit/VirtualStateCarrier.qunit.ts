/// <reference types="qunit" />
import VirtualStateCarrier from "com/financialplanner/transactions/model/VirtualStateCarrier";
import type Context from "sap/ui/model/odata/v4/Context";

import { LEFT_RECORD_STATES, VIRTUAL_STATES } from "../data/constants";
import { buildVirtualStateHarness } from "../support/virtualStateFakes";
import type { VirtualStateHarness } from "../support/types";

const state: { harness: VirtualStateHarness; carrier: VirtualStateCarrier } = {
  harness: undefined as unknown as VirtualStateHarness,
  carrier: new VirtualStateCarrier(),
};

const bindPath = (path: string): void =>
  state.carrier.copyLastRecordStates(
    state.harness.buildContext(path) as unknown as Context,
  );

const readOpened = (key: string): unknown =>
  state.harness.states.getProperty(`${VIRTUAL_STATES.OPENED_PATH}/${key}`);

QUnit.module("VirtualStateCarrier — record to record", hooks => {
  hooks.beforeEach(() => {
    state.harness = buildVirtualStateHarness({
      [VIRTUAL_STATES.LEFT_PATH.slice(1)]: LEFT_RECORD_STATES,
    });
  });

  /** FE never re-states a record whose criticality equals the last one's, so the opened header lost its colour. */
  QUnit.test(
    "gives the opened record the header and field states it lacks",
    assert => {
      bindPath(VIRTUAL_STATES.LEFT_PATH);

      bindPath(VIRTUAL_STATES.OPENED_PATH);

      assert.deepEqual(
        {
          header: readOpened(VIRTUAL_STATES.HEADER_KEY),
          field: readOpened(
            `${VIRTUAL_STATES.GROUP_KEY}/Data/${VIRTUAL_STATES.FIELD_KEY}`,
          ),
        },
        {
          header: VIRTUAL_STATES.INFORMATION,
          field: VIRTUAL_STATES.INFORMATION,
        },
      );
    },
  );

  /** A state FE did compute for the opened record is the truth; a copy over it would show the last record's colour. */
  QUnit.test(
    "keeps a state FE already computed for the opened record",
    assert => {
      state.harness.states.setProperty(VIRTUAL_STATES.OPENED_PATH, {
        [VIRTUAL_STATES.HEADER_KEY]: VIRTUAL_STATES.POSITIVE,
      });
      bindPath(VIRTUAL_STATES.LEFT_PATH);

      bindPath(VIRTUAL_STATES.OPENED_PATH);

      assert.strictEqual(
        readOpened(VIRTUAL_STATES.HEADER_KEY),
        VIRTUAL_STATES.POSITIVE,
      );
    },
  );

  /** Messages belong to one record; carrying them would flag a field on a record that has no error. */
  QUnit.test("carries no message entry across records", assert => {
    bindPath(VIRTUAL_STATES.LEFT_PATH);

    bindPath(VIRTUAL_STATES.OPENED_PATH);

    assert.strictEqual(readOpened(VIRTUAL_STATES.MESSAGE_KEY), undefined);
  });

  /** The first binding has no earlier record, and FE states it itself; nothing may be invented for it. */
  QUnit.test("leaves the first bound record to FE", assert => {
    bindPath(VIRTUAL_STATES.OPENED_PATH);

    assert.strictEqual(
      state.harness.states.getProperty(VIRTUAL_STATES.OPENED_PATH),
      undefined,
    );
  });

  /** FE can bind no context at all; the hook must not throw and break the page binding. */
  QUnit.test("ignores a missing context", assert => {
    state.carrier.copyLastRecordStates(null);

    assert.strictEqual(
      state.harness.states.getProperty(VIRTUAL_STATES.OPENED_PATH),
      undefined,
    );
  });

  /** Re-binding the same record copies nothing onto itself. */
  QUnit.test("copies nothing when the same record is bound again", assert => {
    bindPath(VIRTUAL_STATES.OPENED_PATH);

    bindPath(VIRTUAL_STATES.OPENED_PATH);

    assert.strictEqual(
      state.harness.states.getProperty(VIRTUAL_STATES.OPENED_PATH),
      undefined,
    );
  });

  /** A record left before FE stored anything for it has no states to hand on. */
  QUnit.test("copies nothing from a record with no stored states", assert => {
    bindPath(VIRTUAL_STATES.UNSTATED_PATH);

    bindPath(VIRTUAL_STATES.OPENED_PATH);

    assert.strictEqual(
      state.harness.states.getProperty(VIRTUAL_STATES.OPENED_PATH),
      undefined,
    );
  });
});
