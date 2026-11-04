import type cds from "@sap/cds";

import { CompleteSubtaskVerb } from "../../../../mcp/verbs/completeSubtask.js";
import { LogDefectVerb } from "../../../../mcp/verbs/logDefect.js";
import { PlanSprintVerb } from "../../../../mcp/verbs/planSprint.js";
import { RecordDecisionVerb } from "../../../../mcp/verbs/recordDecision.js";
import { RecordTestRunVerb } from "../../../../mcp/verbs/recordTestRun.js";
import { ResolveDefectVerb } from "../../../../mcp/verbs/resolveDefect.js";
import {
  ACTORS,
  BAD_SEVERITY,
  DECISION_INPUT,
  DECISION_WITHOUT_OPTIONS,
  DEFECT_INPUT,
  DEFECT_RESOLUTION,
  DEFECT_RESOLUTION_REWRITE,
  DEFECT_WITHOUT_REFERENCES,
  INVALID_EXECUTED_AT,
  MINIMAL_TEST_RUN_METRICS,
  OFFSET_EXECUTED_AT,
  OVER_TOTAL_TEST_RUN_METRICS,
  OVER_TOTAL_TEST_RUN_MESSAGE,
  SPRINT_PLAN,
  SPRINT_PLAN_FAILING_MIDWAY,
  SPRINT_PLAN_WITH_DUPLICATE_STORY,
  SPRINT_PLAN_WITH_REPEATED_STORY,
  STORY_REFERENCE,
  TEST_RUN_EXECUTED_AT,
  TEST_RUN_METRICS,
  UNRESOLVABLE,
  WORLD,
} from "../../../shared/data/world.js";
import {
  countAllMilestones,
  countDefectsOf,
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
  buildStageWithoutStoryTestRunInput,
  buildStoryTestRunInput,
  buildWorkspaceTestRunInput,
  buildWorkspaceTestRunInputWithMetrics,
} from "../../../shared/support/verbInputs.js";
import { BUILD_IN_PROGRESS, FIRST_STEP, STAGE } from "../data/chainStates.js";
import { countChainRows } from "../support/readChain.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

