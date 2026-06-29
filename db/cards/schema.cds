namespace com.financialplanner;

using {
  cuid,
  managed
} from '@sap/cds/common';
using {
  com.financialplanner.FeeStructure,
  com.financialplanner.MsrWindowType,
  com.financialplanner.LifecycleState,
  com.financialplanner.MarketCardStatus
} from '../enums';
using {
  com.financialplanner.Issuer,
  com.financialplanner.RewardsProgram,
  com.financialplanner.CardNetwork,
  com.financialplanner.ProgramTier,
  com.financialplanner.EarningCategory,
  com.financialplanner.PerkType,
  com.financialplanner.CardType,
  com.financialplanner.CardSegment
} from '../reference/schema';

@assert.unique: {name: [name]}
entity MarketCard : cuid, managed {
  name             : String(500) not null                        @mandatory  @Common.Label: '{i18n>MarketCard.name}';
  issuer           : Association to Issuer not null              @mandatory  @Common.Label: '{i18n>MarketCard.issuer}';
  rewardsProgram   : Association to RewardsProgram               @Common.Label: '{i18n>MarketCard.rewardsProgram}';
  cardNetwork      : Association to CardNetwork not null         @mandatory  @Common.Label: '{i18n>MarketCard.cardNetwork}';
  programTier      : Association to ProgramTier                  @Common.Label: '{i18n>MarketCard.programTier}';
  cardType         : Association to CardType                     @mandatory  @Common.Label: '{i18n>MarketCard.cardType}';
  cardSegment      : Association to CardSegment                  @mandatory  @Common.Label: '{i18n>MarketCard.cardSegment}';
  feeStructure     : FeeStructure not null                       @mandatory  @Common.Label: '{i18n>MarketCard.feeStructure}';
  feeAmount        : Decimal(15, 2) not null                     @mandatory  @Common.Label: '{i18n>MarketCard.feeAmount}';
  status           : MarketCardStatus not null default 'active'  @mandatory  @Common.Label: '{i18n>MarketCard.status}';
  sourceUrl        : String(500)                                 @Common.Label: '{i18n>MarketCard.sourceUrl}';
  lastScrapeHash   : String(64)                                  @Common.Label: '{i18n>MarketCard.lastScrapeHash}';
  eligibilityGroup : String(100)                                 @Common.Label: '{i18n>MarketCard.eligibilityGroup}';
  offers           : Composition of many Offer
                       on offers.marketCard = $self;
}

@assert.unique: {offerName: [
  marketCard,
  name
]}
entity Offer : cuid, managed {
  marketCard     : Association to MarketCard not null  @mandatory  @Common.Label: '{i18n>Offer.marketCard}';
  name           : String(500) not null                @mandatory  @Common.Label: '{i18n>Offer.name}';
  fyf            : Boolean not null                    @mandatory  @Common.Label: '{i18n>Offer.fyf}';
  offerStartDate : Date                                @Common.Label: '{i18n>Offer.offerStartDate}';
  offerEndDate   : Date                                @Common.Label: '{i18n>Offer.offerEndDate}';
  feeAmount      : Decimal(15, 2)                      @Common.Label: '{i18n>Offer.feeAmount}';
  isCurrent      : Boolean not null default false      @mandatory  @Common.Label: '{i18n>Offer.isCurrent}';
  offerUrl       : String(500)                         @Common.Label: '{i18n>Offer.offerUrl}';
  source         : String(200)                         @Common.Label: '{i18n>Offer.source}';
  notes          : String(1000)                        @Common.Label: '{i18n>Offer.notes}';
  tranches       : Composition of many OfferTranche
                     on tranches.offer = $self;
}

@assert.unique: {tranche: [
  offer,
  trancheNumber
]}
entity OfferTranche : cuid, managed {
  offer           : Association to Offer not null  @mandatory  @Common.Label: '{i18n>OfferTranche.offer}';
  trancheNumber   : Integer not null               @mandatory  @Common.Label: '{i18n>OfferTranche.trancheNumber}';
  msrAmount       : Decimal(15, 2) not null        @mandatory  @Common.Label: '{i18n>OfferTranche.msrAmount}';
  msrWindowType   : MsrWindowType not null         @mandatory  @Common.Label: '{i18n>OfferTranche.msrWindowType}';
  msrWindowMonths : Integer not null               @mandatory  @Common.Label: '{i18n>OfferTranche.msrWindowMonths}';
  bonusAmount     : Decimal(15, 2) not null        @mandatory  @Common.Label: '{i18n>OfferTranche.bonusAmount}';
  unlockMonth     : Integer                        @Common.Label: '{i18n>OfferTranche.unlockMonth}';
}

