import { TrackerDataService } from "../../../../srv/modules/tracker/trackerDataService.js";
import { TrackerService } from "../../../../srv/modules/tracker/trackerService.js";
import { HALF_PAIR_WRITES } from "../data/handlerPayloads.js";
import { buildRequestDouble } from "../support/requestDouble.js";

/**
 * The duplicate guards read the half a partial update omits. These are the
 * cases where that read cannot complete the pair - a create carrying one half,
 * an update whose stored row is gone - and both must fall through to the store
 * constraint rather than count against a half-formed key. Neither is reachable
 * over OData, which is why they are unit tests rather than integration ones.
 */
describe("the write guards on a pair they cannot complete", () => {
  const service = new TrackerService();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Counting siblings on a name with no workspace would match across every workspace at once. */
  it("skips the sprint duplicate count when the write carries no workspace", async () => {
    const double = buildRequestDouble(HALF_PAIR_WRITES.INITIATIVE_NAME_ONLY);

    await service.checkInitiativeWrite(double.request);

    expect(double.rejections).toHaveLength(0);
  });

  /** A patch of a sprint that no longer exists leaves the merge with only what the payload carried. */
  it("skips the sprint duplicate count when the stored sprint cannot be read", async () => {
    jest
      .spyOn(TrackerDataService.prototype, "readInitiativeRow")
      .mockResolvedValue(undefined);
    const double = buildRequestDouble(
      HALF_PAIR_WRITES.INITIATIVE_RENAME,
      "UPDATE",
    );

    await service.checkInitiativeWrite(double.request);

    expect(double.rejections).toHaveLength(0);
  });

  /** A story patch that names neither half of the key has nothing to check and must not read the row. */
  it("skips the story duplicate count when the write touches neither half of the key", async () => {
    const readRow = jest.spyOn(TrackerDataService.prototype, "readMilestoneRow");
    const double = buildRequestDouble(
      HALF_PAIR_WRITES.MILESTONE_DESCRIPTION_ONLY,
      "UPDATE",
    );

    await service.checkMilestoneWrite(double.request);

    expect(readRow).not.toHaveBeenCalled();
    expect(double.rejections).toHaveLength(0);
  });

  /** A create naming only the sprint is the mirror of the rename: half a key, so no count. */
  it("skips the story duplicate count when the write carries no story identifier", async () => {
    const double = buildRequestDouble(HALF_PAIR_WRITES.MILESTONE_SPRINT_ONLY);

    await service.checkMilestoneWrite(double.request);

    expect(double.rejections).toHaveLength(0);
  });

  /** A patch of a story that no longer exists leaves the merge with only the identifier it carried. */
  it("skips the story duplicate count when the stored story cannot be read", async () => {
    jest
      .spyOn(TrackerDataService.prototype, "readMilestoneRow")
      .mockResolvedValue(undefined);
    const double = buildRequestDouble(
      HALF_PAIR_WRITES.MILESTONE_RENAME,
      "UPDATE",
    );

    await service.checkMilestoneWrite(double.request);

    expect(double.rejections).toHaveLength(0);
  });
});
