import type cds from "@sap/cds";

import { ENTITIES } from "../shared/constants.js";

import type {
  ChainFacts,
  CreatorFacts,
  InitiativeRef,
  InsertRow,
  StoryFacts,
  WorkspaceRef,
} from "./types.js";

/**
 * Every query the migration issues. Writes go through the TrackerService
 * transaction so its create-handlers fire; reads join that transaction.
 */
export class MigrationDataService {
  private readonly tracker: cds.Transaction;

  /**
   * Binds the data access to one conversion's transaction.
   * @param tracker The TrackerService transaction the conversion runs in.
   */
  constructor(tracker: cds.Transaction) {
    this.tracker = tracker;
  }

  /**
   * Counts every row of one entity.
   * @param entity The service entity to count.
   * @returns How many rows it holds.
   */
  async countRows(entity: string): Promise<number> {
    const row = (await SELECT.one
      .from(entity)
      .columns("count(1) as total")) as {
      total: number;
    };
    return Number(row.total);
  }

  /**
   * Writes rows through TrackerService, so its guards and create-handlers run.
   * @param entity The service entity to write.
   * @param rows The rows to write.
   * @returns Resolves once every row is written.
   */
  async insertRows(entity: string, rows: InsertRow[]): Promise<void> {
    await this.tracker.run(INSERT.into(entity).entries(rows));
  }

  /**
   * Reads every Initiative, whatever its Workspace, for the ordering assertion.
   * @returns The sprints.
   */
  async readAllInitiatives(): Promise<InitiativeRef[]> {
    return (await SELECT.from(ENTITIES.INITIATIVE).columns(
      "ID",
      "name",
      "position",
    )) as InitiativeRef[];
  }

  /**
   * Reads every Subtask with its story's identifier.
   * @returns The Subtask rows.
   */
  async readChainSubtasks(): Promise<ChainFacts[]> {
    return (await SELECT.from(ENTITIES.SUBTASK).columns(
      "task.milestone.storyId as storyId",
      "step_code",
      "status_code",
    )) as ChainFacts[];
  }

  /**
   * Reads every Task with its story's identifier.
   * @returns The Task rows.
   */
  async readChainTasks(): Promise<ChainFacts[]> {
    return (await SELECT.from(ENTITIES.TASK).columns(
      "milestone.storyId as storyId",
      "step_code",
      "status_code",
    )) as ChainFacts[];
  }

  /**
   * Reads who created every row of one entity.
   * @param entity The service entity to read.
   * @returns Each row's identifier and creator.
   */
  async readCreators(entity: string): Promise<CreatorFacts[]> {
    return (await SELECT.from(entity).columns(
      "ID",
      "createdBy",
    )) as CreatorFacts[];
  }

  /**
   * Reads every Initiative of a Workspace.
   * @param workspaceId The Workspace whose sprints are wanted.
   * @returns The sprints.
   */
  async readInitiatives(workspaceId: string): Promise<InitiativeRef[]> {
    return (await SELECT.from(ENTITIES.INITIATIVE)
      .columns("ID", "name", "position")
      .where({ workspace_ID: workspaceId })) as InitiativeRef[];
  }

  /**
   * Reads every Milestone's type, position and sprint.
   * @returns The stories.
   */
  async readStoryFacts(): Promise<StoryFacts[]> {
    return (await SELECT.from(ENTITIES.MILESTONE).columns(
      "ID",
      "storyId",
      "fricewType_code",
      "position",
      "initiative_ID",
    )) as StoryFacts[];
  }

  /**
   * Reads a Workspace by its slug.
   * @param slug The slug wanted.
   * @returns The Workspace, or null when none carries the slug.
   */
  async readWorkspaceBySlug(slug: string): Promise<WorkspaceRef | null> {
    return (await SELECT.one
      .from(ENTITIES.WORKSPACE)
      .columns("ID", "slug")
      .where({ slug })) as WorkspaceRef | null;
  }
}
