import { randomUUID } from "node:crypto";

import { DefectTitle } from "./defectTitle.js";
import { FRICEW, MIGRATION } from "./constants.js";
import type {
  DefectInsertRow,
  HierarchyRows,
  InitiativeInsertRow,
  InsertRow,
  MilestoneInsertRow,
  SnapshotCheckpoint,
  SnapshotDecision,
  SnapshotDefect,
  SnapshotInitiative,
  SnapshotStory,
  TestRunInsertRow,
} from "./types.js";

/** Translates the embedded ledgers into the rows TrackerService is handed. */
export class MigrationMapper {
  /**
   * Builds the three hierarchy rows the planner's work hangs off.
   * @returns The rows, with the Workspace's identifier for everything below it.
   */
  static toHierarchyRows(): HierarchyRows {
    const areaId = randomUUID();
    const engagementId = randomUUID();
    const workspaceId = randomUUID();
    return {
      workspaceId,
      area: { ID: areaId, name: MIGRATION.AREA_NAME },
      engagement: {
        ID: engagementId,
        name: MIGRATION.ENGAGEMENT_NAME,
        area_ID: areaId,
      },
      workspace: {
        ID: workspaceId,
        slug: MIGRATION.WORKSPACE.SLUG,
        name: MIGRATION.WORKSPACE.NAME,
        currentFocus: null,
        engagement_ID: engagementId,
      },
    };
  }

  /**
   * Maps the sprints in board order, positioned 10, 20, 30.
   * @param initiatives The sprints from the snapshot.
   * @param workspaceId The Workspace they belong to.
   * @returns One row per sprint, in the same order.
   */
  static toInitiativeRows(
    initiatives: SnapshotInitiative[],
    workspaceId: string,
  ): InitiativeInsertRow[] {
    return initiatives.map((initiative, index) => ({
      ID: randomUUID(),
      name: initiative.name,
      goal: initiative.goal,
      branch: initiative.branch,
      status_code: initiative.status,
      mergeCommit: initiative.mergeCommit,
      tag: initiative.tag,
      position: (index + 1) * MIGRATION.POSITION_STEP,
      workspace_ID: workspaceId,
    }));
  }

  /**
   * Maps the board rows, positioned in board order and restarting per sprint.
   * Only a finished story carries the creation flag, so only the open one gets a chain.
   * @param stories The board rows, in board order.
   * @param initiativeIds Each sprint's Initiative identifier, by sprint code.
   * @returns One row per story, in the same order.
   */
  static toMilestoneRows(
    stories: SnapshotStory[],
    initiativeIds: Map<string, string>,
  ): MilestoneInsertRow[] {
    const placed = new Map<string, number>();
    return stories.map(story => {
      const rank = (placed.get(story.sprint) ?? 0) + 1;
      placed.set(story.sprint, rank);
      return {
        storyId: story.story,
        fricewType_code: FRICEW.REMAP[story.boardType] ?? story.boardType,
        description: story.description,
        shipsUi: story.shipsUi,
        position: rank * MIGRATION.POSITION_STEP,
        initiative_ID: initiativeIds.get(story.sprint),
        ...(story.boardStatus === MIGRATION.BOARD_DONE
          ? { createdDone: true }
          : {}),
      };
    });
  }

  /**
   * Maps one log row. The log names no story, so none is inferred, and its dash
   * placeholder for "no resolution" loads as nothing.
   * @param defect The log row.
   * @param initiativeId The sprint it was logged against, absent when not loaded.
   * @param workspaceId The Workspace it belongs to.
   * @returns The Defect row.
   */
  static toDefectRow(
    defect: SnapshotDefect,
    initiativeId: string | undefined,
    workspaceId: string,
  ): DefectInsertRow {
    return {
      severity_code: defect.severity,
      status_code: defect.status,
      title: DefectTitle.deriveFromDescription(defect.description),
      description: defect.description,
      references: null,
      resolution:
        defect.resolution === MIGRATION.RESOLUTION_PLACEHOLDER
          ? null
          : defect.resolution,
      milestone_ID: null,
      initiative_ID: initiativeId ?? null,
      workspace_ID: workspaceId,
    };
  }

