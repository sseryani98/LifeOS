import type cds from "@sap/cds";

import { CompleteStageVerb } from "../../../../mcp/verbs/completeStage.js";
import { StartStageVerb } from "../../../../mcp/verbs/startStage.js";
import type { VerbSuccess } from "../../../../mcp/verbs/shared/types.js";
import type { ChainScriptStep } from "../data/chainScripts.js";

import { buildVerbContext, expectSuccess } from "./verbHarness.js";

/**
 * Runs one scripted stage call through the real verb under the step's own
 * identity, refusing to continue on a rejection so an arrangement failure never
 * reads as the assertion's.
 * @param service The connected service.
 * @param story The story reference the script drives.
 * @param step The verb, stage and caller of this call.
 * @returns The success envelope it answered with.
 */
export const driveChainStep = async (
  service: cds.Service,
  story: string,
  step: ChainScriptStep,
): Promise<VerbSuccess> => {
  const context = buildVerbContext(service, step.actor);
  const verb = step.verb === "start" ? new StartStageVerb() : new CompleteStageVerb();
  return expectSuccess(await verb.run(context, { story, stage: step.stage }));
};

/**
 * Collapses each run of equal neighbours to one value, so a series of readings
 * taken after every call reads as the transitions it went through.
 * @param readings The readings, in the order they were taken.
 * @returns The readings with consecutive repeats removed.
 */
export const collapseRepeatedReadings = (readings: string[]): string[] => {
  return readings.filter((reading, index) => index === 0 || readings[index - 1] !== reading);
};

/**
 * Runs a whole script in order.
 * @param service The connected service.
 * @param story The story reference the script drives.
 * @param script The calls to make.
 * @returns Resolves once every call succeeded.
 */
export const driveChainScript = async (
  service: cds.Service,
  story: string,
  script: ChainScriptStep[],
): Promise<void> => {
  for (const step of script) await driveChainStep(service, story, step);
};
