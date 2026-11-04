import cds from "@sap/cds";

import { ENTITIES } from "../shared/constants.js";

import {
  MIGRATION,
  MIGRATION_KEYS,
  MIGRATION_STATUS,
  RECONCILED_ENTITIES,
  WRITTEN_ENTITIES,
} from "./constants.js";
import snapshot from "./financialPlannerSnapshot.json";
import { MigrationDataService } from "./migrationDataService.js";
import { MigrationMapper } from "./migrationMapper.js";
import { MigrationValidator } from "./migrationValidator.js";
import { ReconciliationFindings } from "./reconciliationFindings.js";
import type {
  AccumulatingRequest,
  CreatorFacts,
  FinancialPlannerSnapshot,
  InitiativeRef,
  ReconciledCount,
  ReconciliationReport,
} from "./types.js";

/**
 * The one-time load of Financial Planner's ledgers. Each conversion runs in its
 * own TrackerService transaction as the migration identity, so a refusal writes
 * nothing and every row it does write is attributable to the load.
 */
export class MigrationService {
  private static readonly SNAPSHOT: FinancialPlannerSnapshot = snapshot;
  private readonly tracker: cds.Service;
  private readonly validator: MigrationValidator;

  /**
   * Binds the migration to the service it writes through.
   * @param tracker The connected TrackerService.
   */
  constructor(tracker: cds.Service) {
    this.tracker = tracker;
    this.validator = new MigrationValidator();
  }

  /**
   * Loads the hierarchy, the three sprints and the twelve stories. The guards
   * run before any write; the load's own event is its first write, ahead of the
   * Workspace it names, which the deferred key allows inside one transaction.
   * @returns Resolves once the load has committed.
   */
  async loadHierarchy(): Promise<void> {
    await this._runAsMigration(
      MIGRATION.EVENT.LOAD_HIERARCHY,
      async (data, req) => {
        await this._checkNotLoaded(data, req);
        await this._checkLibrarySeeded(data, req);
        const { initiatives, stories } = MigrationService.SNAPSHOT;
        const hierarchy = MigrationMapper.toHierarchyRows();
        const sprints = MigrationMapper.toInitiativeRows(
          initiatives,
          hierarchy.workspaceId,
        );
        const sprintIds = new Map(
          initiatives.map((initiative, index) => [
            initiative.sprint,
            sprints[index].ID,
          ]),
        );
        const milestones = MigrationMapper.toMilestoneRows(stories, sprintIds);
        this.validator.validateFricewTypes(req, milestones);
        this._throwAccumulated(req);
        await data.insertRows(ENTITIES.ACTIVITY, [
          MigrationMapper.toMigrationActivityRow(
            new Date().toISOString(),
            hierarchy.workspaceId,
          ),
        ]);
        await data.insertRows(ENTITIES.AREA, [hierarchy.area]);
        await data.insertRows(ENTITIES.ENGAGEMENT, [hierarchy.engagement]);
        await data.insertRows(ENTITIES.WORKSPACE, [hierarchy.workspace]);
        await data.insertRows(ENTITIES.INITIATIVE, sprints);
        await data.insertRows(ENTITIES.MILESTONE, milestones);
      },
    );
  }

