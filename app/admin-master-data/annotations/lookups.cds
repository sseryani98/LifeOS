using AdminService as svc from '../../../srv/admin-service';

annotate svc.FinancialAccountTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>FinancialAccountType}',
    TypeNamePlural: '{i18n>FinancialAccountTypes}',
    Title         : {Value: '{i18n>FinancialAccountType}'}
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
    isAsset
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '60%'}
    },
    {
      Value                : isAsset,
      ![@HTML5.CssDefaults]: {width: '40%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: isAsset}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.IncomeSourceTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>IncomeSourceType}',
    TypeNamePlural: '{i18n>IncomeSourceTypes}',
    Title         : {Value: '{i18n>IncomeSourceType}'}
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

annotate svc.PerkTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PerkType}',
    TypeNamePlural: '{i18n>PerkTypes}',
    Title         : {Value: '{i18n>PerkType}'}
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

annotate svc.AdjustmentTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AdjustmentType}',
    TypeNamePlural: '{i18n>AdjustmentTypes}',
    Title         : {Value: '{i18n>AdjustmentType}'}
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

annotate svc.RedemptionTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RedemptionType}',
    TypeNamePlural: '{i18n>RedemptionTypes}',
    Title         : {Value: '{i18n>RedemptionType}'}
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

annotate svc.AlertTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AlertType}',
    TypeNamePlural: '{i18n>AlertTypes}',
    Title         : {Value: '{i18n>AlertType}'}
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

annotate svc.AlertSeverities with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AlertSeverity}',
    TypeNamePlural: '{i18n>AlertSeverities}',
    Title         : {Value: '{i18n>AlertSeverity}'}
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

annotate svc.PatternSources with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PatternSource}',
    TypeNamePlural: '{i18n>PatternSources}',
    Title         : {Value: '{i18n>PatternSource}'}
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

annotate svc.ConfidenceLevels with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ConfidenceLevel}',
    TypeNamePlural: '{i18n>ConfidenceLevels}',
    Title         : {Value: '{i18n>ConfidenceLevel}'}
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

annotate svc.ScrapeMappings with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ScrapeMapping}',
    TypeNamePlural: '{i18n>ScrapeMappings}',
    Title         : {Value: '{i18n>ScrapeMapping}'}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : entityType,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    entityType,
    sourceText,
    targetId
  ],
  LineItem           : [
    {
      Value                : entityType,
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : sourceText,
      ![@HTML5.CssDefaults]: {width: '50%'}
    },
    {
      Value                : targetId,
      ![@HTML5.CssDefaults]: {width: '30%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: entityType},
    {Value: sourceText},
    {Value: targetId}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

annotate svc.FinancialAccountTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>FinancialAccountType.name}';
  isAsset    @title: '{i18n>FinancialAccountType.isAsset}';
};

annotate svc.IncomeSourceTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>IncomeSourceType.name}';
};

annotate svc.PerkTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>PerkType.name}';
};

annotate svc.AdjustmentTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AdjustmentType.name}';
};

annotate svc.RedemptionTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>RedemptionType.name}';
};

annotate svc.AlertTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AlertType.name}';
};

annotate svc.AlertSeverities with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AlertSeverity.name}';
};

annotate svc.PatternSources with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>PatternSource.name}';
};

annotate svc.ConfidenceLevels with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>ConfidenceLevel.name}';
};

annotate svc.ScrapeMappings with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  entityType @title: '{i18n>ScrapeMapping.entityType}';
  sourceText @title: '{i18n>ScrapeMapping.sourceText}';
  targetId   @title: '{i18n>ScrapeMapping.targetId}';
};
