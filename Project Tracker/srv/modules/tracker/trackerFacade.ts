import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";
import { ENTITIES } from "../shared/constants.js";

import type { ProjectViewService } from "./projectViewService.js";
import type { TrackerService } from "./trackerService.js";
import type {
  CompletedItemList,
  CompletedItemRow,
  MilestoneRow,
  ProjectViewRow,
  QueueItemRow,
  SectionQuery,
} from "./types.js";

/** Handler wiring for TrackerService. Registration only, no logic. */
export class TrackerFacade extends BaseFacade {
  private readonly service: TrackerService;
  private readonly sections: ProjectViewService;

  /**
   * Creates the facade bound to a CDS service and the tracker logic layers.
   * @param srv CDS application service to register handlers on.
   * @param service Tracker logic layer the write guards and derivations delegate to.
   * @param sections Project-view sections layer the section collections delegate to.
   */
  constructor(
    srv: cds.ApplicationService,
    service: TrackerService,
    sections: ProjectViewService,
  ) {
    super(srv, "tracker");
    this.service = service;
    this.sections = sections;
  }

  /** Registers every handler this facade owns. */
  registerHandlers(): void {
    this._registerWriteGuards();
    this._registerCreateEffects();
    this._registerReadDerivations();
  }

  /** Registers the handlers that run once a row has been created. */
  private _registerCreateEffects(): void {
    this.srv.after(
      "CREATE",
      ENTITIES.MILESTONE,
      this.wrapHandler(
        this._handleCreateMilestone,
        "after-CREATE",
        "Milestones",
        "tracker.handler.failed",
      ),
    );
  }

  /** Registers the handlers that fill derived elements on read. */
  private _registerReadDerivations(): void {
    this.srv.after(
      "READ",
      ENTITIES.MILESTONE,
      this.wrapHandler(
        this._handleReadMilestones,
        "after-READ",
        "Milestones",
        "tracker.handler.failed",
      ),
    );
    this.srv.after(
      "READ",
      ENTITIES.PROJECT_VIEW,
      this.wrapHandler(
        this._handleReadProjectView,
        "after-READ",
        "ProjectView",
        "tracker.handler.failed",
      ),
    );
    this._registerSectionReads();
  }

  /** Registers the handlers that rank and page the project view's section reads. */
  private _registerSectionReads(): void {
    this.srv.before(
      "READ",
      [ENTITIES.TASK_QUEUE_ITEM, ENTITIES.COMPLETED_TASK_ITEM],
      this.wrapHandler(
        this._handleDetachSectionPage,
        "before-READ",
        "ProjectViewSections",
        "tracker.handler.failed",
      ),
    );
    this.srv.after(
      "READ",
      ENTITIES.TASK_QUEUE_ITEM,
      this.wrapHandler(
        this._handleReadTaskQueueItems,
        "after-READ",
        "TaskQueueItems",
        "tracker.handler.failed",
      ),
    );
    this.srv.after(
      "READ",
      ENTITIES.COMPLETED_TASK_ITEM,
      this.wrapHandler(
        this._handleReadCompletedTaskItems,
        "after-READ",
        "CompletedTaskItems",
        "tracker.handler.failed",
      ),
    );
  }

  /** Registers the guards that run before a row is written. */
  private _registerWriteGuards(): void {
    this.srv.before(
      ["CREATE", "UPDATE"],
      ENTITIES.INITIATIVE,
      this.wrapHandler(
        this._handleWriteInitiative,
        "before-write",
        "Initiatives",
        "tracker.handler.failed",
      ),
    );
    this.srv.before(
      ["CREATE", "UPDATE"],
      ENTITIES.MILESTONE,
      this.wrapHandler(
        this._handleWriteMilestone,
        "before-write",
        "Milestones",
        "tracker.handler.failed",
      ),
    );
    this.srv.before(
      ["CREATE", "UPDATE"],
      ENTITIES.DEFECT,
      this.wrapHandler(
        this._handleWriteDefect,
        "before-write",
        "Defects",
        "tracker.handler.failed",
      ),
    );
    this.srv.before(
      ["CREATE", "UPDATE"],
      ENTITIES.TEST_RUN,
      this.wrapHandler(
        this._handleWriteTestRun,
        "before-write",
        "TestRuns",
        "tracker.handler.failed",
      ),
    );
  }

