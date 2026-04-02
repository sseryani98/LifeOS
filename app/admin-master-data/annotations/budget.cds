using AdminService as svc from '../../../srv/admin-service';

// ─── Budget Allocation ─────────────────────────────────────────────────────
annotate svc.BudgetAllocations with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>BudgetAllocation}',
    TypeNamePlural: '{i18n>BudgetAllocations}',
    Title         : {Value: purchaseType.name}
  },
  PresentationVariant: {
    SortOrder     : [{
      Property  : purchaseType_ID,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    purchaseType_ID,
    ratio,
    effectiveFrom,
    effectiveTo
  ],
  LineItem           : [
    {
      Value                : purchaseType.name,
      Label                : '{i18n>BudgetAllocation.purchaseType}',
      ![@HTML5.CssDefaults]: {width: '30%'}
    },
    {
      Value                : ratio,
      Label                : '{i18n>BudgetAllocation.ratio}',
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : effectiveFrom,
      ![@HTML5.CssDefaults]: {width: '25%'}
    },
    {
      Value                : effectiveTo,
      ![@HTML5.CssDefaults]: {width: '25%'}
    }
  ],
  FieldGroup #General: {Data: [
    {
      Value: purchaseType_ID,
      Label: '{i18n>BudgetAllocation.purchaseType}'
    },
    {Value: ratio},
    {Value: effectiveFrom},
    {Value: effectiveTo}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Recurrent Expense ─────────────────────────────────────────────────────
annotate svc.RecurrentExpenses with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>RecurrentExpense}',
    TypeNamePlural: '{i18n>RecurrentExpenses}',
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
    amount,
    purchaseType_ID,
    cardInstance_ID,
    effectiveFrom,
    effectiveTo
  ],
  LineItem           : [
    {
      Value                : name,
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : amount,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : purchaseType.name,
      Label                : '{i18n>RecurrentExpense.purchaseType}',
      ![@HTML5.CssDefaults]: {width: '18%'}
    },
    {
      Value                : cardInstance.marketCard.name,
      Label                : '{i18n>RecurrentExpense.cardInstance}',
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : effectiveFrom,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : effectiveTo,
      ![@HTML5.CssDefaults]: {width: '15%'}
    }
  ],
  FieldGroup #General: {Data: [
    {Value: name},
    {Value: amount},
    {
      Value: purchaseType_ID,
      Label: '{i18n>RecurrentExpense.purchaseType}'
    },
    {
      Value: cardInstance_ID,
      Label: '{i18n>RecurrentExpense.cardInstance}'
    },
    {Value: effectiveFrom},
    {Value: effectiveTo},
    {Value: notes}
  ]},
  Facets             : [{
    $Type : 'UI.ReferenceFacet',
    Label : '{i18n>FacetGeneral}',
    Target: '@UI.FieldGroup#General'
  }]
};

// ─── Field Labels & Hidden Fields ──────────────────────────────────────────

annotate svc.BudgetAllocations with {
  ID            @UI.Hidden;
  createdAt     @UI.Hidden;
  createdBy     @UI.Hidden;
  modifiedAt    @UI.Hidden;
  modifiedBy    @UI.Hidden;
  purchaseType  @title: '{i18n>BudgetAllocation.purchaseType}';
  ratio         @title: '{i18n>BudgetAllocation.ratio}';
  effectiveFrom @title: '{i18n>BudgetAllocation.effectiveFrom}';
  effectiveTo   @title: '{i18n>BudgetAllocation.effectiveTo}';
};

annotate svc.RecurrentExpenses with {
  ID            @UI.Hidden;
  createdAt     @UI.Hidden;
  createdBy     @UI.Hidden;
  modifiedAt    @UI.Hidden;
  modifiedBy    @UI.Hidden;
  name          @title: '{i18n>RecurrentExpense.name}';
  amount        @title: '{i18n>RecurrentExpense.amount}';
  purchaseType  @title: '{i18n>RecurrentExpense.purchaseType}';
  cardInstance  @title: '{i18n>RecurrentExpense.cardInstance}';
  effectiveFrom @title: '{i18n>RecurrentExpense.effectiveFrom}';
  effectiveTo   @title: '{i18n>RecurrentExpense.effectiveTo}';
  notes         @title: '{i18n>RecurrentExpense.notes}';
};
