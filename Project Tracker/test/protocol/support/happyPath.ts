import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

import {
  OPEN_STEP,
  REOPEN_REASON,
  STAGE,
} from "../../integration/tracker/data/chainStates.js";
import {
  DECISION_INPUT,
  DEFECT_INPUT,
  DEFECT_RESOLUTION,
  STORY_REFERENCE,
  WORLD,
} from "../../shared/data/world.js";
import {
  buildSprintPlanInput,
  buildWorkspaceTestRunInput,
} from "../../shared/support/verbInputs.js";

import { readToolEnvelope } from "./mcpHarness.js";

/** The stage every chain-shaped happy path drives, on the canonical story. */
const FIRST_STAGE = { story: STORY_REFERENCE, stage: STAGE.BUILD };

/**
 * Puts the world in the state one tool's happy path needs and hands back the
 * arguments it takes. Every prerequisite is driven through the tools themselves,
 * so the arrangement never depends on a binding the assertion is about to check.
 * @param client The connected client.
 * @param tool The tool about to be called.
 * @returns The arguments that tool should succeed with.
 */
export async function arrangeHappyPath(
  client: Client,
  tool: string,
): Promise<Record<string, unknown>> {
  switch (tool) {
    case "complete_stage":
      await _driveTool(client, "start_stage", { ...FIRST_STAGE });
      return { ...FIRST_STAGE };
    case "complete_subtask":
      await _driveTool(client, "start_stage", { ...FIRST_STAGE });
      return { ...FIRST_STAGE, subtask: OPEN_STEP };
    case "reopen_stage":
      await _driveTool(client, "start_stage", { ...FIRST_STAGE });
      await _driveTool(client, "complete_stage", { ...FIRST_STAGE });
      return { ...FIRST_STAGE, reason: REOPEN_REASON };
    case "log_defect":
      return { story: STORY_REFERENCE, ...DEFECT_INPUT };
    case "resolve_defect":
      return _arrangeResolveDefect(client);
    case "record_decision":
      return { target: WORLD.WORKSPACE.slug, ...DECISION_INPUT };
    case "record_test_run":
      return buildWorkspaceTestRunInput();
    case "plan_sprint":
      return buildSprintPlanInput();
    default:
      return { ...FIRST_STAGE };
  }
}

/**
 * Logs the defect a resolution needs something to close.
 * @param client The connected client.
 * @returns The arguments resolve_defect should succeed with.
 */
async function _arrangeResolveDefect(
  client: Client,
): Promise<Record<string, unknown>> {
  const logged = await _driveTool(client, "log_defect", {
    story: STORY_REFERENCE,
    ...DEFECT_INPUT,
  });
  return { defect: logged.defectId as string, resolution: DEFECT_RESOLUTION };
}

/**
 * Calls one tool as a prerequisite, refusing to continue on a rejection so an
 * arrangement failure never reads as the assertion's failure.
 * @param client The connected client.
 * @param name The tool to call.
 * @param args The arguments to call it with.
 * @returns The success envelope it answered with.
 */
async function _driveTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const envelope = readToolEnvelope(
    await client.callTool({ name, arguments: args }),
  );
  if (envelope.ok !== true) {
    throw new Error(`Arranging "${name}" failed: ${String(envelope.message)}`);
  }
  return envelope;
}
