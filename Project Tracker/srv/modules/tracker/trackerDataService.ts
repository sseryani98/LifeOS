import { ENTITIES } from "../shared/constants.js";

import type {
  ChainTaskRow,
  DefectPayload,
  InitiativePayload,
  LibraryStepRow,
  MilestonePayload,
  SubtaskInsertRow,
  TaskInsertRow,
  TestRunPayload,
} from "./types.js";

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
   * Counts other Milestones anywhere in the Workspace carrying the same story
   * ID, across every Initiative of it.
   * @param workspaceId The Workspace the Milestone's Initiative belongs to.
   * @param storyId The story ID being claimed.
   * @param excludeId A Milestone ID to ignore, for the update case.
   * @returns How many other Milestones already hold that story ID.
   */
  async countMilestonesWithStoryId(
    workspaceId: string,
    storyId: string,
    excludeId?: string,
  ): Promise<number> {
    const rows = (await SELECT.from(ENTITIES.MILESTONE)
      .columns("ID")
      .where({ storyId, "initiative.workspace_ID": workspaceId })) as Array<{
        ID: string;
      }>;
    return rows.filter(row => row.ID !== excludeId).length;
  }

  /**
   * Writes a story's materialised stages. An empty list writes nothing.
   * @param rows The Task rows to write.
   * @returns Resolves once every row is written.
   */
  async insertChainTasks(rows: TaskInsertRow[]): Promise<void> {
    await INSERT.into(ENTITIES.TASK).entries(rows);
  }

  /**
   * Writes a story's materialised workflow steps.
   * @param rows The Subtask rows to write.
   * @returns Resolves once every row is written.
   */
  async insertChainSubtasks(rows: SubtaskInsertRow[]): Promise<void> {
    await INSERT.into(ENTITIES.SUBTASK).entries(rows);
  }

  /**
   * Reads the Workspace an Initiative belongs to.
   * @param initiativeId The Initiative wanted.
   * @returns The Workspace ID, or undefined when no such Initiative exists.
   */
  async readInitiativeWorkspaceId(
    initiativeId: string,
  ): Promise<string | undefined> {
    const rows = (await SELECT.from(ENTITIES.INITIATIVE)
      .columns("workspace_ID")
      .where({ ID: initiativeId })) as Array<{ workspace_ID: string }>;
    return rows[0]?.workspace_ID;
  }

  /**
   * Reads the whole methodology library, stages and workflow steps alike, in
   * library position order.
   * @returns Every library step.
   */
  async readLibrarySteps(): Promise<LibraryStepRow[]> {
    return (await SELECT.from(ENTITIES.METHODOLOGY_STEP)
      .columns(
        "code",
        "kind_code",
        "conditional",
        "parent_code",
        "position",
        "requiresHuman",
      )
      .orderBy("position", "code")) as LibraryStepRow[];
  }

  /**
   * Reads the facts an Initiative currently holds that a partial update has to
   * be judged against - the completion pair and the name/workspace pair the
   * duplicate rule counts on. One read serves both rules.
   * @param initiativeId The Initiative being written.
   * @returns The stored fields, or undefined when no row exists.
   */
  async readInitiativeRow(
    initiativeId: string,
  ): Promise<InitiativePayload | undefined> {
    const rows = (await SELECT.from(ENTITIES.INITIATIVE)
      .columns("status_code", "mergeCommit", "tag", "name", "workspace_ID")
      .where({ ID: initiativeId })) as InitiativePayload[];
    return rows[0];
  }

  /**
   * Reads the identifying pair a Milestone currently holds, so a partial update
   * carrying only one half is still counted against its real siblings.
   * @param milestoneId The Milestone being written.
   * @returns The stored story ID and Initiative, or undefined when no row exists.
   */
  async readMilestoneRow(
    milestoneId: string,
  ): Promise<MilestonePayload | undefined> {
    const rows = (await SELECT.from(ENTITIES.MILESTONE)
      .columns("storyId", "initiative_ID")
      .where({ ID: milestoneId })) as MilestonePayload[];
    return rows[0];
  }

  /**
   * Reads the two links a Defect is scoped by, so a patch nulling one is judged
   * against the other as stored.
   * @param defectId The Defect being written.
   * @returns The stored links, or undefined when no row exists.
   */
  async readDefectScopeRow(
    defectId: string,
  ): Promise<DefectPayload | undefined> {
    const rows = (await SELECT.from(ENTITIES.DEFECT)
      .columns("milestone_ID", "initiative_ID")
      .where({ ID: defectId })) as DefectPayload[];
    return rows[0];
  }

  /**
   * Reads the two links a TestRun is scoped by and the counts its total bounds,
   * so a patch carrying one half of either rule is judged against the other.
   * @param testRunId The TestRun being written.
   * @returns The stored links and counts, or undefined when no row exists.
   */
  async readTestRunGuardRow(
    testRunId: string,
  ): Promise<TestRunPayload | undefined> {
    const rows = (await SELECT.from(ENTITIES.TEST_RUN)
      .columns("task_ID", "initiative_ID", "total", "passed", "failed", "pending")
      .where({ ID: testRunId })) as TestRunPayload[];
    return rows[0];
  }

  /**
   * Loads the chain rows of the given Milestones, each with the kind stored on
   * the Task itself rather than its library step's, which may since have changed.
   * @param milestoneIds The Milestones whose chains are wanted.
   * @returns Every Task of those Milestones.
   */
  async readChainTasks(milestoneIds: string[]): Promise<ChainTaskRow[]> {
    if (milestoneIds.length === 0) return [];
    return (await SELECT.from(ENTITIES.TASK)
      .columns("ID", "milestone_ID", "status_code", "kind_code as stepKind")
      .where({ milestone_ID: { in: milestoneIds } })) as ChainTaskRow[];
  }
}
