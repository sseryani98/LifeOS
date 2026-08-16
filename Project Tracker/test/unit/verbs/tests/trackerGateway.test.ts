import { TrackerGateway } from "../../../../mcp/verbs/shared/trackerGateway.js";
import {
  ACTIVITY_EVENTS,
  INITIATIVE_ROWS,
  QUEUE_ROWS,
  WORKSPACE_ROWS,
} from "../data/verbFixtures.js";
import {
  buildRecordingRunner,
  readInsertedEntries,
} from "../support/fakeRunner.js";

const ACTOR = "implementer";
const STAMP = "2026-08-16T10:00:00.000Z";

describe("the verb layer's data access", () => {
  /** A payload is JSON on the row and absent when there is none, never the string "undefined". */
  it("encodes an event payload and leaves it null when there is none", async () => {
    const runner = buildRecordingRunner();
    const gateway = new TrackerGateway(runner);

    await gateway.insertActivity(ACTIVITY_EVENTS.BARE, ACTOR, STAMP);
    await gateway.insertActivity(ACTIVITY_EVENTS.WITH_PAYLOAD, ACTOR, STAMP);
    const [bare] = readInsertedEntries(runner.statements[0]);
    const [carried] = readInsertedEntries(runner.statements[1]);

    expect(bare.payload).toBeNull();
    expect(bare.actor_code).toBe(ACTOR);
    expect(bare.occurredAt).toBe(STAMP);
    expect(JSON.parse(carried.payload as string)).toEqual(
      ACTIVITY_EVENTS.WITH_PAYLOAD.payload,
    );
  });

  /** Every insert stamps its own key, so the caller has an identifier without reading the row back. */
  it("returns the identifier it wrote for each created row", async () => {
    const gateway = new TrackerGateway(buildRecordingRunner());

    const defectId = await gateway.insertDefect({});
    const decisionId = await gateway.insertDecision({});
    const initiativeId = await gateway.insertInitiative({});
    const milestoneId = await gateway.insertMilestone({});

    for (const id of [defectId, decisionId, initiativeId, milestoneId]) {
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  /** A workspace with no sprints has no stories, and asking for them must not query for nothing. */
  it("answers with no stories when a workspace holds no sprints", async () => {
    const runner = buildRecordingRunner([[]]);
    const gateway = new TrackerGateway(runner);

    expect(await gateway.readMilestones("workspace-1")).toEqual([]);
    expect(runner.statements).toHaveLength(1);
  });

  /** The queue drives what to do next, so its order is the answer rather than a presentation detail. */
  it("orders the queue by sprint, then story, then stage", async () => {
    const gateway = new TrackerGateway(buildRecordingRunner([QUEUE_ROWS]));

    const queue = await gateway.readTaskQueue("workspace-1");

    expect(queue.map(row => row.ID)).toEqual(["queue-a", "queue-c", "queue-b"]);
  });

  /** The candidate resolver walks workspaces in a fixed order, so the answer cannot depend on insert order. */
  it("orders workspaces by slug and sprints by position", async () => {
    const gateway = new TrackerGateway(
      buildRecordingRunner([WORKSPACE_ROWS, INITIATIVE_ROWS]),
    );

    const workspaces = await gateway.readWorkspaces();
    const initiatives = await gateway.readInitiatives("workspace-1");

    expect(workspaces.map(row => row.slug)).toEqual([
      "financial-planner",
      "project-tracker",
    ]);
    expect(initiatives.map(row => row.position)).toEqual([10, 20]);
  });

  /** A single-row read has to answer undefined rather than throw, so the caller can reject with its own key. */
  it("answers undefined when a single-row read finds nothing", async () => {
    const gateway = new TrackerGateway(buildRecordingRunner([[], [], [], []]));

    expect(await gateway.readWorkspaceBySlug("nope")).toBeUndefined();
    expect(await gateway.readDefect("nope")).toBeUndefined();
    expect(await gateway.readInitiativeByName("nope", "nope")).toBeUndefined();
    expect(await gateway.readActiveInitiative("nope")).toBeUndefined();
  });

  /** Patches are expressed as a set on one key, or an update could reach rows nobody named. */
  it("patches exactly the row it was given", async () => {
    const runner = buildRecordingRunner();
    const gateway = new TrackerGateway(runner);

    await gateway.updateTask("task-1", { status_code: "complete" });
    await gateway.updateSubtask("sub-1", { status_code: "complete" });
    await gateway.updateDefect("defect-1", { status_code: "Closed" });

    expect(runner.statements).toHaveLength(3);
    for (const statement of runner.statements) {
      expect(JSON.stringify(statement)).toContain("status_code");
      expect(JSON.stringify(statement)).toContain("where");
    }
  });
});
