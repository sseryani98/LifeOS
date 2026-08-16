import type cds from "@sap/cds";

import { completeSubtask } from "../../../../mcp/verbs/completeSubtask.js";
import { logDefect } from "../../../../mcp/verbs/logDefect.js";
import { planSprint } from "../../../../mcp/verbs/planSprint.js";
import { recordDecision } from "../../../../mcp/verbs/recordDecision.js";
import { recordTestRun } from "../../../../mcp/verbs/recordTestRun.js";
import { resolveDefect } from "../../../../mcp/verbs/resolveDefect.js";
import {
  ACTORS,
  DECISION_INPUT,
  DECISION_WITHOUT_OPTIONS,
  DEFECT_INPUT,
  DEFECT_RESOLUTION,
  DEFECT_WITHOUT_REFERENCES,
  MINIMAL_TEST_RUN_METRICS,
  SPRINT_PLAN,
  SPRINT_PLAN_WITH_DUPLICATE_STORY,
  STORY_REFERENCE,
  TEST_RUN_EXECUTED_AT,
  TEST_RUN_METRICS,
  UNRESOLVABLE,
  WORLD,
} from "../../../shared/data/world.js";
import {
  countInitiativesOf,
  readActivityLog,
  readDecisionById,
  readDefectById,
  readStoriesOf,
  readSubtaskByCode,
  readTaskByCode,
  readTestRunsOf,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  setInitiativeStatus,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  buildSprintPlanInput,
  buildStoryTestRunInput,
  buildWorkspaceTestRunInput,
} from "../../../shared/support/verbInputs.js";
import { BUILD_IN_PROGRESS, OPEN_STEP, STAGE } from "../data/chainStates.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

