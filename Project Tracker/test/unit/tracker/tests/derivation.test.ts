import { deriveMilestoneStatus } from "../../../../srv/modules/tracker/milestoneStatus.js";
import { TrackerDataService } from "../../../../srv/modules/tracker/trackerDataService.js";
import { TrackerMapper } from "../../../../srv/modules/tracker/trackerMapper.js";
import {
  CHAIN_ROWS,
  DERIVATION_CHAINS,
  EXPANDED_READS,
} from "../data/handlerPayloads.js";

describe("the status derivation", () => {
  /** An empty chain means the story was created done, so the derivation is total rather than undefined. */
  it("derives Done from an empty chain", () => {
    expect(deriveMilestoneStatus([...DERIVATION_CHAINS.EMPTY])).toBe("done");
  });

  /** Backlog is "nothing has started", which a chain with one closed stage is not. */
  it("derives Backlog only while nothing has started", () => {
    expect(
      deriveMilestoneStatus([...DERIVATION_CHAINS.ALL_NOT_STARTED]),
    ).toBe("backlog");
  });

  /** A story with work under way is neither backlog nor done. */
  it("derives In Progress once a stage has started and blocking work remains", () => {
    expect(deriveMilestoneStatus([...DERIVATION_CHAINS.ONE_IN_PROGRESS])).toBe(
      "inProgress",
    );
  });

  /** A recommended stage never blocks, so leaving it open must not hold a story open. */
  it("derives Done once every blocking stage is closed, recommended ones aside", () => {
    expect(
      deriveMilestoneStatus([...DERIVATION_CHAINS.BLOCKING_ALL_COMPLETE]),
    ).toBe("done");
  });
});

describe("the read-shape translations", () => {
  /** A read that expanded nothing must yield nothing, not throw on a missing collection. */
  it("collects expanded stories and tolerates a read that expanded none", () => {
    expect(
      TrackerMapper.listExpandedMilestones([
        ...EXPANDED_READS.WITH_TREE,
      ] as Record<string, unknown>[]),
    ).toHaveLength(1);
    expect(
      TrackerMapper.listExpandedMilestones([
        ...EXPANDED_READS.WITHOUT_TREE,
      ] as Record<string, unknown>[]),
    ).toHaveLength(0);
  });

  /** One row and many rows have to reach the guards the same way, or a verb write skips them. */
  it("normalises a payload into a list whether it arrived as one or many", () => {
    expect(TrackerMapper.toPayloadList([{ a: 1 }, { a: 2 }])).toHaveLength(2);
    expect(TrackerMapper.toPayloadList({ a: 1 })).toHaveLength(1);
    expect(TrackerMapper.toPayloadList(undefined)).toHaveLength(0);
  });

  /** Grouping is what lets one read answer for every story on the page. */
  it("buckets chain rows by the story they belong to", () => {
    const grouped = TrackerMapper.groupTasksByMilestone([...CHAIN_ROWS]);

    expect(grouped.get("milestone-1")).toHaveLength(2);
    expect(grouped.get("milestone-2")).toHaveLength(1);
  });
});

describe("the handler layer's data access", () => {
  /** Asking for the chains of no stories must not issue a query with an empty list. */
  it("answers with no chain rows when no story was named", async () => {
    expect(await new TrackerDataService().readChainTasks([])).toEqual([]);
  });
});