entity CardInstance : cuid, managed {
  marketCard          : Association to MarketCard not null  @mandatory  @Common.Label: '{i18n>CardInstance.marketCard}';
  offer               : Association to Offer not null       @mandatory  @Common.Label: '{i18n>CardInstance.offer}';
  parentCardInstance  : Association to CardInstance         @Common.Label: '{i18n>CardInstance.parentCardInstance}';
  lifecycleState      : LifecycleState not null             @mandatory  @Common.Label: '{i18n>CardInstance.lifecycleState}';
  applicationDate     : Date                                @Common.Label: '{i18n>CardInstance.applicationDate}';
  activationDate      : Date                                @Common.Label: '{i18n>CardInstance.activationDate}';
  tentativeCancelDate : Date                                @Common.Label: '{i18n>CardInstance.tentativeCancelDate}';
  closedDate          : Date                                @Common.Label: '{i18n>CardInstance.closedDate}';
  creditLimit         : Decimal(15, 2)                      @Common.Label: '{i18n>CardInstance.creditLimit}';
  cardNumberEnc       : String(1000)                        @Common.Label: '{i18n>CardInstance.cardNumberEnc}';
  cvvFrontEnc         : String(1000)                        @Common.Label: '{i18n>CardInstance.cvvFrontEnc}';
  cvvBackEnc          : String(1000)                        @Common.Label: '{i18n>CardInstance.cvvBackEnc}';
  expiryDateEnc       : String(1000)                        @Common.Label: '{i18n>CardInstance.expiryDateEnc}';
  cardholderName      : String(200)                         @Common.Label: '{i18n>CardInstance.cardholderName}';
  statementCloseDay   : Integer                             @Common.Label: '{i18n>CardInstance.statementCloseDay}';
  notes               : String(1000)                        @Common.Label: '{i18n>CardInstance.notes}';
  cardPerks           : Composition of many CardPerk
                          on cardPerks.cardInstance = $self;
}

@assert.unique: {multiplier: [
  marketCard,
  earningCategory,
  effectiveFrom
]}
entity EarningMultiplier : cuid, managed {
  marketCard      : Association to MarketCard not null       @mandatory  @Common.Label: '{i18n>EarningMultiplier.marketCard}';
  earningCategory : Association to EarningCategory not null  @mandatory  @Common.Label: '{i18n>EarningMultiplier.earningCategory}';
  cardInstance    : Association to CardInstance              @Common.Label: '{i18n>EarningMultiplier.cardInstance}';
  multiplier      : Decimal(5, 2) not null                   @mandatory  @Common.Label: '{i18n>EarningMultiplier.multiplier}';
  effectiveFrom   : Date not null                            @mandatory  @Common.Label: '{i18n>EarningMultiplier.effectiveFrom}';
  effectiveTo     : Date not null default '9999-12-31'       @mandatory  @Common.Label: '{i18n>EarningMultiplier.effectiveTo}';
}

entity SoftPerkDefinition : cuid, managed {
  marketCard    : Association to MarketCard not null  @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.marketCard}';
  cardInstance  : Association to CardInstance         @Common.Label: '{i18n>SoftPerkDefinition.cardInstance}';
  perkType      : Association to PerkType not null    @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.perkType}';
  name          : String(500) not null                @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.name}';
  quantity      : Integer                             @Common.Label: '{i18n>SoftPerkDefinition.quantity}';
  dollarValue   : Decimal(15, 2) not null             @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.dollarValue}';
  annualReset   : Boolean not null                    @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.annualReset}';
  effectiveFrom : Date not null                       @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.effectiveFrom}';
  effectiveTo   : Date not null default '9999-12-31'  @mandatory  @Common.Label: '{i18n>SoftPerkDefinition.effectiveTo}';
  notes         : String(1000)                        @Common.Label: '{i18n>SoftPerkDefinition.notes}';
}

@assert.unique: {perkPeriod: [
  cardInstance,
  softPerkDefinition,
  periodStart
]}
entity CardPerk : cuid, managed {
  cardInstance        : Association to CardInstance not null        @mandatory  @Common.Label: '{i18n>CardPerk.cardInstance}';
  softPerkDefinition  : Association to SoftPerkDefinition not null  @mandatory  @Common.Label: '{i18n>CardPerk.softPerkDefinition}';
  periodStart         : Date not null                               @mandatory  @Common.Label: '{i18n>CardPerk.periodStart}';
  periodEnd           : Date not null                               @mandatory  @Common.Label: '{i18n>CardPerk.periodEnd}';
  quantityUsed        : Integer                                     @Common.Label: '{i18n>CardPerk.quantityUsed}';
  dollarValueRealized : Decimal(15, 2) not null default 0.00        @mandatory  @Common.Label: '{i18n>CardPerk.dollarValueRealized}';
  notes               : String(1000)                                @Common.Label: '{i18n>CardPerk.notes}';
}
