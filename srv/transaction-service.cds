using {com.financialplanner as fp} from '../db/transactions/schema';

service TransactionService @(path: '/service/transactionSvcs') {
  entity Transactions as projection on fp.Transaction;
}
