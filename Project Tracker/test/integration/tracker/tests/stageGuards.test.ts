import type cds from "@sap/cds";

import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import { ACTORS, STORY_REFERENCE } from "../../../shared/data/world.js";
import {
  readActivityLog,
  readDerivedMilestoneStatus,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import { PAST_RECOMMENDED_SCRIPT } from "../data/chainScripts.js";
import {
  BUILD_COMPLETE,
  CHAIN_TIMES,
  CODE_QUALITY_AND_TEST_QUALITY_IN_PROGRESS,
  CODE_QUALITY_COMPLETE,
  CODE_QUALITY_IN_PROGRESS,
  HUMAN_REVIEW_IN_PROGRESS,
  STAGE,
  THROUGH_FUNCTIONAL_TEST_COMPLETE,
  THROUGH_TEST_QUALITY_COMPLETE,
  TWO_STAGES_STARTABLE,
} from "../data/chainStates.js";
import {
  BLOCKING_SETS,
  DRIVER_CHANGE,
  EXTRA_HUMAN_ACTOR,
  HUMAN_FLAG_CHANGE,
  POSITION_CHANGE,
  UNSEEDED_ACTOR,
} from "../data/seededLibrary.js";
import { driveChainScript } from "../support/driveChain.js";
import {
  removeActor,
  seedActor,
  setStepDriver,
  setStepPosition,
  setStepRequiresHuman,
} from "../support/libraryAccess.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
  orderOfAppearance,
} from "../support/verbHarness.js";

const completeStage = new CompleteStageVerb();
const startStage = new StartStageVerb();

