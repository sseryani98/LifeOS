using {TransactionService, TransactionService.VendorCategoryAlternatives} from './entities';

extend projection TransactionService.Transactions with {
  // Status → ObjectStatus colour: auto = Positive (green), user_corrected =
  // Information (blue), uncategorized = Critical (orange).
  case
    categorizationStatus
    when 'auto'
         then 3
    when 'user_corrected'
         then 5
    else 2
  end          as statusCriticality : Integer,
  // Header amount colour: a refund (money back) is Positive; a charge stays Neutral.
  case
    when amount > 0
         then 3
    else 0
  end          as amountCriticality : Integer,
  case
    when split.myShareAmount is not null
         then true
    else false
  end          as hasSplit          : Boolean,
  // Object-page title: the vendor once one is assigned, the bank text until then.
  coalesce(
    vendor.name, rawDescription
  )            as headerTitle       : String(1000),
  // Filled per object-page read by the matcher, which no SQL expression can run.
  virtual null as matchedPattern    : String(1000),
  virtual null as matchConfidence   : String(20),
  categoryAlternatives              : Association to many VendorCategoryAlternatives
                                        on categoryAlternatives.vendor_ID = vendor.ID
};
