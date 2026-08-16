import type cds from "@sap/cds";

import { completeStage } from "../../../../mcp/verbs/completeStage.js";
import { reopenStage } from "../../../../mcp/verbs/reopenStage.js";
import { startStage } from "../../../../mcp/verbs/startStage.js";
import {
  ACTORS,
  STAGE_NOTES,
  STORY_REFERENCE,
} from "../../../shared/data/world.js";
import {
  readActivityLog,
  readDerivedMilestoneStatus,
  readTaskByCode,
} from "../../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  setSubtaskStatus,
  type SeededWorld,
} from "../../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../../shared/support/trackerHarness.js";
import {
  BUILD_IN_PROGRESS,
  CHAIN_TIMES,
  CLOSED_STEPS,
  CODE_QUALITY_COMPLETE,
  CODE_QUALITY_IN_PROGRESS,
  EMPTY_REASON,
  HUMAN_REVIEW_OPEN,
  OPEN_STEP,
  REOPEN_REASON,
  STAGE,
  TWO_STAGES_STARTABLE,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import {
  buildVerbContext,
  expectFailure,
  expectSuccess,
} from "../support/verbHarness.js";

describe("stage lifecycle", () => {
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

  /** A completed stage must advance the chain and leave exactly one event, or the log is not the record. */
  it("completes a stage, advances the chain and emits one event", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const result = expectSuccess(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const events = await readActivityLog(world.workspaceId);

    expect(result.timestamp).toBeTruthy();
    expect(result.nextAction?.stepCode).toBe(STAGE.TEST_QUALITY);
    expect(task.status_code).toBe("complete");
    expect(task.completedAt).toBeTruthy();
    expect(events).toHaveLength(1);
    expect(events[0].actor).toBe(ACTORS.IMPLEMENTER);
  });

  /** What a stage concluded is the only prose the chain carries, so it has to reach the row. */
  it("stores the notes a completed stage was given", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    expectSuccess(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
        notes: STAGE_NOTES,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(task.notes).toBe(STAGE_NOTES);
  });

  /** A refused verb must leave no trace at all, or enforcement becomes a write path of its own. */
  it("writes nothing and logs nothing when a guard refuses", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_OPEN);
    const before = await readTaskByCode(world.milestoneId, STAGE.COMMIT);

    const result = expectFailure(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.COMMIT,
      }),
    );
    const after = await readTaskByCode(world.milestoneId, STAGE.COMMIT);

    expect(result.ok).toBe(false);
    expect(after.status_code).toBe(before.status_code);
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
  });

  /** The rejection has to carry the state that explains it, or the caller retries blind. */
  it("refuses a second completion, carrying the status and the original time", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const result = expectFailure(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.stage.alreadyComplete");
    expect(result.message).toContain("complete");
    expect(result.message).toContain(String(task.completedAt));
  });

  /** Open steps must warn rather than block, or an optional step strands the whole story. */
  it("warns about open steps instead of blocking, naming only materialised ones", async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    for (const step of CLOSED_STEPS) {
      await setSubtaskStatus(build.ID, step, "complete");
    }

    const result = expectSuccess(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.BUILD,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.BUILD);

    expect(result.warnings.map(warning => warning.code)).toEqual([
      "verb.stage.subtasksOpen",
    ]);
    expect(result.warnings.map(warning => warning.target)).toEqual([OPEN_STEP]);
    expect(task.status_code).toBe("complete");
  });

  /** A reopen must not rewrite later stages, or the record stops being a history. */
  it("reopens one stage and leaves later stages' records untouched", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);
    const before = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    expectSuccess(
      await reopenStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
        reason: REOPEN_REASON,
      }),
    );
    const reopened = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const later = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    expect(reopened.status_code).toBe("inProgress");
    expect(reopened.completedAt).toBeNull();
    expect(later.completedAt).toBe(before.completedAt);
    expect(
      await readDerivedMilestoneStatus(service, world.milestoneId),
    ).not.toBe("done");
  });

  /** A reopen with no reason records why nothing, which is the state the register exists to prevent. */
  it("refuses a reopen with an empty reason and leaves the stage complete", async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);

    const result = expectFailure(
      await reopenStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
        reason: EMPTY_REASON,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(result.status).toBe(400);
    expect(result.code).toBe("verb.reopen.reasonRequired");
    expect(task.status_code).toBe("complete");
    expect(task.completedAt).toBe(CHAIN_TIMES.CODE_QUALITY_DONE);
  });

  /** A methodology rejection has to name what clears it, or the agent has nothing to act on. */
  it("names the blocking stage and its command in the remediation", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_OPEN);

    const result = expectFailure(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.COMMIT,
      }),
    );

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(STAGE.HUMAN_REVIEW);
    expect(result.remediation).toContain("/human-review-loop");
    expect(result.remediation).not.toContain(STAGE.DOCUMENTATION);
  });

  /** Concurrent writes must serialize, or two events share a timestamp and the register loses its order. */
  it("serializes concurrent writes into strictly ordered events", async () => {
    await setChainStates(world.milestoneId, TWO_STAGES_STARTABLE);

    const results = await Promise.all([
      startStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.DOCUMENTATION,
      }),
      startStage(context, { story: STORY_REFERENCE, stage: STAGE.PM_UPDATE }),
    ]);
    const events = await readActivityLog(world.workspaceId);

    results.forEach(result => expectSuccess(result));
    expect(events).toHaveLength(2);
    expect(events[0].occurredAt).not.toBe(events[1].occurredAt);
    expect(events[0].occurredAt < events[1].occurredAt).toBe(true);
  });
});
