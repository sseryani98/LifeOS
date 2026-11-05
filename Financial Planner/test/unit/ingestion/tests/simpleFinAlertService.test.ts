import { ALERTS } from "../../../../srv/modules/ingestion/constants.js";

import { CONNECTION_ID } from "../../../shared/data/ingestion/simplefin.js";
import {
  ACTIVE_ALERT,
  ALERT_SEVERITY_IDS,
  ALERT_TEXT,
  ALERT_TYPE_IDS,
} from "../data/simplefin.js";
import { buildSimpleFinAlertMocks } from "../support/simplefinMocks.js";

describe("SimpleFINAlertService", () => {
  describe("raiseAlert", () => {
    /** The alert row must carry the seeded type/severity ids and the connection, or the Alerts list cannot resolve or filter it. */
    it("creates an active alert resolved against the seeded reference data", async () => {
      const mocks = buildSimpleFinAlertMocks();

      await mocks.service.raiseAlert(
        ALERTS.TYPE.CONNECTION_ERROR,
        ALERTS.SEVERITY.CRITICAL,
        ALERT_TEXT.TITLE,
        ALERT_TEXT.MESSAGE,
        CONNECTION_ID,
      );

      expect(mocks.data.createAlert).toHaveBeenCalledWith({
        alertType_ID: ALERT_TYPE_IDS["Connection Error"],
        alertSeverity_ID: ALERT_SEVERITY_IDS["Critical"],
        title: ALERT_TEXT.TITLE,
        message: ALERT_TEXT.MESSAGE,
        providerConnection_ID: CONNECTION_ID,
        status: "active",
      });
    });

    /** A daily sync re-raises the same failure; without suppression the user drowns in identical alerts. */
    it("suppresses an alert already active for the connection", async () => {
      const mocks = buildSimpleFinAlertMocks();
      mocks.data.findActiveAlert.mockResolvedValue({ ...ACTIVE_ALERT });

      await mocks.service.raiseAlert(
        ALERTS.TYPE.CONNECTION_ERROR,
        ALERTS.SEVERITY.CRITICAL,
        ALERT_TEXT.TITLE,
        ALERT_TEXT.MESSAGE,
        CONNECTION_ID,
      );

      expect(mocks.data.findActiveAlert).toHaveBeenCalledWith(
        ALERT_TYPE_IDS["Connection Error"],
        CONNECTION_ID,
      );
      expect(mocks.data.createAlert).not.toHaveBeenCalled();
    });

    /** An unseeded severity must skip the alert, not insert a null FK that aborts the sync. */
    it("skips the alert when the severity is not seeded", async () => {
      const mocks = buildSimpleFinAlertMocks();
      mocks.data.getAlertSeverityId.mockResolvedValue(null);

      await mocks.service.raiseAlert(
        ALERTS.TYPE.STALE_DATA,
        ALERTS.SEVERITY.WARNING,
        ALERT_TEXT.TITLE,
        ALERT_TEXT.MESSAGE,
        CONNECTION_ID,
      );

      expect(mocks.data.findActiveAlert).not.toHaveBeenCalled();
      expect(mocks.data.createAlert).not.toHaveBeenCalled();
    });
  });
});
