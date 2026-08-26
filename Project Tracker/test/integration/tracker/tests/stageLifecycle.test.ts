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
  BLOCKED_AND_COMPLETE,
  BUILD_IN_PROGRESS,
  CHAIN_TIMES,
  CLOSED_STEPS,
  CODE_QUALITY_COMPLETE,
  CODE_QUALITY_IN_PROGRESS,
  COMMIT_LAST_OPEN,
  EMPTY_REASON,
  HUMAN_REVIEW_OPEN,
  OPEN_STEP,
  REOPEN_REASON,
  STAGE,
  TWO_STAGES_STARTABLE,
  WHOLE_CHAIN_COMPLETE,
} from "../data/chainStates.js";
import {
  SECOND_STORY,
  UI_STORY,
  UI_STORY_REFERENCE,
} from "../data/writePayloads.js";
import { seedExtraStory } from "../support/seedExtraStory.js";
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
    expect(events[0].kind_code).toBe("stageCompleted");
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
    const events = await readActivityLog(world.workspaceId);

    expect(reopened.status_code).toBe("inProgress");
    expect(reopened.completedAt).toBeNull();
    expect(later.completedAt).toBe(before.completedAt);
    expect(events[0].kind_code).toBe("stageReopened");
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

  /** Reopening a stage that never completed would be an ungated start, skipping the blocking guard. */
  it("refuses to reopen a stage that is not complete", async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_OPEN);

    const result = expectFailure(
      await reopenStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.COMMIT,
        reason: REOPEN_REASON,
      }),
    );
    const task = await readTaskByCode(world.milestoneId, STAGE.COMMIT);

    expect(result.status).toBe(409);
    expect(result.code).toBe("verb.stage.notComplete");
    expect(task.status_code).toBe("inProgress");
    expect(await readActivityLog(world.workspaceId)).toHaveLength(0);
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

  /** Unserialized, both callers read the same open stage and both complete it, twice over. */
  it("serializes two completions of one stage into a success and a conflict", async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const results = await Promise.all([
      completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
      completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.CODE_QUALITY,
      }),
    ]);
    const refused = results.filter(result => !result.ok);
    const events = await readActivityLog(world.workspaceId);

    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(expectFailure(refused[0]).status).toBe(409);
    expect(expectFailure(refused[0]).code).toBe("verb.stage.alreadyComplete");
    expect(events).toHaveLength(1);
    expect(events[0].kind_code).toBe("stageCompleted");
  });

  /** Each verb labels its own event; a start filed under any other kind is history nothing can correct. */
  it("labels both concurrent stage starts as started events", async () => {
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
    expect(events.map(event => event.kind_code)).toEqual([
      "stageStarted",
      "stageStarted",
    ]);
  });

  /** The guard order is the rule: told it is merely complete, a caller reopens a stage it should not. */
  it("reports the block, not the completion, when both conditions hold", async () => {
    await setChainStates(world.milestoneId, BLOCKED_AND_COMPLETE);

    const result = expectFailure(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.COMMIT,
      }),
    );

    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
  });

  /** A conditional stage blocks like a required one, or a UI story commits without its UX test. */
  it("refuses to commit a UI story whose conditional UX test never ran", async () => {
    const uiStoryId = await seedExtraStory(world.initiativeId, UI_STORY);
    await setChainStates(uiStoryId, COMMIT_LAST_OPEN);

    const result = expectFailure(
      await completeStage(context, {
        story: UI_STORY_REFERENCE,
        stage: STAGE.COMMIT,
      }),
    );

    expect(result.code).toBe("verb.stage.blocked");
    expect(result.rule).toBe("wfl.stage.predecessorOpen");
    expect(result.remediation).toContain(STAGE.UX_TEST);
  });

  /** The next action is scoped to the story just written; a sibling's open chain is not this agent's. */
  it("answers no next action when the written story is finished, though a sibling is untouched", async () => {
    await seedExtraStory(world.initiativeId, SECOND_STORY);
    await setChainStates(world.milestoneId, COMMIT_LAST_OPEN);

    const result = expectSuccess(
      await completeStage(context, {
        story: STORY_REFERENCE,
        stage: STAGE.COMMIT,
      }),
    );

    expect(result.nextAction).toBeNull();
  });
});
