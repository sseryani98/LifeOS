namespace com.financialplanner;

using {
  cuid,
  managed
} from '@sap/cds/common';
using {com.financialplanner.PurchaseType} from '../reference/schema';
using {com.financialplanner.CardInstance} from '../cards/schema';

@assert.unique: {allocation: [
  purchaseType,
  effectiveFrom
]}
entity BudgetAllocation : cuid, managed {
  purchaseType  : Association to PurchaseType not null  @mandatory  @Common.Label: '{i18n>BudgetAllocation.purchaseType}'
                                                        @assert      : (case
                                                                          when purchaseType.parent             is not null
                                                                               then 'admin.budget.excludedType'
                                                                          when purchaseType.excludesFromBudget =      true
                                                                               then 'admin.budget.excludedType'
                                                                        end);
  ratio         : Decimal(5, 2) not null                @mandatory  @Common.Label: '{i18n>BudgetAllocation.ratio}'
                                                        @assert.range: [
    0,
    100
  ];
  effectiveFrom : Date not null                         @mandatory  @Common.Label: '{i18n>BudgetAllocation.effectiveFrom}';
  effectiveTo   : Date not null default '9999-12-31'    @mandatory  @Common.Label: '{i18n>BudgetAllocation.effectiveTo}'
                                                        @assert      : (case
                                                                          when effectiveTo != '9999-12-31'
                                                                               then 'admin.budget.historicalReadOnly'
                                                                        end);
}

@assert.unique: {name: [name]}
entity RecurrentExpense : cuid, managed {
  name          : String(200) not null                @mandatory  @Common.Label: '{i18n>RecurrentExpense.name}';
  amount        : Decimal(15, 2) not null             @mandatory  @Common.Label: '{i18n>RecurrentExpense.amount}';
  purchaseType  : Association to PurchaseType         @Common.Label: '{i18n>RecurrentExpense.purchaseType}';
  cardInstance  : Association to CardInstance         @Common.Label: '{i18n>RecurrentExpense.cardInstance}';
  effectiveFrom : Date not null                       @mandatory  @Common.Label: '{i18n>RecurrentExpense.effectiveFrom}';
  effectiveTo   : Date not null default '9999-12-31'  @mandatory  @Common.Label: '{i18n>RecurrentExpense.effectiveTo}';
  notes         : String(1000)                        @Common.Label: '{i18n>RecurrentExpense.notes}';
}
