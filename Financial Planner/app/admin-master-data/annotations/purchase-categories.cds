using AdminService as svc from '../../../srv/admin-service';

annotate svc.PurchaseCategories with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PurchaseCategory}',
    TypeNamePlural: '{i18n>PurchaseCategories}',
    Title         : {Value: name}
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
    excludesFromBudget
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '60%'}
    },
    {
      Value                : excludesFromBudget,
      ![@HTML5.CssDefaults]: {width: '40%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: excludesFromBudget}
  ]},
  Facets             : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetGeneral}',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetPurchaseTypes}',
      Target: 'purchaseTypes/@UI.LineItem'
    }
  ]
};

annotate svc.PurchaseTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PurchaseType}',
    TypeNamePlural: '{i18n>PurchaseTypes}',
    Title         : {Value: name}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : name,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  LineItem           : [{
    Value                : name,
    ![@HTML5.CssDefaults]: {width: '100%'}
  }]
};

annotate svc.PurchaseCategories with {
  ID                 @UI.Hidden
                     @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt          @UI.Hidden;
  createdBy          @UI.Hidden;
  modifiedAt         @UI.Hidden;
  modifiedBy         @UI.Hidden;
  name               @title: '{i18n>PurchaseCategory.name}';
  excludesFromBudget @title: '{i18n>PurchaseCategory.excludesFromBudget}';
};

annotate svc.PurchaseTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>PurchaseType.name}';
};
