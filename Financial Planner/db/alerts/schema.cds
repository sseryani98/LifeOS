namespace com.financialplanner;

using {
    cuid,
    managed
} from '@sap/cds/common';
using {com.financialplanner.AlertStatus} from '../enums';
using {
    com.financialplanner.AlertType,
    com.financialplanner.AlertSeverity
} from '../reference/schema';
using {
    com.financialplanner.CardInstance,
    com.financialplanner.OfferTranche,
    com.financialplanner.CardPerk
} from '../cards/schema';
using {com.financialplanner.ProviderConnection} from '../ingestion/schema';


entity Alert : cuid, managed {
    alertType          : Association to AlertType not null      @mandatory  @Common.Label: '{i18n>Alert.alertType}';
    alertSeverity      : Association to AlertSeverity not null  @mandatory  @Common.Label: '{i18n>Alert.alertSeverity}';
    title              : String(200) not null                   @mandatory  @Common.Label: '{i18n>Alert.title}';
    message            : String(1000) not null                  @mandatory  @Common.Label: '{i18n>Alert.message}';
    cardInstance       : Association to CardInstance            @Common.Label: '{i18n>Alert.cardInstance}';
    providerConnection : Association to ProviderConnection      @Common.Label: '{i18n>Alert.providerConnection}';
    offerTranche       : Association to OfferTranche            @Common.Label: '{i18n>Alert.offerTranche}';
    cardPerk           : Association to CardPerk                @Common.Label: '{i18n>Alert.cardPerk}';
    dueDate            : Date                                   @Common.Label: '{i18n>Alert.dueDate}';
    status             : AlertStatus not null default 'active'  @mandatory  @Common.Label: '{i18n>Alert.status}';
    dismissedAt        : Timestamp                              @Common.Label: '{i18n>Alert.dismissedAt}';
}
