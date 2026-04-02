namespace com.financialplanner;

using {
  cuid,
  managed
} from '@sap/cds/common';
using {
  com.financialplanner.AmountSign,
  com.financialplanner.RuleType,
  com.financialplanner.ReferenceDate,
  com.financialplanner.CardType,
  com.financialplanner.CardSegment,
  com.financialplanner.ScrapeMappingEntityType
} from '../enums';

@assert.unique: {name: [name]}
entity Issuer : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>Issuer.name}';
  shortName : String(20) not null   @mandatory  @Common.Label: '{i18n>Issuer.shortName}';
}

@assert.unique: {name: [name]}
entity RewardsProgram : cuid, managed {
  name         : String(100) not null    @mandatory  @Common.Label: '{i18n>RewardsProgram.name}';
  currencyName : String(50) not null     @mandatory  @Common.Label: '{i18n>RewardsProgram.currencyName}';
  cppValuation : Decimal(5, 2) not null  @mandatory  @Common.Label: '{i18n>RewardsProgram.cppValuation}';
}

@assert.unique: {name: [name]}
entity PurchaseType : cuid, managed {
  name               : String(100) not null            @mandatory  @Common.Label: '{i18n>PurchaseType.name}';
  parent             : Association to PurchaseType     @Common.Label: '{i18n>PurchaseType.parent}';
  sortOrder          : Integer not null                @mandatory  @Common.Label: '{i18n>PurchaseType.sortOrder}';
  excludesFromBudget : Boolean not null default false  @mandatory  @Common.Label: '{i18n>PurchaseType.excludesFromBudget}';
}

@assert.unique: {name: [name]}
entity EarningCategory : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>EarningCategory.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>EarningCategory.sortOrder}';
}

entity IssuerApplicationRule : cuid, managed {
  issuer            : Association to Issuer         @Common.Label: '{i18n>IssuerApplicationRule.issuer}'
                                                    @assert      : (case
                                                                      when issuer             is null
                                                                           and rewardsProgram is null
                                                                           then 'admin.issuerRule.missingIssuerOrProgram'
                                                                    end);
  rewardsProgram    : Association to RewardsProgram @Common.Label: '{i18n>IssuerApplicationRule.rewardsProgram}';
  ruleType          : RuleType not null             @mandatory  @Common.Label: '{i18n>IssuerApplicationRule.ruleType}';
  parameterCount    : Integer                       @Common.Label: '{i18n>IssuerApplicationRule.parameterCount}';
  parameterDays     : Integer                       @Common.Label: '{i18n>IssuerApplicationRule.parameterDays}';
  appliesToCardType : CardType                      @Common.Label: '{i18n>IssuerApplicationRule.appliesToCardType}';
  appliesToSegment  : CardSegment                   @Common.Label: '{i18n>IssuerApplicationRule.appliesToSegment}';
  referenceDate     : ReferenceDate                 @Common.Label: '{i18n>IssuerApplicationRule.referenceDate}';
  description       : String(500) not null          @mandatory  @Common.Label: '{i18n>IssuerApplicationRule.description}';
}

