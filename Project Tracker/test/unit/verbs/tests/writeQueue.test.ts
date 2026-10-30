import { WriteQueue } from "../../../../mcp/verbs/shared/writeQueue.js";

describe("write ordering", () => {
  /** A counter that only ever increments would also pass this, and date every register row from the epoch. */
  it("hands out strictly increasing timestamps anchored to the wall clock", () => {
    const before = Date.now();
    const stamps = Array.from({ length: 5 }, () => WriteQueue.createTimestamp());

    for (let index = 1; index < stamps.length; index++) {
      expect(stamps[index] > stamps[index - 1]).toBe(true);
    }
    expect(new Date(stamps[0]).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(stamps[4]).getTime()).toBeLessThan(before + 1000);
  });

  /** A fractional second is refused outright by the elements that take a date and a time. */
  it("trims a timestamp to whole seconds", () => {
    expect(WriteQueue.toSecondPrecision("2026-08-16T10:00:00.123Z")).toBe(
      "2026-08-16T10:00:00Z",
    );
  });

  /** Writes must not interleave, or two half-written transactions share a moment. */
  it("runs writes one after another", async () => {
    const order: number[] = [];
    const work = (label: number, delay: number) => async () => {
      await new Promise(resolve => setTimeout(resolve, delay));
      order.push(label);
      return label;
    };

    await Promise.all([
      WriteQueue.runSerialized(work(1, 20)),
      WriteQueue.runSerialized(work(2, 1)),
      WriteQueue.runSerialized(work(3, 1)),
    ]);

    expect(order).toEqual([1, 2, 3]);
  });

  /** One failed write must not park every later one behind a promise that never settles. */
  it("keeps the chain running after a write rejects", async () => {
    const failing = WriteQueue.runSerialized(() => Promise.reject(new Error("nope")));

    await expect(failing).rejects.toThrow("nope");
    await expect(WriteQueue.runSerialized(() => Promise.resolve("after"))).resolves.toBe(
      "after",
    );
  });
});
