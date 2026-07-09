import cds from "@sap/cds";
import cron from "node-cron";

import { SchedulingService } from "../../../srv/modules/integration/schedulingService.js";
import { buildScheduler } from "../../support/integration/schedulingMocks.js";

jest.mock("node-cron");

describe("SchedulingService.buildCronExpression", () => {
  /** node-cron reads minute-then-hour — a wrong field order here would run the sync at the wrong time of day. */
  it("builds a daily cron expression from HH:MM", () => {
    expect(SchedulingService.buildCronExpression("20:00")).toBe("0 20 * * *");
  });

  /** Confirms both components carry across without being swapped, so a 07:35 schedule really fires at 07:35. */
  it("preserves minutes and hours", () => {
    expect(SchedulingService.buildCronExpression("07:35")).toBe("35 7 * * *");
  });

  /** Malformed config must degrade to the default rather than emit an invalid cron string that node-cron would reject, killing the sync. */
  it("falls back to the default time on malformed input", () => {
    expect(SchedulingService.buildCronExpression("not-a-time")).toBe(
      "0 20 * * *",
    );
  });

  /** An hour past 23 would build an out-of-range cron field — falling back keeps the scheduler from registering an impossible time. */
  it("falls back when hour is out of range", () => {
    expect(SchedulingService.buildCronExpression("99:00")).toBe("0 20 * * *");
  });

  /** A minute past 59 is an invalid cron field — the fallback prevents a bad schedule from silently disabling the sync. */
  it("falls back when minute is out of range", () => {
    expect(SchedulingService.buildCronExpression("10:75")).toBe("0 20 * * *");
  });
});

describe("SchedulingService.start", () => {
  const originalNodeEnv = process.env["NODE_ENV"];

  afterEach(() => {
    process.env["NODE_ENV"] = originalNodeEnv;
    jest.restoreAllMocks();
    (cron.schedule as jest.Mock).mockClear();
  });

  /** Under NODE_ENV=test the scheduler must register no real timer, or Jest would leak a recurring cron job across the whole suite. */
  it("does not schedule anything under NODE_ENV=test", async () => {
    process.env["NODE_ENV"] = "test";
    const { scheduler } = buildScheduler("20:00");

    await scheduler.start();

    expect(cron.schedule).not.toHaveBeenCalled();
  });

  /** The daily job must be registered on the cron expression derived from the configured sync time, or the sync fires at the wrong hour. */
  it("registers the daily job at the configured time", async () => {
    process.env["NODE_ENV"] = "production";
    const { scheduler } = buildScheduler("07:30");

    await scheduler.start();

    expect(cron.schedule).toHaveBeenCalledWith(
      "30 7 * * *",
      expect.any(Function),
    );
  });

  /** Firing the registered job must actually drive a sync + stale check — wiring it to the wrong callback means the nightly refresh silently does nothing. */
  it("runs a sync and stale check when the job fires", async () => {
    process.env["NODE_ENV"] = "production";
    let spawned: Promise<unknown> | undefined;
    jest.spyOn(cds, "spawn").mockImplementation(((
      _options: unknown,
      task: () => Promise<unknown>,
    ) => {
      spawned = task();
      return spawned as never;
    }) as never);
    const { scheduler, syncAllActive, checkStaleConnections } =
      buildScheduler("20:00");
    await scheduler.start();

    const [, job] = (cron.schedule as jest.Mock).mock.calls[0];
    await job();
    await spawned;

    expect(syncAllActive).toHaveBeenCalled();
    expect(checkStaleConnections).toHaveBeenCalled();
  });
});
