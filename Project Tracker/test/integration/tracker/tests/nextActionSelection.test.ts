import type cds from "@sap/cds";

import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { NextActionVerb } from "../../../../mcp/verbs/nextAction.js";
import { ProjectViewVerb } from "../../../../mcp/verbs/projectView.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { ACTORS } from "../../../shared/data/world.js";
import { clearWorld, setChainStates } from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  BLOCKING_CHAIN_COMPLETE,
  BUILD_IN_PROGRESS,
  COMMIT_LAST_OPEN,
  STAGE,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import { BACKLOG_STORY_ID } from "../data/migrationStories.js";
import {
  EXPECTED_PLANNED_STORY_POSITIONS,
  EXPECTED_SPRINT_POSITIONS,
  PLANNED_REFERENCE,
  PLANNED_STORY_ID,
  STEP_FACTS,
  UI_ONLY_PLAN_STORIES,
} from "../data/nextActionCases.js";
import {
  MIGRATED_REFERENCE,
  STEP_KIND,
  TASK_STATUS,
  TIER,
} from "../data/nextActionWorld.js";
import {
  PLANNED_BACKEND_RESUMED,
  PLANNED_BACKEND_STORY_ID,
  RESUMED_FIRST_QUEUE,
  RESUMED_FIRST_TIERS,
} from "../data/projectViewSections.js";
import { PLANNED_UI_STORY_REFERENCE } from "../data/writePayloads.js";
import { planSprintWith, readStoryPositionsOf } from "../support/nextActionCalls.js";
import { readMilestoneIdOf } from "../support/readChain.js";
import {
  nextActionOf,
  viewNextActionOf,
  viewQueueOf,
} from "../support/readNextAction.js";
import { rowKeysOf, tiersByStoryOf } from "../support/readSections.js";
import {
  readSprintPositions,
  seedCandidateWorld,
  seedMigratedWorkspace,
} from "../support/seedCandidateWorld.js";
import { buildVerbContext, expectSuccess } from "../support/verbHarness.js";

const completeStage = new CompleteStageVerb();
const nextAction = new NextActionVerb();
const projectView = new ProjectViewVerb();
const startStage = new StartStageVerb();

describe("the next action across a workspace", () => {
  let service: cds.Service;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
  });

  /** Tier is the first sort key, so fresh work in a later sprint must beat optional work in an earlier one. */
  it("ranks a later sprint's fresh story above an earlier sprint's residual optional stage", async () => {
    const world = await seedMigratedWorkspace();
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BLOCKING_CHAIN_COMPLETE);
    await planSprintWith(service, UI_ONLY_PLAN_STORIES);

    const result = expectSuccess(await nextAction.run(context, {}));

    expect(nextActionOf(result)).toMatchObject({
      story: PLANNED_UI_STORY_REFERENCE,
      stepCode: STEP_FACTS.BUILD.code,
      tier: TIER.FRESH,
    });
  });

  /** Within one tier the sprint's position decides, and both positions come from the order the plan was given in. */
  it("positions a planned sprint after the migrated ones and lets the earlier sprint win the tie", async () => {
    const world = await seedCandidateWorld(service);

    const sprints = await readSprintPositions(world.workspaceId);
    const planned = await readStoryPositionsOf(world.plannedSprintId);
    const result = expectSuccess(await nextAction.run(context, {}));

    expect(sprints).toMatchObject(EXPECTED_SPRINT_POSITIONS);
    expect(planned).toEqual(EXPECTED_PLANNED_STORY_POSITIONS);
    expect(nextActionOf(result)).toMatchObject({
      story: MIGRATED_REFERENCE.BACKLOG,
      stepCode: STEP_FACTS.BUILD.code,
      tier: TIER.FRESH,
    });
  });

  /** Story position is the last key, so among one sprint's fresh stories the first one planned is the answer. */
  it("picks the first-planned story when one sprint holds every fresh candidate", async () => {
    const world = await seedCandidateWorld(service);
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BLOCKING_CHAIN_COMPLETE);

    const result = expectSuccess(await nextAction.run(context, {}));

    expect(nextActionOf(result)).toMatchObject({
      story: PLANNED_REFERENCE.FIRST,
      stepCode: STEP_FACTS.BUILD.code,
      tier: TIER.FRESH,
    });
  });

  /** Resuming started work beats starting anything new, even when the started story is the last one planned. */
  it("ranks a started story above every untouched one, whatever its position", async () => {
    const world = await seedCandidateWorld(service);
    const lastPlannedId = await readMilestoneIdOf(world.workspaceId, PLANNED_STORY_ID.LAST);
    await setChainStates(lastPlannedId, BUILD_IN_PROGRESS);

    const result = expectSuccess(await nextAction.run(context, {}));

    expect(nextActionOf(result)).toMatchObject({
      story: PLANNED_REFERENCE.LAST,
      stepCode: STAGE.BUILD,
      status: TASK_STATUS.IN_PROGRESS,
      tier: TIER.RESUMING,
    });
  });

  /** "Nothing left anywhere" is a success with no payload, which a caller must be able to tell from optional work at tier 3. */
  it("answers an exhausted workspace with an empty success, unlike one with only optional work left", async () => {
    const world = await seedMigratedWorkspace();
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BLOCKING_CHAIN_COMPLETE);

    const optional = expectSuccess(await nextAction.run(context, {}));
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], WHOLE_CHAIN_COMPLETE);
    const exhausted = await nextAction.run(context, {});

    expect(nextActionOf(optional)).toMatchObject({
      stepCode: STEP_FACTS.DOCUMENTATION.code,
      kind: STEP_KIND.RECOMMENDED,
      tier: TIER.OPTIONAL_ONLY,
    });
    expect(exhausted).toMatchObject({ ok: true, nextAction: null });
  });

  /** The page and the verb must never disagree on what to do next, so both take it from the one engine. */
  it("gives project_view the same next action as next_action", async () => {
    const world = await seedCandidateWorld(service);
    const lastPlannedId = await readMilestoneIdOf(world.workspaceId, PLANNED_STORY_ID.LAST);
    await setChainStates(lastPlannedId, BUILD_IN_PROGRESS);

    const verb = nextActionOf(expectSuccess(await nextAction.run(context, {})));
    const view = viewNextActionOf(expectSuccess(await projectView.run(context, {})));

    expect(view).toEqual(verb);
    expect(view).toMatchObject({ story: PLANNED_REFERENCE.LAST, tier: TIER.RESUMING });
  });

  /** With every story fresh the sprint and story positions decide, and each path passes its own; a wrong one names another story. */
  it("gives project_view the same next action as next_action when sprint position breaks the tie", async () => {
    await seedCandidateWorld(service);

    const verb = nextActionOf(expectSuccess(await nextAction.run(context, {})));
    const view = viewNextActionOf(expectSuccess(await projectView.run(context, {})));

    expect(view).toEqual(verb);
    expect(view).toMatchObject({ story: MIGRATED_REFERENCE.BACKLOG, tier: TIER.FRESH });
  });

  /** The verb's queue is the page's queue: started work first, whatever sprint it sits in, headed by the verb's own next action. */
  it("orders project_view's task queue by tier, a resumed later story ahead of an earlier untouched one", async () => {
    const world = await seedCandidateWorld(service);
    const resumedId = await readMilestoneIdOf(world.workspaceId, PLANNED_BACKEND_STORY_ID);
    await setChainStates(resumedId, PLANNED_BACKEND_RESUMED);

    const result = expectSuccess(await projectView.run(context, {}));
    const queue = viewQueueOf(result);

    expect(rowKeysOf(queue)).toEqual(RESUMED_FIRST_QUEUE);
    expect(tiersByStoryOf(queue)).toEqual(RESUMED_FIRST_TIERS);
    expect(queue[0].story).toBe(viewNextActionOf(result)?.story);
  });
});

