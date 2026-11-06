import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import { PROJECT_VIEW } from "com/lifeos/projecttracker/projectview/model/constants";

/**
 * ProjectViewService — owns every OData V4 call the project view makes.
 */
export default class ProjectViewService {
  private readonly model: ODataModel;

  /**
   * @param model the app's default TrackerService OData V4 model
   */
  public constructor(model: ODataModel) {
    this.model = model;
  }

  /**
   * Reads the workspace the page renders. Slice 1 holds one workspace, so the
   * first row of the view is the page.
   * @returns the workspace's context, or undefined when the store holds none
   */
  public async readWorkspace(): Promise<Context | undefined> {
    const [context] = await this.model
      .bindList(PROJECT_VIEW.PATH)
      .requestContexts(0, 1);
    return context;
  }
}
