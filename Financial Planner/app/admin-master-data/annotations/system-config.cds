using AdminService as svc from '../../../srv/admin-service';

annotate svc.SystemConfigs with
@Capabilities.InsertRestrictions.Insertable: false
@Capabilities.DeleteRestrictions.Deletable : false;

annotate svc.SystemConfigs with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>SystemConfig}',
    TypeNamePlural: '{i18n>SystemConfigs}',
    Title         : {Value: '{i18n>SystemConfig}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : ![key],
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    ![key],
    value,
    description
  ],
  LineItem           : [
    {
      Value                : ![key],
      Label                : '{i18n>SystemConfig.key}',
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      Value                : value,
      ![@HTML5.CssDefaults]: {width: '35%'}
    },
    {
      Value                : description,
      ![@HTML5.CssDefaults]: {width: '40%'}
    }
  ],
  FieldGroup #General: {Data: [
    {
      Value: ![key],
      Label: '{i18n>SystemConfig.key}'
    },
    {Value: value},
    {Value: description}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.SystemConfigs with {
  ID          @UI.Hidden;
  createdAt   @UI.Hidden;
  createdBy   @UI.Hidden;
  modifiedAt  @UI.Hidden;
  modifiedBy  @UI.Hidden;
  ![key]      @title : '{i18n>SystemConfig.key}'
              @Common: {
    ValueListWithFixedValues,
    ValueList: {
      CollectionPath: 'SystemConfigs',
      Parameters    : [{
        $Type            : 'Common.ValueListParameterInOut',
        LocalDataProperty: ![key],
        ValueListProperty: 'key'
      }]
    }
  };
  value       @title: '{i18n>SystemConfig.value}';
  description @title: '{i18n>SystemConfig.description}';
};
