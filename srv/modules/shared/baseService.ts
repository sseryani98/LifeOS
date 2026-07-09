import { Logger } from "./logger.js";

/**
 * Base class for all Service modules.
 * Services contain business logic and delegate validation to Validators.
 */
export class BaseService {
  protected readonly logger: Logger;

  /**
   * Creates a new Service instance with a named logger.
   * @param moduleName - Namespace used to tag this service's log entries
   */
  constructor(moduleName: string) {
    this.logger = new Logger(moduleName);
  }
}
