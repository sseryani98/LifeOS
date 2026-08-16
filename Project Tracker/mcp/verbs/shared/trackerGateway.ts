import { randomUUID } from "node:crypto";

import { ENTITIES } from "../../../srv/modules/shared/constants.js";

import type {
  ActivityEvent,
  ChainRow,
  DefectRow,
  InitiativeRow,
  MilestoneRow,
  QueryRunner,
  SubtaskRow,
  WorkspaceRow,
} from "./types.js";

/** The columns the queue is ordered by, outermost first. */
const QUEUE_ORDER = [
  "initiativePosition",
  "milestonePosition",
  "stepPosition",
] as const;

/**
 * Every statement the verb layer issues, in one place. It holds no rules: a
 * verb decides what to write, this decides how the write is expressed.
 */
export class TrackerGateway {
  private readonly runner: QueryRunner;

  /**
   * Binds the gateway to a runner.
   * @param runner The connected service, or a transaction opened on it.
   */
  constructor(runner: QueryRunner) {
    this.runner = runner;
  }

  /**
   * Writes one activity event.
   * @param event The event to record.
   * @param actor The calling agent's identity.
   * @param occurredAt The server timestamp the call was stamped with.
   * @returns Resolves once the row is written.
   */
  async insertActivity(
    event: ActivityEvent,
    actor: string,
    occurredAt: string,
  ): Promise<void> {
    await this.runner.run(
      INSERT.into(ENTITIES.ACTIVITY).entries({
        ID: randomUUID(),
        kind_code: event.kind,
        actor_code: actor,
        target: event.target,
        payload: event.payload ? JSON.stringify(event.payload) : null,
        occurredAt,
        workspace_ID: event.workspaceId,
      }),
    );
  }

  /**
   * Writes one decision.
   * @param row The decision columns to write.
   * @returns The new decision's identifier.
   */
  async insertDecision(row: Record<string, unknown>): Promise<string> {
    const id = randomUUID();
    await this.runner.run(
      INSERT.into(ENTITIES.DECISION).entries({ ID: id, ...row }),
    );
    return id;
  }

  /**
   * Writes one defect.
   * @param row The defect columns to write.
   * @returns The new defect's identifier.
   */
  async insertDefect(row: Record<string, unknown>): Promise<string> {
    const id = randomUUID();
    await this.runner.run(
      INSERT.into(ENTITIES.DEFECT).entries({ ID: id, ...row }),
    );
    return id;
  }

  /**
   * Writes one initiative.
   * @param row The initiative columns to write.
   * @returns The new initiative's identifier.
   */
  async insertInitiative(row: Record<string, unknown>): Promise<string> {
    const id = randomUUID();
    await this.runner.run(
      INSERT.into(ENTITIES.INITIATIVE).entries({ ID: id, ...row }),
    );
    return id;
  }

  /**
   * Writes one milestone.
   * @param row The milestone columns to write.
   * @returns The new milestone's identifier.
   */
  async insertMilestone(row: Record<string, unknown>): Promise<string> {
    const id = randomUUID();
    await this.runner.run(
      INSERT.into(ENTITIES.MILESTONE).entries({ ID: id, ...row }),
    );
    return id;
  }

  /**
   * Writes one test run.
   * @param row The test-run columns to write.
   * @returns Resolves once the row is written.
   */
  async insertTestRun(row: Record<string, unknown>): Promise<void> {
    await this.runner.run(
      INSERT.into(ENTITIES.TEST_RUN).entries({ ID: randomUUID(), ...row }),
    );
  }

  /**
   * Reads a workspace's activity register, newest first.
   * @param workspaceId The workspace to read.
   * @returns The activity rows.
   */
  async readActivities(workspaceId: string): Promise<Record<string, unknown>[]> {
    return (await this.runner.run(
      SELECT.from(ENTITIES.ACTIVITY)
        .where({ workspace_ID: workspaceId })
        .orderBy("occurredAt desc"),
    )) as Record<string, unknown>[];
  }

