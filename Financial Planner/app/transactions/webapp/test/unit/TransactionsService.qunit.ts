/// <reference types="qunit" />
import TransactionsService from "com/financialplanner/transactions/model/TransactionsService";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

import {
  EXISTING_SPLIT,
  EXISTING_SPLIT_PATH,
  EXISTING_SPLIT_PAYLOAD,
  REFUSED_EDIT_REFRESH,
  SELECTION,
  SERVICE_FAILURE,
  SPLIT_EXPECTED,
  SPLIT_INPUT,
  SPLIT_SHARE_REFRESH,
  SUGGESTION,
  SUGGESTION_PAYLOAD,
  TAXONOMY_ID,
  TRANSACTION_ID,
} from "../data/constants";
import {
  buildFakeODataModel,
  buildFakePageContext,
  buildFakeSplitContext,
} from "../support/odataModelFakes";
import type { FakeOperation, ODataModelHarness } from "../support/types";

const state: { harness: ODataModelHarness; service: TransactionsService } = {
  harness: undefined as unknown as ODataModelHarness,
  service: undefined as unknown as TransactionsService,
};

const useFreshService = (hooks: NestedHooks): void => {
  hooks.beforeEach(() => {
    state.harness = buildFakeODataModel();
    state.service = new TransactionsService(
      state.harness.model as unknown as ODataModel,
    );
  });
};

const onlyOperation = (): FakeOperation => state.harness.model.operations[0];

const parametersOf = (operation: FakeOperation): Record<string, unknown> =>
  Object.fromEntries(operation.parameters);

const outcomeOf = (call: Promise<unknown>): Promise<string> =>
  call.then(
    () => "resolved",
    (error: Error) => error.message,
  );

QUnit.module("TransactionsService — Apply Categories", hooks => {
  useFreshService(hooks);

  /** one vendor + taxonomy reaches every selected row; names must match the CDS action signature or the backend ignores them. */
  QUnit.test(
    "invokes bulkCategorize once with the selection, vendor, purchase type and earning category",
    async assert => {
      const call = state.service.applyBulkCategories(
        SELECTION.COFFEE_AND_GROCERIES,
        TAXONOMY_ID.VENDOR_COFFEE_SHOP,
        TAXONOMY_ID.PURCHASE_TYPE_DINING,
        TAXONOMY_ID.EARNING_CATEGORY_DINING,
      );
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(state.harness.model.operations.length, 1);
      assert.strictEqual(
        onlyOperation().path,
        "/TransactionService.bulkCategorize(...)",
      );
      assert.strictEqual(onlyOperation().invokeCount, 1);
      assert.deepEqual(parametersOf(onlyOperation()), {
        transactionIds: SELECTION.COFFEE_AND_GROCERIES,
        vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP,
        purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_DINING,
        earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_DINING,
      });
    },
  );

  /** vendor is the only mandatory input; an unset purchase type or earning category goes as null, not dropped. */
  QUnit.test(
    "sends an unset purchase type and earning category as null",
    async assert => {
      const call = state.service.applyBulkCategories(
        SELECTION.COFFEE_AND_GROCERIES,
        TAXONOMY_ID.VENDOR_COFFEE_SHOP,
        null,
        null,
      );
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(
        onlyOperation().parameters.get("purchaseType_ID"),
        null,
      );
      assert.strictEqual(
        onlyOperation().parameters.get("earningCategory_ID"),
        null,
      );
    },
  );

  /** the list must show the applied categories, so it refreshes only once the action has succeeded. */
  QUnit.test(
    "refreshes the model only after the action succeeds",
    async assert => {
      const call = state.service.applyBulkCategories(
        SELECTION.COFFEE_AND_GROCERIES,
        TAXONOMY_ID.VENDOR_COFFEE_SHOP,
        null,
        null,
      );
      const refreshesWhilePending = state.harness.model.refreshCount;
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(refreshesWhilePending, 0);
      assert.strictEqual(state.harness.model.refreshCount, 1);
    },
  );

  /** a rejected bulk apply must reach the caller so it can warn the user, and must not refresh as if it worked. */
  QUnit.test(
    "rejects with the backend failure and leaves the model unrefreshed",
    async assert => {
      const call = state.service.applyBulkCategories(
        SELECTION.COFFEE_AND_GROCERIES,
        TAXONOMY_ID.VENDOR_COFFEE_SHOP,
        null,
        null,
      );
      state.harness.rejectInvoke(SERVICE_FAILURE.MESSAGE);

      assert.strictEqual(await outcomeOf(call), SERVICE_FAILURE.MESSAGE);
      assert.strictEqual(state.harness.model.refreshCount, 0);
    },
  );
});

