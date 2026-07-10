using {com.financialplanner as fp} from '../db/transactions/schema';
using {
  com.financialplanner.Vendor,
  com.financialplanner.PurchaseType,
  com.financialplanner.EarningCategory
} from '../db/reference/schema';
using {
  com.financialplanner.CardInstance,
  com.financialplanner.MarketCard
} from '../db/cards/schema';
using {com.financialplanner.ImportLog} from '../db/ingestion/schema';

service TransactionService @(path: '/service/transactionSvcs') {
  entity Transactions            as projection on fp.Transaction;
  entity TransactionSplits       as projection on fp.TransactionSplit;
  entity MerchantPatterns        as projection on fp.MerchantPattern;
  entity Vendors                 as projection on Vendor;
  entity PurchaseTypes           as projection on PurchaseType;
  entity EarningCategories       as projection on EarningCategory;
  entity CardInstances @readonly as projection on CardInstance;
  entity MarketCards @readonly   as projection on MarketCard;
  entity ImportLogs @readonly    as projection on ImportLog;

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

  action parseCsvImport(cardInstance_ID: UUID,
                        fileName: String,
                        fileContent: LargeString) returns CsvParseResult;

  action saveCsvImport(cardInstance_ID: UUID,
                       fileName: String,
                       skippedCount: Integer,
                       rows: many CsvSaveRow)     returns CsvImportSummary;
}
