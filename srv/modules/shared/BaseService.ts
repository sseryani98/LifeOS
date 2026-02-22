import { Logger } from './Logger.js';

/**
 * Base class for all Service modules.
 * Services contain business logic and delegate validation to Validators.
 */
export class BaseService {
  protected readonly logger: Logger;

  /** Creates a new Service instance with a named logger. */
  constructor(moduleName: string) {
    this.logger = new Logger(moduleName);
  }
}
