import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type cds from "@sap/cds";

import { createTrackerMcpServer } from "../../../mcp/server.js";
import { FRICEW_TYPES } from "../../../mcp/verbs/shared/constants.js";
import {
  ACTORS,
  DEFECT_INPUT,
  SPRINT_PLAN_WITH_BAD_TYPE,
  STORY_REFERENCE,
  UNRESOLVABLE,
  WORLD,
} from "../../shared/data/world.js";
import { readActivityLog } from "../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  type SeededWorld,
} from "../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../shared/support/trackerHarness.js";
import { buildSprintPlanInput } from "../../shared/support/verbInputs.js";
import {
  EXPECTED_TOOL_NAMES,
  EXPECTED_TOOLS,
  FORBIDDEN_TOOLS,
  FRICEW_SCHEMA_PATH,
  RETRY_OUTCOME,
  WRITE_TOOL_KINDS,
} from "../data/toolSurface.js";
import { arrangeHappyPath } from "../support/happyPath.js";
import {
  buildFlakyService,
  connectClientTo,
  connectInMemoryClient,
  readSchemaEnum,
  readToolEnvelope,
} from "../support/mcpHarness.js";

describe("the exposed tool surface", () => {
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

  /** The list is the escape hatch's absence made visible; a twelfth tool is a second write path. */
  it("advertises exactly the eleven verbs and no generic data tool", async () => {
    const listed = await client.listTools();
    const names = listed.tools.map(tool => tool.name);

    expect(names).toHaveLength(EXPECTED_TOOL_NAMES.length);
    expect(names.sort()).toEqual([...EXPECTED_TOOL_NAMES].sort());
    for (const forbidden of FORBIDDEN_TOOLS) {
      expect(names).not.toContain(forbidden);
    }
  });

  /** A host that auto-approves read-only tools runs a mislabelled write verb without asking. */
  it("advertises only the two read verbs as read-only", async () => {
    const listed = await client.listTools();

    for (const expected of EXPECTED_TOOLS) {
      const tool = listed.tools.find(
        candidate => candidate.name === expected.name,
      );
      expect(tool?.annotations?.readOnlyHint).toBe(expected.readOnly);
    }
  });

  /** Bound to a sibling verb a tool ships green: only its own activity kind tells them apart. */
  it.each(Object.entries(WRITE_TOOL_KINDS))(
    "runs %s through to the verb that emits %s",
    async (tool, kind) => {
      const args = await arrangeHappyPath(client, tool);

      const result = await client.callTool({ name: tool, arguments: args });
      const events = await readActivityLog(world.workspaceId);

      expect(result.isError).toBeUndefined();
      expect(events.at(-1)?.kind_code).toBe(kind);
    },
  );

  /** Bound to the other read verb, next_action would answer a whole project view. */
  it("answers next_action from the next-action verb alone", async () => {
    const result = await client.callTool({
      name: "next_action",
      arguments: {},
    });
    const envelope = readToolEnvelope(result);

    expect(result.isError).toBeUndefined();
    expect(envelope.nextAction).toBeTruthy();
    expect(envelope.view).toBeUndefined();
  });

  /** The one-call read surface is the whole page; bound elsewhere it answers nothing to render. */
  it("answers project_view with the composed view", async () => {
    const result = await client.callTool({
      name: "project_view",
      arguments: { workspace: WORLD.WORKSPACE.slug },
    });
    const envelope = readToolEnvelope(result);

    expect(result.isError).toBeUndefined();
    expect(envelope.view).toBeTruthy();
  });

  /** The advertised schema is where the six codes are declared; drop the enum and any type is taken. */
  it("declares the FRICEW code list on the sprint-planning tool", async () => {
    const listed = await client.listTools();
    const tool = listed.tools.find(
      candidate => candidate.name === FRICEW_SCHEMA_PATH.TOOL,
    );

    const result = await client.callTool({
      name: FRICEW_SCHEMA_PATH.TOOL,
      arguments: buildSprintPlanInput([...SPRINT_PLAN_WITH_BAD_TYPE.stories]),
    });

    expect(
      readSchemaEnum(tool, FRICEW_SCHEMA_PATH.PROPERTY, FRICEW_SCHEMA_PATH.MEMBER),
    ).toEqual([...FRICEW_TYPES]);
    expect(result.isError).toBe(true);
  });

  /** Invert the envelope mapping and every successful call reads to a client as an error. */
  it("flags a rejected envelope as an error and a successful one as not", async () => {
    const refused = await client.callTool({
      name: "next_action",
      arguments: { story: UNRESOLVABLE.STORY },
    });
    const answered = await client.callTool({
      name: "next_action",
      arguments: {},
    });

    expect(refused.isError).toBe(true);
    expect(readToolEnvelope(refused).status).toBe(404);
    expect(answered.isError).toBeUndefined();
    expect(readToolEnvelope(answered).ok).toBe(true);
  });

  /** A write that died on a dropped socket must be retried once, not reported as a lost store. */
  it("reconnects once and answers from the retried transaction", async () => {
    const flaky = buildFlakyService(RETRY_OUTCOME);
    let reconnects = 0;
    const retryClient = await connectClientTo(
      createTrackerMcpServer(
        { service: flaky.service, actor: ACTORS.IMPLEMENTER },
        async () => {
          reconnects += 1;
        },
      ),
    );

    const result = await retryClient.callTool({
      name: "log_defect",
      arguments: { story: STORY_REFERENCE, ...DEFECT_INPUT },
    });

    expect(reconnects).toBe(1);
    expect(flaky.attempts()).toBe(2);
    expect(result.isError).toBeUndefined();
    expect(readToolEnvelope(result).ok).toBe(true);
  });

  /** Retrying a methodology answer runs the write twice; only a lost store may be retried. */
  it("does not reconnect when the failure is an answer rather than a fault", async () => {
    let reconnects = 0;
    const guardedClient = await connectClientTo(
      createTrackerMcpServer({ service, actor: ACTORS.IMPLEMENTER }, async () => {
        reconnects += 1;
      }),
    );

    const result = await guardedClient.callTool({
      name: "next_action",
      arguments: { story: UNRESOLVABLE.STORY },
    });

    expect(result.isError).toBe(true);
    expect(reconnects).toBe(0);
  });
});
