import type cds from "@sap/cds";

import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { CompleteSubtaskVerb } from "../../../../mcp/verbs/completeSubtask.js";
import { RecordTestRunVerb } from "../../../../mcp/verbs/recordTestRun.js";
import { ReopenStageVerb } from "../../../../mcp/verbs/reopenStage.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { ACTORS, STORY_REFERENCE } from "../../../shared/data/world.js";
import {
  readActivityLog,
  readTaskByCode,
  readTestRunsOf,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  setSubtasksComplete,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  buildStoryTestRunInput,
  buildWorkspaceTestRunInput,
} from "../../../shared/support/verbInputs.js";
import { REOPEN_PRECONDITION_SCRIPT } from "../data/chainScripts.js";
import {
  BRIEF_DONE,
  BUILD_COMPLETE,
  BUILD_IN_PROGRESS,
  BUILD_REOPEN_REASON,
  CODE_QUALITY_COMPLETE,
  CODE_QUALITY_TARGET,
  PLAIN_REASON,
  REOPEN_REASON,
  STAGE,
  STEP,
  STEP_TIMES,
  STEPS_BEFORE_HANDOFF_DONE,
} from "../data/chainStates.js";
import { BLOCKING_SETS, SUBTASK_KIND_CHANGE } from "../data/seededLibrary.js";
import { UI_STORY, UI_STORY_REFERENCE } from "../data/writePayloads.js";
import { driveChainScript } from "../support/driveChain.js";
import { setStepKind } from "../support/libraryAccess.js";
import { countChainRows, readStepsOfStage } from "../support/readChain.js";
import { seedExtraStory } from "../support/seedExtraStory.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
  orderOfAppearance,
} from "../support/verbHarness.js";

const completeStage = new CompleteStageVerb();
const completeSubtask = new CompleteSubtaskVerb();
const recordTestRun = new RecordTestRunVerb();
const reopenStage = new ReopenStageVerb();
const startStage = new StartStageVerb();

