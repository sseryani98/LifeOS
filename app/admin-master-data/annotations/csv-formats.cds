using AdminService as svc from '../../../srv/admin-service';

// ─── CSV Format Config ─────────────────────────────────────────────────────
annotate svc.CsvFormatConfigs with @UI: {
  HeaderInfo             : {
    TypeName      : '{i18n>CsvFormatConfig}',
    TypeNamePlural: '{i18n>CsvFormatConfigs}',
    Title         : {Value: '{i18n>CsvFormatConfig}'}
  },
  PresentationVariant    : {
    SortOrder     : [{
      Property  : issuer_ID,
      Descending: false
    }],
    Visualizations: ['@UI.LineItem']
  },
  SelectionFields        : [
    issuer_ID,
    configName,
    dateColumn,
    dateFormat,
    descriptionColumn,
    amountColumn
  ],
  LineItem               : [
    {
      Value                : issuer_ID,
      Label                : '{i18n>CsvFormatConfig.issuer}',
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : configName,
      ![@HTML5.CssDefaults]: {width: '20%'}
    },
    {
      Value                : dateColumn,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : dateFormat,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : descriptionColumn,
      ![@HTML5.CssDefaults]: {width: '15%'}
    },
    {
      Value                : amountColumn,
      ![@HTML5.CssDefaults]: {width: '15%'}
    }
  ],
  FieldGroup #General    : {Data: [
    {
      Value: issuer_ID,
      Label: '{i18n>CsvFormatConfig.issuer}'
    },
    {Value: configName},
    {Value: delimiter},
    {Value: headerRowsSkip}
  ]},
  FieldGroup #Columns    : {Data: [
    {Value: dateColumn},
    {Value: dateFormat},
    {Value: descriptionColumn},
    {Value: cardmemberColumn},
    {Value: statusColumn},
    {Value: statusPostedValue}
  ]},
  FieldGroup #AmountStyle: {Data: [
    {Value: amountColumn},
    {Value: amountSign},
    {Value: debitColumn},
    {Value: creditColumn}
  ]},
  Facets                 : [
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetGeneral}',
      Target: '@UI.FieldGroup#General'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetColumnMapping}',
      Target: '@UI.FieldGroup#Columns'
    },
    {
      $Type : 'UI.ReferenceFacet',
      Label : '{i18n>FacetAmountStyle}',
      Target: '@UI.FieldGroup#AmountStyle'
    }
  ]
};

// ─── Field Labels & Hidden Fields ──────────────────────────────────────────

annotate svc.CsvFormatConfigs with {
  ID                @UI.Hidden;
  createdAt         @UI.Hidden;
  createdBy         @UI.Hidden;
  modifiedAt        @UI.Hidden;
  modifiedBy        @UI.Hidden;
  issuer            @title : '{i18n>CsvFormatConfig.issuer}'
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
  configName        @title: '{i18n>CsvFormatConfig.configName}';
  dateColumn        @title: '{i18n>CsvFormatConfig.dateColumn}';
  dateFormat        @title: '{i18n>CsvFormatConfig.dateFormat}';
  amountColumn      @title: '{i18n>CsvFormatConfig.amountColumn}';
  amountSign        @title: '{i18n>CsvFormatConfig.amountSign}';
  debitColumn       @title: '{i18n>CsvFormatConfig.debitColumn}';
  creditColumn      @title: '{i18n>CsvFormatConfig.creditColumn}';
  descriptionColumn @title: '{i18n>CsvFormatConfig.descriptionColumn}';
  statusColumn      @title: '{i18n>CsvFormatConfig.statusColumn}';
  statusPostedValue @title: '{i18n>CsvFormatConfig.statusPostedValue}';
  cardmemberColumn  @title: '{i18n>CsvFormatConfig.cardmemberColumn}';
  headerRowsSkip    @title: '{i18n>CsvFormatConfig.headerRowsSkip}';
  delimiter         @title: '{i18n>CsvFormatConfig.delimiter}';
};
