import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type Context from "sap/ui/model/odata/v4/Context";

const CLAIM_TOKEN_OPERATION = "/AdminService.claimSetupToken(...)";
const SYNC_NOW_OPERATION = "AdminService.syncNow(...)";

/**
 * ConnectionService — owns every OData V4 call for the Connection Manager app.
 */
export default class ConnectionService {
  private readonly _model: ODataModel;

  /**
   * @param model the app's default AdminService OData V4 model
   */
  public constructor(model: ODataModel) {
    this._model = model;
  }

  /**
   * Claims a SimpleFIN setup token, creating a new connection, then refreshes
   * the model so the new connection appears in the bound tables.
   * @param token the pasted setup token
   * @param displayName the user-facing connection name
   * @returns resolves once the connection is created
   */
  public async claimSetupToken(token: string, displayName: string): Promise<void> {
    const operation = this._model.bindContext(CLAIM_TOKEN_OPERATION);
    operation.setParameter("setupToken", token);
    operation.setParameter("displayName", displayName);
    await operation.invoke();
    this._model.refresh();
  }

  /**
   * Triggers an immediate sync for the given connection, then refreshes the
   * model so the updated sync status is reflected in the UI.
   * @param context the bound context of the connection to sync
   * @returns resolves once the sync completes
   */
  public async syncNow(context: Context): Promise<void> {
    const operation = this._model.bindContext(SYNC_NOW_OPERATION, context);
    await operation.invoke();
    this._model.refresh();
  }
}
