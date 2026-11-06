import type cds from "@sap/cds";

import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { NextActionVerb } from "../../../../mcp/verbs/nextAction.js";
import { ReopenStageVerb } from "../../../../mcp/verbs/reopenStage.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { ACTORS, UNRESOLVABLE } from "../../../shared/data/world.js";
import {
  readActivityLog,
  readDerivedMilestoneStatus,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import { clearWorld, setChainStates } from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  BLOCKING_CHAIN_COMPLETE,
  BUILD_COMPLETE,
  BUILD_IN_PROGRESS,
  REOPEN_REASON,
  STAGE,
  THROUGH_FUNCTIONAL_TEST_COMPLETE,
  THROUGH_TEST_QUALITY_COMPLETE,
  TWO_STAGES_STARTABLE,
} from "../data/chainStates.js";
import { BACKLOG_STORY_ID } from "../data/migrationStories.js";
import { STEP_FACTS } from "../data/nextActionCases.js";
import {
  MIGRATED_REFERENCE,
  STEP_KIND,
  TASK_STATUS,
  TIER,
} from "../data/nextActionWorld.js";
import { DRIVER_CHANGE } from "../data/seededLibrary.js";
import { setStepDriver } from "../support/libraryAccess.js";
import { nextActionOf } from "../support/readNextAction.js";
import {
  seedMigratedWorkspace,
  type MigratedWorkspace,
} from "../support/seedCandidateWorld.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

const completeStage = new CompleteStageVerb();
const nextAction = new NextActionVerb();
const reopenStage = new ReopenStageVerb();
const startStage = new StartStageVerb();

