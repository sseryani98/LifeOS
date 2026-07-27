using TransactionService as svc from '../../../srv/transaction-service';

annotate svc.Transactions with @UI: {
  HeaderInfo             : {
    TypeName      : '{i18n>Transaction}',
    TypeNamePlural: '{i18n>Transactions}',
    Title         : {Value: rawDescription},
    Description   : {Value: postedAt}
  },
  PresentationVariant    : {
    SortOrder     : [{
      Property  : postedAt,
      Descending: true
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields        : [
    postedAt,
    cardInstance_ID,
    categorizationStatus,
    purchaseType_ID,
    earningCategory_ID,
    vendor_ID,
    source,
    isExcluded
  ],
  LineItem               : [
    {
      Value                : postedAt,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : rawDescription,
      ![@HTML5.CssDefaults]: {width: '22%'}
    },
    {
      Value                : vendor_ID,
      ![@HTML5.CssDefaults]: {width: '14%'}
    },
    {
      Value                : amount,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : purchaseType_ID,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : earningCategory_ID,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : cardInstance_ID,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : categorizationStatus,
      Criticality          : statusCriticality,
      ![@HTML5.CssDefaults]: {width: '10%'}
    }
  ],
  FieldGroup #Details    : {Data: [
    {Value: rawDescription},
    {Value: vendor_ID},
    {Value: purchaseType_ID},
    {Value: earningCategory_ID},
    {Value: amount},
    {Value: postedAt},
    {Value: transactedAt},
    {Value: cardInstance_ID},
    {Value: source},
    {Value: notes},
    {Value: isExcluded}
  ]},
  FieldGroup #Suggestions: {Data: [
    {
      Value      : categorizationStatus,
      Criticality: statusCriticality
    },
    {Value: hasSplit}
  ]},
  Facets                 : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetDetails}',
      Target: '@UI.FieldGroup#Details'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetSplit}',
      Target: 'split/@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetSuggestions}',
      Target: '@UI.FieldGroup#Suggestions'
    }
  ]
};

annotate svc.Transactions with {
  ID                    @UI.Hidden;
  createdAt             @UI.Hidden;
  createdBy             @UI.Hidden;
  modifiedAt            @UI.Hidden;
  modifiedBy            @UI.Hidden;
  statusCriticality     @UI.Hidden;
  providerAccount       @UI.Hidden;
  externalId            @UI.Hidden;
  rawDescription        @readonly  @title: '{i18n>Transaction.rawDescription}';
  amount                @readonly  @title: '{i18n>Transaction.amount}';
  postedAt              @readonly  @title: '{i18n>Transaction.postedAt}';
  transactedAt          @readonly  @title: '{i18n>Transaction.transactedAt}';
  source                @readonly  @title: '{i18n>Transaction.source}';
  categorizationStatus  @readonly  @title: '{i18n>Transaction.categorizationStatus}';
  hasSplit              @readonly  @title: '{i18n>Transaction.hasSplit}';
  notes                 @title: '{i18n>Transaction.notes}';
  isExcluded            @title: '{i18n>Transaction.isExcluded}';
  vendor                @title : '{i18n>Transaction.vendor}'
                        @Common: {
    Text           : vendor.name,
    TextArrangement: #TextOnly,
    ValueList      : {
      CollectionPath: 'Vendors',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: vendor_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  purchaseType          @title : '{i18n>Transaction.purchaseType}'
                        @Common: {
    Text           : purchaseType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'PurchaseTypes',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: purchaseType_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  earningCategory       @title : '{i18n>Transaction.earningCategory}'
                        @Common: {
    Text           : earningCategory.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'EarningCategories',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: earningCategory_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  cardInstance          @title : '{i18n>Transaction.cardInstance}'
                        @Common: {
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

annotate svc.TransactionSplits with @UI: {FieldGroup #General: {Data: [
  {Value: mySharePct},
  {Value: myShareAmount},
  {Value: splitDescription},
  {Value: isRecurring}
]}};

annotate svc.TransactionSplits with {
  ID               @UI.Hidden;
  createdAt        @UI.Hidden;
  createdBy        @UI.Hidden;
  modifiedAt       @UI.Hidden;
  modifiedBy       @UI.Hidden;
  mySharePct       @title: '{i18n>TransactionSplit.mySharePct}';
  myShareAmount    @title: '{i18n>TransactionSplit.myShareAmount}';
  splitDescription @title: '{i18n>TransactionSplit.splitDescription}';
  isRecurring      @title: '{i18n>TransactionSplit.isRecurring}';
};

annotate svc.Vendors with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.PurchaseTypes with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.EarningCategories with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

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
