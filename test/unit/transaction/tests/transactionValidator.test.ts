import { TransactionValidator } from "../../../../srv/modules/transaction/transactionValidator.js";
import {
  BOTH_INPUTS_SPLIT,
  BULK_APPLY,
  DOLLAR_SPLIT,
  EMPTY_SELECTION_BULK,
  EXCEEDS_DOLLAR_SPLIT,
  FRIEND_ABS_AMOUNT,
  INVALID_PCT_SPLIT,
  MISSING_TXN_CORRECTION,
  MISSING_VENDOR_CORRECTION,
  NEGATIVE_DOLLAR_SPLIT,
  NEGATIVE_PCT_SPLIT,
  NEITHER_INPUT_SPLIT,
  NO_VENDOR_BULK,
  PADEL_ABS_AMOUNT,
  PERCENTAGE_SPLIT,
  REIMBURSED_SPLIT,
  RESTAURANT_ABS_AMOUNT,
  VALID_CORRECTION,
} from "../data/splits.js";

describe("TransactionValidator", () => {
  describe("validateSplit", () => {
    /** A valid percentage split must pass so the common shared-expense path is not blocked. */
    it("accepts a percentage-only split", () => {
      const errors = TransactionValidator.validateSplit(
        PERCENTAGE_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(errors).toHaveLength(0);
    });

    /** A valid dollar split must pass — the user may enter their exact share instead of a percentage. */
    it("accepts a dollar-only split within the total", () => {
      const errors = TransactionValidator.validateSplit(
        DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
      );

      expect(errors).toHaveLength(0);
    });

    /** A zero-share reimbursed split must pass so fully-reimbursed purchases can be recorded. */
    it("accepts a zero-percentage reimbursed split", () => {
      const errors = TransactionValidator.validateSplit(
        REIMBURSED_SPLIT,
        FRIEND_ABS_AMOUNT,
      );

      expect(errors).toHaveLength(0);
    });

    /** Supplying both percentage and amount must fail — the two inputs are mutually exclusive. */
    it("rejects both inputs at once", () => {
      const errors = TransactionValidator.validateSplit(
        BOTH_INPUTS_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.enterOneInput");
    });

    /** Supplying neither input must fail — there is nothing to split. */
    it("rejects when neither input is given", () => {
      const errors = TransactionValidator.validateSplit(
        NEITHER_INPUT_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.enterOneInput");
    });

    /** A percentage above 100% must fail so a share can never exceed the whole. */
    it("rejects a percentage outside 0–1", () => {
      const errors = TransactionValidator.validateSplit(
        INVALID_PCT_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.invalidPercentage");
    });

    /** A negative percentage must fail — the lower bound of the range is guarded too. */
    it("rejects a negative percentage", () => {
      const errors = TransactionValidator.validateSplit(
        NEGATIVE_PCT_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.invalidPercentage");
    });

    /** A negative dollar share must fail — a share below zero is nonsensical. */
    it("rejects a negative dollar share", () => {
      const errors = TransactionValidator.validateSplit(
        NEGATIVE_DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.amountExceedsTotal");
    });

    /** A dollar share larger than the transaction must fail — the share caps at the total. */
    it("rejects a dollar share exceeding the total", () => {
      const errors = TransactionValidator.validateSplit(
        EXCEEDS_DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
      );

      expect(errors[0].messageKey).toBe("transaction.split.amountExceedsTotal");
    });
  });

  describe("computeMyShareAmount", () => {
    /** A percentage share must resolve to amount × pct rounded to cents — the value the budget reads. */
    it("computes the share from a percentage", () => {
      const share = TransactionValidator.computeMyShareAmount(
        PERCENTAGE_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(share).toBe(22);
    });

    /** A dollar share must pass through unchanged so an explicit amount is stored verbatim. */
    it("passes a dollar share through unchanged", () => {
      const share = TransactionValidator.computeMyShareAmount(
        DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
      );

      expect(share).toBe(42.5);
    });

    /** With neither input present the share defaults to zero rather than null — myShareAmount is never left unset. */
    it("defaults to zero when neither input is present", () => {
      const share = TransactionValidator.computeMyShareAmount(
        NEITHER_INPUT_SPLIT,
        PADEL_ABS_AMOUNT,
      );

      expect(share).toBe(0);
    });
  });

  describe("validateBulkCategorize", () => {
    /** A selection with a vendor must pass so bulk apply proceeds. */
    it("accepts a non-empty selection with a vendor", () => {
      const errors = TransactionValidator.validateBulkCategorize(BULK_APPLY);

      expect(errors).toHaveLength(0);
    });

    /** An empty selection must fail — there is nothing to categorize. */
    it("rejects an empty selection", () => {
      const errors =
        TransactionValidator.validateBulkCategorize(EMPTY_SELECTION_BULK);

      expect(errors[0].messageKey).toBe("transaction.recategorize.noSelection");
    });

    /** A selection with no vendor must fail — learning needs a vendor to anchor the pattern. */
    it("rejects a selection with no vendor", () => {
      const errors =
        TransactionValidator.validateBulkCategorize(NO_VENDOR_BULK);

      expect(errors[0].messageKey).toBe(
        "transaction.bulkCategorize.vendorRequired",
      );
    });
  });

  describe("validateCorrection", () => {
    /** A complete correction must pass so single-row edits are accepted. */
    it("accepts a correction with a transaction and vendor", () => {
      const errors = TransactionValidator.validateCorrection(VALID_CORRECTION);

      expect(errors).toHaveLength(0);
    });

    /** A correction without a vendor must fail — the vendor anchors the learned pattern. */
    it("rejects a correction missing its vendor", () => {
      const errors =
        TransactionValidator.validateCorrection(MISSING_VENDOR_CORRECTION);

      expect(errors[0].messageKey).toBe("transaction.correct.vendorRequired");
    });

    /** A correction with no target transaction must fail — there is nothing to correct. */
    it("rejects a correction missing its transaction", () => {
      const errors =
        TransactionValidator.validateCorrection(MISSING_TXN_CORRECTION);

      expect(errors[0].messageKey).toBe(
        "transaction.correct.transactionRequired",
      );
    });
  });
});
