import cds from "@sap/cds";

import { CsvImportDataService } from "./modules/ingestion/csvImportDataService.js";
import { CsvImportFacade } from "./modules/ingestion/csvImportFacade.js";
import { CsvImportService } from "./modules/ingestion/csvImportService.js";
import { DeduplicationDataService } from "./modules/ingestion/deduplicationDataService.js";
import { DeduplicationService } from "./modules/ingestion/deduplicationService.js";

/** TransactionService — Transaction ingestion, categorization, and listing. */
export default class TransactionService extends cds.ApplicationService {
  /**
   * Wires the CSV import parse action.
   * @returns Resolves once handlers are registered and base init completes.
   */
  async init(): Promise<void> {
    const csvImportService = new CsvImportService(
      new CsvImportDataService(),
      new DeduplicationService(new DeduplicationDataService()),
    );
    new CsvImportFacade(this, csvImportService).registerHandlers();
    return super.init();
  }
}
