// Harness for the SchedulingService unit test: builds the scheduler bound to a
// fully mocked SimpleFIN sync engine, so tests can assert the cron wiring without
// a real timer. node-cron / cds.spawn are mocked in the test file itself.

import { SchedulingService } from "../../../../srv/modules/ingestion/schedulingService.js";

import type { SimpleFINService } from "../../../../srv/modules/ingestion/simpleFinService.js";

export interface SchedulerHarness {
  scheduler: SchedulingService;
  getSyncTime: jest.Mock;
  syncAllActive: jest.Mock;
  checkStaleConnections: jest.Mock;
}

/** Builds a SchedulingService whose sync engine is fully mocked. */
export function buildScheduler(syncTime: string): SchedulerHarness {
  const getSyncTime = jest.fn(async () => syncTime);
  const syncAllActive = jest.fn(async () => undefined);
  const checkStaleConnections = jest.fn(async () => undefined);
  const service = {
    getSyncTime,
    syncAllActive,
    checkStaleConnections,
  } as unknown as SimpleFINService;
  return {
    scheduler: new SchedulingService(service),
    getSyncTime,
    syncAllActive,
    checkStaleConnections,
  };
}
