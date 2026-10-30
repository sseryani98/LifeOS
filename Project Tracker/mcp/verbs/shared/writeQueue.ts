import { TIMESTAMP } from "./constants.js";

/**
 * Serializes the write verbs and hands out the timestamps they are stamped
 * with. Both are process-wide state, so they live on the class, not an instance.
 */
export class WriteQueue {
  /** The tail of the write chain. Every write awaits it before starting. */
  private static tail: Promise<unknown> = Promise.resolve();

  /** The last timestamp handed out, so the next one is strictly later. */
  private static lastIssued = 0;

  /**
   * Issues a timestamp strictly later than every timestamp issued before it.
   * Two writes landing inside the same millisecond would otherwise tie, and the
   * activity register is ordered by exactly this value.
   * @returns An ISO timestamp, strictly increasing across calls.
   */
  static createTimestamp(): string {
    const now = Date.now();
    WriteQueue.lastIssued =
      now > WriteQueue.lastIssued ? now : WriteQueue.lastIssued + 1;
    return new Date(WriteQueue.lastIssued).toISOString();
  }

  /**
   * Runs a write to completion before the next one starts. Reads do not pass
   * through here and stay concurrent.
   * @param work The write to run.
   * @returns Whatever the write returned.
   */
  static runSerialized<T>(work: () => Promise<T>): Promise<T> {
    const result = WriteQueue.tail.then(work, work);
    // The chain must survive a rejected write, or one failure would serialize
    // every later call behind a promise that never settles cleanly.
    WriteQueue.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  /**
   * Trims a timestamp to whole seconds. Measured against the pinned runtime: a
   * DateTime element rejects a fractional-second value outright with
   * ASSERT_DATA_TYPE, while the activity register's Timestamp keeps the
   * milliseconds that make two writes in one second distinguishable.
   * @param timestamp An ISO timestamp.
   * @returns The same instant, without its fractional seconds.
   */
  static toSecondPrecision(timestamp: string): string {
    return `${timestamp.slice(0, TIMESTAMP.SECOND_PRECISION_LENGTH)}Z`;
  }
}
