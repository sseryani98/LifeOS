using AdminService as svc from '../../../srv/admin-service';

annotate svc.CardInstances with {
  ID         @UI.Hidden  @Common: {
    Text           : marketCard.name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.ProviderAccounts with {
  ID           @UI.Hidden;
  createdAt    @UI.Hidden;
  createdBy    @UI.Hidden;
  modifiedAt   @UI.Hidden;
  modifiedBy   @UI.Hidden;
  cardInstance @Common: {
    Text           : cardInstance.marketCard.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'CardInstances',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: cardInstance_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'cardholderName'
        }
      ]
    }
  };
};

annotate svc.ProviderConnections with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.ProviderConnections with @UI: {
  LineItem           : [
    {
      $Type                       : 'UI.DataField',
      Value                       : displayName,
      ![@HTML5.CssDefaults]       : {width: '34%'}
    },
    {
      $Type                       : 'UI.DataField',
      Value                       : lastSyncAt,
      ![@HTML5.CssDefaults]       : {width: '33%'}
    },
    {
      $Type                       : 'UI.DataField',
      Value                       : lastErrorMessage,
      ![@HTML5.CssDefaults]       : {width: '33%'}
    }
  ],
  PresentationVariant: {
    SortOrder     : [{Property: displayName}],
    Visualizations: ['@UI.LineItem']
  }
};

annotate svc.ProviderAccounts with @UI: {
  LineItem           : [
    {
      $Type                       : 'UI.DataField',
      Value                       : accountName,
      ![@HTML5.CssDefaults]       : {width: '50%'}
    },
    {
      $Type                       : 'UI.DataField',
      Value                       : externalAccountId,
      ![@HTML5.CssDefaults]       : {width: '50%'}
    }
  ],
  PresentationVariant: {
    SortOrder     : [{Property: accountName}],
    Visualizations: ['@UI.LineItem']
  }
};
