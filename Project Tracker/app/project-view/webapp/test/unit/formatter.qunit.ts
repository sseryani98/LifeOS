/// <reference types="qunit" />
import formatter from "com/lifeos/projecttracker/projectview/model/formatter";

import { DISPLAY_CODE, STAGE } from "../data/constants";
import { buildFormatterHost } from "../support/projectViewFakes";

QUnit.module("formatter", () => {
  QUnit.module("step kind", () => {
    /** Only Recommended is optional work, so only it carries the hint icon; any other kind showing it misreads as skippable. */
    QUnit.test(
      "gives Recommended the hint icon and no other kind any icon",
      assert => {
        assert.strictEqual(
          formatter.formatKindIcon(DISPLAY_CODE.KIND_RECOMMENDED),
          "sap-icon://hint",
        );
        assert.strictEqual(
          formatter.formatKindIcon(DISPLAY_CODE.KIND_REQUIRED),
          "",
        );
      },
    );

    /** Highlighting a blocking kind would invert what the colour means on the card and in the queue. */
    QUnit.test(
      "highlights Recommended and leaves blocking kinds plain",
      assert => {
        assert.strictEqual(
          formatter.formatKindState(DISPLAY_CODE.KIND_RECOMMENDED),
          "Information",
        );
        assert.strictEqual(
          formatter.formatKindState(DISPLAY_CODE.KIND_CONDITIONAL),
          "None",
        );
      },
    );

    /** A kind no code list holds must read as Required, the safe reading, never as a blank cell. */
    QUnit.test(
      "labels each kind and reads an unknown one as Required",
      assert => {
        const host = buildFormatterHost();

        assert.strictEqual(
          host.formatKindText(DISPLAY_CODE.KIND_CONDITIONAL),
          "kindConditional",
        );
        assert.strictEqual(
          host.formatKindText(DISPLAY_CODE.UNKNOWN),
          "kindRequired",
        );
      },
    );
  });

  QUnit.module("stage status", () => {
    /** The queue holds open stages only, so anything but In Progress must look Not Started rather than iconless. */
    QUnit.test(
      "gives In Progress its icon and reads anything else as Not Started",
      assert => {
        assert.strictEqual(
          formatter.formatStatusIcon(DISPLAY_CODE.STATUS_IN_PROGRESS),
          "sap-icon://process",
        );
        assert.strictEqual(
          formatter.formatStatusIcon(DISPLAY_CODE.STATUS_COMPLETE),
          "sap-icon://pending",
        );
      },
    );

    /** Started work is what the reader resumes first, so only it is highlighted. */
    QUnit.test(
      "highlights In Progress and leaves Not Started plain",
      assert => {
        assert.strictEqual(
          formatter.formatStatusState(DISPLAY_CODE.STATUS_IN_PROGRESS),
          "Information",
        );
        assert.strictEqual(
          formatter.formatStatusState(DISPLAY_CODE.STATUS_NOT_STARTED),
          "None",
        );
      },
    );

    /** The card and the queue share this label, so one code must read one way in both. */
    QUnit.test(
      "labels In Progress and reads anything else as Not Started",
      assert => {
        const host = buildFormatterHost();

        assert.strictEqual(
          host.formatStatusText(DISPLAY_CODE.STATUS_IN_PROGRESS),
          "statusInProgress",
        );
        assert.strictEqual(
          host.formatStatusText(DISPLAY_CODE.UNKNOWN),
          "statusNotStarted",
        );
      },
    );
  });

  QUnit.module("stage", () => {
    /** The queue's Stage column shows the name, so the card's Stage line must too, or one stage reads two ways on one page. */
    QUnit.test("names the stage and keeps its code beside the name", assert => {
      assert.strictEqual(
        buildFormatterHost().formatStageText(STAGE.NAME, STAGE.CODE),
        `nextActionStageText:${STAGE.NAME},${STAGE.CODE}`,
      );
    });
  });

  QUnit.module("tier", () => {
    /** The tier is the reason this stage is next; a wrong label sends the reader to fresh work over started work. */
    QUnit.test("names the reason each tier gives", assert => {
      const host = buildFormatterHost();

      assert.strictEqual(
        host.formatTierText(DISPLAY_CODE.TIER_RESUMING),
        "tierResuming",
      );
      assert.strictEqual(
        host.formatTierText(DISPLAY_CODE.TIER_FRESH),
        "tierFresh",
      );
    });

    /** No next action carries no tier; it must still read as a sentence, never as a blank status. */
    QUnit.test("reads a missing tier as optional work only", assert => {
      assert.strictEqual(
        buildFormatterHost().formatTierText(null),
        "tierOptionalOnly",
      );
    });
  });
});
