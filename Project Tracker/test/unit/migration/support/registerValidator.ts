import type cds from "@sap/cds";

import { MigrationValidator } from "../../../../srv/modules/migration/migrationValidator.js";

/** One error a rule accumulated on the request. */
export interface AccumulatedError {
  code?: string;
  message?: string;
  status?: number;
  target?: string;
  args?: unknown[];
}

/** A request that records what the validator put on it. */
export interface ValidatorRequestDouble {
  request: cds.Request;
  errors: AccumulatedError[];
}

/**
 * Builds the migration's validator.
 * @returns The validator.
 */
export const buildRegisterValidator = (): MigrationValidator => {
  return new MigrationValidator();
};

/**
 * Builds a request whose error spy records what a rule accumulated. A rule
 * that rejects instead of accumulating fails here, because reject is absent.
 * @returns The double and what it accumulated.
 */
export const buildValidatorRequest = (): ValidatorRequestDouble => {
  const errors: AccumulatedError[] = [];
  const request = {
    error: (detail: AccumulatedError) => {
      errors.push(detail);
    },
  } as unknown as cds.Request;
  return { request, errors };
};