describe("registers", () => {
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

  /** A closed defect with no resolution is exactly the state the register exists to prevent. */
  it("refuses to close a defect without a resolution, then closes it with one", async () => {
    const logged = expectSuccess(
      await logDefect(context, { story: STORY_REFERENCE, ...DEFECT_INPUT }),
    );
    const defectId = logged.defectId as string;

    const refused = expectFailure(
      await resolveDefect(context, { defect: defectId, resolution: "" }),
    );
    const stillOpen = await readDefectById(defectId);
    expectSuccess(
      await resolveDefect(context, {
        defect: defectId,
        resolution: DEFECT_RESOLUTION,
      }),
    );
    const closed = await readDefectById(defectId);

    expect(refused.status).toBe(400);
    expect(refused.code).toBe("verb.defect.resolutionRequired");
    expect(stillOpen.status_code).toBe("Open");
    expect(closed.status_code).toBe("Closed");
    expect(closed.resolution).toBe(DEFECT_RESOLUTION);
  });

  /** A sprint and its stories are one act, so the register must record one event and not four. */
  it("creates a sprint with its stories and emits one event", async () => {
    const result = expectSuccess(
      await planSprint(context, buildSprintPlanInput() as never),
    );
    const stories = await readStoriesOf(result.initiativeId as string);
    const events = await readActivityLog(world.workspaceId);

    expect(await countInitiativesOf(world.workspaceId)).toBe(2);
    expect(stories).toHaveLength(SPRINT_PLAN.stories.length);
    expect(stories.map(story => story.fricewType_code).sort()).toEqual([
      "Enhancement",
      "Form",
      "Report",
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].kind_code).toBe("sprintPlanned");
  });

  /** A story ID already live in the workspace must be refused, or two stories share one address. */
  it("refuses a plan that reuses a story ID already in the workspace", async () => {
    const result = expectFailure(
      await planSprint(
        context,
        buildSprintPlanInput([...SPRINT_PLAN_WITH_DUPLICATE_STORY]) as never,
      ),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.story.duplicate");
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
  });

  /** A defect must carry exactly one scope, or there is nothing to resolve it against. */
  it("refuses a defect with neither scope and one with both", async () => {
    const neither = expectFailure(
      await logDefect(context, { ...DEFECT_INPUT }),
    );
    const both = expectFailure(
      await logDefect(context, {
        story: STORY_REFERENCE,
        workspace: WORLD.WORKSPACE.slug,
        ...DEFECT_INPUT,
      }),
    );

    expect(neither.code).toBe("verb.defect.scopeRequired");
    expect(both.code).toBe("verb.defect.scopeRequired");
  });

  /** The ad-hoc entry point has no story, so a workspace-scoped defect must reach the active sprint. */
  it("scopes a workspace-mode defect to the active sprint", async () => {
    const result = expectSuccess(
      await logDefect(context, {
        workspace: WORLD.WORKSPACE.slug,
        ...DEFECT_INPUT,
      }),
    );
    const defect = await readDefectById(result.defectId as string);

    expect(defect.milestone_ID).toBeNull();
    expect(defect.initiative_ID).toBe(world.initiativeId);
  });

  /** A decision with no inner target belongs to the workspace itself, which is a legal target. */
  it("records a decision against the workspace, the sprint and a story", async () => {
    const onWorkspace = expectSuccess(
      await recordDecision(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_INPUT,
      }),
    );
    const onStory = expectSuccess(
      await recordDecision(context, {
        target: STORY_REFERENCE,
        ...DECISION_INPUT,
      }),
    );
    const onSprint = expectSuccess(
      await recordDecision(context, {
        target: `${WORLD.WORKSPACE.slug}/${WORLD.INITIATIVE.name}`,
        ...DECISION_INPUT,
      }),
    );

    const workspaceRow = await readDecisionById(onWorkspace.decisionId as string);
    const storyRow = await readDecisionById(onStory.decisionId as string);
    const sprintRow = await readDecisionById(onSprint.decisionId as string);

    expect(workspaceRow.milestone_ID).toBeNull();
    expect(workspaceRow.initiative_ID).toBeNull();
    expect(storyRow.milestone_ID).toBe(world.milestoneId);
    expect(sprintRow.initiative_ID).toBe(world.initiativeId);
  });

  /** A target that resolves to neither a story nor a sprint must be refused, not written to the workspace. */
  it("refuses a decision target that resolves to nothing", async () => {
    const result = expectFailure(
      await recordDecision(context, {
        target: `${WORLD.WORKSPACE.slug}/${UNRESOLVABLE.DECISION_TARGET}`,
        ...DECISION_INPUT,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
  });

  /** A run recorded against a stage and one recorded against a sprint are different rows, not the same one twice. */
  it("records a test run in story mode and in workspace mode", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);

    expectSuccess(
      await recordTestRun(
        context,
        buildStoryTestRunInput(STORY_REFERENCE, STAGE.BUILD),
      ),
    );
    expectSuccess(
      await recordTestRun(context, buildWorkspaceTestRunInput() as never),
    );
    const runs = await readTestRunsOf(world.workspaceId);

    expect(runs).toHaveLength(2);
    expect(runs.filter(run => run.task_ID !== null)).toHaveLength(1);
    expect(runs.filter(run => run.initiative_ID !== null)).toHaveLength(1);
  });

  /** The optional halves of a register row are optional, so leaving them out must still write a row. */
  it("writes a defect with no references, a decision with no options and a bare run", async () => {
    const defect = expectSuccess(
      await logDefect(context, {
        story: STORY_REFERENCE,
        ...DEFECT_WITHOUT_REFERENCES,
      }),
    );
    const decision = expectSuccess(
      await recordDecision(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_WITHOUT_OPTIONS,
      }),
    );
    expectSuccess(
      await recordTestRun(context, buildWorkspaceTestRunInput(true) as never),
    );
    const runs = await readTestRunsOf(world.workspaceId);

    expect(await readDefectById(defect.defectId as string)).toBeTruthy();
    expect(await readDecisionById(decision.decisionId as string)).toBeTruthy();
    expect(runs).toHaveLength(1);
    expect(runs[0].total).toBe(MINIMAL_TEST_RUN_METRICS.total);
  });

  /** Workspace mode hangs off the active sprint, so a workspace with none must say so rather than orphan the row. */
  it("refuses a workspace-scoped write when no sprint is active", async () => {
    await setInitiativeStatus(world.initiativeId, "Complete");

    const defect = expectFailure(
      await logDefect(context, {
        workspace: WORLD.WORKSPACE.slug,
        ...DEFECT_INPUT,
      }),
    );
    const run = expectFailure(
      await recordTestRun(context, buildWorkspaceTestRunInput() as never),
    );

    expect(defect.status).toBe(404);
    expect(run.status).toBe(404);
  });

  /** A story without a stage names a target that does not exist, so it must be refused rather than widened. */
  it("refuses a test run scoped to a story with no stage", async () => {
    const result = expectFailure(
      await recordTestRun(context, {
        story: STORY_REFERENCE,
        metrics: { ...TEST_RUN_METRICS },
        executedAt: TEST_RUN_EXECUTED_AT,
      }),
    );

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.testrun.scopeRequired");
  });

  /** Closing a workflow step has to be recorded, or the open-step warning can never clear. */
  it("closes one workflow step and records it", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);

    expectSuccess(
      await completeSubtask(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: OPEN_STEP,
      }),
    );
    const step = await readSubtaskByCode(build.ID, OPEN_STEP);
    const events = await readActivityLog(world.workspaceId);

    expect(step.status_code).toBe("complete");
    expect(step.completedAt).toBeTruthy();
    expect(events[0].kind_code).toBe("subtaskCompleted");
  });

  /** A step outside the stage's materialised set must be refused, or a warning could name a row that is not there. */
  it("refuses a workflow step that was never materialised", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);

    const result = expectFailure(
      await completeSubtask(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: "smoke",
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
  });

  /** A defect that does not exist must be refused rather than created on the way to being closed. */
  it("refuses to resolve a defect that does not exist", async () => {
    const result = expectFailure(
      await resolveDefect(context, {
        defect: UNRESOLVABLE.DEFECT,
        resolution: DEFECT_RESOLUTION,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
  });
});
