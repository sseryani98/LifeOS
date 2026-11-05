using {TransactionService} from '../transaction-service';
using {com.financialplanner as fp} from '../../db/transactions/schema';
using {
  com.financialplanner.Vendor,
  com.financialplanner.PurchaseType,
  com.financialplanner.EarningCategory,
  com.financialplanner.CategorizationStatusType,
  com.financialplanner.TransactionSourceType
} from '../../db/reference/schema';
using {com.financialplanner.CardInstance, com.financialplanner.MarketCard} from '../../db/cards/schema';
using {com.financialplanner.ImportLog} from '../../db/ingestion/schema';

extend service TransactionService with {
  @odata.draft.enabled
  entity Transactions                        as projection on fp.Transaction;

  entity TransactionSplits                   as projection on fp.TransactionSplit;
  entity MerchantPatterns                    as projection on fp.MerchantPattern;
  entity Vendors                             as projection on Vendor;
  entity PurchaseTypes                       as projection on PurchaseType;
  entity EarningCategories                   as projection on EarningCategory;
  entity CategorizationStatusTypes @readonly as projection on CategorizationStatusType;
  entity TransactionSourceTypes @readonly    as projection on TransactionSourceType;
  entity CardInstances @readonly             as projection on CardInstance;
  entity MarketCards @readonly               as projection on MarketCard;
  entity ImportLogs @readonly                as projection on ImportLog;

  // Every (PT, EC) combo a vendor has been categorized with, for the object
  // page's suggestions. The stats keys can be null, so one synthetic key stands in.
  @readonly  @cds.redirection.target: false
  entity VendorCategoryAlternatives          as
    select from fp.VendorCategoryStats
    mixin {
      purchaseType    : Association to PurchaseType
                          on purchaseType.ID = $projection.purchaseType_ID;
      earningCategory : Association to EarningCategory
                          on earningCategory.ID = $projection.earningCategory_ID;
    }
    into {
      key vendor_ID || '|' || coalesce(
            purchaseType_ID, ''
          ) || '|' || coalesce(
            earningCategory_ID, ''
          ) as comboKey : String(110),
          vendor_ID,
          purchaseType_ID,
          earningCategory_ID,
          usageCount,
          purchaseType,
          earningCategory
    };
}
