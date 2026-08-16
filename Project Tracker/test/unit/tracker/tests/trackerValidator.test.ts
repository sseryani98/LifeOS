import { TrackerValidator } from "../../../../srv/modules/tracker/trackerValidator.js";
import {
  COMPLETION_PAYLOADS,
  DEFECT_SCOPES,
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
