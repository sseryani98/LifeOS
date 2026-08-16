import cds from "@sap/cds";

import { Logger } from "./logger.js";

/**
 * Reports whether a thrown value is a CAP rejection rather than a programming
 * error, by the status or code every deliberate rejection carries.
 * @param error The value caught from a handler.
 * @returns True when the value already carries a status or a code.
 */
function isRejection(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; status?: unknown };
  return candidate.status !== undefined || candidate.code !== undefined;
}

/**
 * Base class for Facade modules. A Facade registers CDS event handlers and
 * delegates; it holds no logic of its own.
 */
export class BaseFacade {
  protected readonly logger: Logger;
  protected readonly srv: cds.ApplicationService;

  /**
   * Creates a facade bound to a CDS service.
   * @param srv CDS application service this facade registers handlers on.
   * @param moduleName Namespace used to tag this facade's log entries.
   */
  constructor(srv: cds.ApplicationService, moduleName: string) {
    this.srv = srv;
    this.logger = new Logger(moduleName);
  }

  /** Registers every CDS event handler this facade owns. */
  registerHandlers(): void {
    throw new Error("registerHandlers() must be implemented");
  }

  /**
   * Wraps a handler with logging, and turns an unhandled throw into a rejection
   * carrying an i18n key rather than a stack trace.
   * @param handler Handler method to wrap, already bound to this facade.
   * @param event Event name used for log context.
   * @param entity Entity name used for log context.
   * @param errorKey Runtime message key used when the handler throws.
   * @returns A handler suitable for srv.before / srv.on / srv.after.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapHandler<T extends (...args: any[]) => any>(
    handler: T,
    event: string,
    entity: string,
    errorKey: string,
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (...args: any[]) => {
      const req = (args.find(
        (arg): arg is cds.Request =>
          arg !== null &&
          typeof arg === "object" &&
          "headers" in (arg as Record<string, unknown>),
      ) ?? args[0]) as cds.Request;
      this.logger.logInfo(event, entity);
      try {
        return await handler(...args);
      } catch (error: unknown) {
        // A rejection the handler raised deliberately already carries its status
        // and its key; re-wrapping it as a 500 would throw both away.
        if (isRejection(error)) throw error;
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.logError(`${event} ${entity}`, detail);
        throw req.reject(500, errorKey);
      }
    };
  }
}
