import { TransactionMapper } from "../../../../srv/modules/transaction/transactionMapper.js";
import {
  EMPTY_BULK_PAYLOAD,
  EMPTY_STRING_PCT_PAYLOAD,
  MINIMAL_SPLIT_PAYLOAD,
  PADEL_TXN_ID,
  PG_DOLLAR_TEMPLATE_ROW,
  PG_PCT_TEMPLATE_ROW,
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

  describe("toRecurringSplitTemplate", () => {
    /** Postgres returns decimals as strings; a template must reach the Split dialog as numbers, or it pre-fills "0.2000" and the share maths breaks. */
    it("coerces a percentage template's string decimals to numbers", () => {
      const template = TransactionMapper.toRecurringSplitTemplate(
        PG_PCT_TEMPLATE_ROW,
      );

      expect(template.mySharePct).toBe(0.2);
      expect(template.myShareAmount).toBe(22);
      expect(template.splitDescription).toBe("Padel with friends");
    });

    /** A dollar template's null percentage must stay null, not Number(null) = 0, or the dialog opens a fixed share as a 0% reimbursement. */
    it("keeps a dollar template's null percentage and coerces its amount", () => {
      const template = TransactionMapper.toRecurringSplitTemplate(
        PG_DOLLAR_TEMPLATE_ROW,
      );

      expect(template.mySharePct).toBeNull();
      expect(template.myShareAmount).toBe(42.5);
    });
  });
});
