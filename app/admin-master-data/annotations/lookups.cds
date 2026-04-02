using AdminService as svc from '../../../srv/admin-service';

// ─── Financial Account Type ────────────────────────────────────────────────
annotate svc.FinancialAccountTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>FinancialAccountType}',
    TypeNamePlural: '{i18n>FinancialAccountTypes}',
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
    sortOrder,
    isAsset
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      Value                : sortOrder,
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      Value                : isAsset,
      ![@HTML5.CssDefaults]: {width: '30%'}
    }
  ]
};

// ─── Income Source Type ────────────────────────────────────────────────────
annotate svc.IncomeSourceTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>IncomeSourceType}',
    TypeNamePlural: '{i18n>IncomeSourceTypes}',
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

// ─── Perk Type ─────────────────────────────────────────────────────────────
annotate svc.PerkTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PerkType}',
    TypeNamePlural: '{i18n>PerkTypes}',
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

// ─── Adjustment Type ───────────────────────────────────────────────────────
annotate svc.AdjustmentTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AdjustmentType}',
    TypeNamePlural: '{i18n>AdjustmentTypes}',
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

// ─── Redemption Type ───────────────────────────────────────────────────────
annotate svc.RedemptionTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RedemptionType}',
    TypeNamePlural: '{i18n>RedemptionTypes}',
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

// ─── Alert Type (read-only) ────────────────────────────────────────────────
annotate svc.AlertTypes with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AlertType}',
    TypeNamePlural: '{i18n>AlertTypes}',
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

// ─── Alert Severity (read-only) ────────────────────────────────────────────
annotate svc.AlertSeverities with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>AlertSeverity}',
    TypeNamePlural: '{i18n>AlertSeverities}',
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

// ─── Pattern Source (read-only) ────────────────────────────────────────────
annotate svc.PatternSources with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>PatternSource}',
    TypeNamePlural: '{i18n>PatternSources}',
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

// ─── Confidence Level (read-only) ──────────────────────────────────────────
annotate svc.ConfidenceLevels with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ConfidenceLevel}',
    TypeNamePlural: '{i18n>ConfidenceLevels}',
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

// ─── Scrape Mapping ────────────────────────────────────────────────────────
annotate svc.ScrapeMappings with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>ScrapeMapping}',
    TypeNamePlural: '{i18n>ScrapeMappings}',
    Title         : {Value: sourceText}
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
  ]
};

// ─── Field Labels & Hidden Fields ──────────────────────────────────────────

annotate svc.FinancialAccountTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>FinancialAccountType.name}';
  sortOrder  @title: '{i18n>FinancialAccountType.sortOrder}';
  isAsset    @title: '{i18n>FinancialAccountType.isAsset}';
};

annotate svc.IncomeSourceTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>IncomeSourceType.name}';
  sortOrder  @title: '{i18n>IncomeSourceType.sortOrder}';
};

annotate svc.PerkTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>PerkType.name}';
  sortOrder  @title: '{i18n>PerkType.sortOrder}';
};

annotate svc.AdjustmentTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AdjustmentType.name}';
  sortOrder  @title: '{i18n>AdjustmentType.sortOrder}';
};

annotate svc.RedemptionTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>RedemptionType.name}';
  sortOrder  @title: '{i18n>RedemptionType.sortOrder}';
};

annotate svc.AlertTypes with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AlertType.name}';
  sortOrder  @title: '{i18n>AlertType.sortOrder}';
};

annotate svc.AlertSeverities with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>AlertSeverity.name}';
  sortOrder  @title: '{i18n>AlertSeverity.sortOrder}';
};

annotate svc.PatternSources with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>PatternSource.name}';
  sortOrder  @title: '{i18n>PatternSource.sortOrder}';
};

annotate svc.ConfidenceLevels with {
  ID         @UI.Hidden;
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
  name       @title: '{i18n>ConfidenceLevel.name}';
  sortOrder  @title: '{i18n>ConfidenceLevel.sortOrder}';
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
