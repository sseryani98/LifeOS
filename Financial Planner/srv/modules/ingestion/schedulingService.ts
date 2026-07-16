import cds from "@sap/cds";
import cron from "node-cron";

import { Logger } from "../shared/logger.js";

import { SCHEDULE } from "./constants.js";
import type { SimpleFINService } from "./simpleFinService.js";

/**
 * Schedules the daily SimpleFIN sync via node-cron inside the CAP
 * process. The job body runs in a spawned CDS context (`cds.spawn`). Disabled
 * automatically under test to avoid leaking timers.
 */
export class SchedulingService {
  private readonly service: SimpleFINService;
  private readonly logger: Logger;

  /**
   * Creates the scheduler bound to the SimpleFIN sync engine.
   *
   * @param service SimpleFIN sync engine the scheduled job drives.
   */
  constructor(service: SimpleFINService) {
    this.service = service;
    this.logger = new Logger("integration.scheduling");
  }

  /**
   * Builds a daily cron expression ("m h * * *") from an HH:MM time string,
   * falling back to the default time on malformed input.
   *
   * @param syncTime Desired sync time as "HH:MM" (24h).
   * @returns Daily cron expression firing at that time.
   */
  static buildCronExpression(syncTime: string): string {
    const parts = syncTime.split(":");
    if (parts.length !== SCHEDULE.TIME_PARTS) {
      return SchedulingService.buildCronExpression(SCHEDULE.DEFAULT_TIME);
    }
    const hour = Number.parseInt(parts[0], 10);
    const minute = Number.parseInt(parts[1], 10);
    const valid =
      !Number.isNaN(hour) &&
      !Number.isNaN(minute) &&
      hour >= 0 &&
      hour <= SCHEDULE.MAX_HOUR &&
      minute >= 0 &&
      minute <= SCHEDULE.MAX_MINUTE;
    if (!valid) {
      return SchedulingService.buildCronExpression(SCHEDULE.DEFAULT_TIME);
    }
    return `${minute} ${hour} * * *`;
  }

  /** Schedules the daily sync + stale check. No-op under test. */
  async start(): Promise<void> {
    if (process.env["NODE_ENV"] === "test") {
      return;
    }
    const syncTime = await this.service.getSyncTime();
    const expression = SchedulingService.buildCronExpression(syncTime);
    cron.schedule(expression, () => {
      cds.spawn({}, async () => {
        this.logger.info("STATE_CHANGE", "Scheduled SimpleFIN sync starting");
        await this.service.syncAllActive();
        await this.service.checkStaleConnections();
      });
    });
    this.logger.info("STATE_CHANGE", "SimpleFIN sync scheduled", { expression });
  }
}
