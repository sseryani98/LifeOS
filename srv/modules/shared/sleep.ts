// Production async delay backed by a real timer.

import type { SleepFn } from "./types.js";

/**
 * Default delay used for retry backoff in production.
 * @param milliseconds Milliseconds to wait.
 * @returns A promise that resolves after the delay.
 */
export const defaultSleep: SleepFn = milliseconds =>
  new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
