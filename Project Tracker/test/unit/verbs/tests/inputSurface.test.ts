import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { CompleteSubtaskVerb } from "../../../../mcp/verbs/completeSubtask.js";
import { PlanSprintVerb } from "../../../../mcp/verbs/planSprint.js";
import { RecordTestRunVerb } from "../../../../mcp/verbs/recordTestRun.js";
import { ReopenStageVerb } from "../../../../mcp/verbs/reopenStage.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { VERB_INPUT_KEYS } from "../data/verbFixtures.js";
import { readArrayItemKeys } from "../support/fakeRunner.js";

describe("the verbs' input surface", () => {
  /** The guards read stored state, never a caller's claim, so enforcing the methodology may add no argument to any verb. */
  it("accepts exactly the arguments each stage verb accepted before enforcement", () => {
    expect(Object.keys(new StartStageVerb().inputShape)).toEqual([
      ...VERB_INPUT_KEYS.START_STAGE,
    ]);
    expect(Object.keys(new CompleteStageVerb().inputShape)).toEqual([
      ...VERB_INPUT_KEYS.COMPLETE_STAGE,
    ]);
    expect(Object.keys(new CompleteSubtaskVerb().inputShape)).toEqual([
      ...VERB_INPUT_KEYS.COMPLETE_SUBTASK,
    ]);
    expect(Object.keys(new ReopenStageVerb().inputShape)).toEqual([
      ...VERB_INPUT_KEYS.REOPEN_STAGE,
    ]);
    expect(Object.keys(new RecordTestRunVerb().inputShape)).toEqual([
      ...VERB_INPUT_KEYS.RECORD_TEST_RUN,
    ]);
  });

  /** Only the migration load may create a story Done, so planning must offer no way to send the creation flag. */
  it("gives a planned story no creation-status argument", () => {
    const shape = new PlanSprintVerb().inputShape;

    expect(Object.keys(shape)).toEqual([...VERB_INPUT_KEYS.PLAN_SPRINT]);
    expect(readArrayItemKeys(shape.stories)).toEqual([...VERB_INPUT_KEYS.PLANNED_STORY]);
  });
});
