import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";

import type { SimpleFINService } from "./simpleFinService.js";

/**
 * Facade wiring for SimpleFIN connection management.
 */
export class SimpleFINFacade extends BaseFacade {
  private readonly service: SimpleFINService;

  /**
   * Creates the facade bound to a CDS service and the sync engine.
   *
   * @param srv CDS application service to register handlers on.
   * @param service SimpleFIN sync engine handlers delegate to.
   */
  constructor(srv: cds.ApplicationService, service: SimpleFINService) {
    super(srv, "integration.simplefin");
    this.service = service;
  }

  /** Registers all SimpleFIN connection-management handlers. */
  registerHandlers(): void {
    this.srv.on(
      "syncNow",
      "ProviderConnections",
      this.wrapHandler(
        this._handleSyncNow,
        "action-syncNow",
        "ProviderConnections",
        "ingestion.simplefin.connectionError",
      ),
    );
    this.srv.on(
      "claimSetupToken",
      this.wrapHandler(
        this._handleClaimSetupToken,
        "action-claimSetupToken",
        "ProviderConnections",
        "ingestion.simplefin.invalidToken",
      ),
    );
    this.srv.after(
      "UPDATE",
      "ProviderAccounts",
      this.wrapHandler(
        this._handleProviderAccountUpdated,
        "after-UPDATE",
        "ProviderAccounts",
        "ingestion.simplefin.connectionError",
      ),
    );
  }

  /**
   * Sync the selected connection now.
   *
   * @param req Bound request targeting the selected connection.
   * @returns Sync outcome message.
   */
  private _handleSyncNow = (req: cds.Request): Promise<string> =>
    this.service.runManualSync(req);

  /**
   * Claim a setup token and create a connection.
   *
   * @param req Request carrying the setup token and display name.
   * @returns New connection id, or undefined on validation failure.
   */
  private _handleClaimSetupToken = (
    req: cds.Request,
  ): Promise<string | undefined> => this.service.claim(req);

  /**
   * After UPDATE — backfill null-card transactions on mapping change.
   *
   * @param _data Updated entity data (unused).
   * @param req Request describing the account update.
   * @returns Promise resolving once the backfill completes.
   */
  private _handleProviderAccountUpdated = (
    _data: unknown,
    req: cds.Request,
  ): Promise<void> => this.service.handleAccountMapping(req);
}
