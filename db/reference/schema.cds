namespace com.financialplanner;

using { cuid, managed } from '@sap/cds/common';
using { com.financialplanner.AmountSign,
        com.financialplanner.RuleType,
        com.financialplanner.ReferenceDate,
        com.financialplanner.CardType,
        com.financialplanner.CardSegment,
        com.financialplanner.ScrapeMappingEntityType } from '../enums';

// ─── §3.1 Issuer ────────────────────────────────────────────────────────────
entity Issuer : cuid, managed {
  name      : String(100) not null;
  shortName : String(20)  not null;
}

// ─── §3.2 Rewards Program ───────────────────────────────────────────────────
entity RewardsProgram : cuid, managed {
  name          : String(100) not null;
  currencyName  : String(50)  not null;
  cppValuation  : Decimal(5,2) not null;
}

// ─── §3.3 Purchase Type ─────────────────────────────────────────────────────
entity PurchaseType : cuid, managed {
  name               : String(100) not null;
  parent             : Association to PurchaseType;
  sortOrder          : Integer not null;
  excludesFromBudget : Boolean not null default false;
}

// ─── §3.4 Earning Category ──────────────────────────────────────────────────
entity EarningCategory : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.5 Issuer Application Rule ───────────────────────────────────────────
entity IssuerApplicationRule : cuid, managed {
  issuer             : Association to Issuer;
  rewardsProgram     : Association to RewardsProgram;
  ruleType           : RuleType not null;
  parameterCount     : Integer;
  parameterDays      : Integer;
  appliesToCardType  : CardType;
  appliesToSegment   : CardSegment;
  referenceDate      : ReferenceDate;
  description        : String(500) not null;
}

// ─── §3.6 CSV Format Config ─────────────────────────────────────────────────
entity CsvFormatConfig : cuid, managed {
  issuer            : Association to Issuer not null;
  configName        : String(100) not null;
  dateColumn        : String(50) not null;
  dateFormat        : String(50) not null;
  amountColumn      : String(50);
  amountSign        : AmountSign;
  debitColumn       : String(50);
  creditColumn      : String(50);
  descriptionColumn : String(50) not null;
  statusColumn      : String(50);
  statusPostedValue : String(50);
  cardmemberColumn  : String(50);
  headerRowsSkip    : Integer not null default 1;
  delimiter         : String(5) not null default ',';
}

// ─── §3.7 Financial Account Type ────────────────────────────────────────────
entity FinancialAccountType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
  isAsset   : Boolean not null;
}

// ─── §3.8 Income Source Type ────────────────────────────────────────────────
entity IncomeSourceType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.9 Perk Type ─────────────────────────────────────────────────────────
entity PerkType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.10 Adjustment Type ──────────────────────────────────────────────────
entity AdjustmentType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.11 Alert Type ───────────────────────────────────────────────────────
entity AlertType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.12 Alert Severity ───────────────────────────────────────────────────
entity AlertSeverity : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.13 Card Network ─────────────────────────────────────────────────────
entity CardNetwork : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.14 Pattern Source ───────────────────────────────────────────────────
entity PatternSource : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.15 Confidence Level ─────────────────────────────────────────────────
entity ConfidenceLevel : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.16 Program Tier ─────────────────────────────────────────────────────
entity ProgramTier : cuid, managed {
  rewardsProgram : Association to RewardsProgram not null;
  name           : String(100) not null;
  sortOrder      : Integer not null;
}

// ─── §3.17 System Config ────────────────────────────────────────────────────
entity SystemConfig : cuid, managed {
  ![key]      : String(100) not null;
  value       : String(500);
  description : String(500) not null;
}

// ─── §3.18 Redemption Type ──────────────────────────────────────────────────
entity RedemptionType : cuid, managed {
  name      : String(100) not null;
  sortOrder : Integer not null;
}

// ─── §3.19 Scrape Mapping ───────────────────────────────────────────────────
entity ScrapeMapping : cuid, managed {
  entityType : ScrapeMappingEntityType not null;
  sourceText : String(200) not null;
  targetId   : UUID not null;
}
