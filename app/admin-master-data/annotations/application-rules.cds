using AdminService as svc from '../../../srv/admin-service';

annotate svc.IssuerApplicationRules with @UI: {
  HeaderInfo            : {
    TypeName      : '{i18n>IssuerApplicationRule}',
    TypeNamePlural: '{i18n>IssuerApplicationRules}',
    Title         : {Value: '{i18n>IssuerApplicationRule}'}
  },
  PresentationVariant   : {
    SortOrder     : [{
      Property  : issuer_ID,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields       : [
    issuer_ID,
    rewardsProgram_ID,
    ruleType,
    parameterCount,
    parameterDays,
    appliesToCardType_code,
    appliesToCardSegment_code,
    description
  ],
  LineItem              : [
    {
      Value                : issuer_ID,
      Label                : '{i18n>IssuerApplicationRule.issuer}',
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : rewardsProgram_ID,
      Label                : '{i18n>IssuerApplicationRule.rewardsProgram}',
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : ruleType,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : parameterCount,
      ![@HTML5.CssDefaults]: {width: '8%'}
    },
    {
      Value                : parameterDays,
      ![@HTML5.CssDefaults]: {width: '8%'}
    },
    {
      Value                : appliesToCardType_code,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : appliesToCardSegment_code,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : description,
      ![@HTML5.CssDefaults]: {width: '26%'}
    }
  ],
  FieldGroup #General   : {Data: [
    {
      Value: issuer_ID,
      Label: '{i18n>IssuerApplicationRule.issuer}'
    },
    {
      Value: rewardsProgram_ID,
      Label: '{i18n>IssuerApplicationRule.rewardsProgram}'
    },
    {Value: ruleType},
    {Value: description}
  ]},
  FieldGroup #Parameters: {Data: [
    {Value: parameterCount},
    {Value: parameterDays},
    {Value: referenceDate}
  ]},
  FieldGroup #Scope     : {Data: [
    {Value: appliesToCardType_code},
    {Value: appliesToCardSegment_code}
  ]},
  Facets                : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetGeneral}',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetParameters}',
      Target: '@UI.FieldGroup#Parameters'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetScope}',
      Target: '@UI.FieldGroup#Scope'
    }
  ]
};

annotate svc.IssuerApplicationRules with {
  ID                   @UI.Hidden;
  createdAt            @UI.Hidden;
  createdBy            @UI.Hidden;
  modifiedAt           @UI.Hidden;
  modifiedBy           @UI.Hidden;
  issuer               @title : '{i18n>IssuerApplicationRule.issuer}'
                       @Common: {
    Text           : issuer.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'Issuers',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: issuer_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'shortName'
        }
      ]
    }
  };
  rewardsProgram       @title : '{i18n>IssuerApplicationRule.rewardsProgram}'
                       @Common: {
    Text           : rewardsProgram.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'RewardsPrograms',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: rewardsProgram_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'currencyType_code'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'cppValuation'
        }
      ]
    }
  };
  ruleType             @title: '{i18n>IssuerApplicationRule.ruleType}';
  parameterCount       @title: '{i18n>IssuerApplicationRule.parameterCount}';
  parameterDays        @title: '{i18n>IssuerApplicationRule.parameterDays}';
  appliesToCardType    @title : '{i18n>IssuerApplicationRule.appliesToCardType}'
                       @Common: {
    Text           : appliesToCardType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues
  };
  appliesToCardSegment @title : '{i18n>IssuerApplicationRule.appliesToCardSegment}'
                       @Common: {
    Text           : appliesToCardSegment.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues
  };
  referenceDate        @title : '{i18n>IssuerApplicationRule.referenceDate}'
                       @UI.Hidden;
  description          @title: '{i18n>IssuerApplicationRule.description}';
};
