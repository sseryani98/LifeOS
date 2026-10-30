/** Production async delay backed by a real timer. */
export class DefaultSleep {
  /**
   * Default delay used for retry backoff in production.
   * @param milliseconds Milliseconds to wait.
   * @returns A promise that resolves after the delay.
   */
  static createDelay(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  }
}