describe("the stage guards", () => {
  let service: cds.Service;
  let world: SeededWorld;
  let agent: ReturnType<typeof buildVerbContext>;
  let human: ReturnType<typeof buildVerbContext>;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    agent = buildVerbContext(service, ACTORS.IMPLEMENTER);
    human = buildVerbContext(service, ACTORS.SANDRO);
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  afterEach(async () => {
    await setStepDriver(DRIVER_CHANGE.STEP, DRIVER_CHANGE.SEEDED);
    await setStepPosition(POSITION_CHANGE.STEP, POSITION_CHANGE.SEEDED);
    await setStepRequiresHuman(HUMAN_FLAG_CHANGE.STEP, HUMAN_FLAG_CHANGE.SEEDED);
    await clearWorld();
    await removeActor(EXTRA_HUMAN_ACTOR.code);
  });

  /** Starting out of order is the shortcut the guard exists to refuse, and the refusal must say what to run instead. */
  it("refuses to start a stage behind an open predecessor, naming it and its command", async () => {
    await setChainStates(world.milestoneId, BUILD_COMPLETE);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );

    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(STAGE.CODE_QUALITY);
    expect(result.remediation).toContain("/code-quality");
  });

  /** Incomplete means not yet Complete, so a predecessor still running blocks a start exactly as an untouched one does. */
  it("refuses to start a stage while its predecessor is still in progress", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );

    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(STAGE.CODE_QUALITY);
    expect(result.remediation).toContain("/code-quality");
  });

  /** Closing a stage while the one before it still runs writes completions out of order and can carry the story to Done. */
  it("refuses to complete a stage while its predecessor is still in progress", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_AND_TEST_QUALITY_IN_PROGRESS);

    const result = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );
    const testQuality = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(STAGE.CODE_QUALITY);
    expect(result.remediation).toContain("/code-quality");
    expect(testQuality.status_code).toBe("inProgress");
  });

  /** Naming only the earliest blocker costs one rejection per open stage to discover what one could have said. */
  it("names the whole blocking set in position order, each with its own command", async () => {
    await setChainStates(world.milestoneId, BUILD_COMPLETE);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );

    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(orderOfAppearance(result.remediation, BLOCKING_SETS.BEFORE_REVIEW)).toEqual([
      ...BLOCKING_SETS.BEFORE_REVIEW,
    ]);
    expect(
      orderOfAppearance(result.remediation, BLOCKING_SETS.BEFORE_REVIEW_DRIVERS),
    ).toEqual([...BLOCKING_SETS.BEFORE_REVIEW_DRIVERS]);
    expect(result.remediation).not.toContain(STAGE.UX_TEST);
  });

  /** Drivers change while stages do not, so a command written into the guard drifts the first time one is renamed. */
  it("builds the remediation's command from the seeded driver, not from the guard", async () => {
    await setChainStates(world.milestoneId, BUILD_COMPLETE);
    await setStepDriver(DRIVER_CHANGE.STEP, DRIVER_CHANGE.CHANGED);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );

    expect(result.remediation).toContain(DRIVER_CHANGE.CHANGED);
    expect(result.remediation).not.toContain(DRIVER_CHANGE.SEEDED);
  });

  /** The blocking order is the one the chain was made with; a library reorder must not let a stage overtake its predecessor. */
  it("keeps blocking in the instantiated order after the library moves a predecessor past it", async () => {
    await setChainStates(world.milestoneId, BUILD_COMPLETE);
    await setStepPosition(POSITION_CHANGE.STEP, POSITION_CHANGE.CHANGED);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.TEST_QUALITY }),
    );

    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(POSITION_CHANGE.STEP);
  });

  /** A Recommended stage never blocks, or skipping documentation would strand every story short of Done. */
  it("runs the last stages past an untouched recommended one and reaches Done", async () => {
    await setChainStates(world.milestoneId, TWO_STAGES_STARTABLE);

    await driveChainScript(service, STORY_REFERENCE, PAST_RECOMMENDED_SCRIPT);
    const documentation = await readTaskByCode(world.milestoneId, STAGE.DOCUMENTATION);

    expect(await readDerivedMilestoneStatus(service, world.milestoneId)).toBe("done");
    expect(documentation.status_code).toBe("notStarted");
  });

  /** Committing past an open review is the exact skip the register was built to make impossible. */
  it("refuses to complete commit while human review is open, naming every blocker but the recommended one", async () => {
    await setChainStates(world.milestoneId, THROUGH_FUNCTIONAL_TEST_COMPLETE);

    const result = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.COMMIT }),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(orderOfAppearance(result.remediation, BLOCKING_SETS.BEFORE_COMMIT)).toEqual([
      ...BLOCKING_SETS.BEFORE_COMMIT,
    ]);
    expect(
      orderOfAppearance(result.remediation, BLOCKING_SETS.BEFORE_COMMIT_DRIVERS),
    ).toEqual([...BLOCKING_SETS.BEFORE_COMMIT_DRIVERS]);
    expect(result.remediation).not.toContain(STAGE.DOCUMENTATION);
  });

  /** Review is the one stage an agent must not close for itself, and a refusal must leave no trace of the attempt. */
  it("refuses an agent closing human review, leaving the stage untouched, then accepts the human", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_IN_PROGRESS);

    const refused = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );
    const untouched = await readTaskByCode(world.milestoneId, STAGE.HUMAN_REVIEW);
    const eventsAfterRefusal = await readActivityLog(world.workspaceId);
    expectSuccess(
      await completeStage.run(human, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );
    const closed = await readTaskByCode(world.milestoneId, STAGE.HUMAN_REVIEW);

    expect(refused.code).toBe("wfl.stage.humanOnly");
    expect(untouched.status_code).toBe("inProgress");
    expect(untouched.completedAt).toBeNull();
    expect(eventsAfterRefusal).toHaveLength(0);
    expect(closed.status_code).toBe("complete");
  });

  /** Human-only is permanent and not-started is not, so the agent must be told the fact it cannot fix first. */
  it("answers human-only rather than not-started when an agent closes an unstarted review", async () => {
    await setChainStates(world.milestoneId, THROUGH_FUNCTIONAL_TEST_COMPLETE);

    const result = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );

    expect(result.code).toBe("wfl.stage.humanOnly");
    expect(result.code).not.toBe("verb.stage.notStarted");
  });

  /** The guard order puts the open predecessor first, so review is never reported closable-by-a-human while blocked. */
  it("answers the open predecessor before human-only", async () => {
    await setChainStates(world.milestoneId, THROUGH_TEST_QUALITY_COMPLETE);

    const result = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );

    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
  });

  /** Human-only outranks already-complete, and already-complete is what the human is told next. */
  it("answers human-only to an agent and already-complete to the human on a closed review", async () => {
    await setChainStates(world.milestoneId, TWO_STAGES_STARTABLE);

    const toAgent = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );
    const toHuman = expectFailure(
      await completeStage.run(human, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );

    expect(toAgent.code).toBe("wfl.stage.humanOnly");
    expect(toHuman.code).toBe("verb.stage.alreadyComplete");
  });

  /** The rule is "not a human", so a system identity is refused exactly as an agent is. */
  it("refuses a system identity closing human review", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_IN_PROGRESS);

    const result = expectFailure(
      await completeStage.run(buildVerbContext(service, ACTORS.SYSTEM), {
        story: STORY_REFERENCE,
        stage: STAGE.HUMAN_REVIEW,
      }),
    );

    expect(result.code).toBe("wfl.stage.humanOnly");
  });

  /** A made-up name must never close review; it is refused as unknown before its kind is ever read. */
  it("refuses an identity missing from the actor list closing human review, leaving it open", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_IN_PROGRESS);

    const result = expectFailure(
      await completeStage.run(buildVerbContext(service, UNSEEDED_ACTOR), {
        story: STORY_REFERENCE,
        stage: STAGE.HUMAN_REVIEW,
      }),
    );
    const untouched = await readTaskByCode(world.milestoneId, STAGE.HUMAN_REVIEW);

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.identity.unknown");
    expect(untouched.status_code).toBe("inProgress");
  });

  /** The check reads the actor's kind from the code list, so any identity seeded as human may close review. */
  it("accepts any identity whose kind is human, not only one named caller", async () => {
    await seedActor({ ...EXTRA_HUMAN_ACTOR });
    await setChainStates(world.milestoneId, HUMAN_REVIEW_IN_PROGRESS);

    expectSuccess(
      await completeStage.run(buildVerbContext(service, EXTRA_HUMAN_ACTOR.code), {
        story: STORY_REFERENCE,
        stage: STAGE.HUMAN_REVIEW,
      }),
    );
    const closed = await readTaskByCode(world.milestoneId, STAGE.HUMAN_REVIEW);

    expect(closed.status_code).toBe("complete");
  });

  /** Who may close a stage is fixed when the chain is made, so lifting the library flag must not let an agent close review. */
  it("still refuses an agent closing human review after the library lifts its human-only flag", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_IN_PROGRESS);
    await setStepRequiresHuman(HUMAN_FLAG_CHANGE.STEP, HUMAN_FLAG_CHANGE.CHANGED);

    const result = expectFailure(
      await completeStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.HUMAN_REVIEW }),
    );
    const review = await readTaskByCode(world.milestoneId, STAGE.HUMAN_REVIEW);

    expect(result.code).toBe("wfl.stage.humanOnly");
    expect(review.status_code).toBe("inProgress");
  });

  /** A second start would overwrite the first start time, so it is refused and hands the original back. */
  it("refuses to start a stage already in progress, carrying when it started", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.CODE_QUALITY }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(result.code).toBe("wfl.stage.alreadyStarted");
    expect(result.message).toContain(CHAIN_TIMES.CODE_QUALITY_STARTED.slice(0, 19));
    expect(task.startedAt).toBe(CHAIN_TIMES.CODE_QUALITY_STARTED);
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
  });

  /** Restarting a finished stage is a reopen, which takes a reason, so the refusal names that verb. */
  it("refuses to start a complete stage and names reopen as the way back", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const result = expectFailure(
      await startStage.run(agent, { story: STORY_REFERENCE, stage: STAGE.CODE_QUALITY }),
    );

    expect(result.code).toBe("verb.stage.alreadyComplete");
    expect(result.remediation).toContain("reopen_stage");
  });
});
