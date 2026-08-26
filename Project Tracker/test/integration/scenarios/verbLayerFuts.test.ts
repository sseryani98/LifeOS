import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type cds from "@sap/cds";

import { CODES } from "../../../srv/modules/shared/constants.js";
import {
  EXPECTED_TOOL_NAMES,
  FORBIDDEN_TOOLS,
  READY_LOG,
  SPAWN_TIMEOUT_MS,
} from "../../protocol/data/toolSurface.js";
import {
  captureServerStreams,
  connectInMemoryClient,
} from "../../protocol/support/mcpHarness.js";
import {
  ACTORS,
  BARE_STORY_REFERENCE,
  DECISION_INPUT,
  DEFECT_INPUT,
  DEFECT_RESOLUTION,
  SPRINT_PLAN,
  SPRINT_PLAN_WITH_BAD_TYPE,
  STORY_REFERENCE,
  WORLD,
} from "../../shared/data/world.js";
import {
  countAllMilestones,
  countInitiativesOf,
  readActivityLog,
  readDefectById,
  readDerivedMilestoneStatus,
  readStoriesOf,
  readTaskByCode,
} from "../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  setChainStates,
  setSubtaskStatus,
  type SeededWorld,
} from "../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../shared/support/trackerHarness.js";
import { buildSprintPlanInput } from "../../shared/support/verbInputs.js";
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
} from "../tracker/data/chainStates.js";
import {
  EMPTY_RESOLUTION,
  FUT,
  TOOL,
  VIEW_KEYS,
} from "./data/functionalUnits.js";
import {
  callTool,
  driveTool,
  nextStepOf,
  warningCodesOf,
  warningTargetsOf,
} from "./support/futHarness.js";

/**
 * The spec's functional units, executed rather than mapped. Each one is driven
 * through a real client over the advertised tools, which is this story's whole
 * caller-facing surface - it ships no page, so a tool call is the outermost
 * thing anyone can hold. The tier suites still own regression; this tier owns
 * the question of whether each named unit passes.
 */
