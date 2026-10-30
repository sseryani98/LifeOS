import { CompleteStageVerb } from "./completeStage.js";
import { CompleteSubtaskVerb } from "./completeSubtask.js";
import { LogDefectVerb } from "./logDefect.js";
import { NextActionVerb } from "./nextAction.js";
import { PlanSprintVerb } from "./planSprint.js";
import { ProjectViewVerb } from "./projectView.js";
import { RecordDecisionVerb } from "./recordDecision.js";
import { RecordTestRunVerb } from "./recordTestRun.js";
import { ReopenStageVerb } from "./reopenStage.js";
import { ResolveDefectVerb } from "./resolveDefect.js";
import { StartStageVerb } from "./startStage.js";
import type { VerbDefinition } from "./shared/types.js";

/**
 * The exposed surface, exhaustive. There is no query tool, no raw-SQL tool and
 * no generic CRUD tool here on purpose: removing the escape hatch is what makes
 * the enforced path the only path.
 */
export class VerbRegistry {
  /** Every registered verb, in the order the transport lists them. */
  static readonly DEFINITIONS: readonly VerbDefinition[] = [
    new StartStageVerb(),
    new CompleteStageVerb(),
    new CompleteSubtaskVerb(),
    new ReopenStageVerb(),
    new LogDefectVerb(),
    new ResolveDefectVerb(),
    new RecordDecisionVerb(),
    new RecordTestRunVerb(),
    new PlanSprintVerb(),
    new NextActionVerb(),
    new ProjectViewVerb(),
  ];
}
