import cds from "@sap/cds";

import { Logger } from "./logger.js";

const MS_PER_SECOND = 1000;

/**
 * Base class for all Facade modules.
 * Facades register CDS event handlers and delegate to Service classes.
 * No business logic allowed — enforced by ESLint rules.
 */
export class BaseFacade {
  protected readonly logger: Logger;
  protected readonly srv: cds.ApplicationService;

  /** Creates a new Facade instance tied to a CDS service. */
  constructor(srv: cds.ApplicationService, moduleName: string) {
    this.srv = srv;
    this.logger = new Logger(moduleName);
  }

  /** Must be implemented by subclasses to register all CDS event handlers. */
  registerHandlers(): void {
    throw new Error("registerHandlers() must be implemented");
  }

  /**
   * Wraps a handler with structured logging and error handling.
   * Returns a function suitable for passing directly to srv.before/on/after.
   * Supports all CAP handler signatures: before(req), on(req, next), after(data, req).
   * @param handler - The handler method to wrap (bound to this facade)
   * @param event - Event name for logging context (e.g., 'before-CREATE')
   * @param entity - Entity name for logging context
   * @param errorKey - i18n key for error messages
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
      const startTime = Date.now();
      const req = (args.find(
        (arg): arg is cds.Request =>
          arg !== null &&
          typeof arg === "object" &&
          "headers" in (arg as Record<string, unknown>),
      ) ?? args[0]) as cds.Request;
      this.logger.setCorrelationId(req.id);
      this.logger.info("ENTRY", `${event} ${entity}`);
      try {
        const result = await handler(...args);
        this.logger.info("EXIT", `${event} ${entity}`, {
          duration_s: (Date.now() - startTime) / MS_PER_SECOND,
        });
        return result;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.error("ERROR", `${event} ${entity}: ${errorMessage}`, {
          event,
          entity,
          error: errorMessage,
          duration_s: (Date.now() - startTime) / MS_PER_SECOND,
        });
        throw req.reject(500, errorKey);
      }
    };
  }
}