  /**
   * Materialises the chain of a story created in Backlog.
   * @param _created The created row, unused: the request carries the payload.
   * @param req Request carrying the created Milestone payload.
   * @returns Resolves once the chain is written.
   */
  private _handleCreateMilestone = (
    _created: unknown,
    req: cds.Request,
  ): Promise<void> => this.service.createChains(req);

  /**
   * Applies the TestRun scope rule.
   * @param req Request carrying the TestRun payload.
   * @returns Resolves once the guard has accumulated any error on the request.
   */
  private _handleWriteTestRun = (req: cds.Request): Promise<void> =>
    this.service.checkTestRunWrite(req);

  /**
   * Fills the derived status on every Milestone a read returned.
   * @param rows The Milestone rows read.
   * @returns Resolves once every row carries its derived status.
   */
  private _handleReadMilestones = (
    rows: MilestoneRow | MilestoneRow[],
  ): Promise<void> =>
    this.service.applyMilestoneStatuses(Array.isArray(rows) ? rows : [rows]);

  /**
   * Fills the derived scalars of a project-view read.
   * @param rows The project-view rows read.
   * @returns Resolves once the derived elements are filled.
   */
  private _handleReadProjectView = (
    rows: ProjectViewRow | ProjectViewRow[],
  ): Promise<void> =>
    this.service.applyProjectViewDerivations(
      Array.isArray(rows) ? rows : [rows],
    );

  /**
   * Lifts a section read's page so the rows are ranked whole before it is cut.
   * @param req The section read.
   * @returns Nothing; the page is held for the after-READ.
   */
  private _handleDetachSectionPage = (req: cds.Request): void =>
    this.sections.detachSectionPage(req, req.query as SectionQuery);

  /**
   * Fills the tier and blocker of every queue row a read returned, and orders them.
   * @param rows The queue rows read.
   * @param req The read, carrying any lifted page.
   * @returns Resolves once the rows are filled and ordered.
   */
  private _handleReadTaskQueueItems = (
    rows: QueueItemRow | QueueItemRow[],
    req: cds.Request,
  ): Promise<void> =>
    this.sections.applyQueueDerivations(
      Array.isArray(rows) ? rows : [rows],
      req,
    );

  /**
   * Orders and caps the recently completed rows a read returned, naming each completer.
   * @param rows The completed rows read.
   * @param req The read, carrying any lifted page.
   * @returns Resolves once the rows are filled, ordered and capped.
   */
  private _handleReadCompletedTaskItems = (
    rows: CompletedItemRow | CompletedItemList,
    req: cds.Request,
  ): Promise<void> =>
    this.sections.applyCompletionDerivations(
      Array.isArray(rows) ? rows : [rows],
      req,
    );

  /**
   * Applies the Defect scope rule.
   * @param req Request carrying the Defect payload.
   * @returns Resolves once the guard has accumulated any error on the request.
   */
  private _handleWriteDefect = (req: cds.Request): Promise<void> =>
    this.service.checkDefectWrite(req);

  /**
   * Applies the Initiative name and completion rules.
   * @param req Request carrying the Initiative payload.
   * @returns Resolves once the guards have run.
   */
  private _handleWriteInitiative = (req: cds.Request): Promise<void> =>
    this.service.checkInitiativeWrite(req);

  /**
   * Applies the Milestone story-ID rule.
   * @param req Request carrying the Milestone payload.
   * @returns Resolves once the guard has run.
   */
  private _handleWriteMilestone = (req: cds.Request): Promise<void> =>
    this.service.checkMilestoneWrite(req);
}
