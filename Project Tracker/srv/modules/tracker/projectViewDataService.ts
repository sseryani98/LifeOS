import { CODES, ENTITIES } from "../shared/constants.js";

import { NEXT_ACTION } from "./constants.js";
import type { CompletionEventRow, StageFactRow } from "./types.js";

/** Every query the project-view sections issue. No logic lives here. */
export class ProjectViewDataService {
  /**
   * Reads the completion events filed against the given stage targets, newest
   * first, so the first event per target is the latest completion.
   * @param targets The `{workspace}/{story}#{stage}` targets wanted.
   * @returns The matching completion events.
   */
  async readCompletionEvents(targets: string[]): Promise<CompletionEventRow[]> {
    return (await SELECT.from(ENTITIES.ACTIVITY)
      .columns("target", "actor_code")
      .where({
        kind_code: CODES.ACTIVITY_KINDS.STAGE_COMPLETED,
        target: { in: targets },
      })
      .orderBy("occurredAt desc")) as CompletionEventRow[];
  }

  /**
   * Reads the stages with the given identifiers.
   * @param taskIds The stages wanted.
   * @returns Their facts.
   */
  async readStagesByIds(taskIds: string[]): Promise<StageFactRow[]> {
    return (await SELECT.from(ENTITIES.TASK)
      .columns(...NEXT_ACTION.STAGE_FACT_COLUMNS)
      .where({ ID: { in: taskIds } })) as StageFactRow[];
  }

  /**
   * Reads every stage of the given stories, closed ones included, because a
   * tier and a blocker are judged against the whole chain.
   * @param milestoneIds The stories wanted.
   * @returns Their stages' facts.
   */
  async readStagesOfMilestones(
    milestoneIds: string[],
  ): Promise<StageFactRow[]> {
    return (await SELECT.from(ENTITIES.TASK)
      .columns(...NEXT_ACTION.STAGE_FACT_COLUMNS)
      .where({ milestone_ID: { in: milestoneIds } })) as StageFactRow[];
  }

  /**
   * Reads every stage of every story in one workspace.
   * @param workspaceId The workspace wanted.
   * @returns Its stages' facts.
   */
  async readStagesOfWorkspace(workspaceId: string): Promise<StageFactRow[]> {
    return (await SELECT.from(ENTITIES.TASK)
      .columns(...NEXT_ACTION.STAGE_FACT_COLUMNS)
      .where({
        "milestone.initiative.workspace_ID": workspaceId,
      })) as StageFactRow[];
  }
}
