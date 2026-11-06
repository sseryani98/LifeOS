import PageController from "sap/fe/core/PageController";
import JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ProjectViewService from "com/lifeos/projecttracker/projectview/model/ProjectViewService";
import { PROJECT_VIEW } from "com/lifeos/projecttracker/projectview/model/constants";

/**
 * Project view page controller. Binds the whole page to the one workspace the
 * store holds, so every section renders from that one binding: one loading
 * state and one read-failure state for the page, never one per section.
 *
 * @namespace com.lifeos.projecttracker.projectview.controller
 */
export default class ProjectView extends PageController {
  private readonly state = new JSONModel({ busy: true, readFailed: false });

  /**
   * Initialises the page state and starts the workspace read.
   */
  public onInit(): void {
    super.onInit();
    this.setModel(this.state, PROJECT_VIEW.UI_MODEL);
    const service = new ProjectViewService(
      this.getAppComponent().getModel() as ODataModel,
    );
    void this._bindWorkspace(service);
  }

  /**
   * Binds the page to the workspace, or raises the page's one failure strip. A
   * store with no workspace leaves the page unbound, so every section reads empty.
   * @param service the data-access layer the read runs through
   * @returns resolves once the page is bound or the failure is shown
   */
  private async _bindWorkspace(service: ProjectViewService): Promise<void> {
    try {
      const context = await service.readWorkspace();
      if (context) this.getView()?.setBindingContext(context);
    } catch {
      this.state.setProperty("/readFailed", true);
    } finally {
      this.state.setProperty("/busy", false);
    }
  }
}
