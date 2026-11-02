import cds from "@sap/cds";

import { BaseFacade } from "../shared/baseFacade.js";

import type { CsvImportSaveService } from "./csvImportSaveService.js";
import type { CsvImportService } from "./csvImportService.js";
import type {
  CsvClassifiedRow,
  CsvImportSummary,
  CsvParseResult,
} from "./types.js";

/**
 * Facade wiring for the CSV import engine: the parse (review) and save (persist)
 * actions.
 */
export class CsvImportFacade extends BaseFacade {
  private readonly saveService: CsvImportSaveService;
  private readonly service: CsvImportService;

  /**
   * Creates the facade bound to a CDS service and the CSV import engines.
   * @param srv CDS application service to register handlers on.
   * @param service CSV parse engine the parse handler delegates to.
   * @param saveService CSV save engine the save handler delegates to.
   */
  constructor(
    srv: cds.ApplicationService,
    service: CsvImportService,
    saveService: CsvImportSaveService,
  ) {
    super(srv, "integration.csv");
    this.service = service;
    this.saveService = saveService;
  }

  /** Registers the CSV parse and save action handlers. */
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
    this.srv.on(
      "reclassifyCsvRow",
      this.wrapHandler(
        this._handleReclassifyCsvRow,
        "action-reclassifyCsvRow",
        "Transactions",
        "ingestion.csv.parseFailed",
      ),
    );
    this.srv.on(
      "saveCsvImport",
      this.wrapHandler(
        this._handleSaveCsvImport,
        "action-saveCsvImport",
        "Transactions",
        "ingestion.csv.saveFailed",
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

  /**
   * Re-decode one corrected Excluded row.
   * @param req Request carrying the parse inputs plus rowNumber and correctedValue.
   * @returns The classified row, or undefined on validation or decode failure.
   */
  private _handleReclassifyCsvRow = (
    req: cds.Request,
  ): Promise<CsvClassifiedRow | undefined> => this.service.reclassify(req);

  /**
   * Persist the reviewed rows for the selected card.
   * @param req Request carrying cardInstance_ID, fileName, skippedCount, and rows.
   * @returns The post-import summary, or undefined on validation failure.
   */
  private _handleSaveCsvImport = (
    req: cds.Request,
  ): Promise<CsvImportSummary | undefined> => this.saveService.save(req);
}
