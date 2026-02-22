import cds from '@sap/cds';

import { Logger } from './Logger.js';

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

  /**
   * Wraps a handler with structured logging (ENTRY/EXIT) and error handling.
   * Every registered handler must be wrapped with this method.
   */
  async wrapHandler(req: cds.Request, handlerName: string, callback: () => Promise<unknown>): Promise<unknown> {
    this.logger.setCorrelationId(req.id);
    this.logger.info('ENTRY', handlerName);
    try {
      const result = await callback();
      this.logger.info('EXIT', handlerName);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('ERROR', `${handlerName} failed: ${errorMessage}`, {
        handler: handlerName,
        error: errorMessage
      });
      throw error;
    }
  }
}
