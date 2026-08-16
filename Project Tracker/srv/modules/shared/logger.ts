import cds from "@sap/cds";

/**
 * Thin named wrapper over cds.log. It writes nothing to disk on purpose: this
 * module's second process speaks JSON-RPC on stdout, and a logger that owned
 * its own sink would be one more thing to redirect.
 */
export class Logger {
  private readonly cdsLogger: ReturnType<typeof cds.log>;

  /**
   * Creates a logger for the given module namespace.
   * @param moduleName Namespace passed to cds.log and tagged on every entry.
   */
  constructor(moduleName: string) {
    this.cdsLogger = cds.log(moduleName);
  }

  /**
   * Logs a failure with its context.
   * @param action Short label for the operation that failed.
   * @param message Human-readable failure detail.
   */
  logError(action: string, message: string): void {
    this.cdsLogger.error(action, message);
  }

  /**
   * Logs an informational event.
   * @param action Short label for the operation.
   * @param message Human-readable detail.
   */
  logInfo(action: string, message: string): void {
    this.cdsLogger.info(action, message);
  }
}
