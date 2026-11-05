using TransactionService as svc from '../../../srv/transaction-service';

annotate svc.Transactions with @Capabilities.FilterRestrictions: {
  FilterExpressionRestrictions: [{
    Property          : postedAt,
    AllowedExpressions: 'SingleRange'
  }]
};

annotate svc.Transactions with @UI: {
  HeaderInfo             : {
    TypeName      : '{i18n>Transaction}',
    TypeNamePlural: '{i18n>Transactions}',
    Title         : {Value: headerTitle},
    Description   : {Value: postedAt}
  },
  PresentationVariant    : {
    SortOrder     : [{
      Property  : postedAt,
      Descending: true
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields        : [
    postedAt,
    rawDescription,
    vendor_ID,
    purchaseType_ID,
    earningCategory_ID,
    cardInstance_ID,
    categorizationStatus,
    hasSplit,
    source,
    notes,
    isExcluded
  ],
  // Sized for a 1440px viewport: a date, a 4-digit amount with its currency and
  // the longest status label each fit on one line.
  LineItem               : [
    {
      Value                : postedAt,
      Label                : '{i18n>Transaction.postedAtShort}',
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : rawDescription,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : vendor_ID,
      ![@HTML5.CssDefaults]: {width: '8%'}
    },
    {
      Value                : amount,
      ![@HTML5.CssDefaults]: {width: '14%'}
    },
    {
      Value                : purchaseType_ID,
      ![@HTML5.CssDefaults]: {width: '10%'}
    },
    {
      Value                : earningCategory_ID,
      ![@HTML5.CssDefaults]: {width: '12%'}
    },
    {
      Value                : cardInstance_ID,
      ![@HTML5.CssDefaults]: {width: '9%'}
    },
    {
      Value                : categorizationStatus,
      Label                : '{i18n>Transaction.categorizationStatusShort}',
      Criticality          : statusCriticality,
      ![@HTML5.CssDefaults]: {width: '13%'}
    },
    // Rendered by the manifest's icon column in its place; this entry keeps the
    // column in the filter-parity count.
    {
      Value                : hasSplit,
      ![@HTML5.CssDefaults]: {width: '4%'}
    },
    {
      Value                : source,
      ![@HTML5.CssDefaults]: {width: '6%'}
    },
    {
      Value                : notes,
      ![@HTML5.CssDefaults]: {width: '4%'}
    }
  ],
  DataPoint #Amount      : {
    Value      : amount,
    Title      : '{i18n>Transaction.amount}',
    Criticality: amountCriticality
  },
  HeaderFacets           : [
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'AmountHeader',
      Target: '@UI.DataPoint#Amount'
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'StatusHeader',
      Target: '@UI.FieldGroup#StatusHeader'
    }
  ],
  // A FieldGroup, not a DataPoint: FE draws a header DataPoint large and without
  // its criticality icon, unlike the list and the Match card.
  FieldGroup #StatusHeader: {Data: [{
    Value      : categorizationStatus,
    Criticality: statusCriticality
  }]},
  // Three groups, each in its own subsection below: one form holding all three
  // gave a group two columns at some widths and split its fields 2+1, so each
  // group gets a whole form and lays out as one row under its own heading.
  FieldGroup #Details    : {Data: [
    {Value: rawDescription},
    {Value: vendor_ID},
    {Value: purchaseType_ID},
    {Value: earningCategory_ID}
  ]},
  FieldGroup #Posting    : {Data: [
    {Value: amount},
    {Value: postedAt},
    {
      Value        : transactedAt,
      ![@UI.Hidden]: {$edmJson: {$Eq: [
        {$Path: 'transactedAt'},
        {$Null: null}
      ]}}
    },
    {Value: source}
  ]},
  FieldGroup #UserInput  : {Data: [
    {Value: cardInstance_ID},
    {Value: notes},
    {Value: isExcluded}
  ]},
  FieldGroup #Suggestions: {Data: [
    {Value: matchedPattern},
    {Value: matchConfidence},
    {
      Value      : categorizationStatus,
      Criticality: statusCriticality
    }
  ]},
  Facets                 : [
    {
      $Type : 'UI.CollectionFacet',
      ID    : 'Details',
      Label : '{i18n>FacetDetails}',
      Facets: [
        {
          $Type : 'UI.CollectionFacet',
          ID    : 'DetailsCategory',
          Label : '{i18n>FacetDetailsCategory}',
          Facets: [{
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Details'
          }]
        },
        {
          $Type : 'UI.CollectionFacet',
          ID    : 'DetailsPosting',
          Label : '{i18n>FacetDetailsPosting}',
          Facets: [{
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Posting'
          }]
        },
        {
          $Type : 'UI.CollectionFacet',
          ID    : 'DetailsUserInput',
          Label : '{i18n>FacetDetailsUserInput}',
          Facets: [{
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#UserInput'
          }]
        }
      ]
    },
    // A split is optional: the section shows once one exists (the list's Split action makes it).
    {
      $Type        : 'UI.ReferenceFacet',
      Label        : '{i18n>FacetSplit}',
      Target       : 'split/@UI.FieldGroup#General',
      ![@UI.Hidden]: {$edmJson: {$Not: {$Path: 'hasSplit'}}}
    },
    {
      $Type : 'UI.CollectionFacet',
      ID    : 'Suggestions',
      Label : '{i18n>FacetSuggestions}',
      Facets: [
        {
          $Type : 'UI.ReferenceFacet',
          Label : '{i18n>FacetMatch}',
          Target: '@UI.FieldGroup#Suggestions'
        },
        {
          $Type : 'UI.ReferenceFacet',
          Label : '{i18n>FacetAlternatives}',
          Target: 'categoryAlternatives/@UI.LineItem'
        }
      ]
    }
  ]
};

