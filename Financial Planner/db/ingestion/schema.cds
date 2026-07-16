namespace com.financialplanner;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {
    com.financialplanner.ProviderType,
    com.financialplanner.LastSyncStatus
} from '../enums';
using {com.financialplanner.CardInstance} from '../cards/schema';

// SimpleFIN Bridge connection health and account mapping.
// access_url_enc holds the encrypted SimpleFIN Access URL (EncryptionUtility).
// Never store or log the decrypted value.

entity ProviderConnection : cuid, managed {
    providerType     : ProviderType not null                           @mandatory  @Common.Label: '{i18n>ProviderConnection.providerType}';
    displayName      : String(200) not null                            @mandatory  @Common.Label: '{i18n>ProviderConnection.displayName}';
    accessUrlEnc     : String(2000) not null                           @mandatory  @Common.Label: '{i18n>ProviderConnection.accessUrlEnc}';
    lastSyncAt       : Timestamp                                       @Common.Label: '{i18n>ProviderConnection.lastSyncAt}';
    lastSyncStatus   : LastSyncStatus not null default 'never_synced'  @mandatory  @Common.Label: '{i18n>ProviderConnection.lastSyncStatus}';
    lastErrorMessage : String(1000)                                    @Common.Label: '{i18n>ProviderConnection.lastErrorMessage}';
    isActive         : Boolean not null default true                   @mandatory  @Common.Label: '{i18n>ProviderConnection.isActive}';
    accounts         : Association to many ProviderAccount
                           on accounts.providerConnection = $self;
}

entity ProviderAccount : cuid, managed {
    providerConnection : Association to ProviderConnection not null  @mandatory  @Common.Label: '{i18n>ProviderAccount.providerConnection}';
    cardInstance       : Association to CardInstance                 @Common.Label: '{i18n>ProviderAccount.cardInstance}';
    externalAccountId  : String(255) not null                        @mandatory  @Common.Label: '{i18n>ProviderAccount.externalAccountId}';
    accountName        : String(200)                                 @Common.Label: '{i18n>ProviderAccount.accountName}';
    isActive           : Boolean not null default true               @mandatory  @Common.Label: '{i18n>ProviderAccount.isActive}';
}

// One row per CSV import run: the imported file, its target card, and the
// persisted totals shown in the wizard's import history.
entity ImportLog : cuid, managed {
    cardInstance     : Association to CardInstance not null  @mandatory  @Common.Label: '{i18n>ImportLog.cardInstance}';
    fileName         : String(500) not null                  @mandatory  @Common.Label: '{i18n>ImportLog.fileName}';
    importDate       : Timestamp not null                    @mandatory  @Common.Label: '{i18n>ImportLog.importDate}';
    transactionCount : Integer not null                      @mandatory  @Common.Label: '{i18n>ImportLog.transactionCount}';
    totalAmount      : Decimal(15, 2) not null               @mandatory  @Common.Label: '{i18n>ImportLog.totalAmount}';
    skippedCount     : Integer not null default 0            @mandatory  @Common.Label: '{i18n>ImportLog.skippedCount}';
}
