import { definition as completeStage } from "./completeStage.js";
import { definition as completeSubtask } from "./completeSubtask.js";
import { definition as logDefect } from "./logDefect.js";
import { definition as nextAction } from "./nextAction.js";
import { definition as planSprint } from "./planSprint.js";
import { definition as projectView } from "./projectView.js";
import { definition as recordDecision } from "./recordDecision.js";
import { definition as recordTestRun } from "./recordTestRun.js";
import { definition as reopenStage } from "./reopenStage.js";
import { definition as resolveDefect } from "./resolveDefect.js";
import { definition as startStage } from "./startStage.js";
import type { VerbDefinition } from "./shared/types.js";

/**
 * The exposed surface, exhaustive. There is no query tool, no raw-SQL tool and
 * no generic CRUD tool here on purpose: removing the escape hatch is what makes
 * the enforced path the only path.
 */
export const VERB_DEFINITIONS: VerbDefinition[] = [
  startStage,
  completeStage,
  completeSubtask,
  reopenStage,
  logDefect,
  resolveDefect,
  recordDecision,
  recordTestRun,
  planSprint,
  nextAction,
  projectView,
];