QUnit.module("TransactionsService — Re-categorize", hooks => {
  useFreshService(hooks);

  /** every selected id goes to reCategorize; skipping user-corrected rows is the backend's call, not the UI's. */
  QUnit.test(
    "invokes reCategorize once with every selected transaction id",
    async assert => {
      const call = state.service.runReCategorization(
        SELECTION.COFFEE_AND_GROCERIES,
      );
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(state.harness.model.operations.length, 1);
      assert.strictEqual(
        onlyOperation().path,
        "/TransactionService.reCategorize(...)",
      );
      assert.strictEqual(onlyOperation().invokeCount, 1);
      assert.deepEqual(parametersOf(onlyOperation()), {
        transactionIds: SELECTION.COFFEE_AND_GROCERIES,
      });
    },
  );

  /** the re-run changes vendor and categories server-side, so the list refreshes once it has completed. */
  QUnit.test(
    "refreshes the model only after the re-run succeeds",
    async assert => {
      const call = state.service.runReCategorization(
        SELECTION.COFFEE_AND_GROCERIES,
      );
      const refreshesWhilePending = state.harness.model.refreshCount;
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(refreshesWhilePending, 0);
      assert.strictEqual(state.harness.model.refreshCount, 1);
    },
  );

  /** a failed re-run must surface to the caller and must not refresh as if rows had changed. */
  QUnit.test(
    "rejects with the backend failure and leaves the model unrefreshed",
    async assert => {
      const call = state.service.runReCategorization(
        SELECTION.COFFEE_AND_GROCERIES,
      );
      state.harness.rejectInvoke(SERVICE_FAILURE.MESSAGE);

      assert.strictEqual(await outcomeOf(call), SERVICE_FAILURE.MESSAGE);
      assert.strictEqual(state.harness.model.refreshCount, 0);
    },
  );
});

