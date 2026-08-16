/** The tail of the write chain. Every write awaits it before starting. */
let tail: Promise<unknown> = Promise.resolve();

/** The last timestamp handed out, so the next one is strictly later. */
let lastIssued = 0;

/**
 * Issues a timestamp strictly later than every timestamp issued before it.
 * Two writes landing inside the same millisecond would otherwise tie, and the
 * activity register is ordered by exactly this value.
 * @returns An ISO timestamp, strictly increasing across calls.
 */
export function nextTimestamp(): string {
  const now = Date.now();
  lastIssued = now > lastIssued ? now : lastIssued + 1;
  return new Date(lastIssued).toISOString();
}

/**
 * Trims a timestamp to whole seconds. Measured against the pinned runtime: a
 * DateTime element rejects a fractional-second value outright with
 * ASSERT_DATA_TYPE, while the activity register's Timestamp keeps the
 * milliseconds that make two writes in one second distinguishable.
 * @param timestamp An ISO timestamp.
 * @returns The same instant, without its fractional seconds.
 */
export function toSecondPrecision(timestamp: string): string {
  return `${timestamp.slice(0, 19)}Z`;
}

/**
 * Runs a write to completion before the next one starts. Reads do not pass
 * through here and stay concurrent.
 * @param work The write to run.
 * @returns Whatever the write returned.
 */
export function runSerialized<T>(work: () => Promise<T>): Promise<T> {
  const result = tail.then(work, work);
  // The chain must survive a rejected write, or one failure would serialize
  // every later call behind a promise that never settles cleanly.
  tail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