describe("the workflow-step, reopen and test-run guards", () => {
  let service: cds.Service;
  let world: SeededWorld;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  afterEach(async () => {
    await setStepKind(SUBTASK_KIND_CHANGE.STEP, SUBTASK_KIND_CHANGE.SEEDED);
  });

  /** A step closed under a stage nobody started, or ahead of its own predecessor, is work recorded out of order. */
  it("refuses a step on an unstarted stage, then a step ahead of its predecessor, changing no step", async () => {
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    const untouched = await readStepsOfStage(build.ID);

    const unstarted = expectFailure(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.GATE,
      }),
    );
    const afterUnstarted = await readStepsOfStage(build.ID);
    expectSuccess(await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }));
    for (const step of [STEP.BRIEF, STEP.RED]) {
      expectSuccess(
        await completeSubtask.run(context, {
          story: STORY_REFERENCE,
          stage: STAGE.BUILD,
          subtask: step,
        }),
      );
    }
    const beforeAhead = await readStepsOfStage(build.ID);
    const ahead = expectFailure(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.GATE,
      }),
    );
    const afterAhead = await readStepsOfStage(build.ID);

    expect(unstarted.code).toBe("wfl.subtask.stageNotStarted");
    expect(unstarted.remediation).toContain("start_stage");
    expect(afterUnstarted).toEqual(untouched);
    expect(ahead.code).toBe("wfl.subtask.predecessorOpen");
    expect(ahead.remediation).toContain(STEP.IMPLEMENT);
    expect(afterAhead).toEqual(beforeAhead);
  });

  /** A materialised conditional step blocks like a required one, and its remediation names the command that runs it. */
  it("refuses a UI story's last step while its smoke step is open, naming smoke and the build command", async () => {
    const uiStoryId = await seedExtraStory(world.initiativeId, UI_STORY);
    await setChainStates(uiStoryId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(uiStoryId, STAGE.BUILD);
    await setSubtasksComplete(build.ID, { ...STEPS_BEFORE_HANDOFF_DONE });

    const result = expectFailure(
      await completeSubtask.run(context, {
        story: UI_STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.HANDOFF,
      }),
    );

    expect(result.code).toBe("wfl.subtask.predecessorOpen");
    expect(result.remediation).toContain(STEP.SMOKE);
    expect(result.remediation).toContain("/build");
  });

  /** Every open earlier step blocks, so the refusal names all of them in order, and their one shared command once. */
  it("names every open step before handoff in order, and the shared build command once", async () => {
    expectSuccess(await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }));

    const result = expectFailure(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.HANDOFF,
      }),
    );

    expect(result.code).toBe("wfl.subtask.predecessorOpen");
    expect(orderOfAppearance(result.remediation, BLOCKING_SETS.BEFORE_HANDOFF)).toEqual([
      ...BLOCKING_SETS.BEFORE_HANDOFF,
    ]);
    expect(String(result.remediation).split("/build").length - 1).toBe(1);
  });

  /** A Recommended step never blocks, so skipping one must not strand the steps after it. */
  it("closes a step past an open step whose kind was Recommended when the chain was made", async () => {
    // The kind is frozen at instantiation, so the edit must precede the story.
    await setStepKind(SUBTASK_KIND_CHANGE.STEP, SUBTASK_KIND_CHANGE.CHANGED);
    await clearWorld();
    world = await seedCanonicalWorld();
    expectSuccess(await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }));
    for (const step of [STEP.BRIEF, STEP.RED]) {
      expectSuccess(
        await completeSubtask.run(context, {
          story: STORY_REFERENCE,
          stage: STAGE.BUILD,
          subtask: step,
        }),
      );
    }

    const result = await completeSubtask.run(context, {
      story: STORY_REFERENCE,
      stage: STAGE.BUILD,
      subtask: STEP.GATE,
    });
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    const steps = await readStepsOfStage(build.ID);

    expect(result.ok).toBe(true);
    expect(steps.find(step => step.stepCode === STEP.GATE)?.status_code).toBe("complete");
    expect(steps.find(step => step.stepCode === STEP.IMPLEMENT)?.status_code).toBe(
      "notStarted",
    );
  });

  /** A library edit after the chain exists must not loosen the guard on a step the story was created under as blocking. */
  it("still refuses a step past an open one whose library kind became Recommended after the chain was made", async () => {
    expectSuccess(await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }));
    for (const step of [STEP.BRIEF, STEP.RED]) {
      expectSuccess(
        await completeSubtask.run(context, {
          story: STORY_REFERENCE,
          stage: STAGE.BUILD,
          subtask: step,
        }),
      );
    }
    await setStepKind(SUBTASK_KIND_CHANGE.STEP, SUBTASK_KIND_CHANGE.CHANGED);

    const result = expectFailure(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.GATE,
      }),
    );

    expect(result.code).toBe("wfl.subtask.predecessorOpen");
    expect(result.remediation).toContain(STEP.IMPLEMENT);
  });

  /** A second close would overwrite when the step really finished, so it is refused and hands that time back. */
  it("refuses a step that is already complete, carrying when it completed", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    await setSubtasksComplete(build.ID, { ...BRIEF_DONE });

    const result = expectFailure(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: STEP.BRIEF,
      }),
    );
    const steps = await readStepsOfStage(build.ID);

    expect(result.code).toBe("wfl.subtask.alreadyComplete");
    expect(result.message).toContain(STEP_TIMES.brief.slice(0, 19));
    expect(steps.find(step => step.stepCode === STEP.BRIEF)?.completedAt).toBe(
      STEP_TIMES.brief,
    );
  });

  /** The open-step warning can only name a row that exists, and a backend story never had a smoke step. */
  it("warns only about the open handoff step when a backend build stage closes", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    await setSubtasksComplete(build.ID, { ...STEPS_BEFORE_HANDOFF_DONE });

    const result = expectSuccess(
      await completeStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }),
    );
    const closed = await readTaskByCode(world.milestoneId, STAGE.BUILD);

    expect(result.warnings.map(warning => warning.code)).toEqual(["verb.stage.subtasksOpen"]);
    expect(result.warnings.map(warning => warning.target)).toEqual([STEP.HANDOFF]);
    expect(closed.status_code).toBe("complete");
  });

  /** Reopening anything but a complete stage would be an ungated start, skipping the predecessor guard. */
  it("refuses to reopen a stage that is not started or still in progress, changing neither", async () => {
    await driveChainScript(service, STORY_REFERENCE, REOPEN_PRECONDITION_SCRIPT);
    const runningBefore = await readTaskByCode(world.milestoneId, STAGE.FUNCTIONAL_TEST);

    const notStarted = expectFailure(
      await reopenStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.PM_UPDATE,
        reason: PLAIN_REASON,
      }),
    );
    const running = expectFailure(
      await reopenStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.FUNCTIONAL_TEST,
        reason: PLAIN_REASON,
      }),
    );
    const pmUpdate = await readTaskByCode(world.milestoneId, STAGE.PM_UPDATE);
    const runningAfter = await readTaskByCode(world.milestoneId, STAGE.FUNCTIONAL_TEST);

    expect(notStarted.code).toBe("wfl.stage.notComplete");
    expect(running.code).toBe("wfl.stage.notComplete");
    expect(pmUpdate.status_code).toBe("notStarted");
    expect(runningAfter).toEqual(runningBefore);
  });

  /** The row carries current state only, so the history a reopen clears must survive in the log and nothing may be deleted. */
  it("reopens a complete stage to In Progress at the reopen time, deleting nothing and logging why", async () => {
    await driveChainScript(service, STORY_REFERENCE, REOPEN_PRECONDITION_SCRIPT);
    const priorCompletion = String(
      (await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY)).completedAt,
    );
    const countsBefore = await countChainRows();

    const result = expectSuccess(
      await reopenStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
        reason: REOPEN_REASON,
      }),
    );
    const reopened = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const events = await readActivityLog(world.workspaceId);
    const reopenEvents = events.filter(event => event.kind_code === "stageReopened");
    const completions = events.filter(
      event => event.kind_code === "stageCompleted" && event.target === CODE_QUALITY_TARGET,
    );

    expect(reopened.status_code).toBe("inProgress");
    expect(reopened.completedAt).toBeNull();
    expect(String(reopened.startedAt).slice(0, 19)).toBe(result.timestamp.slice(0, 19));
    expect(await countChainRows()).toEqual(countsBefore);
    expect(reopenEvents).toHaveLength(1);
    expect(reopenEvents[0].payload).toContain(REOPEN_REASON);
    expect(completions.map(event => event.occurredAt.slice(0, 19))).toContain(
      priorCompletion.slice(0, 19),
    );
  });

  /** A run filed against a stage that never started is evidence for work that did not happen. */
  it("refuses a story-mode test run on an unstarted stage, then files it once the stage starts", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const refused = expectFailure(
      await recordTestRun.run(
        context,
        buildStoryTestRunInput(STORY_REFERENCE, STAGE.TEST_QUALITY),
      ),
    );
    const runsAfterRefusal = await readTestRunsOf(world.workspaceId);
    expectSuccess(
      await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );
    expectSuccess(
      await recordTestRun.run(
        context,
        buildStoryTestRunInput(STORY_REFERENCE, STAGE.TEST_QUALITY),
      ),
    );
    const runs = await readTestRunsOf(world.workspaceId);
    const testQuality = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    expect(refused.code).toBe("wfl.testrun.stageNotStarted");
    expect(refused.remediation).toContain("start_stage");
    expect(runsAfterRefusal).toHaveLength(0);
    expect(runs).toHaveLength(1);
    expect(runs[0].task_ID).toBe(testQuality.ID);
  });

  /** A workspace-mode run has no stage, so the not-started guard has nothing to fire on even when nothing has started. */
  it("files a workspace-mode test run while every stage is still unstarted", async () => {
    expectSuccess(
      await recordTestRun.run(context, buildWorkspaceTestRunInput() as never),
    );

    expect(await readTestRunsOf(world.workspaceId)).toHaveLength(1);
  });

  /** A reopen is scoped to the named stage, so its closed steps keep their times and closing it again warns about nothing. */
  it("reopens a build stage leaving all six steps complete, then closes it with no open-step warning", async () => {
    await setChainStates(world.milestoneId, BUILD_COMPLETE);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    await setSubtasksComplete(build.ID, { ...STEP_TIMES });

    expectSuccess(
      await reopenStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        reason: BUILD_REOPEN_REASON,
      }),
    );
    const steps = await readStepsOfStage(build.ID);
    const closed = expectSuccess(
      await completeStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }),
    );

    expect(steps).toHaveLength(Object.keys(STEP_TIMES).length);
    for (const step of steps) {
      expect(step.status_code).toBe("complete");
      expect(step.completedAt).toBe(STEP_TIMES[step.stepCode as keyof typeof STEP_TIMES]);
    }
    expect(closed.warnings.map(warning => warning.code)).not.toContain(
      "verb.stage.subtasksOpen",
    );
  });
});
