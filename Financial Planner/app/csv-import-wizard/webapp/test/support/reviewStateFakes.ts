// Builds a ReviewState against a real "ui" JSON model and a service stand-in that only
// answers loadMatchedTransactions — the one call the review buckets make.

import type CsvImportWizardService from "com/financialplanner/csvimportwizard/model/CsvImportWizardService";
import ReviewState from "com/financialplanner/csvimportwizard/model/ReviewState";

import type { ReviewHarness } from "./types";

/**
 * Builds a ReviewState whose matched-transaction lookups are recorded and answered
 * from the harness's mutable `matches`.
 * @returns the harness
 */
export const buildReviewHarness = (): ReviewHarness => {
  const state = ReviewState.buildInitialModel();
  const harness = { state, matchedLookups: [], matches: {} } as unknown as ReviewHarness;
  const service = {
    loadMatchedTransactions: (ids: string[]) => {
      harness.matchedLookups.push(ids);
      return Promise.resolve(harness.matches);
    },
  } as unknown as CsvImportWizardService;
  harness.review = new ReviewState(state, service);
  return harness;
};
