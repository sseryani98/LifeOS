// Harness for the DeduplicationService unit test: builds the service wired to a
// fully mocked data layer. Kept out of the test file so each test reads as
// arrange-act-assert rather than mock plumbing.

import { DeduplicationService } from "../../../srv/modules/integration/deduplicationService.js";

import type { DeduplicationDataService } from "../../../srv/modules/integration/deduplicationDataService.js";

export interface DedupMocks {
  findByExternalId: jest.Mock;
  findByNaturalKey: jest.Mock;
  service: DeduplicationService;
}

/** Builds a fresh DeduplicationService with its data layer fully mocked. */
export function buildDedupMocks(): DedupMocks {
  const findByExternalId = jest.fn();
  const findByNaturalKey = jest.fn();
  const dataService = {
    findByExternalId,
    findByNaturalKey,
  } as unknown as DeduplicationDataService;
  const service = new DeduplicationService(dataService);
  return { findByExternalId, findByNaturalKey, service };
}