QUnit.module("TransactionsService — Split", hooks => {
  useFreshService(hooks);

  /** one share form is sent and the other goes null for the backend to compute; names must match the CDS action. */
  QUnit.test(
    "invokes splitTransaction once with the row, one share form, description and recurring flag",
    async assert => {
      const call = state.service.splitTransaction(
        TRANSACTION_ID.PADEL,
        SPLIT_EXPECTED.PERCENT_FRACTION,
        null,
        SPLIT_INPUT.PERCENT_SHARE.splitDescription,
        true,
      );
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(state.harness.model.operations.length, 1);
      assert.strictEqual(
        onlyOperation().path,
        "/TransactionService.splitTransaction(...)",
      );
      assert.strictEqual(onlyOperation().invokeCount, 1);
      assert.deepEqual(parametersOf(onlyOperation()), {
        transactionId: TRANSACTION_ID.PADEL,
        mySharePct: SPLIT_EXPECTED.PERCENT_FRACTION,
        myShareAmount: null,
        splitDescription: SPLIT_INPUT.PERCENT_SHARE.splitDescription,
        isRecurring: true,
      });
    },
  );

  /** a dollar-based split sends the amount and leaves the percentage null for the backend to derive. */
  QUnit.test(
    "sends a dollar share with the percentage left null",
    async assert => {
      const call = state.service.splitTransaction(
        TRANSACTION_ID.PADEL,
        null,
        SPLIT_EXPECTED.AMOUNT,
        null,
        false,
      );
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(onlyOperation().parameters.get("mySharePct"), null);
      assert.strictEqual(
        onlyOperation().parameters.get("myShareAmount"),
        SPLIT_EXPECTED.AMOUNT,
      );
      assert.strictEqual(onlyOperation().parameters.get("isRecurring"), false);
    },
  );

  /** the row's share must show once saved, so the list refreshes only after the split succeeds. */
  QUnit.test(
    "refreshes the model only after the split succeeds",
    async assert => {
      const call = state.service.splitTransaction(
        TRANSACTION_ID.PADEL,
        null,
        SPLIT_EXPECTED.AMOUNT,
        null,
        false,
      );
      const refreshesWhilePending = state.harness.model.refreshCount;
      state.harness.resolveInvoke();
      await call;

      assert.strictEqual(refreshesWhilePending, 0);
      assert.strictEqual(state.harness.model.refreshCount, 1);
    },
  );

  /** a rejected split (a share out of range, say) must reach the caller and must not refresh as saved. */
  QUnit.test(
    "rejects with the backend failure and leaves the model unrefreshed",
    async assert => {
      const call = state.service.splitTransaction(
        TRANSACTION_ID.PADEL,
        null,
        SPLIT_EXPECTED.AMOUNT,
        null,
        false,
      );
      state.harness.rejectInvoke(SERVICE_FAILURE.MESSAGE);

      assert.strictEqual(await outcomeOf(call), SERVICE_FAILURE.MESSAGE);
      assert.strictEqual(state.harness.model.refreshCount, 0);
    },
  );
});

QUnit.module("TransactionsService — Recurring split suggestion", hooks => {
  useFreshService(hooks);

  /** the suggestion is the backend's unbound function keyed on the row; a wrong name or parameter never reaches the vendor's template. */
  QUnit.test(
    "calls the suggestRecurringSplit function once for the transaction",
    async assert => {
      const call = state.service.findRecurringSplitSuggestion(
        TRANSACTION_ID.PADEL,
      );
      state.harness.resolveInvokeWith(null);
      await call;

      assert.strictEqual(state.harness.model.operations.length, 1);
      assert.strictEqual(
        onlyOperation().path.startsWith("/suggestRecurringSplit("),
        true,
      );
      assert.strictEqual(onlyOperation().invokeCount, 1);
      assert.strictEqual(
        onlyOperation().parameters.get("transactionId"),
        TRANSACTION_ID.PADEL,
      );
    },
  );

  /** a percentage template arrives with its Decimals as strings; the dialog needs numbers to convert and save them. */
  QUnit.test(
    "returns a percentage-based template with its share and amount as numbers",
    async assert => {
      const call = state.service.findRecurringSplitSuggestion(
        TRANSACTION_ID.PADEL,
      );
      state.harness.resolveInvokeWith({ ...SUGGESTION_PAYLOAD.PERCENT_BASED });

      assert.deepEqual(await call, { ...SUGGESTION.PERCENT_BASED });
    },
  );

  /** a dollar template has no percentage; coercing that null to 0 would turn it into a 0% split. */
  QUnit.test(
    "returns a dollar-based template with the percentage still null",
    async assert => {
      const call = state.service.findRecurringSplitSuggestion(
        TRANSACTION_ID.PADEL,
      );
      state.harness.resolveInvokeWith({ ...SUGGESTION_PAYLOAD.DOLLAR_BASED });

      assert.deepEqual(await call, { ...SUGGESTION.DOLLAR_BASED });
    },
  );

  /** a vendor with no recurring split has no template; the caller must see null and open the dialog blank. */
  QUnit.test("returns null when the vendor has no template", async assert => {
    const call = state.service.findRecurringSplitSuggestion(
      TRANSACTION_ID.PADEL,
    );
    state.harness.resolveInvokeWith(null);

    assert.strictEqual(await call, null);
  });
});