describe("the intent-verb layer's functional units", () => {
  let service: cds.Service;
  let client: Client;
  let world: SeededWorld;

  beforeAll(async () => {
    await trackerServer;
    service = await connectTrackerService();
    client = await connectInMemoryClient(service, ACTORS.IMPLEMENTER);
  });

  beforeEach(async () => {
    await clearWorld();
    world = await seedCanonicalWorld();
  });

  /** Removing the generic tools is what makes the enforced path the only path, so the count is the contract. */
  it(`${FUT.TOOL_LIST} exposes exactly eleven verbs and no generic data tool`, async () => {
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name);

    expect(names.slice().sort()).toEqual(EXPECTED_TOOL_NAMES.slice().sort());
    for (const forbidden of FORBIDDEN_TOOLS) {
      expect(names).not.toContain(forbidden);
    }
  });

  /** A stage that closes without saying what comes next leaves the chain to be guessed at. */
  it(`${FUT.STAGE_ADVANCES} advances the chain and emits one event on completion`, async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_IN_PROGRESS);

    const { envelope } = await callTool(client, TOOL.COMPLETE_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.CODE_QUALITY,
    });
    const task = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const events = await readActivityLog(world.workspaceId);

    expect(envelope.ok).toBe(true);
    expect(typeof envelope.timestamp).toBe("string");
    expect(nextStepOf(envelope)).toBe(STAGE.TEST_QUALITY);
    expect(task.status_code).toBe(CODES.TASK_STATUS.COMPLETE);
    expect(task.completedAt).not.toBeNull();
    expect(events).toHaveLength(1);
    expect(events[0].actor).toBe(ACTORS.IMPLEMENTER);
  });

  /** A refusal that still logs turns the register into a record of things that never happened. */
  it(`${FUT.REJECTION_WRITES_NOTHING} writes nothing and logs nothing when refused`, async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_OPEN);
    const before = await readTaskByCode(world.milestoneId, STAGE.COMMIT);

    const { envelope, isError } = await callTool(client, TOOL.COMPLETE_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.COMMIT,
    });
    const after = await readTaskByCode(world.milestoneId, STAGE.COMMIT);
    const events = await readActivityLog(world.workspaceId);

    expect(envelope.ok).toBe(false);
    expect(isError).toBe(true);
    expect(after.status_code).toBe(before.status_code);
    expect(after.completedAt).toBe(before.completedAt);
    expect(events).toHaveLength(0);
  });

  /** Told only no, a caller retries; told the status and the original time, it knows there is nothing to do. */
  it(`${FUT.SECOND_COMPLETION} refuses a second completion with usable state`, async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const { envelope } = await callTool(client, TOOL.COMPLETE_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.CODE_QUALITY,
    });

    expect(envelope.status).toBe(409);
    expect(envelope.code).toBe("verb.stage.alreadyComplete");
    expect(envelope.message).toContain(CODES.TASK_STATUS.COMPLETE);
    expect(envelope.message).toContain(
      CHAIN_TIMES.CODE_QUALITY_DONE.slice(0, 10),
    );
  });

  /** An optional step left open must not hold a story shut, and only steps that exist may be named. */
  it(`${FUT.OPEN_STEPS_WARN} warns about an open step instead of blocking`, async () => {
    await setChainStates(world.milestoneId, BUILD_IN_PROGRESS);
    const build = await readTaskByCode(world.milestoneId, STAGE.BUILD);
    for (const step of CLOSED_STEPS) {
      await setSubtaskStatus(build.ID, step, CODES.SUBTASK_STATUS.COMPLETE);
    }

    const { envelope } = await callTool(client, TOOL.COMPLETE_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.BUILD,
    });
    const closed = await readTaskByCode(world.milestoneId, STAGE.BUILD);

    expect(envelope.ok).toBe(true);
    expect(warningCodesOf(envelope)).toEqual(["verb.stage.subtasksOpen"]);
    expect(warningTargetsOf(envelope)).toEqual([OPEN_STEP]);
    expect(closed.status_code).toBe(CODES.TASK_STATUS.COMPLETE);
  });

  /** A reopen that rewrote later stages would make the chain a current state rather than a history. */
  it(`${FUT.REOPEN_PRESERVES_LATER} preserves later stages' records on a reopen`, async () => {
    await setChainStates(world.milestoneId, WHOLE_CHAIN_COMPLETE);
    const before = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    const { envelope } = await callTool(client, TOOL.REOPEN_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.CODE_QUALITY,
      reason: REOPEN_REASON,
    });
    const reopened = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const later = await readTaskByCode(world.milestoneId, STAGE.TEST_QUALITY);

    expect(envelope.ok).toBe(true);
    expect(reopened.completedAt).toBeNull();
    expect(later.completedAt).toBe(before.completedAt);
    expect(await readDerivedMilestoneStatus(service, world.milestoneId)).not.toBe(
      CODES.MILESTONE_STATUS.DONE,
    );
  });

  /** A reopen with no reason erases why the stage was ever closed, which is what the register is for. */
  it(`${FUT.REOPEN_NEEDS_REASON} refuses a reopen that carries no reason`, async () => {
    await setChainStates(world.milestoneId, CODE_QUALITY_COMPLETE);

    const { envelope } = await callTool(client, TOOL.REOPEN_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.CODE_QUALITY,
      reason: EMPTY_REASON,
    });
    const stage = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);

    expect(envelope.status).toBe(400);
    expect(envelope.code).toBe("verb.reopen.reasonRequired");
    expect(stage.status_code).toBe(CODES.TASK_STATUS.COMPLETE);
  });

  /** Two workspaces hold the same story identifier, so resolving a bare one writes to the wrong board. */
  it(`${FUT.BARE_STORY_REFUSED} refuses a bare story reference rather than resolving it`, async () => {
    const { envelope } = await callTool(client, TOOL.START_STAGE, {
      story: BARE_STORY_REFERENCE,
      stage: STAGE.CODE_QUALITY,
    });
    const stage = await readTaskByCode(world.milestoneId, STAGE.CODE_QUALITY);
    const events = await readActivityLog(world.workspaceId);

    expect(envelope.status).toBe(400);
    expect(envelope.code).toBe("verb.story.unqualified");
    expect(envelope.message).toContain("{workspace}/{story}");
    expect(stage.status_code).toBe(CODES.TASK_STATUS.NOT_STARTED);
    expect(events).toHaveLength(0);
  });

  /** A register that cannot say which agent acted answers no question a review ever asks. */
  it(`${FUT.IDENTITY_REACHES_ROW} carries the caller's identity onto the row and the event`, async () => {
    const { envelope } = await callTool(client, TOOL.LOG_DEFECT, {
      story: STORY_REFERENCE,
      ...DEFECT_INPUT,
    });
    const defect = await readDefectById(envelope.defectId as string);
    const events = await readActivityLog(world.workspaceId);

    expect(defect.createdBy).toBe(ACTORS.IMPLEMENTER);
    expect(events[0].actor).toBe(ACTORS.IMPLEMENTER);
    expect(events[0].createdBy).toBe(ACTORS.IMPLEMENTER);
  });

  /** One log line inside the frame stream kills the session, and only a real transport reproduces it. */
  it(
    `${FUT.STDOUT_IS_FRAMES_ONLY} writes only JSON-RPC frames to stdout`,
    async () => {
      const streams = await captureServerStreams();
      const lines = streams.stdout.split("\n").filter(line => line.trim());

      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect((JSON.parse(line) as { jsonrpc?: string }).jsonrpc).toBe("2.0");
      }
      expect(streams.stderr).toContain(READY_LOG);
      expect(streams.stdout).not.toContain(READY_LOG);
    },
    SPAWN_TIMEOUT_MS + 5_000,
  );

  /** A block that does not say what clears it sends the caller off to read the methodology by hand. */
  it(`${FUT.REJECTION_CARRIES_REMEDIATION} names the blocking stage and its command`, async () => {
    await setChainStates(world.milestoneId, HUMAN_REVIEW_OPEN);

    const { envelope } = await callTool(client, TOOL.COMPLETE_STAGE, {
      story: STORY_REFERENCE,
      stage: STAGE.COMMIT,
    });

    expect(envelope.status).toBe(409);
    expect(envelope.code).toBe("verb.stage.blocked");
    expect(envelope.remediation).toContain(STAGE.HUMAN_REVIEW);
    expect(envelope.remediation).toContain("/human-review-loop");
  });

  /** A closed defect with no resolution is the state the register exists to make impossible. */
  it(`${FUT.CLOSE_NEEDS_RESOLUTION} refuses to close a defect without a resolution`, async () => {
    const logged = await driveTool(client, TOOL.LOG_DEFECT, {
      story: STORY_REFERENCE,
      ...DEFECT_INPUT,
    });
    const defectId = logged.defectId as string;

    const refused = await callTool(client, TOOL.RESOLVE_DEFECT, {
      defect: defectId,
      resolution: EMPTY_RESOLUTION,
    });
    const stillOpen = await readDefectById(defectId);
    const accepted = await callTool(client, TOOL.RESOLVE_DEFECT, {
      defect: defectId,
      resolution: DEFECT_RESOLUTION,
    });
    const closed = await readDefectById(defectId);

    expect(refused.envelope.status).toBe(400);
    expect(refused.envelope.code).toBe("verb.defect.resolutionRequired");
    expect(stillOpen.status_code).toBe(CODES.DEFECT_STATUS.OPEN);
    expect(accepted.envelope.ok).toBe(true);
    expect(closed.status_code).toBe(CODES.DEFECT_STATUS.CLOSED);
    expect(closed.resolution).toBe(DEFECT_RESOLUTION);
  });

  /** Planning is one act; four events would read as four decisions nobody made. */
  it(`${FUT.PLAN_IN_ONE_CALL} creates a sprint and its stories in one call`, async () => {
    const { envelope } = await callTool(
      client,
      TOOL.PLAN_SPRINT,
      buildSprintPlanInput(),
    );
    const stories = await readStoriesOf(envelope.initiativeId as string);
    const events = await readActivityLog(world.workspaceId);

    expect(envelope.ok).toBe(true);
    expect(await countInitiativesOf(world.workspaceId)).toBe(2);
    expect(stories).toHaveLength(SPRINT_PLAN.stories.length);
    expect(stories.map(story => story.fricewType_code).sort()).toEqual(
      SPRINT_PLAN.stories.map(story => story.type).slice().sort(),
    );
    expect(events).toHaveLength(1);
  });

  /** The advertised schema is the boundary, so a bad type has to die before any row is written. */
  it(`${FUT.BAD_TYPE_REFUSED} refuses a story type outside the code list at the boundary`, async () => {
    const { isError } = await callTool(
      client,
      TOOL.PLAN_SPRINT,
      buildSprintPlanInput([...SPRINT_PLAN_WITH_BAD_TYPE.stories]),
    );

    expect(isError).toBe(true);
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
    expect(await countAllMilestones()).toBe(1);
  });

  /** A second call to render one page is the round trip the composed view exists to remove. */
  it(`${FUT.VIEW_IN_ONE_CALL} answers the whole view in one call`, async () => {
    await driveTool(client, TOOL.LOG_DEFECT, {
      story: STORY_REFERENCE,
      ...DEFECT_INPUT,
    });
    await driveTool(client, TOOL.RECORD_DECISION, {
      target: WORLD.WORKSPACE.slug,
      ...DECISION_INPUT,
    });

    const { envelope } = await callTool(client, TOOL.PROJECT_VIEW);
    const view = envelope.view as Record<string, unknown>;
    const sprints = view.initiatives as { milestones: { chain: unknown[] }[] }[];

    for (const key of VIEW_KEYS) expect(view).toHaveProperty(key);
    expect(view.defects).toHaveLength(1);
    expect(view.decisions).toHaveLength(1);
    expect((view.activities as unknown[]).length).toBeGreaterThan(0);
    expect(sprints[0].milestones[0].chain.length).toBeGreaterThan(0);
  });

  /** Interleaved writes would give two events one instant, and the register's order is its meaning. */
  it(`${FUT.CONCURRENT_WRITES} serializes concurrent writes into ordered events`, async () => {
    await setChainStates(world.milestoneId, TWO_STAGES_STARTABLE);

    const [first, second] = await Promise.all([
      callTool(client, TOOL.START_STAGE, {
        story: STORY_REFERENCE,
        stage: STAGE.DOCUMENTATION,
      }),
      callTool(client, TOOL.START_STAGE, {
        story: STORY_REFERENCE,
        stage: STAGE.PM_UPDATE,
      }),
    ]);
    const events = await readActivityLog(world.workspaceId);
    const stamps = events.map(event => event.occurredAt);

    expect(first.envelope.ok).toBe(true);
    expect(second.envelope.ok).toBe(true);
    expect(events).toHaveLength(2);
    expect(new Set(stamps).size).toBe(2);
    expect(stamps[0] < stamps[1]).toBe(true);
  });
});