// Picking a vendor fills the draft's empty PT/EC server-side, so the
// page must re-read them, the title, and the vendor's alternatives.
annotate svc.Transactions with @Common.SideEffects #VendorPicked: {
  SourceProperties: [vendor_ID],
  TargetProperties: [
    'purchaseType_ID',
    'earningCategory_ID',
    'headerTitle'
  ],
  TargetEntities  : [categoryAlternatives]
};

annotate svc.Transactions with {
  ID                    @UI.Hidden;
  createdAt             @UI.Hidden;
  createdBy             @UI.Hidden;
  modifiedAt            @UI.Hidden;
  modifiedBy            @UI.Hidden;
  statusCriticality     @UI.Hidden;
  amountCriticality     @UI.Hidden;
  headerTitle           @UI.HiddenFilter  @title: '{i18n>Transaction.headerTitle}';
  matchedPattern        @readonly  @UI.HiddenFilter  @title: '{i18n>Transaction.matchedPattern}';
  matchConfidence       @readonly  @UI.HiddenFilter  @title: '{i18n>Transaction.matchConfidence}';
  providerAccount       @UI.Hidden;
  externalId            @UI.Hidden;
  rawDescription        @readonly  @title: '{i18n>Transaction.rawDescription}';
  amount                @readonly  @title: '{i18n>Transaction.amount}'  @Measures.ISOCurrency: 'CAD';
  postedAt              @readonly  @title: '{i18n>Transaction.postedAt}';
  transactedAt          @readonly  @title: '{i18n>Transaction.transactedAt}';
  source                @readonly
                        @title : '{i18n>Transaction.source}'
                        @Common: {
    Text           : sourceType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'TransactionSourceTypes',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: source,
          ValueListProperty: 'code'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  categorizationStatus  @readonly
                        @title : '{i18n>Transaction.categorizationStatus}'
                        @Common: {
    FilterDefaultValue: 'uncategorized',
    Text           : categorizationStatusType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'CategorizationStatusTypes',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: categorizationStatus,
          ValueListProperty: 'code'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  hasSplit              @readonly  @title: '{i18n>Transaction.hasSplit}';
  notes                 @title: '{i18n>Transaction.notes}';
  // A boolean always holds a value, so the page must never mark it required.
  isExcluded            @title: '{i18n>Transaction.isExcluded}'  @Common.FieldControl: #Optional;
  vendor                @title : '{i18n>Transaction.vendor}'
                        @Common: {
    Text           : vendor.name,
    TextArrangement: #TextOnly,
    ValueList      : {
      CollectionPath: 'Vendors',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: vendor_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  purchaseType          @title : '{i18n>Transaction.purchaseType}'
                        @Common: {
    Text           : purchaseType.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'PurchaseTypes',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: purchaseType_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  earningCategory       @title : '{i18n>Transaction.earningCategory}'
                        @Common: {
    Text           : earningCategory.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'EarningCategories',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: earningCategory_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'name'
        }
      ]
    }
  };
  cardInstance          @title : '{i18n>Transaction.cardInstance}'
                        @Common: {
    Text           : cardInstance.marketCard.name,
    TextArrangement: #TextOnly,
    ValueListWithFixedValues,
    ValueList      : {
      CollectionPath: 'CardInstances',
      Parameters    : [
        {
          $Type            : 'Common.ValueListParameterInOut',
          LocalDataProperty: cardInstance_ID,
          ValueListProperty: 'ID'
        },
        {
          $Type            : 'Common.ValueListParameterDisplayOnly',
          ValueListProperty: 'cardholderName'
        }
      ]
    }
  };
};

// My Share % is the manifest's custom field: the stored 0–1 fraction must show
// and edit as the 0–100 the Split dialog uses.
annotate svc.TransactionSplits with @UI: {FieldGroup #General: {Data: [
  {Value: myShareAmount},
  {Value: splitDescription},
  {Value: isRecurring}
]}};

