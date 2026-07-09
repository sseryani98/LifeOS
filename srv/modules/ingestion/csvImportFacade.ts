import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";

import type { CsvImportService } from "./csvImportService.js";
import type { CsvParseResult } from "./types.js";

/**
 * Facade wiring for the CSV import engine.
 */
export class CsvImportFacade extends BaseFacade {
  private readonly service: CsvImportService;

  /**
   * Creates the facade bound to a CDS service and the CSV import engine.
   * @param srv CDS application service to register handlers on.
   * @param service CSV import engine the handler delegates to.
   */
  constructor(srv: cds.ApplicationService, service: CsvImportService) {
    super(srv, "integration.csv");
    this.service = service;
  }

  /** Registers the CSV parse action handler. */
  registerHandlers(): void {
    this.srv.on(
      "parseCsvImport",
      this.wrapHandler(
        this._handleParseCsvImport,
        "action-parseCsvImport",
        "Transactions",
        "ingestion.csv.parseFailed",
      ),
    );
  }

  /**
   * Parse-and-classify a CSV upload for the selected card.
   * @param req Request carrying cardInstance_ID, fileName, and fileContent.
   * @returns The parse result, or undefined on validation failure.
   */
  private _handleParseCsvImport = (
    req: cds.Request,
  ): Promise<CsvParseResult | undefined> => this.service.parse(req);
}
