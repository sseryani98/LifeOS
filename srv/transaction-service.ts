import cds from "@sap/cds";

import { CsvImportDataService } from "./modules/ingestion/csvImportDataService.js";
import { CsvImportFacade } from "./modules/ingestion/csvImportFacade.js";
import { CsvImportSaveService } from "./modules/ingestion/csvImportSaveService.js";
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
    const dataService = new CsvImportDataService();
    const csvImportService = new CsvImportService(
      dataService,
      new DeduplicationService(new DeduplicationDataService()),
    );
    const csvImportSaveService = new CsvImportSaveService(dataService);
    new CsvImportFacade(
      this,
      csvImportService,
      csvImportSaveService,
    ).registerHandlers();
    return super.init();
  }
}
