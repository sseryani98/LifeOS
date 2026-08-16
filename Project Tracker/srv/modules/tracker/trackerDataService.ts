import { ENTITIES } from "../shared/constants.js";

import type { ChainTaskRow } from "./types.js";

/** Every query the handler layer issues. No logic lives here. */
export class TrackerDataService {
  /**
   * Counts sibling Initiatives in the same Workspace carrying the same name.
   * @param workspaceId The Workspace the Initiative belongs to.
   * @param name The name being claimed.
   * @param excludeId An Initiative ID to ignore, for the update case.
   * @returns How many other Initiatives already hold that name.
   */
  async countInitiativesNamed(
    workspaceId: string,
    name: string,
    excludeId?: string,
  ): Promise<number> {
    const rows = (await SELECT.from(ENTITIES.INITIATIVE)
      .columns("ID")
      .where({ workspace_ID: workspaceId, name })) as Array<{ ID: string }>;
    return rows.filter(row => row.ID !== excludeId).length;
  }

  /**
   * Counts sibling Milestones in the same Initiative carrying the same story ID.
   * @param initiativeId The Initiative the Milestone belongs to.
   * @param storyId The story ID being claimed.
   * @param excludeId A Milestone ID to ignore, for the update case.
   * @returns How many other Milestones already hold that story ID.
   */
  async countMilestonesWithStoryId(
    initiativeId: string,
    storyId: string,
    excludeId?: string,
  ): Promise<number> {
    const rows = (await SELECT.from(ENTITIES.MILESTONE)
      .columns("ID")
      .where({ initiative_ID: initiativeId, storyId })) as Array<{
      ID: string;
    }>;
    return rows.filter(row => row.ID !== excludeId).length;
  }

  /**
   * Loads the chain rows of the given Milestones, with each Task's step kind
   * flattened on so the derivation needs no second read.
   * @param milestoneIds The Milestones whose chains are wanted.
   * @returns Every Task of those Milestones.
   */
  async readChainTasks(milestoneIds: string[]): Promise<ChainTaskRow[]> {
    if (milestoneIds.length === 0) return [];
    return (await SELECT.from(ENTITIES.TASK)
      .columns(
        "ID",
        "milestone_ID",
        "status_code",
        "step.kind_code as stepKind",
      )
      .where({ milestone_ID: { in: milestoneIds } })) as ChainTaskRow[];
  }
}
