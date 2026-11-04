import { TrackerValidator } from "../../../../srv/modules/tracker/trackerValidator.js";
import {
  COMPLETION_PAYLOADS,
  DEFECT_SCOPES,
  TEST_RUN_COUNT_ARGS,
  TEST_RUN_COUNTS,
  TEST_RUN_SCOPES,
} from "../data/handlerPayloads.js";
import { buildRequestDouble } from "../support/requestDouble.js";

describe("the handler-layer input rules", () => {
  const validator = new TrackerValidator();

  /** A defect linked to nothing is invisible to every register, so it must be refused. */
  it("accepts a defect scoped either way and refuses one scoped to nothing", () => {
    const onStory = buildRequestDouble(DEFECT_SCOPES.ON_STORY);
    const onSprint = buildRequestDouble(DEFECT_SCOPES.ON_SPRINT);
    const orphan = buildRequestDouble(DEFECT_SCOPES.ORPHAN);

    validator.validateDefectScope(onStory.request, DEFECT_SCOPES.ON_STORY);
    validator.validateDefectScope(onSprint.request, DEFECT_SCOPES.ON_SPRINT);
    validator.validateDefectScope(orphan.request, DEFECT_SCOPES.ORPHAN);

    expect(onStory.errors).toHaveLength(0);
    expect(onSprint.errors).toHaveLength(0);
    expect(orphan.errors[0].code).toBe("tracker.defect.scopeRequired");
  });

  /** A run linked to nothing is a fact about no sprint and no stage. */
  it("accepts a test run scoped either way and refuses one scoped to nothing", () => {
    const onStage = buildRequestDouble(TEST_RUN_SCOPES.ON_STAGE);
    const onSprint = buildRequestDouble(TEST_RUN_SCOPES.ON_SPRINT);
    const orphan = buildRequestDouble(TEST_RUN_SCOPES.ORPHAN);

    validator.validateTestRunScope(onStage.request, TEST_RUN_SCOPES.ON_STAGE);
    validator.validateTestRunScope(onSprint.request, TEST_RUN_SCOPES.ON_SPRINT);
    validator.validateTestRunScope(orphan.request, TEST_RUN_SCOPES.ORPHAN);

    expect(onStage.errors).toHaveLength(0);
    expect(onSprint.errors).toHaveLength(0);
    expect(orphan.errors[0].code).toBe("tracker.testrun.scopeRequired");
  });

  /** A run claiming more outcomes than tests is a gate figure nothing downstream can trust. */
  it("refuses test-run counts that add up past the total, naming all four numbers", () => {
    const atTotal = buildRequestDouble(TEST_RUN_COUNTS.AT_TOTAL_WITH_PENDING);
    const underTotal = buildRequestDouble(
      TEST_RUN_COUNTS.UNDER_TOTAL_WITHOUT_PENDING,
    );
    const passedOver = buildRequestDouble(TEST_RUN_COUNTS.PASSED_OVER_TOTAL);
    const pendingOver = buildRequestDouble(TEST_RUN_COUNTS.PENDING_OVER_TOTAL);

    validator.validateTestRunCounts(
      atTotal.request,
      TEST_RUN_COUNTS.AT_TOTAL_WITH_PENDING,
    );
    validator.validateTestRunCounts(
      underTotal.request,
      TEST_RUN_COUNTS.UNDER_TOTAL_WITHOUT_PENDING,
    );
    validator.validateTestRunCounts(
      passedOver.request,
      TEST_RUN_COUNTS.PASSED_OVER_TOTAL,
    );
    validator.validateTestRunCounts(
      pendingOver.request,
      TEST_RUN_COUNTS.PENDING_OVER_TOTAL,
    );

    expect(atTotal.errors).toHaveLength(0);
    expect(underTotal.errors).toHaveLength(0);
    expect(passedOver.errors[0].code).toBe("verb.testrun.countsExceedTotal");
    expect(passedOver.errors[0].args).toEqual([
      ...TEST_RUN_COUNT_ARGS.PASSED_OVER_TOTAL,
    ]);
    expect(pendingOver.errors[0].args).toEqual([
      ...TEST_RUN_COUNT_ARGS.PENDING_OVER_TOTAL,
    ]);
  });

  /** A missing count is the mandatory check's to report; a sum over nothing would refuse under the wrong key. */
  it("leaves a test run carrying no counts to the mandatory check", () => {
    const double = buildRequestDouble(TEST_RUN_COUNTS.NO_COUNTS);

    validator.validateTestRunCounts(double.request, TEST_RUN_COUNTS.NO_COUNTS);

    expect(double.errors).toHaveLength(0);
  });

  /** Both git facts are required together, so either one missing has to fail on its own. */
  it("requires both completion facts, and only once a sprint is complete", () => {
    const active = buildRequestDouble(COMPLETION_PAYLOADS.ACTIVE);
    const both = buildRequestDouble(COMPLETION_PAYLOADS.COMPLETE_WITH_BOTH);
    const noTag = buildRequestDouble(COMPLETION_PAYLOADS.COMPLETE_WITHOUT_TAG);
    const noCommit = buildRequestDouble(
      COMPLETION_PAYLOADS.COMPLETE_WITHOUT_COMMIT,
    );

    validator.validateInitiativeCompletion(
      active.request,
      COMPLETION_PAYLOADS.ACTIVE,
    );
    validator.validateInitiativeCompletion(
      both.request,
      COMPLETION_PAYLOADS.COMPLETE_WITH_BOTH,
    );
    validator.validateInitiativeCompletion(
      noTag.request,
      COMPLETION_PAYLOADS.COMPLETE_WITHOUT_TAG,
    );
    validator.validateInitiativeCompletion(
      noCommit.request,
      COMPLETION_PAYLOADS.COMPLETE_WITHOUT_COMMIT,
    );

    expect(active.errors).toHaveLength(0);
    expect(both.errors).toHaveLength(0);
    expect(noTag.errors[0].code).toBe(
      "tracker.initiative.completionFieldsRequired",
    );
    expect(noCommit.errors[0].code).toBe(
      "tracker.initiative.completionFieldsRequired",
    );
  });
});