const completeSubtask = new CompleteSubtaskVerb();
const logDefect = new LogDefectVerb();
const planSprint = new PlanSprintVerb();
const recordDecision = new RecordDecisionVerb();
const recordTestRun = new RecordTestRunVerb();
const resolveDefect = new ResolveDefectVerb();

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
      await logDefect.run(context, { story: STORY_REFERENCE, ...DEFECT_INPUT }),
    );
    const defectId = logged.defectId as string;

    const refused = expectFailure(
      await resolveDefect.run(context, { defect: defectId, resolution: "" }),
    );
    const stillOpen = await readDefectById(defectId);
    expectSuccess(
      await resolveDefect.run(context, {
        defect: defectId,
        resolution: DEFECT_RESOLUTION,
      }),
    );
    const closed = await readDefectById(defectId);
    const events = await readActivityLog(world.workspaceId);

    expect(refused.status).toBe(400);
    expect(refused.code).toBe("verb.defect.resolutionRequired");
    expect(stillOpen.status_code).toBe("Open");
    expect(closed.status_code).toBe("Closed");
    expect(closed.resolution).toBe(DEFECT_RESOLUTION);
    expect(events.map(event => event.kind_code)).toEqual([
      "defectLogged",
      "defectResolved",
    ]);
  });

  /** A raw "{0}" and no target left the caller unable to tell which sprint name collided. */
  it("refuses a duplicate sprint name, naming the sprint as message and target", async () => {
    const result = expectFailure(
      await planSprint.run(context, {
        ...buildSprintPlanInput(),
        name: WORLD.INITIATIVE.name,
      } as never),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.initiative.duplicate");
    expect(result.message).toContain(`"${WORLD.INITIATIVE.name}"`);
    expect(result.message).not.toContain("{0}");
    expect(result.target).toBe(WORLD.INITIATIVE.name);
    expect(result.retryable).toBeUndefined();
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
  });

  /** A sprint and its stories are one act, so the register must record one event and not four. */
  it("creates a sprint with its stories and emits one event", async () => {
    const result = expectSuccess(
      await planSprint.run(context, buildSprintPlanInput() as never),
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
      await planSprint.run(
        context,
        buildSprintPlanInput([...SPRINT_PLAN_WITH_DUPLICATE_STORY]) as never,
      ),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.story.duplicate");
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
  });

  /** The same identifier twice in one plan breaks per-workspace addressing just as surely. */
  it("refuses a plan that carries one story identifier twice", async () => {
    const result = expectFailure(
      await planSprint.run(
        context,
        buildSprintPlanInput([...SPRINT_PLAN_WITH_REPEATED_STORY]) as never,
      ),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.story.duplicate");
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
  });

  /** A plan is one act: dying on story two must leave no sprint, or the register holds an orphan. */
  it("rolls the whole plan back when a later story cannot be written", async () => {
    const before = await countAllMilestones();
    const chainBefore = await countChainRows();

    const result = expectFailure(
      await planSprint.run(
        context,
        buildSprintPlanInput([...SPRINT_PLAN_FAILING_MIDWAY]) as never,
      ),
    );

    expect(result.status).toBe(400);
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
    expect(await countAllMilestones()).toBe(before);
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
    expect(await countChainRows()).toEqual(chainBefore);
  });

  /** A severity outside the code list must be refused, or the register groups defects it cannot. */
  it("refuses a defect whose severity is outside the code list", async () => {
    const result = expectFailure(
      await logDefect.run(context, {
        story: STORY_REFERENCE,
        ...DEFECT_INPUT,
        severity: BAD_SEVERITY,
      }),
    );

    expect(result.status).toBe(400);
    expect(await countDefectsOf(world.workspaceId)).toBe(0);
  });

  /** A defect must carry exactly one scope, or there is nothing to resolve it against. */
  it("refuses a defect with neither scope and one with both", async () => {
    const neither = expectFailure(
      await logDefect.run(context, { ...DEFECT_INPUT }),
    );
    const both = expectFailure(
      await logDefect.run(context, {
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
      await logDefect.run(context, {
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
      await recordDecision.run(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_INPUT,
      }),
    );
    const onStory = expectSuccess(
      await recordDecision.run(context, {
        target: STORY_REFERENCE,
        ...DECISION_INPUT,
      }),
    );
    const onSprint = expectSuccess(
      await recordDecision.run(context, {
        target: `${WORLD.WORKSPACE.slug}/${WORLD.INITIATIVE.name}`,
        ...DECISION_INPUT,
      }),
    );

    const workspaceRow = await readDecisionById(onWorkspace.decisionId as string);
    const storyRow = await readDecisionById(onStory.decisionId as string);
    const sprintRow = await readDecisionById(onSprint.decisionId as string);
    const events = await readActivityLog(world.workspaceId);

    expect(events.map(event => event.kind_code)).toEqual([
      "decisionRecorded",
      "decisionRecorded",
      "decisionRecorded",
    ]);
    expect(workspaceRow.milestone_ID).toBeNull();
    expect(workspaceRow.initiative_ID).toBeNull();
    expect(storyRow.milestone_ID).toBe(world.milestoneId);
    expect(sprintRow.initiative_ID).toBe(world.initiativeId);
  });

  /** A target that resolves to neither a story nor a sprint must be refused, naming both kinds it could have been. */
  it("refuses a decision target that resolves to nothing", async () => {
    const result = expectFailure(
      await recordDecision.run(context, {
        target: `${WORLD.WORKSPACE.slug}/${UNRESOLVABLE.DECISION_TARGET}`,
        ...DECISION_INPUT,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.target.notFound");
    expect(result.message).toContain(
      `Valid codes: ${WORLD.STORY.storyId}, ${WORLD.INITIATIVE.name}.`,
    );
  });

  /** A run recorded against a stage and one recorded against a sprint are different rows, not the same one twice. */
  it("records a test run in story mode and in workspace mode", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);

    expectSuccess(
      await recordTestRun.run(
        context,
        buildStoryTestRunInput(STORY_REFERENCE, STAGE.BUILD),
      ),
    );
    expectSuccess(
      await recordTestRun.run(context, buildWorkspaceTestRunInput() as never),
    );
    const runs = await readTestRunsOf(world.workspaceId);
    const events = await readActivityLog(world.workspaceId);

    expect(runs).toHaveLength(2);
    expect(runs.filter(run => run.task_ID !== null)).toHaveLength(1);
    expect(runs.filter(run => run.initiative_ID !== null)).toHaveLength(1);
    expect(events.map(event => event.kind_code)).toEqual([
      "testRunRecorded",
      "testRunRecorded",
    ]);
  });

  /** The optional halves of a register row are optional, so leaving them out must still write a row. */
  it("writes a defect with no references, a decision with no options and a bare run", async () => {
    const defect = expectSuccess(
      await logDefect.run(context, {
        story: STORY_REFERENCE,
        ...DEFECT_WITHOUT_REFERENCES,
      }),
    );
    const decision = expectSuccess(
      await recordDecision.run(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_WITHOUT_OPTIONS,
      }),
    );
    expectSuccess(
      await recordTestRun.run(context, buildWorkspaceTestRunInput(true) as never),
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
      await logDefect.run(context, {
        workspace: WORLD.WORKSPACE.slug,
        ...DEFECT_INPUT,
      }),
    );
    const run = expectFailure(
      await recordTestRun.run(context, buildWorkspaceTestRunInput() as never),
    );

    expect(defect.status).toBe(404);
    expect(defect.code).toBe("verb.sprint.noneActive");
    expect(defect.message).toContain(WORLD.WORKSPACE.slug);
    expect(run.status).toBe(404);
    expect(run.code).toBe("verb.sprint.noneActive");
  });

  /** A story without a stage names a target that does not exist, so it must be refused rather than widened. */
  it("refuses a test run scoped to a story with no stage", async () => {
    const result = expectFailure(
      await recordTestRun.run(context, {
        story: STORY_REFERENCE,
        metrics: { ...TEST_RUN_METRICS },
        executedAt: TEST_RUN_EXECUTED_AT,
      }),
    );

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.testrun.scopeRequired");
  });

  /** A run claiming more outcomes than tests was written as a gate figure, so it must be refused whole. */
  it("refuses a test run whose counts exceed its total and writes nothing", async () => {
    const result = expectFailure(
      await recordTestRun.run(
        context,
        buildWorkspaceTestRunInputWithMetrics(OVER_TOTAL_TEST_RUN_METRICS),
      ),
    );
    const runs = await readTestRunsOf(world.workspaceId);
    const events = await readActivityLog(world.workspaceId);

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.testrun.countsExceedTotal");
    expect(result.message).toBe(OVER_TOTAL_TEST_RUN_MESSAGE);
    expect(runs).toHaveLength(0);
    expect(events).toEqual([]);
  });

  /** The mirror case: a stage with no story must be refused, never silently filed to the sprint. */
  it("refuses a test run naming a stage without its story", async () => {
    const result = expectFailure(
      await recordTestRun.run(
        context,
        buildStageWithoutStoryTestRunInput(STAGE.BUILD),
      ),
    );
    const runs = await readTestRunsOf(world.workspaceId);

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.testrun.scopeRequired");
    expect(runs).toHaveLength(0);
  });

  /** An offset timestamp names one instant; storing its wall-clock digits as UTC would be another. */
  it("normalises an offset executedAt to UTC and refuses an unparseable one", async () => {
    expectSuccess(
      await recordTestRun.run(context, {
        workspace: WORLD.WORKSPACE.slug,
        metrics: { ...TEST_RUN_METRICS },
        executedAt: OFFSET_EXECUTED_AT.SUPPLIED,
      }),
    );
    const refused = expectFailure(
      await recordTestRun.run(context, {
        workspace: WORLD.WORKSPACE.slug,
        metrics: { ...TEST_RUN_METRICS },
        executedAt: INVALID_EXECUTED_AT,
      }),
    );
    const runs = await readTestRunsOf(world.workspaceId);

    expect(runs).toHaveLength(1);
    expect(String(runs[0].executedAt)).toContain(
      OFFSET_EXECUTED_AT.STORED.slice(0, 19),
    );
    expect(refused.status).toBe(400);
    expect(refused.code).toBe("verb.timestamp.invalid");
  });

  /** The register row and the envelope must agree on when the decision landed. */
  it("stores the explicit decidedAt the verb writes", async () => {
    const result = expectSuccess(
      await recordDecision.run(context, {
        target: WORLD.WORKSPACE.slug,
        ...DECISION_INPUT,
      }),
    );
    const row = await readDecisionById(result.decisionId as string);

    expect(String(row.decidedAt)).toContain(
      String(result.timestamp).slice(0, 19),
    );
  });

  /** Closing a workflow step has to be recorded, or the open-step warning can never clear. */
  it("closes one workflow step and records it", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);

    expectSuccess(
      await completeSubtask.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
        subtask: FIRST_STEP,
      }),
    );
    const step = await readSubtaskByCode(build.ID, FIRST_STEP);
    const events = await readActivityLog(world.workspaceId);

    expect(step.status_code).toBe("complete");
    expect(step.completedAt).toBeTruthy();
    expect(events[0].kind_code).toBe("subtaskCompleted");
  });

  /** A step outside the stage's materialised set must be refused, or a warning could name a row that is not there. */
  it("refuses a workflow step that was never materialised", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);

    const result = expectFailure(
      await completeSubtask.run(context, {
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
      await resolveDefect.run(context, {
        defect: UNRESOLVABLE.DEFECT,
        resolution: DEFECT_RESOLUTION,
      }),
    );

    expect(result.status).toBe(404);
    expect(result.code).toBe("verb.defect.notFound");
    expect(result.target).toBe(UNRESOLVABLE.DEFECT);
    expect(result.message).toContain(UNRESOLVABLE.DEFECT);
    expect(result.message).not.toContain("Valid codes");
  });

  /** A second close would rewrite the stored resolution and log the resolution twice, which is rewriting history. */
  it("refuses to resolve a defect that is already closed and keeps the first resolution", async () => {
    const logged = expectSuccess(
      await logDefect.run(context, { story: STORY_REFERENCE, ...DEFECT_INPUT }),
    );
    const defectId = logged.defectId as string;
    expectSuccess(
      await resolveDefect.run(context, {
        defect: defectId,
        resolution: DEFECT_RESOLUTION,
      }),
    );

    const refused = expectFailure(
      await resolveDefect.run(context, {
        defect: defectId,
        resolution: DEFECT_RESOLUTION_REWRITE,
      }),
    );
    const stored = await readDefectById(defectId);
    const events = await readActivityLog(world.workspaceId);

    expect(refused.status).toBe(409);
    expect(refused.code).toBe("verb.defect.alreadyResolved");
    expect(refused.target).toBe(defectId);
    expect(refused.message).toContain("Closed");
    expect(refused.remediation).toContain("log_defect");
    expect(stored.resolution).toBe(DEFECT_RESOLUTION);
    expect(events.map(event => event.kind_code)).toEqual([
      "defectLogged",
      "defectResolved",
    ]);
  });
});
