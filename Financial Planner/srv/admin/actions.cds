using {AdminService} from './entities';

// "Sync Now" runs an immediate sync for one connection.
extend AdminService.ProviderConnections with actions {
  action syncNow() returns String;
};

extend service AdminService with {
  action claimSetupToken(setupToken: String, displayName: String) returns String;
}
