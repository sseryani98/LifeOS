import cds from "@sap/cds";

/** TransactionService — Transaction ingestion, categorization, and listing. */
export default class TransactionService extends cds.ApplicationService {
  /** Registers event handlers for TransactionService entities. */
  async init(): Promise<void> {
    // Handler registration added in W1-S2+
    return super.init();
  }
}
