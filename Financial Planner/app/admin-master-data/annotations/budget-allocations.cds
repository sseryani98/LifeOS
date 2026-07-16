using AdminService as svc from '../../../srv/admin-service';

annotate svc.BudgetAllocations with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>BudgetAllocation}',
    TypeNamePlural: '{i18n>BudgetAllocations}',
    Title         : {Value: '{i18n>BudgetAllocation}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : purchaseCategory_ID,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    purchaseCategory_ID,
    ratio,
    effectiveFrom,
    effectiveTo
  ],
  LineItem           : [
    {
      Value                : purchaseCategory_ID,
      Label                : '{i18n>BudgetAllocation.purchaseCategory}',
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      Value                : ratio,
      Label                : '{i18n>BudgetAllocation.ratio}',
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : effectiveFrom,
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      Value                : effectiveTo,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  FieldGroup #General: {Data: [
    {
      Value: purchaseCategory_ID,
      Label: '{i18n>BudgetAllocation.purchaseCategory}'
    },
    {Value: ratio},
    {Value: effectiveFrom},
    {Value: effectiveTo}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.BudgetAllocations with {
  ID               @UI.Hidden;
  createdAt        @UI.Hidden;
  createdBy        @UI.Hidden;
  modifiedAt       @UI.Hidden;
  modifiedBy       @UI.Hidden;
  purchaseCategory @title : '{i18n>BudgetAllocation.purchaseCategory}'
                   @Common: {
    Text           : purchaseCategory.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'PurchaseCategories',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: purchaseCategory_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'excludesFromBudget'
        }
      ]
    }
  };
  ratio            @title: '{i18n>BudgetAllocation.ratio}';
  effectiveFrom    @title: '{i18n>BudgetAllocation.effectiveFrom}';
  effectiveTo      @title: '{i18n>BudgetAllocation.effectiveTo}';
};
