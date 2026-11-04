import type cds from "@sap/cds";

import { CompleteSubtaskVerb } from "../../../../mcp/verbs/completeSubtask.js";
import { PlanSprintVerb } from "../../../../mcp/verbs/planSprint.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { ACTORS, STORY_REFERENCE, WORLD } from "../../../shared/data/world.js";
import {
  countAllMilestones,
  readDerivedMilestoneStatus,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  createMilestoneThroughService,
  seedCanonicalWorld,
  seedInitiative,
  seedSecondWorkspace,
  setChainStates,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import { buildSprintPlanInput } from "../../../shared/support/verbInputs.js";
import {
  BLOCKING_CHAIN_COMPLETE,
  BUILD_COMPLETE,
  STAGE,
  STEP,
} from "../data/chainStates.js";
import {
  BACKLOG_STORY_ID,
  DONE_STORY,
  DUPLICATE_OF_CANONICAL,
  FLAG_FALSE_STORY,
  MIGRATION_STORIES,
  STORY_EDIT_WITH_UI,
} from "../data/migrationStories.js";
import { LIBRARY_CHANGE, MATERIALISED } from "../data/seededLibrary.js";
import {
  PATHS,
  PLANNED_STORY,
  PLANNED_UI_STORY_REFERENCE,
  SECOND_INITIATIVE,
} from "../data/writePayloads.js";
import {
  addLibraryStep,
  removeLibraryStep,
  setStepKind,
} from "../support/libraryAccess.js";
import { createMilestoneExpectingRejection } from "../support/milestoneCreation.js";
import { patchExpectingSuccess } from "../support/odataHarness.js";
import {
  countStagesOf,
  countStoriesInWorkspace,
  readMilestoneIdOf,
  readStagesOf,
  readStepsOfStage,
  readStepsOfStory,
  readStoredMilestone,
  readStoryIdsWithStages,
  readStoryIdsWithSteps,
} from "../support/readChain.js";
import { seedExtraStory } from "../support/seedExtraStory.js";
import { createMigrationStories, seedMigrationSprints } from "../support/seedMigration.js";
import {
  buildVerbContext,
  expectSuccess,
  subtaskCodesOf,
} from "../support/verbHarness.js";

const completeSubtask = new CompleteSubtaskVerb();
const planSprint = new PlanSprintVerb();
const startStage = new StartStageVerb();

describe("chain instantiation", () => {
  let service: cds.Service;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
  });

  beforeEach(async () => {
    await clearWorld();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  afterEach(async () => {
    await removeLibraryStep(LIBRARY_CHANGE.ADDED_STEP.code);
    await setStepKind(LIBRARY_CHANGE.KIND_CHANGE.STEP, LIBRARY_CHANGE.KIND_CHANGE.SEEDED);
  });

  /** Only a story created in Backlog gets a chain; one finished before the register existed must not grow invented history. */
  it("gives a chain to the one migrated story created in Backlog and none to the eleven created Done", async () => {
    const sprintIds = await seedMigrationSprints();

    await createMigrationStories(sprintIds);

    expect(await countAllMilestones()).toBe(MIGRATION_STORIES.length);
    expect(await readStoryIdsWithStages()).toEqual([BACKLOG_STORY_ID]);
    expect(await readStoryIdsWithSteps()).toEqual([BACKLOG_STORY_ID]);
  });

  /** False must mean exactly what absent means, or a caller that sends the default gets a different story. */
  it("treats a creation flag sent as false the same as one left out", async () => {
    const world = await seedCanonicalWorld();

    const flagFalseId = await seedExtraStory(world.initiativeId, FLAG_FALSE_STORY);

    expect(await countStagesOf(flagFalseId)).toBe(MATERIALISED.BACKEND_STAGES.length);
  });

  /** A story created Done is chainless, and chainless must read Done rather than an undefined status. */
  it("leaves a story created Done chainless and derives it Done", async () => {
    const world = await seedCanonicalWorld();

    const doneId = await seedExtraStory(world.initiativeId, DONE_STORY);

    expect(await countStagesOf(doneId)).toBe(0);
    expect(await readDerivedMilestoneStatus(service, doneId)).toBe("done");
  });

  /** The creation flag is an instruction to the create-handler, not a fact about the story, so it must never be stored. */
  it("stores nothing for the creation flag", async () => {
    const world = await seedCanonicalWorld();
    const doneId = await seedExtraStory(world.initiativeId, DONE_STORY);

    const stored = await readStoredMilestone(doneId);

    expect(stored).toBeDefined();
    expect(Object.keys(stored)).not.toContain("createdDone");
  });

  /** A backend story's chain is every step but the UI ones, in library order, and nothing has started on it. */
  it("materialises eight stages and six steps for a backend story, in order, all Not Started", async () => {
    const world = await seedCanonicalWorld();

    const stages = await readStagesOf(world.milestoneId);
    const steps = await readStepsOfStory(world.milestoneId);

    expect(stages.map(stage => stage.stepCode)).toEqual([...MATERIALISED.BACKEND_STAGES]);
    expect(steps.map(step => step.stepCode)).toEqual([...MATERIALISED.BACKEND_SUBTASKS]);
    expect(new Set(stages.map(stage => stage.status_code))).toEqual(new Set(["notStarted"]));
    expect(new Set(steps.map(step => step.status_code))).toEqual(new Set(["notStarted"]));
  });

  /** A skipped step is no row at all; a row in some skipped state is one the open-step warning could still name. */
  it("writes no row for a stage or step whose predicate fails", async () => {
    const world = await seedCanonicalWorld();

    const stages = await readStagesOf(world.milestoneId);
    const steps = await readStepsOfStory(world.milestoneId);

    expect(stages.filter(stage => stage.stepCode === STAGE.UX_TEST)).toHaveLength(0);
    expect(steps.filter(step => step.stepCode === "smoke")).toHaveLength(0);
  });

  /** A story that ships UI carries the UI stage and the smoke step, or it commits without either ever running. */
  it("materialises the full chain for a story planned with UI", async () => {
    const world = await seedCanonicalWorld();

    expectSuccess(await planSprint.run(context, buildSprintPlanInput() as never));
    const uiId = await readMilestoneIdOf(world.workspaceId, PLANNED_STORY.UI.id);

    expect((await readStagesOf(uiId)).map(stage => stage.stepCode)).toEqual([
      ...MATERIALISED.UI_STAGES,
    ]);
    expect((await readStepsOfStory(uiId)).map(step => step.stepCode)).toEqual([
      ...MATERIALISED.UI_SUBTASKS,
    ]);
  });

  /** Planning never sends the creation flag, so every story it plans is Backlog and gets its chain. */
  it("gives every story a sprint plan creates its chain", async () => {
    const world = await seedCanonicalWorld();

    expectSuccess(await planSprint.run(context, buildSprintPlanInput() as never));
    const backendId = await readMilestoneIdOf(world.workspaceId, PLANNED_STORY.BACKEND.id);

    expect(await countStagesOf(backendId)).toBe(MATERIALISED.BACKEND_STAGES.length);
  });

  /** Starting a stage is the moment its conditional steps matter, so the answer has to say which ones this story has. */
  it("answers a stage start with the stage's materialised steps in position order", async () => {
    await seedCanonicalWorld();
    expectSuccess(await planSprint.run(context, buildSprintPlanInput() as never));

    const result = expectSuccess(
      await startStage.run(context, {
        story: PLANNED_UI_STORY_REFERENCE,
        stage: STAGE.BUILD,
      }),
    );

    expect(subtaskCodesOf(result)).toEqual([...MATERIALISED.UI_SUBTASKS]);
  });

  /** A backend story has no smoke row, so the start must list its own rows and handoff must close behind coverage alone. */
  it("answers a backend build start with its six steps, then closes each in order through handoff", async () => {
    const world = await seedCanonicalWorld();

    const started = expectSuccess(
      await startStage.run(context, { story: STORY_REFERENCE, stage: STAGE.BUILD }),
    );
    for (const step of MATERIALISED.BACKEND_SUBTASKS) {
      expectSuccess(
        await completeSubtask.run(context, {
          story: STORY_REFERENCE,
          stage: STAGE.BUILD,
          subtask: step,
        }),
      );
    }
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    const steps = await readStepsOfStage(build.ID);

    expect(subtaskCodesOf(started)).toEqual([...MATERIALISED.BACKEND_SUBTASKS]);
    expect(steps.map(step => step.stepCode)).toEqual([...MATERIALISED.BACKEND_SUBTASKS]);
    expect(new Set(steps.map(step => step.status_code))).toEqual(new Set(["complete"]));
    expect(steps.at(-1)?.stepCode).toBe(STEP.HANDOFF);
  });

  /** A chain is made at creation and at no other time, so an edit must neither rebuild one nor invent one for a story created Done. */
  it("leaves every chain untouched when a story is edited, including one created Done", async () => {
    const world = await seedCanonicalWorld();
    const doneId = await seedExtraStory(world.initiativeId, DONE_STORY);

    await patchExpectingSuccess(`${PATHS.MILESTONES}(${world.milestoneId})`, {
      ...STORY_EDIT_WITH_UI,
    });
    await patchExpectingSuccess(`${PATHS.MILESTONES}(${doneId})`, { ...STORY_EDIT_WITH_UI });
    const stages = await readStagesOf(world.milestoneId);

    expect(stages).toHaveLength(MATERIALISED.BACKEND_STAGES.length);
    expect(stages.filter(stage => stage.stepCode === STAGE.UX_TEST)).toHaveLength(0);
    expect(await countStagesOf(doneId)).toBe(0);
  });

  /** Only the build stage carries steps, so any other stage's start must answer an empty list rather than a sibling's. */
  it("answers a start of a stage with no steps with an empty list", async () => {
    const world = await seedCanonicalWorld();
    await setChainStates(world.milestoneId, BUILD_COMPLETE);

    const result = expectSuccess(
      await startStage.run(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    );

    expect(result.subtasks).toEqual([]);
  });

  /** A story exists once per workspace; a second create anywhere in it would be a second chain for the same object. */
  it("refuses a live identifier in another sprint of the workspace and never refreshes the chain", async () => {
    const world = await seedCanonicalWorld();
    const secondSprintId = await seedInitiative(world.workspaceId, { ...SECOND_INITIATIVE });
    const before = (await readStagesOf(world.milestoneId)).map(stage => ({
      stepCode: stage.stepCode,
      stepKind: stage.stepKind,
    }));

    const refused = await createMilestoneExpectingRejection({
      ...DUPLICATE_OF_CANONICAL,
      initiative_ID: secondSprintId,
    });
    await addLibraryStep({ ...LIBRARY_CHANGE.ADDED_STEP });
    await setStepKind(LIBRARY_CHANGE.KIND_CHANGE.STEP, LIBRARY_CHANGE.KIND_CHANGE.CHANGED);
    const after = (await readStagesOf(world.milestoneId)).map(stage => ({
      stepCode: stage.stepCode,
      stepKind: stage.stepKind,
    }));

    expect(refused.status).toBe(409);
    expect(refused.key).toBe("verb.story.duplicate");
    expect(await countStoriesInWorkspace(world.workspaceId, WORLD.STORY.storyId)).toBe(1);
    expect(after).toEqual(before);
  });

  /** Reading the kind live from the library is how a shipped story turned itself back to In Progress when a stage was made Required. */
  it("keeps a stage's stored kind and a Done story's status when its library step changes kind", async () => {
    const world = await seedCanonicalWorld();
    await setChainStates(world.milestoneId, BLOCKING_CHAIN_COMPLETE);
    const statusBefore = await readDerivedMilestoneStatus(service, world.milestoneId);

    await setStepKind(LIBRARY_CHANGE.KIND_CHANGE.STEP, LIBRARY_CHANGE.KIND_CHANGE.CHANGED);
    const stages = await readStagesOf(world.milestoneId);
    const changed = stages.find(stage => stage.stepCode === LIBRARY_CHANGE.KIND_CHANGE.STEP);

    expect(statusBefore).toBe("done");
    expect(changed?.status_code).toBe("notStarted");
    expect(changed?.stepKind).toBe(LIBRARY_CHANGE.KIND_CHANGE.SEEDED);
    expect(await readDerivedMilestoneStatus(service, world.milestoneId)).toBe("done");
  });

  /** The uniqueness is per workspace, not global: two workspaces may each hold the same identifier, each with its own chain. */
  it("accepts a live identifier in a different workspace and gives it its own chain", async () => {
    await seedCanonicalWorld();
    const otherWorkspaceId = await seedSecondWorkspace();
    const otherSprintId = await seedInitiative(otherWorkspaceId, { ...SECOND_INITIATIVE });

    const otherId = await createMilestoneThroughService({
      ...DUPLICATE_OF_CANONICAL,
      initiative_ID: otherSprintId,
    });

    expect(await countStagesOf(otherId)).toBe(MATERIALISED.BACKEND_STAGES.length);
  });
});
