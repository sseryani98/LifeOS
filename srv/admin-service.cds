/**
 * AdminService — Reference data CRUD, system config, integrations, alerts.
 * Path: /service/adminSvcs
 */
using { com.financialplanner as fp } from '../db/reference/schema';

service AdminService @(path: '/service/adminSvcs') {
  entity Issuers as projection on fp.Issuer;
  entity RewardsPrograms as projection on fp.RewardsProgram;
  entity PurchaseTypes as projection on fp.PurchaseType;
  entity EarningCategories as projection on fp.EarningCategory;
  entity IssuerApplicationRules as projection on fp.IssuerApplicationRule;
  entity CsvFormatConfigs as projection on fp.CsvFormatConfig;
  entity FinancialAccountTypes as projection on fp.FinancialAccountType;
  entity IncomeSourceTypes as projection on fp.IncomeSourceType;
  entity PerkTypes as projection on fp.PerkType;
  entity AdjustmentTypes as projection on fp.AdjustmentType;
  entity AlertTypes @readonly as projection on fp.AlertType;
  entity AlertSeverities @readonly as projection on fp.AlertSeverity;
  entity CardNetworks @readonly as projection on fp.CardNetwork;
  entity PatternSources @readonly as projection on fp.PatternSource;
  entity ConfidenceLevels @readonly as projection on fp.ConfidenceLevel;
  entity ProgramTiers as projection on fp.ProgramTier;
  entity SystemConfigs as projection on fp.SystemConfig;
  entity RedemptionTypes as projection on fp.RedemptionType;
  entity ScrapeMappings as projection on fp.ScrapeMapping;
}
