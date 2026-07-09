// Support for the AdminService integration test: draft create/activate request
// helpers plus the fixture seed. Kept out of the test file so each test body
// reads as arrange-act-assert rather than draft plumbing.

import {
  AMEX_COBALT,
  AMEX_COBALT_DEC2025_OFFER,
  AMEX_COBALT_INSTANCE,
} from "../../data/cards.js";
import {
  GROCERIES_ALLOCATION_CURRENT,
  DINING_ALLOCATION_CURRENT,
} from "../../data/budget.js";

const SERVICE = "/service/adminSvcs";

interface DraftResponse {
  status: number;
  data: { ID: string };
}

type PostFn = (
  url: string,
  data: Record<string, unknown>,
) => Promise<DraftResponse>;

export interface DraftHelpers {
  createViaDraft: (
    entity: string,
    data: Record<string, unknown>,
  ) => Promise<DraftResponse>;
  createViaDraftExpectError: (
    entity: string,
    data: Record<string, unknown>,
  ) => Promise<DraftResponse | { status: number }>;
}

/** Binds the draft create/activate helpers to a cds.test POST handle. */
export function buildDraftHelpers(post: PostFn): DraftHelpers {
  /** Creates a draft, applies data, and activates it. Returns the active entity. */
  async function createViaDraft(
    entity: string,
    data: Record<string, unknown>,
  ): Promise<DraftResponse> {
    const draft = await post(`${SERVICE}/${entity}`, data);
    const id = draft.data.ID;
    return post(
      `${SERVICE}/${entity}(ID=${id},IsActiveEntity=false)/AdminService.draftActivate`,
      {},
    );
  }

  /** Creates a draft, applies data, and attempts activation. Returns the error or activated entity. */
  async function createViaDraftExpectError(
    entity: string,
    data: Record<string, unknown>,
  ): Promise<DraftResponse | { status: number }> {
    const draft = await post(`${SERVICE}/${entity}`, data);
    const id = draft.data.ID;
    return post(
      `${SERVICE}/${entity}(ID=${id},IsActiveEntity=false)/AdminService.draftActivate`,
      {},
    ).catch((error: { status: number }) => error);
  }

  return { createViaDraft, createViaDraftExpectError };
}

/** Seeds the card + budget fixture world not covered by db/data/*.csv. */
export async function seedAdmin(): Promise<void> {
  // Reference data is already seeded from db/data/*.csv by cds.deploy.
  // Only insert entities that have no CSV seed files.
  await INSERT.into("com.financialplanner.MarketCard").entries([AMEX_COBALT]);
  await INSERT.into("com.financialplanner.Offer").entries([
    AMEX_COBALT_DEC2025_OFFER,
  ]);
  await INSERT.into("com.financialplanner.CardInstance").entries([
    AMEX_COBALT_INSTANCE,
  ]);
  await INSERT.into("com.financialplanner.BudgetAllocation").entries([
    GROCERIES_ALLOCATION_CURRENT,
    DINING_ALLOCATION_CURRENT,
  ]);
}
