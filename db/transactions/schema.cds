namespace com.financialplanner;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {
    com.financialplanner.CategorizationStatus,
    com.financialplanner.TransactionSource
} from '../enums';
using {com.financialplanner.CardInstance} from '../cards/schema';

// Transactions domain (target set: Transaction, TransactionSplit, Vendor,
// MerchantPattern, VendorCategoryStats view).
//
// W1-S2 (ENH-008) defines Transaction with the fields the ingestion pipeline
// populates, which is all the deduplication engine needs. The rest is added by
// the sprint that consumes it, so the model grows alongside its logic:
//   - providerAccount association            → INT-001 (W1-S2)
//   - vendor / purchaseType / earningCategory FKs, Vendor, MerchantPattern,
//     VendorCategoryStats view               → ENH-001 categorization (W1-S3)
//   - TransactionSplit                       → ENH-009 split logic (W1-S3)
//   - goal association                       → FRM-008 goals (W2-S2)

entity Transaction : cuid, managed {
    cardInstance         : Association to CardInstance                            @Common.Label: '{i18n>Transaction.cardInstance}';
    externalId           : String(255)                                            @Common.Label: '{i18n>Transaction.externalId}';
    source               : TransactionSource not null                             @mandatory  @Common.Label: '{i18n>Transaction.source}';
    amount               : Decimal(15, 2) not null                                @mandatory  @Common.Label: '{i18n>Transaction.amount}';
    postedAt             : Date not null                                          @mandatory  @Common.Label: '{i18n>Transaction.postedAt}';
    transactedAt         : Date                                                   @Common.Label: '{i18n>Transaction.transactedAt}';
    rawDescription       : String(1000) not null                                  @mandatory  @Common.Label: '{i18n>Transaction.rawDescription}';
    categorizationStatus : CategorizationStatus not null default 'uncategorized'  @mandatory  @Common.Label: '{i18n>Transaction.categorizationStatus}';
    isExcluded           : Boolean not null default false                         @mandatory  @Common.Label: '{i18n>Transaction.isExcluded}';
    notes                : String(1000)                                           @Common.Label: '{i18n>Transaction.notes}';
}
