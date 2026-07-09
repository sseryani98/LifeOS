using AdminService as svc from '../../../srv/admin-service';

annotate svc.RecurrentExpenses with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RecurrentExpense}',
    TypeNamePlural: '{i18n>RecurrentExpenses}',
    Title         : {Value: '{i18n>RecurrentExpense}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : name,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    name,
    amount,
    purchaseType_ID,
    cardInstance_ID,
    effectiveFrom,
    effectiveTo
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : amount,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : purchaseType_ID,
      Label                : '{i18n>RecurrentExpense.purchaseType}',
      ![@HTML5.CssDefaults]: {width: '18%'}
    },
    {
      Value                : cardInstance_ID,
      Label                : '{i18n>RecurrentExpense.cardInstance}',
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : effectiveFrom,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : effectiveTo,
      ![@HTML5.CssDefaults]: {width: '15%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: amount},
    {
      Value: purchaseType_ID,
      Label: '{i18n>RecurrentExpense.purchaseType}'
    },
    {
      Value: cardInstance_ID,
      Label: '{i18n>RecurrentExpense.cardInstance}'
    },
    {Value: effectiveFrom},
    {Value: effectiveTo},
    {Value: notes}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.RecurrentExpenses with {
  ID            @UI.Hidden;
  createdAt     @UI.Hidden;
  createdBy     @UI.Hidden;
  modifiedAt    @UI.Hidden;
  modifiedBy    @UI.Hidden;
  name          @title: '{i18n>RecurrentExpense.name}';
  amount        @title: '{i18n>RecurrentExpense.amount}';
  purchaseType  @title : '{i18n>RecurrentExpense.purchaseType}'
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
  cardInstance  @title : '{i18n>RecurrentExpense.cardInstance}'
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
          ValueListProperty: 'lifecycleState'
        }
      ]
    }
  };
  effectiveFrom @title: '{i18n>RecurrentExpense.effectiveFrom}';
  effectiveTo   @title: '{i18n>RecurrentExpense.effectiveTo}';
  notes         @title: '{i18n>RecurrentExpense.notes}';
};
