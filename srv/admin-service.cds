/**
 * AdminService — Reference data CRUD, system config, integrations, alerts.
 * Path: /service/adminSvcs
 */
using {com.financialplanner as fp} from '../db/reference/schema';
using from '../db/cards/schema';
using from '../db/budget/schema';

service AdminService @(path: '/service/adminSvcs') {
  @odata.draft.enabled
  entity Issuers                    as projection on fp.Issuer;
  @odata.draft.enabled
  entity RewardsPrograms            as projection on fp.RewardsProgram;
  @odata.draft.enabled
  entity PurchaseTypes              as projection on fp.PurchaseType;
  @odata.draft.enabled
  entity EarningCategories          as projection on fp.EarningCategory;
  @odata.draft.enabled
  entity IssuerApplicationRules     as projection on fp.IssuerApplicationRule;
  @odata.draft.enabled
  entity CsvFormatConfigs           as projection on fp.CsvFormatConfig;
  @odata.draft.enabled
  entity FinancialAccountTypes      as projection on fp.FinancialAccountType;
  @odata.draft.enabled
  entity IncomeSourceTypes          as projection on fp.IncomeSourceType;
  @odata.draft.enabled
  entity PerkTypes                  as projection on fp.PerkType;
  @odata.draft.enabled
  entity AdjustmentTypes            as projection on fp.AdjustmentType;
  entity AlertTypes @readonly       as projection on fp.AlertType;
  entity AlertSeverities @readonly  as projection on fp.AlertSeverity;
  entity CardNetworks @readonly     as projection on fp.CardNetwork;
  entity PatternSources @readonly   as projection on fp.PatternSource;
  entity ConfidenceLevels @readonly as projection on fp.ConfidenceLevel;
  @odata.draft.enabled
  entity ProgramTiers               as projection on fp.ProgramTier;
  @odata.draft.enabled
  entity SystemConfigs              as projection on fp.SystemConfig;
  @odata.draft.enabled
  entity RedemptionTypes            as projection on fp.RedemptionType;
  @odata.draft.enabled
  entity ScrapeMappings             as projection on fp.ScrapeMapping;

  // Card entities
  entity MarketCards                as projection on fp.MarketCard;
  entity Offers                     as projection on fp.Offer;
  entity OfferTranches              as projection on fp.OfferTranche;
  entity CardInstances              as projection on fp.CardInstance;
  entity EarningMultipliers         as projection on fp.EarningMultiplier;
  entity SoftPerkDefinitions        as projection on fp.SoftPerkDefinition;
  entity CardPerks                  as projection on fp.CardPerk;

  // Budget entities
  @odata.draft.enabled
  entity BudgetAllocations          as projection on fp.BudgetAllocation;
  @odata.draft.enabled
  entity RecurrentExpenses          as projection on fp.RecurrentExpense;
}
