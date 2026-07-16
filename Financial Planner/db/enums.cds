namespace com.financialplanner;

type FeeStructure              : String enum {
  annual;
  monthly
}

type MsrWindowType             : String enum {
  one_time;
  monthly_recurring
}

type LifecycleState            : String enum {
  Focus;
  Active;
  To_Cancel;
  Closed
}

type CategorizationStatus      : String enum {
  auto;
  user_corrected;
  uncategorized
}

type TransactionSource         : String enum {
  simplefin;
  csv;
  manual
}

type MatchType                 : String enum {
  exact;
  contains;
  starts_with
}

type LastSyncStatus            : String enum {
  success;
  error;
  never_synced
}

type AmountSign                : String enum {
  NEGATIVE_IS_DEBIT;
  POSITIVE_IS_DEBIT
}

type ProviderType              : String enum {
  simplefin
}

type GoalDirection             : String enum {
  saving;
  spending
}

type GoalStatus                : String enum {
  active;
  completed;
  cancelled
}

type AlertStatus               : String enum {
  active;
  dismissed;
  acknowledged
}

type RuleType                  : String enum {
  MAX_CONCURRENT;
  APPS_IN_WINDOW;
  PRODUCT_COOLDOWN;
  ISSUER_COOLDOWN;
  ONCE_PER_LIFETIME;
  TIER_LIFETIME_LIMIT;
}

type ReferenceDate             : String enum {
  application;
  closure;
  latest_activity
}

type ScrapeRunMode             : String enum {
  scheduled;
  manual;
  bulk
}

type ScrapeRunStatus           : String enum {
  running;
  completed;
  failed
}

type ScrapeQueueItemChangeType : String enum {
  new_card;
  offer_change;
  multiplier_change;
  perk_change
}

type ScrapeQueueItemStatus     : String enum {
  queued;
  approved;
  rejected
}

type ScrapeMappingEntityType   : String enum {
  EarningCategory;
  Issuer;
  RewardsProgram;
  PerkType;
  CardNetwork
}

type MarketCardStatus          : String enum {
  active;
  discontinued
}
