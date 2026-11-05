using {
  TransactionService,
  TransactionService.CsvParseResult,
  TransactionService.CsvClassifiedRow,
  TransactionService.CsvSaveRow,
  TransactionService.CsvImportSummary,
  TransactionService.SplitResult,
  TransactionService.SplitSuggestion,
  TransactionService.BulkCategorizeResult,
  TransactionService.ReCategorizeResult
} from './types';

extend service TransactionService with {
  action   parseCsvImport(cardInstance_ID: UUID,
                          fileName: String,
                          fileContent: LargeString)               returns CsvParseResult;

  action   reclassifyCsvRow(cardInstance_ID: UUID,
                            fileName: String,
                            fileContent: LargeString,
                            rowNumber: Integer,
                            correctedValue: String)               returns CsvClassifiedRow;

  action   saveCsvImport(cardInstance_ID: UUID,
                         fileName: String,
                         skippedCount: Integer,
                         rows: many CsvSaveRow)                   returns CsvImportSummary;

  action   splitTransaction(transactionId: UUID       @mandatory,
                            mySharePct: Decimal(5, 4) @assert.range: [
    0,
    1
  ]  @assert.range.message: '{i18n>transaction.split.pctOutOfRange}',
                            myShareAmount: Decimal(15, 2),
                            splitDescription: String,
                            isRecurring: Boolean)                 returns SplitResult;

  function suggestRecurringSplit(transactionId: UUID @mandatory ) returns SplitSuggestion;

  action   bulkCategorize(transactionIds: many UUID,
                          vendor_ID: UUID @mandatory,
                          purchaseType_ID: UUID,
                          earningCategory_ID: UUID)               returns BulkCategorizeResult;

  action   correctCategorization(transactionId: UUID @mandatory,
                                 vendor_ID: UUID     @mandatory,
                                 purchaseType_ID: UUID,
                                 earningCategory_ID: UUID);

  action   reCategorize(transactionIds: many UUID)                returns ReCategorizeResult;
}
