using AdminService as svc from '../../../srv/admin-service';

// ─── Purchase Type ─────────────────────────────────────────────────────────
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
  SelectionFields    : [
    name,
    parent_ID,
    sortOrder,
    excludesFromBudget
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      Value                : parent.name,
      Label                : '{i18n>PurchaseType.parent}',
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      Value                : sortOrder,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : excludesFromBudget,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {
      Value: parent_ID,
      Label: '{i18n>PurchaseType.parent}'
    },
    {Value: sortOrder},
    {Value: excludesFromBudget}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Earning Category ──────────────────────────────────────────────────────
annotate svc.EarningCategories with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>EarningCategory}',
    TypeNamePlural: '{i18n>EarningCategories}',
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
    sortOrder
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '70%'}
    },
    {
      Value                : sortOrder,
      ![@HTML5.CssDefaults]: {width: '30%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: sortOrder}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Field Labels & Hidden Fields ──────────────────────────────────────────

annotate svc.PurchaseTypes with {
  ID                 @UI.Hidden;
  createdAt          @UI.Hidden;
  createdBy          @UI.Hidden;
  modifiedAt         @UI.Hidden;
  modifiedBy         @UI.Hidden;
  name               @title: '{i18n>PurchaseType.name}';
  parent             @title: '{i18n>PurchaseType.parent}';
  sortOrder          @title: '{i18n>PurchaseType.sortOrder}';
  excludesFromBudget @title: '{i18n>PurchaseType.excludesFromBudget}';
};

annotate svc.EarningCategories with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>EarningCategory.name}';
  sortOrder  @title: '{i18n>EarningCategory.sortOrder}';
};
