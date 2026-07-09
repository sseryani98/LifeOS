import cds from "@sap/cds";

/** TransactionService — Transaction ingestion, categorization, and listing. */
export default class TransactionService extends cds.ApplicationService {
  /**
   * Registers event handlers for TransactionService entities.
   * @returns Resolves once base service initialization completes.
   */
  async init(): Promise<void> {
    return super.init();
  }
}
