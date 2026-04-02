namespace com.financialplanner;

// All enum types defined here
// Enums are imported by domain schema files via `using from '../enums';`

// §2.1 — Market Card, Issuer Application Rule
type CardType         : String enum { credit; charge }

// §2.2 — Market Card, Issuer Application Rule
type CardSegment      : String enum { personal; business }

// §2.3 — Market Card
type FeeStructure     : String enum { annual; monthly }

// §2.4 — Offer Tranche
type MsrWindowType    : String enum { one_time; monthly_recurring }

// §2.5 — Card Instance
type LifecycleState   : String enum { Focus; Active; To_Cancel; Closed }

// §2.6 — Transaction
type CategorizationStatus : String enum { auto; user_corrected; uncategorized }

// §2.7 — Transaction
type TransactionSource : String enum { simplefin; csv; manual }

// §2.8 — Merchant Pattern
type MatchType        : String enum { exact; contains; starts_with }

// §2.9 — Provider Connection
type LastSyncStatus   : String enum { success; error; never_synced }

// §2.10 — CSV Format Config
type AmountSign       : String enum { NEGATIVE_IS_DEBIT; POSITIVE_IS_DEBIT }

// §2.11 — Provider Connection
type ProviderType     : String enum { simplefin }

// §2.12 — Goal
type GoalDirection    : String enum { saving; spending }

// §2.13 — Goal
type GoalStatus       : String enum { active; completed; cancelled }

// §2.14 — Alert
type AlertStatus      : String enum { active; dismissed; acknowledged }

// §2.15 — Issuer Application Rule
type RuleType         : String enum {
  MAX_CONCURRENT;
  APPS_IN_WINDOW;
  PRODUCT_COOLDOWN;
  ISSUER_COOLDOWN;
  ONCE_PER_LIFETIME;
  TIER_LIFETIME_LIMIT;
}

// §2.16 — Issuer Application Rule
type ReferenceDate    : String enum { application; closure; latest_activity }

// §2.17 — Scrape Run
type ScrapeRunMode    : String enum { scheduled; manual; bulk }

// §2.18 — Scrape Run
type ScrapeRunStatus  : String enum { running; completed; failed }

// §2.19 — Scrape Queue Item
type ScrapeQueueItemChangeType : String enum { new_card; offer_change; multiplier_change; perk_change }

// §2.20 — Scrape Queue Item
type ScrapeQueueItemStatus : String enum { queued; approved; rejected }

// §2.21 — Scrape Mapping
type ScrapeMappingEntityType : String enum { EarningCategory; Issuer; RewardsProgram; PerkType; CardNetwork }

// §2.22 — Market Card
type MarketCardStatus : String enum { active; discontinued }
