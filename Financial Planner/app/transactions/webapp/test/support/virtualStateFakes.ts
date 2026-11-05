// An FE-extended OData model stand-in: only the local annotation model FE keeps
// its computed states in, plus contexts that resolve to it.

import JSONModel from "sap/ui/model/json/JSONModel";

import type { FakeStateContext, VirtualStateHarness } from "./types";

/**
 * Builds a fresh model whose local annotation model starts with the given data.
 * @param data the local annotation model's initial content
 * @returns the states model and a context factory bound to the fake model
 */
export const buildVirtualStateHarness = (
  data: Record<string, unknown>,
): VirtualStateHarness => {
  const states = new JSONModel(structuredClone(data));
  const model = { getLocalAnnotationModel: () => states };
  return {
    states,
    buildContext: (path: string): FakeStateContext => ({
      getPath: () => path,
      getModel: () => model,
    }),
  };
};
