// An OData V4 model stand-in: each operation stays pending until the test settles it,
// so invoke-vs-refresh order is observable. A result reads back once invoke() settled.

import type {
  FakeODataModel,
  FakeOperation,
  FakePageContext,
  FakeSplitContext,
  ODataModelHarness,
} from "./types";

/**
 * Builds a recording OData V4 model whose operations resolve or reject on command.
 * @returns the fake model plus switches that settle the pending invoke
 */
export const buildFakeODataModel = (): ODataModelHarness => {
  const pending: {
    resolve: () => void;
    reject: (reason: Error) => void;
  } = { resolve: () => undefined, reject: () => undefined };
  const answer: { payload: unknown } = { payload: undefined };
  const model: FakeODataModel = {
    operations: [],
    refreshCount: 0,
    bindContext: (path: string) => {
      // invoke is assigned, not declared, because the verb-first method-name rule rejects the V4 API's name.
      const operation = {
        path,
        parameters: new Map<string, unknown>(),
        invokeCount: 0,
        setParameter: (name: string, value: unknown) => {
          operation.parameters.set(name, value);
          return operation;
        },
      } as FakeOperation;
      const settled = { done: false };
      const readResult = (): unknown =>
        settled.done ? answer.payload : undefined;
      operation.invoke = () => {
        operation.invokeCount += 1;
        return new Promise<void>((resolve, reject) => {
          pending.resolve = () => {
            settled.done = true;
            resolve();
          };
          pending.reject = reject;
        });
      };
      operation.requestObject = () =>
        new Promise<unknown>((resolve, reject) => {
          pending.resolve = () => {
            resolve(answer.payload);
          };
          pending.reject = reject;
        });
      operation.getBoundContext = () => ({ getObject: readResult });
      model.operations.push(operation);
      return operation;
    },
    refresh: () => {
      model.refreshCount += 1;
    },
  };
  return {
    model,
    rejectInvoke: message => {
      pending.reject(new Error(message));
    },
    resolveInvoke: () => {
      pending.resolve();
    },
    resolveInvokeWith: payload => {
      answer.payload = payload;
      pending.resolve();
    },
  };
};

/**
 * Builds a split-row binding context that records every side-effects request.
 * @returns the fake context
 */
export const buildFakeSplitContext = (): FakeSplitContext => {
  const context = { requested: [] } as unknown as FakeSplitContext;
  // Assigned, not declared, because the verb-first method-name rule rejects the V4 API's name.
  context.requestSideEffects = (paths: unknown[]) => {
    context.requested.push(paths);
    return Promise.resolve();
  };
  return context;
};

/**
 * Builds an object-page context whose binding records patchCompleted handlers and
 * resets, so a refused edit can be completed on command and its recovery observed.
 * @returns the fake context
 */
export const buildFakePageContext = (): FakePageContext => {
  const handlers: Array<(event: unknown) => unknown> = [];
  const context = {
    attachCount: 0,
    events: [],
    requested: [],
  } as unknown as FakePageContext;
  const binding = {
    attachPatchCompleted: (handler: (event: unknown) => unknown) => {
      context.attachCount += 1;
      handlers.push(handler);
    },
    resetChanges: () => {
      context.events.push("reset");
      return Promise.resolve();
    },
  };
  context.getBinding = () => binding;
  // Assigned, not declared, because the verb-first method-name rule rejects the V4 API's name.
  context.requestSideEffects = (paths: unknown[]) => {
    context.events.push("reread");
    context.requested.push(paths);
    return Promise.resolve();
  };
  context.completePatch = async (success: boolean) => {
    const event = {
      getParameter: (name: string) =>
        name === "success" ? success : undefined,
    };
    await Promise.all(handlers.map(handler => handler(event)));
  };
  return context;
};
