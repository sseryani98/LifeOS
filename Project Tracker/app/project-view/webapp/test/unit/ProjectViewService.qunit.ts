/// <reference types="qunit" />
import ProjectViewService from "com/lifeos/projecttracker/projectview/model/ProjectViewService";

import {
  READ_FAILURE,
  READ_WINDOW,
  SERVICE_PATH,
  WORKSPACE_ROW_PATH,
} from "../data/constants";
import {
  buildFakeContext,
  buildFakeODataModel,
} from "../support/projectViewFakes";

QUnit.module("ProjectViewService", () => {
  QUnit.module("readWorkspace", () => {
    /** The whole page binds to this one row; any other row would render the wrong workspace. */
    QUnit.test("returns the first workspace row the store holds", async assert => {
      const odata = buildFakeODataModel([
        buildFakeContext(WORKSPACE_ROW_PATH.FIRST),
        buildFakeContext(WORKSPACE_ROW_PATH.SECOND),
      ]);

      const context = await new ProjectViewService(odata.model).readWorkspace();

      assert.strictEqual(context?.getPath(), WORKSPACE_ROW_PATH.FIRST);
    });

    /** An empty store must leave the page unbound, not hand the controller a context that is not there. */
    QUnit.test("returns undefined when the store holds no workspace", async assert => {
      const odata = buildFakeODataModel([]);

      const context = await new ProjectViewService(odata.model).readWorkspace();

      assert.strictEqual(context, undefined);
    });

    /** The page reads one row through the project view; a wider window or another entity set reads what nothing renders. */
    QUnit.test("reads one row from the project view entity set", async assert => {
      const odata = buildFakeODataModel([]);

      await new ProjectViewService(odata.model).readWorkspace();

      assert.deepEqual(odata.reads, [
        {
          path: SERVICE_PATH.PROJECT_VIEW,
          start: READ_WINDOW.START,
          length: READ_WINDOW.LENGTH,
        },
      ]);
    });

    /** The controller raises the page's one failure strip from this rejection; swallowing it here would hide a dead backend. */
    QUnit.test("rejects when the store read fails", async assert => {
      const odata = buildFakeODataModel([]);
      odata.rejectNextRead(READ_FAILURE.MESSAGE);

      const outcome = await new ProjectViewService(odata.model)
        .readWorkspace()
        .then(
          () => "resolved",
          (error: Error) => error.message,
        );

      assert.strictEqual(outcome, READ_FAILURE.MESSAGE);
    });
  });
});