@assert.unique: {configName: [configName]}
entity CsvFormatConfig : cuid, managed {
  issuer            : Association to Issuer not null  @mandatory  @Common.Label: '{i18n>CsvFormatConfig.issuer}';
  configName        : String(100) not null            @mandatory  @Common.Label: '{i18n>CsvFormatConfig.configName}';
  dateColumn        : String(50) not null             @mandatory  @Common.Label: '{i18n>CsvFormatConfig.dateColumn}';
  dateFormat        : String(50) not null             @mandatory  @Common.Label: '{i18n>CsvFormatConfig.dateFormat}';
  amountColumn      : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.amountColumn}'
                                                      @assert      : (case
                                                                        when (
                                                                               amountColumn     is not null
                                                                               and amountSign   is not null
                                                                             )
                                                                             and (
                                                                               debitColumn      is not null
                                                                               and creditColumn is not null
                                                                             )
                                                                             then 'admin.csvConfig.invalidAmountStyle'
                                                                        when (
                                                                               amountColumn     is     null
                                                                               or amountSign    is     null
                                                                             )
                                                                             and (
                                                                               debitColumn      is     null
                                                                               or creditColumn  is     null
                                                                             )
                                                                             then 'admin.csvConfig.invalidAmountStyle'
                                                                      end);
  amountSign        : AmountSign                      @Common.Label: '{i18n>CsvFormatConfig.amountSign}';
  debitColumn       : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.debitColumn}';
  creditColumn      : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.creditColumn}';
  descriptionColumn : String(50) not null             @mandatory  @Common.Label: '{i18n>CsvFormatConfig.descriptionColumn}';
  statusColumn      : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.statusColumn}';
  statusPostedValue : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.statusPostedValue}'
                                                      @assert      : (case
                                                                        when statusColumn          is not null
                                                                             and statusPostedValue is     null
                                                                             then 'admin.csvConfig.missingStatusValue'
                                                                      end);
  cardmemberColumn  : String(50)                      @Common.Label: '{i18n>CsvFormatConfig.cardmemberColumn}';
  headerRowsSkip    : Integer not null default 1      @mandatory  @Common.Label: '{i18n>CsvFormatConfig.headerRowsSkip}';
  delimiter         : String(5) not null default ','  @mandatory  @Common.Label: '{i18n>CsvFormatConfig.delimiter}';
}

@assert.unique: {name: [name]}
entity FinancialAccountType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>FinancialAccountType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>FinancialAccountType.sortOrder}';
  isAsset   : Boolean not null      @mandatory  @Common.Label: '{i18n>FinancialAccountType.isAsset}';
}

@assert.unique: {name: [name]}
entity IncomeSourceType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>IncomeSourceType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>IncomeSourceType.sortOrder}';
}

@assert.unique: {name: [name]}
entity PerkType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>PerkType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>PerkType.sortOrder}';
}

@assert.unique: {name: [name]}
entity AdjustmentType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>AdjustmentType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>AdjustmentType.sortOrder}';
}

@assert.unique: {name: [name]}
entity AlertType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>AlertType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>AlertType.sortOrder}';
}

@assert.unique: {name: [name]}
entity AlertSeverity : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>AlertSeverity.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>AlertSeverity.sortOrder}';
}

@assert.unique: {name: [name]}
entity CardNetwork : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>CardNetwork.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>CardNetwork.sortOrder}';
}

@assert.unique: {name: [name]}
entity PatternSource : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>PatternSource.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>PatternSource.sortOrder}';
}

@assert.unique: {name: [name]}
entity ConfidenceLevel : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>ConfidenceLevel.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>ConfidenceLevel.sortOrder}';
}

@assert.unique: {programName: [
  rewardsProgram,
  name
]}
entity ProgramTier : cuid, managed {
  rewardsProgram : Association to RewardsProgram not null  @mandatory  @Common.Label: '{i18n>ProgramTier.rewardsProgram}';
  name           : String(100) not null                    @mandatory  @Common.Label: '{i18n>ProgramTier.name}';
  sortOrder      : Integer not null                        @mandatory  @Common.Label: '{i18n>ProgramTier.sortOrder}';
}

@assert.unique: {configKey: [key]}
entity SystemConfig : cuid, managed {
  @assert.format: '^[A-Z][A-Z0-9_]*$'
  ![key]      : String(100) not null  @mandatory  @Common.Label: '{i18n>SystemConfig.key}';
  value       : String(500)           @Common.Label: '{i18n>SystemConfig.value}';
  description : String(500) not null  @mandatory  @Common.Label: '{i18n>SystemConfig.description}';
}

@assert.unique: {name: [name]}
entity RedemptionType : cuid, managed {
  name      : String(100) not null  @mandatory  @Common.Label: '{i18n>RedemptionType.name}';
  sortOrder : Integer not null      @mandatory  @Common.Label: '{i18n>RedemptionType.sortOrder}';
}

@assert.unique: {mapping: [
  entityType,
  sourceText
]}
entity ScrapeMapping : cuid, managed {
  entityType : ScrapeMappingEntityType not null  @mandatory  @Common.Label: '{i18n>ScrapeMapping.entityType}';
  sourceText : String(200) not null              @mandatory  @Common.Label: '{i18n>ScrapeMapping.sourceText}';
  targetId   : UUID not null                     @mandatory  @Common.Label: '{i18n>ScrapeMapping.targetId}';
}
