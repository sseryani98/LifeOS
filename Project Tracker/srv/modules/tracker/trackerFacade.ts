import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";
import { ENTITIES } from "../shared/constants.js";

import type { TrackerService } from "./trackerService.js";
import type { MilestoneRow } from "./types.js";

/** Handler wiring for TrackerService. Registration only, no logic. */
export class TrackerFacade extends BaseFacade {
  private readonly service: TrackerService;

  /**
   * Creates the facade bound to a CDS service and the tracker logic layer.
   * @param srv CDS application service to register handlers on.
   * @param service Tracker logic layer every handler delegates to.
   */
  constructor(srv: cds.ApplicationService, service: TrackerService) {
    super(srv, "tracker");
    this.service = service;
  }

  /** Registers every handler this facade owns. */
  registerHandlers(): void {
    this._registerWriteGuards();
    this._registerReadDerivations();
  }

  /** Registers the two handlers that fill derived elements on read. */
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
      "CREATE",
      ENTITIES.TEST_RUN,
      this.wrapHandler(
        this._handleCreateTestRun,
        "before-CREATE",
        "TestRuns",
        "tracker.handler.failed",
      ),
    );
  }

  /**
   * Applies the TestRun scope rule.
   * @param req Request carrying the TestRun payload.
   * @returns Nothing; the guard accumulates its error on the request.
   */
  private _handleCreateTestRun = (req: cds.Request): void =>
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
    rows: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<void> =>
    this.service.applyProjectViewDerivations(Array.isArray(rows) ? rows : [rows]);

  /**
   * Applies the Defect scope rule.
   * @param req Request carrying the Defect payload.
   * @returns Nothing; the guard accumulates its error on the request.
   */
  private _handleWriteDefect = (req: cds.Request): void =>
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
