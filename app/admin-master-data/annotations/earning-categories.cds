using AdminService as svc from '../../../srv/admin-service';

annotate svc.EarningCategories with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>EarningCategory}',
    TypeNamePlural: '{i18n>EarningCategories}',
    Title         : {Value: '{i18n>EarningCategory}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : name,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [name],
  LineItem           : [{
    Value                : name,
    ![@HTML5.CssDefaults]: {width: '100%'}
  }],
  FieldGroup #General: {Data: [{Value: name}]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.EarningCategories with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>EarningCategory.name}';
};
