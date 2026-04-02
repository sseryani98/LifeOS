using AdminService as svc from '../../../srv/admin-service';

// ─── Issuer ────────────────────────────────────────────────────────────────
annotate svc.Issuers with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>Issuer}',
    TypeNamePlural: '{i18n>Issuers}',
    Title         : {Value: name}
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
  FieldGroup #General: {Data: [
    {Value: shortName}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Rewards Program ───────────────────────────────────────────────────────
annotate svc.RewardsPrograms with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RewardsProgram}',
    TypeNamePlural: '{i18n>RewardsPrograms}',
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
    currencyName,
    cppValuation
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      Value                : currencyName,
      ![@HTML5.CssDefaults]: {width: '35%'}
    },
    {
      Value                : cppValuation,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: currencyName},
    {Value: cppValuation}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Program Tier (composition child of Rewards Program) ───────────────────
annotate svc.ProgramTiers with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ProgramTier}',
    TypeNamePlural: '{i18n>ProgramTiers}',
    Title         : {Value: name}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : name,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '70%'}
    },
    {
      Value                : sortOrder,
      ![@HTML5.CssDefaults]: {width: '30%'}
    }
  ]
};

// ─── Issuer Application Rule ───────────────────────────────────────────────
annotate svc.IssuerApplicationRules with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>IssuerApplicationRule}',
    TypeNamePlural: '{i18n>IssuerApplicationRules}',
    Title         : {Value: description}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : issuer_ID,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    issuer_ID,
    rewardsProgram_ID,
    ruleType,
    parameterCount,
    parameterDays,
    appliesToCardType,
    appliesToSegment,
    description
  ],
  LineItem           : [
    {
      Value                : issuer.name,
      Label                : '{i18n>IssuerApplicationRule.issuer}',
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : rewardsProgram.name,
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
      Value                : appliesToCardType,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : appliesToSegment,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : description,
      ![@HTML5.CssDefaults]: {width: '26%'}
    }
  ],
  FieldGroup #General: {Data: [
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
  FieldGroup #Scope: {Data: [
    {Value: appliesToCardType},
    {Value: appliesToSegment}
  ]},
  Facets             : [
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

// ─── Card Network (read-only) ──────────────────────────────────────────────
annotate svc.CardNetworks with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>CardNetwork}',
    TypeNamePlural: '{i18n>CardNetworks}',
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
  ]
};

// ─── Field Labels & Hidden Fields ──────────────────────────────────────────

annotate svc.Issuers with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>Issuer.name}';
  shortName  @title : '{i18n>Issuer.shortName}'
             @Common: {
    Text           : name,
    TextArrangement: #TextLast
  };
};

annotate svc.RewardsPrograms with {
  ID           @UI.Hidden;
  createdAt    @UI.Hidden;
  createdBy    @UI.Hidden;
  modifiedAt   @UI.Hidden;
  modifiedBy   @UI.Hidden;
  name         @title: '{i18n>RewardsProgram.name}';
  currencyName @title: '{i18n>RewardsProgram.currencyName}';
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
  sortOrder      @title: '{i18n>ProgramTier.sortOrder}';
};

annotate svc.IssuerApplicationRules with {
  ID                @UI.Hidden;
  createdAt         @UI.Hidden;
  createdBy         @UI.Hidden;
  modifiedAt        @UI.Hidden;
  modifiedBy        @UI.Hidden;
  issuer            @title: '{i18n>IssuerApplicationRule.issuer}';
  rewardsProgram    @title: '{i18n>IssuerApplicationRule.rewardsProgram}';
  ruleType          @title: '{i18n>IssuerApplicationRule.ruleType}';
  parameterCount    @title: '{i18n>IssuerApplicationRule.parameterCount}';
  parameterDays     @title: '{i18n>IssuerApplicationRule.parameterDays}';
  appliesToCardType @title: '{i18n>IssuerApplicationRule.appliesToCardType}';
  appliesToSegment  @title: '{i18n>IssuerApplicationRule.appliesToSegment}';
  referenceDate     @title: '{i18n>IssuerApplicationRule.referenceDate}';
  description       @title: '{i18n>IssuerApplicationRule.description}';
};

annotate svc.CardNetworks with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  modifiedAt @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>CardNetwork.name}';
  sortOrder  @title: '{i18n>CardNetwork.sortOrder}';
};
