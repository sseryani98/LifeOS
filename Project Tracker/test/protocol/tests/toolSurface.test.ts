import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type cds from "@sap/cds";

import { TrackerMcpServer } from "../../../mcp/server.js";
import {
  ACTORS,
  DEFECT_INPUT,
  NEGATIVE_COUNT_TEST_RUN_METRICS,
  SPRINT_PLAN_WITH_BAD_TYPE,
  STORY_REFERENCE,
  UNRESOLVABLE,
  WORLD,
} from "../../shared/data/world.js";
import {
  countInitiativesOf,
  readActivityLog,
  readTestRunsOf,
} from "../../shared/support/readTracker.js";
import {
  clearWorld,
  seedCanonicalWorld,
  type SeededWorld,
} from "../../shared/support/seedWorld.js";
import {
  connectTrackerService,
  trackerServer,
} from "../../shared/support/trackerHarness.js";
import {
  buildReopenStageInput,
  buildSprintPlanInput,
  buildWorkspaceTestRunInputWithMetrics,
} from "../../shared/support/verbInputs.js";
import {
  CONCURRENT_READS,
  DESCRIPTION_FLOOR,
  ENUM_SCHEMA_PATHS,
  EXPECTED_CODE_LISTS,
  EXPECTED_TOOL_NAMES,
  EXPECTED_TOOLS,
  FORBIDDEN_TOOLS,
  INSTRUCTIONS_MARKERS,
  MANIFEST_VERSION,
  NON_EMPTY_ARRAY_PATHS,
  NON_NEGATIVE_METRIC_PATHS,
  RETRY_OUTCOME,
  UNKNOWN_ARGUMENT,
  WRITE_TOOL_KINDS,
} from "../data/toolSurface.js";
import { arrangeHappyPath } from "../support/happyPath.js";
import {
  buildFlakyService,
  connectClientTo,
  connectInMemoryClient,
  readSchemaEnum,
  readSchemaMinimum,
  readSchemaMinItems,
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

  // The SDK guide prescribes closing what a suite opened, client before server.
  // Harmless while one suite runs; a leaked transport is what keeps a runner
  // alive after the last assertion.
  afterAll(async () => {
    await client.close();
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

  /** The advertised schema is where the codes are declared; drop an enum and any value is taken. */
  it.each(ENUM_SCHEMA_PATHS)(
    "declares $TOOL's code list on the advertised schema",
    async path => {
      const listed = await client.listTools();
      const tool = listed.tools.find(
        candidate => candidate.name === path.TOOL,
      );

      const declared = readSchemaEnum(
        tool,
        path.PROPERTY,
        "MEMBER" in path ? path.MEMBER : undefined,
      );

      expect(declared).toEqual(EXPECTED_CODE_LISTS[path.TOOL]);
    },
  );

  /** Drop the enum and a story planned with an invented type is written rather than refused. */
  it("refuses a planned story whose type is not a FRICEW code", async () => {
    const result = await client.callTool({
      name: "plan_sprint",
      arguments: buildSprintPlanInput([...SPRINT_PLAN_WITH_BAD_TYPE.stories]),
    });

    expect(result.isError).toBe(true);
  });

  /** The advertised minimum is what tells a host, before it calls, that a sprint needs a story. */
  it.each(NON_EMPTY_ARRAY_PATHS)(
    "declares $TOOL's $PROPERTY as non-empty on the advertised schema",
    async path => {
      const listed = await client.listTools();
      const tool = listed.tools.find(
        candidate => candidate.name === path.TOOL,
      );

      expect(readSchemaMinItems(tool, path.PROPERTY)).toBe(1);
    },
  );

  /** A client builds its call from the advertised schema, so a floor the schema hides is one it will cross. */
  it.each(NON_NEGATIVE_METRIC_PATHS)(
    "declares $TOOL's $MEMBER count non-negative on the advertised schema",
    async path => {
      const listed = await client.listTools();
      const tool = listed.tools.find(
        candidate => candidate.name === path.TOOL,
      );

      expect(readSchemaMinimum(tool, path.PROPERTY, path.MEMBER)).toBe(0);
    },
  );

  /** A negative count can balance an over-total one, so the schema must refuse it before any row is written. */
  it("refuses a test run carrying a negative count and writes nothing", async () => {
    const result = await client.callTool({
      name: "record_test_run",
      arguments: buildWorkspaceTestRunInputWithMetrics(
        NEGATIVE_COUNT_TEST_RUN_METRICS,
      ),
    });
    const events = await readActivityLog(world.workspaceId);

    expect(result.isError).toBe(true);
    expect(await readTestRunsOf(world.workspaceId)).toHaveLength(0);
    expect(events).toEqual([]);
  });

  /** A sprint is an Initiative and its stories; an empty plan wrote an Active sprint with none, and its event. */
  it("refuses a sprint planned with no stories and writes nothing", async () => {
    const result = await client.callTool({
      name: "plan_sprint",
      arguments: buildSprintPlanInput([]),
    });
    const events = await readActivityLog(world.workspaceId);

    expect(result.isError).toBe(true);
    expect(await countInitiativesOf(world.workspaceId)).toBe(1);
    expect(events).toEqual([]);
  });

  /** A misspelled argument was accepted in silence, so the caller's typo read as a success. */
  it.each(EXPECTED_TOOL_NAMES)(
    "refuses an argument %s never declared",
    async tool => {
      const result = await client.callTool({
        name: tool,
        arguments: { [UNKNOWN_ARGUMENT.key]: UNKNOWN_ARGUMENT.value },
      });

      expect(result.isError).toBe(true);
    },
  );

  /** Registering a resource or a prompt tomorrow would otherwise break no test at all. */
  it("advertises tools as its only primitive", () => {
    const capabilities = client.getServerCapabilities() ?? {};

    expect(capabilities.tools).toBeDefined();
    expect(capabilities.resources).toBeUndefined();
    expect(capabilities.prompts).toBeUndefined();
  });

  /** The one place a client is told the verbs are the only write path, rather than one tool's job. */
  it("hands the client its operating instructions at initialize", () => {
    const instructions = client.getInstructions() ?? "";

    for (const marker of INSTRUCTIONS_MARKERS) {
      expect(instructions.toLowerCase()).toContain(marker);
    }
  });

  /** Emptied, stubbed or pasted from a sibling, a description is what picks the wrong tool. */
  it("describes every tool distinctly and substantially", async () => {
    const listed = await client.listTools();
    const descriptions = listed.tools.map(tool => tool.description ?? "");

    for (const description of descriptions) {
      expect(description.length).toBeGreaterThanOrEqual(DESCRIPTION_FLOOR);
    }
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  /** Two versions nobody compares drift apart indefinitely, and each looks right on its own. */
  it("advertises the version the manifest declares", () => {
    const advertised = client.getServerVersion();

    expect(advertised?.version).toBe(MANIFEST_VERSION);
  });

  /** Optional in the type and unasserted, remediation could stop being populated unnoticed. */
  it("carries remediation naming the verb to call first", async () => {
    const result = await client.callTool({
      name: "reopen_stage",
      arguments: buildReopenStageInput(),
    });
    const envelope = readToolEnvelope(result);

    expect(result.isError).toBe(true);
    expect(envelope.remediation).toContain("start_stage");
  });

  /** reconnect reassigns the context's service, so overlapping calls share mutable state. */
  it("answers every call when several overlap on one server", async () => {
    const calls = Array.from({ length: CONCURRENT_READS }, () =>
      client.callTool({ name: "next_action", arguments: {} }),
    );

    const results = await Promise.all(calls);

    for (const result of results) {
      expect(result.isError).toBeUndefined();
      expect(readToolEnvelope(result).ok).toBe(true);
    }
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
      TrackerMcpServer.createServer(
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
    await retryClient.close();
  });

  /** Retrying a methodology answer runs the write twice; only a lost store may be retried. */
  it("does not reconnect when the failure is an answer rather than a fault", async () => {
    let reconnects = 0;
    const guardedClient = await connectClientTo(
      TrackerMcpServer.createServer({ service, actor: ACTORS.IMPLEMENTER }, async () => {
        reconnects += 1;
      }),
    );

    const result = await guardedClient.callTool({
      name: "next_action",
      arguments: { story: UNRESOLVABLE.STORY },
    });

    expect(result.isError).toBe(true);
    expect(reconnects).toBe(0);
    await guardedClient.close();
  });
});