  /**
   * Reads the workspace's one active sprint.
   * @param workspaceId The workspace to read.
   * @returns The active initiative, or undefined when none is active.
   */
  async readActiveInitiative(
    workspaceId: string,
  ): Promise<InitiativeRow | undefined> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.INITIATIVE).where({
        workspace_ID: workspaceId,
        status_code: "Active",
      }),
    )) as InitiativeRow[];
    return rows[0];
  }

  /**
   * Reads a milestone's chain with each step's library facts flattened on.
   * @param milestoneId The milestone whose chain is wanted.
   * @returns The chain in library position order.
   */
  async readChain(milestoneId: string): Promise<ChainRow[]> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.TASK)
        .columns(
          "ID",
          "status_code",
          "startedAt",
          "completedAt",
          "notes",
          "step_code",
          "step.name as stepName",
          "step.position as stepPosition",
          "step.kind_code as stepKind",
          "step.driver as driver",
        )
        .where({ milestone_ID: milestoneId }),
    )) as ChainRow[];
    return rows.sort((left, right) => left.stepPosition - right.stepPosition);
  }

  /**
   * Reads a workspace's decision register.
   * @param workspaceId The workspace to read.
   * @returns The decision rows.
   */
  async readDecisions(workspaceId: string): Promise<Record<string, unknown>[]> {
    return (await this.runner.run(
      SELECT.from(ENTITIES.DECISION)
        .where({ workspace_ID: workspaceId })
        .orderBy("decidedAt desc"),
    )) as Record<string, unknown>[];
  }

  /**
   * Reads one defect by identifier.
   * @param defectId The defect wanted.
   * @returns The defect row, or undefined when no such defect exists.
   */
  async readDefect(defectId: string): Promise<DefectRow | undefined> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.DEFECT)
        .columns("*", "workspace.slug as workspaceSlug")
        .where({ ID: defectId }),
    )) as DefectRow[];
    return rows[0];
  }

  /**
   * Reads a workspace's defect register.
   * @param workspaceId The workspace to read.
   * @returns The defect rows.
   */
  async readDefects(workspaceId: string): Promise<DefectRow[]> {
    return (await this.runner.run(
      SELECT.from(ENTITIES.DEFECT).where({ workspace_ID: workspaceId }),
    )) as DefectRow[];
  }

  /**
   * Reads a workspace's sprints in position order.
   * @param workspaceId The workspace to read.
   * @returns The initiative rows.
   */
  async readInitiatives(workspaceId: string): Promise<InitiativeRow[]> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.INITIATIVE).where({ workspace_ID: workspaceId }),
    )) as InitiativeRow[];
    return rows.sort((left, right) => left.position - right.position);
  }

  /**
   * Reads one story by its identifier inside a workspace.
   * @param workspaceId The workspace the story belongs to.
   * @param storyId The story identifier.
   * @returns The milestone row, or undefined when no such story exists.
   */
  async readMilestone(
    workspaceId: string,
    storyId: string,
  ): Promise<MilestoneRow | undefined> {
    const milestones = await this.readMilestones(workspaceId);
    return milestones.find(row => row.storyId === storyId);
  }

  /**
   * Reads every story in a workspace, in sprint then story position order.
   * @param workspaceId The workspace to read.
   * @returns The milestone rows.
   */
  async readMilestones(workspaceId: string): Promise<MilestoneRow[]> {
    const initiatives = await this.readInitiatives(workspaceId);
    if (initiatives.length === 0) return [];
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.MILESTONE).where({
        initiative_ID: { in: initiatives.map(row => row.ID) },
      }),
    )) as MilestoneRow[];
    return initiatives.flatMap(initiative =>
      rows
        .filter(row => row.initiative_ID === initiative.ID)
        .sort((left, right) => left.position - right.position),
    );
  }

  /**
   * Reads a stage's steps with each step's library facts flattened on.
   * @param taskId The stage whose steps are wanted.
   * @returns The steps in library position order.
   */
  async readSubtasks(taskId: string): Promise<SubtaskRow[]> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.SUBTASK)
        .columns(
          "ID",
          "status_code",
          "completedAt",
          "step_code",
          "step.name as stepName",
          "step.position as stepPosition",
        )
        .where({ task_ID: taskId }),
    )) as SubtaskRow[];
    return rows.sort((left, right) => left.stepPosition - right.stepPosition);
  }

  /**
   * Reads a workspace's incomplete stages, in resolution order.
   * @param workspaceId The workspace to read.
   * @returns The queue rows.
   */
  async readTaskQueue(workspaceId: string): Promise<Record<string, unknown>[]> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.TASK_QUEUE_ITEM).where({
        workspaceId,
      }),
    )) as Record<string, unknown>[];
    return rows.sort((left, right) => {
      for (const key of QUEUE_ORDER) {
        const delta = Number(left[key]) - Number(right[key]);
        if (delta !== 0) return delta;
      }
      return 0;
    });
  }

  /**
   * Reads one workspace by its slug.
   * @param slug The workspace slug.
   * @returns The workspace row, or undefined when no such workspace exists.
   */
  async readWorkspaceBySlug(slug: string): Promise<WorkspaceRow | undefined> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.WORKSPACE).where({ slug }),
    )) as WorkspaceRow[];
    return rows[0];
  }

  /**
   * Reads one sprint by its name inside a workspace.
   * @param workspaceId The workspace the sprint belongs to.
   * @param name The sprint name.
   * @returns The initiative row, or undefined when no such sprint exists.
   */
  async readInitiativeByName(
    workspaceId: string,
    name: string,
  ): Promise<InitiativeRow | undefined> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.INITIATIVE).where({ workspace_ID: workspaceId, name }),
    )) as InitiativeRow[];
    return rows[0];
  }

  /**
   * Reads every workspace, slug order.
   * @returns The workspace rows.
   */
  async readWorkspaces(): Promise<WorkspaceRow[]> {
    const rows = (await this.runner.run(
      SELECT.from(ENTITIES.WORKSPACE),
    )) as WorkspaceRow[];
    return rows.sort((left, right) => left.slug.localeCompare(right.slug));
  }

  /**
   * Patches one defect.
   * @param defectId The defect to patch.
   * @param patch The columns to set.
   * @returns Resolves once the row is written.
   */
  async updateDefect(
    defectId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.runner.run(
      UPDATE(ENTITIES.DEFECT).set(patch).where({ ID: defectId }),
    );
  }

  /**
   * Patches one step.
   * @param subtaskId The step to patch.
   * @param patch The columns to set.
   * @returns Resolves once the row is written.
   */
  async updateSubtask(
    subtaskId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.runner.run(
      UPDATE(ENTITIES.SUBTASK).set(patch).where({ ID: subtaskId }),
    );
  }

  /**
   * Patches one stage.
   * @param taskId The stage to patch.
   * @param patch The columns to set.
   * @returns Resolves once the row is written.
   */
  async updateTask(
    taskId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    await this.runner.run(
      UPDATE(ENTITIES.TASK).set(patch).where({ ID: taskId }),
    );
  }
}
