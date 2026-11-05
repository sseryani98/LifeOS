using {TransactionService} from '../transaction-service';

extend service TransactionService with {
  type CsvClassifiedRow {
    rowNumber                   : Integer;
    postedAt                    : Date;
    amount                      : Decimal(15, 2);
    rawDescription              : String;
    cardInstance_ID             : UUID;
    cardholderName              : String;
    dedupOutcome                : String;
    matchedTransactionId        : UUID;
    suggestedVendor_ID          : UUID;
    suggestedVendorName         : String;
    suggestedPurchaseType_ID    : UUID;
    suggestedEarningCategory_ID : UUID;
    suggestionConfidence        : String;
  }

  type CsvExcludedRow {
    rowNumber       : Integer;
    rawCells        : many String;
    errorField      : String;
    errorMessageKey : String;
    errorValue      : String;
  }

  type CsvParseResult {
    configResolved      : Boolean;
    configName          : String;
    newRows             : many CsvClassifiedRow;
    potentialDuplicates : many CsvClassifiedRow;
    excludedRows        : many CsvExcludedRow;
    skippedCount        : Integer;
  }

  type CsvSaveRow {
    postedAt           : Date;
    amount             : Decimal(15, 2);
    rawDescription     : String;
    cardInstance_ID    : UUID;
    vendor_ID          : UUID;
    purchaseType_ID    : UUID;
    earningCategory_ID : UUID;
  }

  type CsvImportSummary {
    importLogId      : UUID;
    transactionCount : Integer;
    totalAmount      : Decimal(15, 2);
    topVendorName    : String;
  }

  type SplitResult {
    transactionId : UUID;
    mySharePct    : Decimal(5, 4);
    myShareAmount : Decimal(15, 2);
    isRecurring   : Boolean;
  }

  type SplitSuggestion {
    mySharePct       : Decimal(5, 4);
    myShareAmount    : Decimal(15, 2);
    splitDescription : String;
    isRecurring      : Boolean;
  }

  type BulkCategorizeResult {
    updatedCount : Integer;
  }

  type ReCategorizeResult {
    recategorizedCount : Integer;
    skippedCount       : Integer;
  }
}