// Editing one share recomputes or clears the other server-side, so the page re-reads both.
annotate svc.TransactionSplits with @Common.SideEffects #Share: {
  SourceProperties: [
    mySharePct,
    myShareAmount
  ],
  TargetProperties: [
    'mySharePct',
    'myShareAmount'
  ]
};

annotate svc.TransactionSplits with {
  ID               @UI.Hidden;
  createdAt        @UI.Hidden;
  createdBy        @UI.Hidden;
  modifiedAt       @UI.Hidden;
  modifiedBy       @UI.Hidden;
  mySharePct       @title: '{i18n>TransactionSplit.mySharePct}';
  // Either share may be entered, so neither is required; the backend fills the amount.
  myShareAmount    @title: '{i18n>TransactionSplit.myShareAmount}'  @Measures.ISOCurrency: 'CAD'  @Common.FieldControl: #Optional;
  splitDescription @title: '{i18n>TransactionSplit.splitDescription}';
  isRecurring      @title: '{i18n>TransactionSplit.isRecurring}'  @Common.FieldControl: #Optional;
};

annotate svc.CategorizationStatusTypes with {
  code @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
};

annotate svc.TransactionSourceTypes with {
  code @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
};

annotate svc.Vendors with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.PurchaseTypes with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.EarningCategories with {
  ID         @UI.Hidden  @Common: {
    Text           : name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.CardInstances with {
  ID         @UI.Hidden  @Common: {
    Text           : marketCard.name,
    TextArrangement: #TextOnly
  };
  createdAt  @UI.Hidden;
  createdBy  @UI.Hidden;
  modifiedAt @UI.Hidden;
  modifiedBy @UI.Hidden;
};

annotate svc.VendorCategoryAlternatives with @UI: {
  HeaderInfo         : {
    TypeName      : '{i18n>VendorCategoryAlternative}',
    TypeNamePlural: '{i18n>VendorCategoryAlternatives}'
  },
  // Ranked by count, so the vendor's usual combo leads.
  PresentationVariant: {
    SortOrder     : [{
      Property  : usageCount,
      Descending: true
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields    : [
    purchaseType_ID,
    earningCategory_ID,
    usageCount
  ],
  LineItem           : [
    {
      Value                : purchaseType_ID,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      Value                : earningCategory_ID,
      ![@HTML5.CssDefaults]: {width: '40%'}
    },
    {
      Value                : usageCount,
      ![@HTML5.CssDefaults]: {width: '20%'}
    }
  ]
};

annotate svc.VendorCategoryAlternatives with {
  comboKey        @UI.Hidden;
  vendor_ID       @UI.Hidden;
  purchaseType_ID @title : '{i18n>Transaction.purchaseType}'
                  @Common: {
    Text           : purchaseType.name,
    TextArrangement: #TextOnly
  };
  earningCategory_ID @title : '{i18n>Transaction.earningCategory}'
                     @Common: {
    Text           : earningCategory.name,
    TextArrangement: #TextOnly
  };
  usageCount      @title: '{i18n>VendorCategoryAlternative.usageCount}';
};