describe("the next action a write hands back", () => {
  let service: cds.Service;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
  });

  /** A write's answer is about the story it touched; falling back to another story would send the caller somewhere it did not ask about. */
  it("goes null when the written story is finished, though another story still has work", async () => {
    const world = await seedCandidateWorld(service);
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], COMMIT_LAST_OPEN);

    const write = expectSuccess(
      await completeStage.run(context, {
        story: MIGRATED_REFERENCE.BACKLOG,
        stage: STAGE.COMMIT,
      }),
    );
    const workspace = expectSuccess(await nextAction.run(context, {}));

    expect(nextActionOf(write)).toBeNull();
    expect(nextActionOf(workspace)).toMatchObject({ story: PLANNED_REFERENCE.FIRST });
  });

  /** A write's next action is the same payload next_action gives, so the caller can act on it without a second read. */
  it("hands back the written story's next stage with the full payload after a completion", async () => {
    const world = await seedCandidateWorld(service);
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BUILD_IN_PROGRESS);

    const write = expectSuccess(
      await completeStage.run(context, {
        story: MIGRATED_REFERENCE.BACKLOG,
        stage: STAGE.BUILD,
      }),
    );

    expect(nextActionOf(write)).toMatchObject({
      story: MIGRATED_REFERENCE.BACKLOG,
      stepCode: STAGE.CODE_QUALITY,
      kind: STEP_KIND.REQUIRED,
      status: TASK_STATUS.NOT_STARTED,
      tier: TIER.RESUMING,
    });
  });

  /** Story scope holds even when another story outranks the written one workspace-wide. */
  it("stays on the started story when an earlier sprint's story would win workspace-wide", async () => {
    const world = await seedCandidateWorld(service);
    await setChainStates(world.storyIds[BACKLOG_STORY_ID], BUILD_IN_PROGRESS);

    const write = expectSuccess(
      await startStage.run(context, {
        story: PLANNED_REFERENCE.FIRST,
        stage: STAGE.BUILD,
      }),
    );

    expect(nextActionOf(write)).toMatchObject({
      story: PLANNED_REFERENCE.FIRST,
      stepCode: STAGE.BUILD,
      status: TASK_STATUS.IN_PROGRESS,
      tier: TIER.RESUMING,
    });
  });
});