  /**
   * Maps one checkpoint decision, dated on the checkpoint rather than the load.
   * @param decision The decision and its recorded rationale.
   * @param checkpointDate The checkpoint's own date.
   * @param initiativeId The sprint the checkpoint closed.
   * @param workspaceId The Workspace it belongs to.
   * @returns The Decision row.
   */
  static toDecisionRow(
    decision: SnapshotDecision,
    checkpointDate: string,
    initiativeId: string | undefined,
    workspaceId: string,
  ): InsertRow {
    return {
      decision: decision.decision,
      rationale: decision.rationale,
      context: null,
      options: null,
      decidedAt: MigrationMapper._toMidnightUtc(checkpointDate),
      initiative_ID: initiativeId ?? null,
      milestone_ID: null,
      workspace_ID: workspaceId,
    };
  }

  /**
   * Maps the checkpoint's test run. It states no pending count and no duration,
   * so neither is invented.
   * @param checkpoint The checkpoint carrying the run and its date.
   * @param initiativeId The sprint the run gated.
   * @param workspaceId The Workspace it belongs to.
   * @returns The TestRun row.
   */
  static toTestRunRow(
    checkpoint: SnapshotCheckpoint,
    initiativeId: string | undefined,
    workspaceId: string,
  ): TestRunInsertRow {
    const { testRun } = checkpoint;
    return {
      total: testRun.total,
      passed: testRun.passed,
      failed: testRun.failed,
      pending: null,
      durationMs: null,
      linesPct: testRun.linesPct,
      branchesPct: testRun.branchesPct,
      failures: JSON.stringify(testRun.failures),
      executedAt: MigrationMapper._toMidnightUtc(checkpoint.date),
      task_ID: null,
      initiative_ID: initiativeId ?? null,
      workspace_ID: workspaceId,
    };
  }

  /**
   * Builds the checkpoint's narrative event, dated when it was written.
   * @param checkpoint The checkpoint carrying the prose and its date.
   * @param sprintName The name of the sprint the checkpoint closed.
   * @param workspaceId The Workspace it belongs to.
   * @returns The Activity row.
   */
  static toCheckpointActivityRow(
    checkpoint: SnapshotCheckpoint,
    sprintName: string | undefined,
    workspaceId: string,
  ): InsertRow {
    return {
      kind_code: MIGRATION.ACTIVITY_KIND.CHECKPOINT,
      actor_code: MIGRATION.ACTOR,
      target: `${MIGRATION.WORKSPACE.SLUG}${MIGRATION.TARGET_SEPARATOR}${sprintName}`,
      payload: JSON.stringify(checkpoint.prose),
      occurredAt: MigrationMapper._toMidnightUtc(checkpoint.date),
      workspace_ID: workspaceId,
    };
  }

  /**
   * Builds the load's own event, the one row recording that the cutover ran.
   * @param occurredAt When the load started.
   * @param workspaceId The Workspace being loaded.
   * @returns The Activity row.
   */
  static toMigrationActivityRow(
    occurredAt: string,
    workspaceId: string,
  ): InsertRow {
    return {
      kind_code: MIGRATION.ACTIVITY_KIND.MIGRATION,
      actor_code: MIGRATION.ACTOR,
      target: MIGRATION.WORKSPACE.SLUG,
      payload: null,
      occurredAt,
      workspace_ID: workspaceId,
    };
  }

  /**
   * Stores a source date, which carries no time of day, as that day's midnight UTC.
   * @param date The date, as YYYY-MM-DD.
   * @returns The timestamp.
   */
  private static _toMidnightUtc(date: string): string {
    return `${date}${MIGRATION.MIDNIGHT_UTC}`;
  }
}
