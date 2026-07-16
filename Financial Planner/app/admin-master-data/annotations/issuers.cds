using AdminService as svc from '../../../srv/admin-service';

annotate svc.Issuers with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>Issuer}',
    TypeNamePlural: '{i18n>Issuers}',
    Title         : {Value: '{i18n>Issuer}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : shortName,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [name],
  LineItem           : [{
    Value                : shortName,
    Label                : '{i18n>Issuer.name}',
    ![@HTML5.CssDefaults]: {width: '100%'}
  }],
  FieldGroup #General: {Data: [{Value: shortName}]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.Issuers with {
  ID         @UI.Hidden
             @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>Issuer.name}';
  shortName  @title : '{i18n>Issuer.shortName}'
             @UI.HiddenFilter
             @Common: {
    Text           : name,
    TextArrangement: #TextLast
  };
};
