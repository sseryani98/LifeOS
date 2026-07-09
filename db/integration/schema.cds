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
