using AdminService as svc from '../../../srv/admin-service';

annotate svc.RewardsPrograms with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RewardsProgram}',
    TypeNamePlural: '{i18n>RewardsPrograms}',
    Title         : {Value: '{i18n>RewardsProgram}'}
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
    currencyType_code,
    cppValuation
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      Value                : currencyType_code,
      ![@HTML5.CssDefaults]: {width: '35%'}
    },
    {
      Value                : cppValuation,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: currencyType_code},
    {Value: cppValuation}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.ProgramTiers with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ProgramTier}',
    TypeNamePlural: '{i18n>ProgramTiers}',
    Title         : {Value: '{i18n>ProgramTier}'}
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

annotate svc.CardNetworks with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>CardNetwork}',
    TypeNamePlural: '{i18n>CardNetworks}',
    Title         : {Value: '{i18n>CardNetwork}'}
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
  }]
};

annotate svc.RewardsPrograms with {
  ID           @UI.Hidden
               @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt    @UI.Hidden;
  createdBy    @UI.Hidden;
  modifiedAt   @UI.Hidden;
  modifiedBy   @UI.Hidden;
  name         @title: '{i18n>RewardsProgram.name}';
  currencyType @title : '{i18n>RewardsProgram.currencyType}'
               @Common: {
    Text           : currencyType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues
  };
  cppValuation @title: '{i18n>RewardsProgram.cppValuation}';
};

annotate svc.ProgramTiers with {
  ID             @UI.Hidden;
  createdAt      @UI.Hidden;
  createdBy      @UI.Hidden;
  modifiedAt     @UI.Hidden;
  modifiedBy     @UI.Hidden;
  rewardsProgram @title: '{i18n>ProgramTier.rewardsProgram}';
  name           @title: '{i18n>ProgramTier.name}';
};

annotate svc.CardNetworks with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  modifiedAt @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>CardNetwork.name}';
};

annotate svc.RewardsCurrencyType with {
  code @UI.Hidden
       @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  name @UI.HiddenFilter;
};

annotate svc.CardType with {
  code @UI.Hidden
       @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  name @UI.HiddenFilter;
};

annotate svc.CardSegment with {
  code @UI.Hidden
       @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  name @UI.HiddenFilter;
};
