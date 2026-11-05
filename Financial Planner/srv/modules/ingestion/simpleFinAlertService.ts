import { BaseService } from "../shared/baseService.js";

import type { SimpleFINDataService } from "./simpleFinDataService.js";

/**
 * Raises SimpleFIN connection alerts against the seeded alert reference data,
 * one active alert per type and connection.
 */
export class SimpleFINAlertService extends BaseService {
  private readonly dataService: SimpleFINDataService;

  /**
   * Creates the alert raiser over the SimpleFIN data layer.
   * @param dataService Data-access layer for alert reference data and alerts.
   */
  constructor(dataService: SimpleFINDataService) {
    super("integration.simplefin");
    this.dataService = dataService;
  }

  /**
   * Creates an alert, suppressing duplicates already active for the connection.
   * @param typeName Alert type display name (seeded reference data).
   * @param severityName Alert severity display name (seeded reference data).
   * @param title Alert title.
   * @param message Alert body.
   * @param connectionId Connection the alert is raised against.
   */
  async raiseAlert(
    typeName: string,
    severityName: string,
    title: string,
    message: string,
    connectionId: string,
  ): Promise<void> {
    const alertTypeId = await this.dataService.getAlertTypeId(typeName);
    const alertSeverityId = await this.dataService.getAlertSeverityId(severityName);
    if (!alertTypeId || !alertSeverityId) {
      this.logger.warn("STATE_CHANGE", "Alert reference data missing", {
        typeName,
        severityName,
      });
      return;
    }
    const existing = await this.dataService.findActiveAlert(
      alertTypeId,
      connectionId,
    );
    if (existing) {
      return;
    }
    await this.dataService.createAlert({
      alertType_ID: alertTypeId,
      alertSeverity_ID: alertSeverityId,
      title,
      message,
      providerConnection_ID: connectionId,
      status: "active",
    });
  }
}