QUnit.module("TransactionsService — Split share refresh", hooks => {
  useFreshService(hooks);

  /** the backend recomputes the dollar share from an edited percentage; without a re-read the page keeps showing the stale amount. */
  QUnit.test("re-reads the split's dollar share once", async assert => {
    const context = buildFakeSplitContext();

    await state.service.refreshSplitShare(context as unknown as Context);

    assert.deepEqual(context.requested, [
      [{ $PropertyPath: SPLIT_SHARE_REFRESH.AMOUNT_PATH }],
    ]);
  });
});

QUnit.module("TransactionsService — Existing split", hooks => {
  useFreshService(hooks);

  /** a re-split must start from the row's saved terms; reading the draft or another row would seed the wrong split. */
  QUnit.test("reads the active row's split navigation", async assert => {
    const call = state.service.findExistingSplit(TRANSACTION_ID.PADEL);
    state.harness.resolveInvokeWith(null);
    await call;

    assert.deepEqual(
      state.harness.model.operations.map(operation => operation.path),
      [EXISTING_SPLIT_PATH.PADEL],
    );
  });

  /** the split's Decimals arrive as strings and its recurring flag may be off; the dialog needs numbers and the flag as saved. */
  QUnit.test(
    "returns the existing split's terms with numeric shares",
    async assert => {
      const call = state.service.findExistingSplit(TRANSACTION_ID.PADEL);
      state.harness.resolveInvokeWith({ ...EXISTING_SPLIT_PAYLOAD });

      assert.deepEqual(await call, { ...EXISTING_SPLIT.PERCENT_BASED });
    },
  );

  /** a row with no split has nothing to pre-populate; the caller must see null and fall back to the suggestion. */
  QUnit.test("returns null when the row has no split", async assert => {
    const call = state.service.findExistingSplit(TRANSACTION_ID.PADEL);
    state.harness.resolveInvokeWith(null);

    assert.strictEqual(await call, null);
  });
});

QUnit.module("TransactionsService — Refused object-page edits", hooks => {
  useFreshService(hooks);

  /** a refused PATCH stays pending and is re-sent with the next edit, so every later edit is refused too until the change is dropped. */
  QUnit.test(
    "drops the refused change, then re-reads both split shares",
    async assert => {
      const context = buildFakePageContext();
      state.service.attachRefusedEditRecovery(context as unknown as Context);

      await context.completePatch(false);

      assert.deepEqual(context.events, ["reset", "reread"]);
      assert.deepEqual(context.requested, [
        [...REFUSED_EDIT_REFRESH.SPLIT_SHARES],
      ]);
    },
  );

  /** a saved edit is the draft's value already; resetting it would throw away the user's input. */
  QUnit.test("leaves a saved edit alone", async assert => {
    const context = buildFakePageContext();
    state.service.attachRefusedEditRecovery(context as unknown as Context);

    await context.completePatch(true);

    assert.deepEqual(context.events, []);
  });

  /** FE skips its #Share side effect on the first edit after a refusal, so that edit's recomputed share would stay stale on screen. */
  QUnit.test(
    "re-reads both split shares once on the first saved edit after a refusal",
    async assert => {
      const context = buildFakePageContext();
      state.service.attachRefusedEditRecovery(context as unknown as Context);
      await context.completePatch(false);

      await context.completePatch(true);
      await context.completePatch(true);

      assert.deepEqual(context.events, ["reset", "reread", "reread"]);
    },
  );

  /** FE rebinds the page on every navigation; a second listener on the same binding would reset and re-read twice. */
  QUnit.test(
    "listens on a page binding once however often it rebinds",
    assert => {
      const context = buildFakePageContext();

      state.service.attachRefusedEditRecovery(context as unknown as Context);
      state.service.attachRefusedEditRecovery(context as unknown as Context);

      assert.strictEqual(context.attachCount, 1);
    },
  );
});