  /**
   * Ties the load out and fails loudly on any assertion that does not hold. It
   * reads only, so a failure leaves the partial state in place for the operator.
   * @returns The tie-out, when every assertion holds.
   */
  // The spec names this entry point for the cutover script; no listed verb fits it.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async reconcile(): Promise<ReconciliationReport> {
    return this._runAsMigration(
      MIGRATION.EVENT.RECONCILE,
      async (data, req) => {
        const counts = await this._readCounts(data);
        const stories = await data.readStoryFacts();
        const findings = [
          ReconciliationFindings.findCountOffenders(counts),
          ReconciliationFindings.findChainOffenders(
            await data.readChainTasks(),
            await data.readChainSubtasks(),
            this._listOpenStoryIds(),
          ),
          ReconciliationFindings.findTypeOffenders(stories),
          ReconciliationFindings.findProvenanceOffenders(
            await this._readCreators(data),
          ),
          ReconciliationFindings.findOrderingOffenders(
            await data.readAllInitiatives(),
            stories,
          ),
        ];
        this.validator.validateReconciliation(req, { counts, findings });
        this._throwAccumulated(req);
        return { counts };
      },
    );
  }

  /**
   * Seeds the defects, decisions, test run and checkpoint narrative against the
   * loaded sprints. Every row is checked before any is written.
   * @returns Resolves once the seed has committed.
   */
  async seedRegisters(): Promise<void> {
    await this._runAsMigration(
      MIGRATION.EVENT.SEED_REGISTERS,
      async (data, req) => {
        const workspace = await data.readWorkspaceBySlug(
          MIGRATION.WORKSPACE.SLUG,
        );
        if (!workspace) {
          return req.reject(
            MIGRATION_STATUS.CONFLICT,
            MIGRATION_KEYS.HIERARCHY_MISSING,
            [MIGRATION.WORKSPACE.SLUG],
          );
        }
        const { defects, checkpoint } = MigrationService.SNAPSHOT;
        const sprints = await this._resolveSprints(data, workspace.ID);
        const checkpointSprint = sprints.get(checkpoint.sprint);
        const defectRows = defects.map(defect =>
          MigrationMapper.toDefectRow(
            defect,
            sprints.get(defect.sprint)?.ID,
            workspace.ID,
          ),
        );
        const testRun = MigrationMapper.toTestRunRow(
          checkpoint,
          checkpointSprint?.ID,
          workspace.ID,
        );
        for (const defect of defectRows) {
          this.validator.validateDefectTarget(req, defect);
          this.validator.validateDefectResolution(req, defect);
        }
        this.validator.validateTestRunTarget(req, testRun);
        this._throwAccumulated(req);
        await data.insertRows(ENTITIES.DEFECT, defectRows);
        await this._writeCheckpoint(data, checkpointSprint, workspace.ID);
        await data.insertRows(ENTITIES.TEST_RUN, [testRun]);
      },
    );
  }

  /**
   * Refuses to load over a Workspace already there: a second load would
   * duplicate every story and its chain.
   * @param data The conversion's data access.
   * @param req The conversion's request.
   * @returns Resolves when no such Workspace exists.
   */
  private async _checkNotLoaded(
    data: MigrationDataService,
    req: cds.Request,
  ): Promise<void> {
    const existing = await data.readWorkspaceBySlug(MIGRATION.WORKSPACE.SLUG);
    if (existing) {
      req.reject(MIGRATION_STATUS.CONFLICT, MIGRATION_KEYS.ALREADY_LOADED, [
        existing.slug,
      ]);
    }
  }

  /**
   * Refuses to load before the library exists: the open story's chain would
   * silently come out empty.
   * @param data The conversion's data access.
   * @param req The conversion's request.
   * @returns Resolves when the library holds steps.
   */
  private async _checkLibrarySeeded(
    data: MigrationDataService,
    req: cds.Request,
  ): Promise<void> {
    if ((await data.countRows(ENTITIES.METHODOLOGY_STEP)) > 0) return;
    req.reject(MIGRATION_STATUS.CONFLICT, MIGRATION_KEYS.LIBRARY_MISSING);
  }

  /**
   * Lists the stories the board holds outside Done: the ones created in Backlog.
   * @returns Their story identifiers.
   */
  private _listOpenStoryIds(): string[] {
    return MigrationService.SNAPSHOT.stories
      .filter(story => story.boardStatus !== MIGRATION.BOARD_DONE)
      .map(story => story.story);
  }

  /**
   * Counts every reconciled entity against what the source implies.
   * @param data The conversion's data access.
   * @returns One tie-out line per entity.
   */
  private async _readCounts(
    data: MigrationDataService,
  ): Promise<ReconciledCount[]> {
    const expected = ReconciliationFindings.buildExpectedCounts(
      MigrationService.SNAPSHOT,
    );
    const counts: ReconciledCount[] = [];
    for (const [entity, source] of Object.entries(RECONCILED_ENTITIES)) {
      counts.push({
        entity,
        expected: expected[entity],
        actual: await data.countRows(source),
      });
    }
    return counts;
  }

  /**
   * Reads who created every row of every entity the load writes.
   * @param data The conversion's data access.
   * @returns Each entity's rows and creators, by entity name.
   */
  private async _readCreators(
    data: MigrationDataService,
  ): Promise<Record<string, CreatorFacts[]>> {
    const creators: Record<string, CreatorFacts[]> = {};
    for (const [entity, source] of Object.entries(WRITTEN_ENTITIES)) {
      creators[entity] = await data.readCreators(source);
    }
    return creators;
  }

  /**
   * Resolves each sprint code the ledgers key by to its stored Initiative. A
   * sprint the hierarchy load did not create resolves to nothing, which the
   * register rules then refuse.
   * @param data The conversion's data access.
   * @param workspaceId The loaded Workspace.
   * @returns The stored Initiatives, by the sprint code they were loaded from.
   */
  private async _resolveSprints(
    data: MigrationDataService,
    workspaceId: string,
  ): Promise<Map<string, InitiativeRef>> {
    const stored = await data.readInitiatives(workspaceId);
    return new Map(
      MigrationService.SNAPSHOT.initiatives.flatMap(sprint =>
        stored
          .filter(row => row.name === sprint.name)
          .map(row => [sprint.sprint, row] as const),
      ),
    );
  }

  /**
   * Runs one conversion in its own transaction as the migration identity. A
   * throw inside rolls the whole conversion back.
   * @param event The conversion's name, which its request carries.
   * @param work The conversion, given its data access and its request.
   * @returns What the conversion resolves with.
   */
  private async _runAsMigration<T>(
    event: string,
    work: (data: MigrationDataService, req: cds.Request) => Promise<T>,
  ): Promise<T> {
    const user = new cds.User(MIGRATION.ACTOR);
    return (await this.tracker.tx({ user }, transaction =>
      work(new MigrationDataService(transaction), new cds.Request({ event })),
    )) as T;
  }

  /**
   * Fails the conversion with every error its checks accumulated, as one error
   * or as a multiple-error rejection.
   * @param req The conversion's request.
   */
  private _throwAccumulated(req: cds.Request): void {
    const accumulated = req as unknown as AccumulatingRequest;
    if (accumulated.errors?.length) accumulated.reject();
  }

  /**
   * Writes what the checkpoint itself recorded: its decisions, and its
   * remaining narrative as the register seed's one Activity row.
   * @param data The conversion's data access.
   * @param sprint The sprint the checkpoint closed.
   * @param workspaceId The loaded Workspace.
   * @returns Resolves once both are written.
   */
  private async _writeCheckpoint(
    data: MigrationDataService,
    sprint: InitiativeRef | undefined,
    workspaceId: string,
  ): Promise<void> {
    const { checkpoint } = MigrationService.SNAPSHOT;
    await data.insertRows(
      ENTITIES.DECISION,
      checkpoint.decisions.map(decision =>
        MigrationMapper.toDecisionRow(
          decision,
          checkpoint.date,
          sprint?.ID,
          workspaceId,
        ),
      ),
    );
    await data.insertRows(ENTITIES.ACTIVITY, [
      MigrationMapper.toCheckpointActivityRow(
        checkpoint,
        sprint?.name,
        workspaceId,
      ),
    ]);
  }
}
