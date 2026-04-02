namespace com.financialplanner;

using { cuid, managed } from '@sap/cds/common';
using { com.financialplanner.CardType,
        com.financialplanner.CardSegment,
        com.financialplanner.FeeStructure,
        com.financialplanner.MsrWindowType,
        com.financialplanner.LifecycleState,
        com.financialplanner.MarketCardStatus } from '../enums';
using { com.financialplanner.Issuer,
        com.financialplanner.RewardsProgram,
        com.financialplanner.CardNetwork,
        com.financialplanner.ProgramTier,
        com.financialplanner.EarningCategory,
        com.financialplanner.PerkType,
        com.financialplanner.IssuerApplicationRule } from '../reference/schema';

// ─── §4.1 Market Card ──────────────────────────────────────────────────────────
entity MarketCard : cuid, managed {
  name             : String(500)   not null;
  issuer           : Association to Issuer not null;
  rewardsProgram   : Association to RewardsProgram;
  cardNetwork      : Association to CardNetwork not null;
  programTier      : Association to ProgramTier;
  cardType         : CardType      not null;
  cardSegment      : CardSegment   not null;
  feeStructure     : FeeStructure  not null;
  feeAmount        : Decimal(15,2) not null;
  status           : MarketCardStatus not null default 'active';
  sourceUrl        : String(500);
  lastScrapeHash   : String(64);
  eligibilityGroup : String(100);
  offers           : Composition of many Offer on offers.marketCard = $self;
}

// ─── §4.2 Offer ────────────────────────────────────────────────────────────────
entity Offer : cuid, managed {
  marketCard     : Association to MarketCard not null;
  name           : String(500)   not null;
  fyf            : Boolean       not null;
  offerStartDate : Date;
  offerEndDate   : Date;
  feeAmount      : Decimal(15,2);
  isCurrent      : Boolean       not null default false;
  offerUrl       : String(500);
  source         : String(200);
  notes          : String(1000);
  tranches       : Composition of many OfferTranche on tranches.offer = $self;
}

// ─── §4.3 Offer Tranche ────────────────────────────────────────────────────────
entity OfferTranche : cuid, managed {
  offer           : Association to Offer not null;
  trancheNumber   : Integer       not null;
  msrAmount       : Decimal(15,2) not null;
  msrWindowType   : MsrWindowType not null;
  msrWindowMonths : Integer       not null;
  bonusAmount     : Decimal(15,2) not null;
  unlockMonth     : Integer;
}

// ─── §4.4 Card Instance ────────────────────────────────────────────────────────
entity CardInstance : cuid, managed {
  marketCard          : Association to MarketCard not null;
  offer               : Association to Offer not null;
  parentCardInstance  : Association to CardInstance;
  lifecycleState      : LifecycleState not null;
  applicationDate     : Date;
  activationDate      : Date;
  tentativeCancelDate : Date;
  closedDate          : Date;
  creditLimit         : Decimal(15,2);
  cardNumberEnc       : String(1000);
  cvvFrontEnc         : String(1000);
  cvvBackEnc          : String(1000);
  expiryDateEnc       : String(1000);
  cardholderName      : String(200);
  statementCloseDay   : Integer;
  notes               : String(1000);
  cardPerks           : Composition of many CardPerk on cardPerks.cardInstance = $self;
}

// ─── §4.5 Earning Multiplier ───────────────────────────────────────────────────
entity EarningMultiplier : cuid, managed {
  marketCard      : Association to MarketCard not null;
  earningCategory : Association to EarningCategory not null;
  cardInstance    : Association to CardInstance;
  multiplier      : Decimal(5,2) not null;
  effectiveFrom   : Date         not null;
  effectiveTo     : Date;
}

// ─── §4.6 Soft Perk Definition ─────────────────────────────────────────────────
entity SoftPerkDefinition : cuid, managed {
  marketCard    : Association to MarketCard not null;
  cardInstance  : Association to CardInstance;
  perkType      : Association to PerkType not null;
  name          : String(500)   not null;
  quantity      : Integer;
  dollarValue   : Decimal(15,2) not null;
  annualReset   : Boolean       not null;
  effectiveFrom : Date          not null;
  effectiveTo   : Date;
  notes         : String(1000);
}

// ─── §4.7 Card Perk ────────────────────────────────────────────────────────────
entity CardPerk : cuid, managed {
  cardInstance        : Association to CardInstance not null;
  softPerkDefinition  : Association to SoftPerkDefinition not null;
  periodStart         : Date          not null;
  periodEnd           : Date          not null;
  quantityUsed        : Integer;
  dollarValueRealized : Decimal(15,2) not null default 0.00;
  notes               : String(1000);
}

// ─── Cross-domain association ──────────────────────────────────────────────────
// Replaces raw marketCard_ID : UUID in IssuerApplicationRule (reference/schema.cds)
extend IssuerApplicationRule with {
  marketCard : Association to MarketCard;
}
