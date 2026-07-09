using {com.financialplanner as fp} from '../db/transactions/schema';

service TransactionService @(path: '/service/transactionSvcs') {
  entity Transactions as projection on fp.Transaction;

  type CsvClassifiedRow {
    rowNumber            : Integer;
    postedAt             : Date;
    amount               : Decimal(15, 2);
    rawDescription       : String;
    cardInstance_ID      : UUID;
    cardholderName       : String;
    dedupOutcome         : String;
    matchedTransactionId : UUID;
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

  action parseCsvImport(cardInstance_ID: UUID,
                        fileName: String,
                        fileContent: LargeString) returns CsvParseResult;
}