describe("the next action within one story", () => {
  let service: cds.Service;
  let world: MigratedWorkspace;
  let backlogStoryId: string;
  let context: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    context = buildVerbContext(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedMigratedWorkspace();
    backlogStoryId = world.storyIds[BACKLOG_STORY_ID];
  });

  afterEach(async () => {
    await setStepDriver(DRIVER_CHANGE.STEP, DRIVER_CHANGE.SEEDED);
  });

  /** A freshly migrated chain must point at its first stage with every field a caller needs to run it, and say it is fresh work. */
  it("resolves an untouched chain to its first stage, carrying the full payload at the fresh tier", async () => {
    const result = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );

    expect(nextActionOf(result)).toEqual({
      story: MIGRATED_REFERENCE.BACKLOG,
      stepCode: STEP_FACTS.BUILD.code,
      name: STEP_FACTS.BUILD.name,
      description: STEP_FACTS.BUILD.description,
      kind: STEP_KIND.REQUIRED,
      driver: STEP_FACTS.BUILD.driver,
      requiresHuman: false,
      status: TASK_STATUS.NOT_STARTED,
      tier: TIER.FRESH,
    });
  });

  /** The status on the payload names the verb to call; for a running stage that is complete_stage, and start_stage must still refuse. */
  it("returns a running stage as In Progress, refuses to start it again, and lets it complete", async () => {
    await setChainStates(backlogStoryId, BUILD_IN_PROGRESS);

    const resolved = nextActionOf(
      expectSuccess(await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG })),
    );
    const restart = expectFailure(
      await startStage.run(context, {
        story: MIGRATED_REFERENCE.BACKLOG,
        stage: String(resolved?.stepCode),
      }),
    );
    const completion = await completeStage.run(context, {
      story: MIGRATED_REFERENCE.BACKLOG,
      stage: String(resolved?.stepCode),
    });

    expect(resolved).toMatchObject({
      stepCode: STAGE.BUILD,
      status: TASK_STATUS.IN_PROGRESS,
      tier: TIER.RESUMING,
    });
    expect(restart.code).toBe("wfl.stage.alreadyStarted");
    expect(completion).toMatchObject({ ok: true });
  });

  /** For a stage not yet started the payload names start_stage, and no predecessor guard may refuse it. */
  it("returns an unstarted stage as Not Started, and start_stage accepts it", async () => {
    await setChainStates(backlogStoryId, BUILD_COMPLETE);

    const resolved = nextActionOf(
      expectSuccess(await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG })),
    );
    const start = await startStage.run(context, {
      story: MIGRATED_REFERENCE.BACKLOG,
      stage: String(resolved?.stepCode),
    });

    expect(resolved).toMatchObject({
      stepCode: STAGE.CODE_QUALITY,
      status: TASK_STATUS.NOT_STARTED,
    });
    expect(start.ok).toBe(true);
  });

  /** Skipping a Recommended stage hides it until the story is otherwise finished; it is resolved in position order like any other. */
  it("resolves to the Recommended stage ahead of the Required ones after it", async () => {
    await setChainStates(backlogStoryId, TWO_STAGES_STARTABLE);

    const result = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );

    expect(nextActionOf(result)).toMatchObject({
      stepCode: STEP_FACTS.DOCUMENTATION.code,
      kind: STEP_KIND.RECOMMENDED,
      tier: TIER.RESUMING,
    });
  });

  /** The resolver reads stages, never the story's status, so a story that derives Done still yields its residual optional stage. */
  it("still resolves a Done story's residual Recommended stage at tier 3, with or without the story named", async () => {
    await setChainStates(backlogStoryId, BLOCKING_CHAIN_COMPLETE);

    const status = await readDerivedMilestoneStatus(service, backlogStoryId);
    const scoped = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );
    const unscoped = expectSuccess(await nextAction.run(context, {}));

    expect(status).toBe("done");
    expect(nextActionOf(scoped)).toMatchObject({
      story: MIGRATED_REFERENCE.BACKLOG,
      stepCode: STEP_FACTS.DOCUMENTATION.code,
      kind: STEP_KIND.RECOMMENDED,
      tier: TIER.OPTIONAL_ONLY,
    });
    expect(nextActionOf(unscoped)).toEqual(nextActionOf(scoped));
  });

  /** A human-only stage named without warning is a next action the agent cannot run; the payload must say so up front. */
  it("flags a stage only a human may close", async () => {
    await setChainStates(backlogStoryId, THROUGH_FUNCTIONAL_TEST_COMPLETE);

    const result = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );

    expect(nextActionOf(result)).toMatchObject({
      stepCode: STEP_FACTS.HUMAN_REVIEW.code,
      driver: STEP_FACTS.HUMAN_REVIEW.driver,
      requiresHuman: true,
    });
  });

  /** A driver written into the resolver drifts the first time an operator renames a command in the seed. */
  it("carries the driver the seeded step holds now", async () => {
    await setChainStates(backlogStoryId, BUILD_COMPLETE);
    await setStepDriver(DRIVER_CHANGE.STEP, DRIVER_CHANGE.CHANGED);

    const result = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );

    expect(nextActionOf(result)).toMatchObject({
      stepCode: DRIVER_CHANGE.STEP,
      driver: DRIVER_CHANGE.CHANGED,
    });
  });

  /** "Nothing left" and "no such story" need different reactions, so one is an empty success and the other a 404. */
  it("answers a chainless story with an empty success and an unknown one with a 404", async () => {
    const chainless = await nextAction.run(context, {
      story: MIGRATED_REFERENCE.CHAINLESS_DONE,
    });
    const unknown = expectFailure(
      await nextAction.run(context, { story: UNRESOLVABLE.STORY }),
    );

    expect(chainless).toMatchObject({ ok: true, nextAction: null });
    expect(unknown).toMatchObject({ status: 404, code: "verb.target.notFound" });
  });

  /** After a reopen the work goes back to the reopened stage, and a later stage closed before it is not re-offered. */
  it("moves the next action back to a reopened stage and leaves later closed work alone", async () => {
    await setChainStates(backlogStoryId, THROUGH_TEST_QUALITY_COMPLETE);

    const before = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );
    expectSuccess(
      await reopenStage.run(context, {
        story: MIGRATED_REFERENCE.BACKLOG,
        stage: STAGE.CODE_QUALITY,
        reason: REOPEN_REASON,
      }),
    );
    const after = expectSuccess(
      await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }),
    );
    const testQuality = await readTaskByCode(backlogStoryId, STAGE.TEST_QUALITY);

    expect(nextActionOf(before)?.stepCode).toBe(STAGE.FUNCTIONAL_TEST);
    expect(nextActionOf(after)).toMatchObject({
      stepCode: STAGE.CODE_QUALITY,
      status: TASK_STATUS.IN_PROGRESS,
    });
    expect(testQuality.status_code).toBe(TASK_STATUS.COMPLETE);
  });

  /** Reading what to do next must never itself become something that happened, or every poll pollutes the register. */
  it("writes no activity in either mode", async () => {
    await setChainStates(backlogStoryId, BUILD_COMPLETE);

    expectSuccess(await nextAction.run(context, { story: MIGRATED_REFERENCE.BACKLOG }));
    expectSuccess(await nextAction.run(context, {}));
    const events = await readActivityLog(world.workspaceId);

    expect(events).toEqual([]);
  });
});
