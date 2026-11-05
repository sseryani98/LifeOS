using from './transaction/entities';
using from './transaction/calculations';
using from './transaction/types';
using from './transaction/actions';

// CSV ingestion (parse/save actions, ImportLogs, Csv* types) lives here with the
// transaction actions as a design decision.
service TransactionService @(path: '/service/transactionSvcs') {}
