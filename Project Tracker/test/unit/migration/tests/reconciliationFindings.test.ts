import { ReconciliationFindings } from "../../../../srv/modules/migration/reconciliationFindings.js";
import {
  ORDERING_INITIATIVES,
  ORDERING_KEY,
  ORDERING_STORIES,
} from "../data/orderingFacts.js";

/**
 * The ordering assertion, called directly: the store's not-null and unique
 * position columns leave no way to arrange its failures through a load.
 */
describe("the reconciliation's ordering assertion", () => {
  /** A sprint without a position has no place in the run order, so the next sprint to work is ambiguous. */
  it("names a sprint that lost its position", () => {
    const finding = ReconciliationFindings.findOrderingOffenders(
      [...ORDERING_INITIATIVES.ONE_UNPOSITIONED],
      [...ORDERING_STORIES.POSITIONED],
    );

    expect(finding).toEqual({
      key: ORDERING_KEY,
      offenders: ["Second sprint"],
    });
  });

  /** A story without a position cannot be ordered, so the next story to work is ambiguous. */
  it("names a story that lost its position", () => {
    const finding = ReconciliationFindings.findOrderingOffenders(
      [...ORDERING_INITIATIVES.POSITIONED],
      [...ORDERING_STORIES.ONE_UNPOSITIONED],
    );

    expect(finding).toEqual({
      key: ORDERING_KEY,
      offenders: ["unpositioned-story"],
    });
  });

  /** Two stories in one slot tie for next; the same position in another sprint is a different slot and must not be flagged. */
  it("names the second of two stories sharing a slot in one sprint, and nothing else", () => {
    const finding = ReconciliationFindings.findOrderingOffenders(
      [...ORDERING_INITIATIVES.POSITIONED],
      [...ORDERING_STORIES.SHARED_SLOT],
    );

    expect(finding).toEqual({
      key: ORDERING_KEY,
      offenders: ["slot-clash-story"],
    });
  });
});
