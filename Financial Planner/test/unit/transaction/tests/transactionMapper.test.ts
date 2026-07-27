import { TransactionMapper } from "../../../../srv/modules/transaction/transactionMapper.js";
import {
  EMPTY_BULK_PAYLOAD,
  EMPTY_STRING_PCT_PAYLOAD,
  MINIMAL_SPLIT_PAYLOAD,
  PADEL_TXN_ID,
} from "../data/splits.js";

describe("TransactionMapper", () => {
  describe("toSplitCommand", () => {
    /** A cleared percentage field arrives as "" — coercing it to 0 would pass validation as a legal 0% split and silently persist a $0 share. */
    it("maps an empty-string percentage to null, not zero", () => {
      const command = TransactionMapper.toSplitCommand(
        EMPTY_STRING_PCT_PAYLOAD,
      );

      expect(command.mySharePct).toBeNull();
    });

    /** CAP omits unfilled optional params; the either/or rule needs absent shares as null, and isRecurring must default false rather than undefined. */
    it("defaults every absent optional param", () => {
      const command = TransactionMapper.toSplitCommand(MINIMAL_SPLIT_PAYLOAD);

      expect(command.transactionId).toBe(PADEL_TXN_ID);
      expect(command.mySharePct).toBeNull();
      expect(command.myShareAmount).toBeNull();
      expect(command.splitDescription).toBeNull();
      expect(command.isRecurring).toBe(false);
    });
  });

  describe("toBulkCommand", () => {
    /** An omitted selection must become an empty array so the validator raises noSelection instead of the service throwing on .length. */
    it("defaults an omitted selection to an empty array", () => {
      const command = TransactionMapper.toBulkCommand(EMPTY_BULK_PAYLOAD);

      expect(command.transactionIds).toEqual([]);
      expect(command.vendor_ID).toBeNull();
    });
  });
});
