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
using {com.financialplanner.ProviderAccount} from '../integration/schema';

entity Transaction : cuid, managed {
    cardInstance         : Association to CardInstance                            @Common.Label: '{i18n>Transaction.cardInstance}';
    providerAccount      : Association to ProviderAccount                         @Common.Label: '{i18n>Transaction.providerAccount}';
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
