namespace com.financialplanner;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {
    com.financialplanner.CategorizationStatus,
    com.financialplanner.TransactionSource,
    com.financialplanner.MatchType
} from '../enums';
using {com.financialplanner.CardInstance} from '../cards/schema';
using {com.financialplanner.ProviderAccount} from '../ingestion/schema';
using {
    com.financialplanner.Vendor,
    com.financialplanner.PurchaseType,
    com.financialplanner.EarningCategory,
    com.financialplanner.PatternSource,
    com.financialplanner.ConfidenceLevel
} from '../reference/schema';

entity Transaction : cuid, managed {
    cardInstance         : Association to CardInstance                            @Common.Label: '{i18n>Transaction.cardInstance}';
    providerAccount      : Association to ProviderAccount                         @Common.Label: '{i18n>Transaction.providerAccount}';
    externalId           : String(255)                                            @Common.Label: '{i18n>Transaction.externalId}';
    source               : TransactionSource not null                             @mandatory  @Common.Label: '{i18n>Transaction.source}';
    amount               : Decimal(15, 2) not null                                @mandatory  @Common.Label: '{i18n>Transaction.amount}';
    postedAt             : Date not null                                          @mandatory  @Common.Label: '{i18n>Transaction.postedAt}';
    transactedAt         : Date                                                   @Common.Label: '{i18n>Transaction.transactedAt}';
    rawDescription       : String(1000) not null                                  @mandatory  @Common.Label: '{i18n>Transaction.rawDescription}';
    vendor               : Association to Vendor                                  @Common.Label: '{i18n>Transaction.vendor}';
    purchaseType         : Association to PurchaseType                            @Common.Label: '{i18n>Transaction.purchaseType}';
    earningCategory      : Association to EarningCategory                         @Common.Label: '{i18n>Transaction.earningCategory}';
    categorizationStatus : CategorizationStatus not null default 'uncategorized'  @mandatory  @Common.Label: '{i18n>Transaction.categorizationStatus}';
    isExcluded           : Boolean not null default false                         @mandatory  @Common.Label: '{i18n>Transaction.isExcluded}';
    notes                : String(1000)                                           @Common.Label: '{i18n>Transaction.notes}';
    split                : Composition of one TransactionSplit
                               on split.transaction = $self;
}

// The user's "my share" of a shared expense. At most one per Transaction.
entity TransactionSplit : cuid, managed {
    transaction      : Association to Transaction not null  @mandatory  @Common.Label: '{i18n>TransactionSplit.transaction}';
    mySharePct       : Decimal(5, 4)                        @Common.Label: '{i18n>TransactionSplit.mySharePct}';
    myShareAmount    : Decimal(15, 2) not null              @mandatory  @Common.Label: '{i18n>TransactionSplit.myShareAmount}';
    splitDescription : String(500)                          @Common.Label: '{i18n>TransactionSplit.splitDescription}';
    isRecurring      : Boolean not null default false       @mandatory  @Common.Label: '{i18n>TransactionSplit.isRecurring}';
    notes            : String(1000)                         @Common.Label: '{i18n>TransactionSplit.notes}';
}

// Vendor-matching rules for the categorization engine. A pattern maps a
// raw-description fragment to a Vendor; amount (optional) discriminates
// same-description-different-vendor cases.
entity MerchantPattern : cuid, managed {
    vendor          : Association to Vendor not null           @mandatory  @Common.Label: '{i18n>MerchantPattern.vendor}';
    pattern         : String(1000) not null                    @mandatory  @Common.Label: '{i18n>MerchantPattern.pattern}';
    matchType       : MatchType not null                       @mandatory  @Common.Label: '{i18n>MerchantPattern.matchType}';
    patternSource   : Association to PatternSource not null    @mandatory  @Common.Label: '{i18n>MerchantPattern.patternSource}';
    confidenceLevel : Association to ConfidenceLevel not null  @mandatory  @Common.Label: '{i18n>MerchantPattern.confidenceLevel}';
    amount          : Decimal(15, 2)                           @Common.Label: '{i18n>MerchantPattern.amount}';
    isActive        : Boolean not null default true            @mandatory  @Common.Label: '{i18n>MerchantPattern.isActive}';
}

// Category-suggestion ranking for the categorization engine: a live count of
// each (vendor, purchaseType, earningCategory) combination across categorized
// transactions
view VendorCategoryStats as
    select from Transaction {
        vendor.ID          as vendor_ID          : UUID,
        purchaseType.ID    as purchaseType_ID    : UUID,
        earningCategory.ID as earningCategory_ID : UUID,
        count( * )         as usageCount         : Integer
    }
    where
        vendor.ID is not null
    group by
        vendor.ID,
        purchaseType.ID,
        earningCategory.ID;
