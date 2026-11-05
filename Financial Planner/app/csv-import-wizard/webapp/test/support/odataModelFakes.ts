// A V4 ODataModel stand-in for CsvImportWizardService: it records every bound
// operation's parameters and invoke, every list create and refresh, and answers
// each bound path from a per-path queue. No backend.

import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

import type { BoundOperation, CreatedReference, FakeODataModel } from "./types";

/**
 * Builds the fake model. An answered path hands out its queued results in order.
 * An unanswered requestObject rejects, as a V4 read of a missing or unreadable
 * entity does; an unanswered invoke leaves the bound result undefined.
 * @returns the fake model and its recordings
 */
export const buildFakeODataModel = (): FakeODataModel => {
  const answers = new Map<string, unknown[]>();
  const operations: BoundOperation[] = [];
  const creates: CreatedReference[] = [];
  const refreshes = { count: 0 };
  const takeAnswer = (path: string): unknown => answers.get(path)?.shift();
  const model = {
    bindContext: (path: string) => {
      const operation: BoundOperation = { path, parameters: {}, invokeCount: 0 };
      operations.push(operation);
      const state: { result: unknown } = { result: undefined };
      // invoke/requestObject are assigned, not declared: the verb-first method-name rule rejects the V4 API's names.
      const binding: Record<string, unknown> = {
        setParameter: (name: string, value: unknown) => {
          operation.parameters[name] = value;
        },
        getBoundContext: () => ({ getObject: () => state.result }),
      };
      binding.invoke = async () => {
        operation.invokeCount += 1;
        state.result = takeAnswer(path);
      };
      binding.requestObject = async () => {
        if (!answers.get(path)?.length) {
          throw new Error(`No entity readable at ${path}`);
        }
        return takeAnswer(path);
      };
      return binding;
    },
    bindList: (entitySet: string) => ({
      create: (data: object) => {
        creates.push({ entitySet, data });
        // created is assigned for the same reason as invoke above.
        const context: Record<string, unknown> = { getObject: () => takeAnswer(entitySet) };
        context.created = async () => undefined;
        return context;
      },
    }),
    refresh: () => {
      refreshes.count += 1;
    },
  } as unknown as ODataModel;
  return {
    model,
    operations,
    creates,
    refreshes,
    stubAnswer: (path, ...results) => {
      answers.set(path, [...(answers.get(path) ?? []), ...results]);
    },
  };
};
