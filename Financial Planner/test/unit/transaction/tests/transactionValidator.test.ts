import { TransactionValidator } from "../../../../srv/modules/transaction/transactionValidator.js";
import {
  BOTH_INPUTS_SPLIT,
  BULK_APPLY,
  DOLLAR_SPLIT,
  EMPTY_RECATEGORIZE,
  EMPTY_SELECTION_BULK,
  EXCEEDS_DOLLAR_SPLIT,
  EXCEEDS_SHARE,
  FRIEND_ABS_AMOUNT,
  FULL_DOLLAR_SPLIT,
  FULL_PADEL_SHARE,
  FULL_PCT_SPLIT,
  FULL_RESTAURANT_SHARE,
  MISSING_TXN_CORRECTION,
  MISSING_VENDOR_CORRECTION,
  NEGATIVE_DOLLAR_SPLIT,
  NEGATIVE_SHARE,
  NEITHER_INPUT_SPLIT,
  PADEL_ABS_AMOUNT,
  PADEL_PCT_SHARE,
  PERCENTAGE_SPLIT,
  RECATEGORIZE_SELECTION,
  REIMBURSED_SPLIT,
  RESTAURANT_ABS_AMOUNT,
  RESTAURANT_DOLLAR_SHARE,
  VALID_CORRECTION,
  ZERO_SHARE,
} from "../data/splits.js";

describe("TransactionValidator", () => {
  describe("validateSplit", () => {
    /** A valid percentage split must pass so the common shared-expense path is not blocked. */
    it("accepts a percentage-only split", () => {
      const errors = TransactionValidator.validateSplit(
        PERCENTAGE_SPLIT,
        PADEL_ABS_AMOUNT,
        PADEL_PCT_SHARE,
      );

      expect(errors).toHaveLength(0);
    });

    /** A valid dollar split must pass — the user may enter their exact share instead of a percentage. */
    it("accepts a dollar-only split within the total", () => {
      const errors = TransactionValidator.validateSplit(
        DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
        RESTAURANT_DOLLAR_SHARE,
      );

      expect(errors).toHaveLength(0);
    });

    /** A zero-share reimbursed split must pass so fully-reimbursed purchases can be recorded. */
    it("accepts a zero-percentage reimbursed split", () => {
      const errors = TransactionValidator.validateSplit(
        REIMBURSED_SPLIT,
        FRIEND_ABS_AMOUNT,
        ZERO_SHARE,
      );

      expect(errors).toHaveLength(0);
    });

    /** Supplying both percentage and amount must fail — the two inputs are mutually exclusive. */
    it("rejects both inputs at once", () => {
      const errors = TransactionValidator.validateSplit(
        BOTH_INPUTS_SPLIT,
        PADEL_ABS_AMOUNT,
        PADEL_PCT_SHARE,
      );

      expect(errors[0].messageKey).toBe("transaction.split.enterOneInput");
    });

    /** Supplying neither input must fail — there is nothing to split. */
    it("rejects when neither input is given", () => {
      const errors = TransactionValidator.validateSplit(
        NEITHER_INPUT_SPLIT,
        PADEL_ABS_AMOUNT,
        ZERO_SHARE,
      );

      expect(errors[0].messageKey).toBe("transaction.split.enterOneInput");
    });

    /** A negative dollar share must fail — a share below zero is nonsensical. */
    it("rejects a negative dollar share", () => {
      const errors = TransactionValidator.validateSplit(
        NEGATIVE_DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
        NEGATIVE_SHARE,
      );

      expect(errors[0].messageKey).toBe("transaction.split.amountExceedsTotal");
    });

    /** A dollar share larger than the transaction must fail — the share caps at the total. */
    it("rejects a dollar share exceeding the total", () => {
      const errors = TransactionValidator.validateSplit(
        EXCEEDS_DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
        EXCEEDS_SHARE,
      );

      expect(errors[0].messageKey).toBe("transaction.split.amountExceedsTotal");
    });

    /** 100% is inside the range, not past it — a `>=` ceiling would reject a user splitting the whole charge to themselves. */
    it("accepts a percentage at the 100% ceiling", () => {
      const errors = TransactionValidator.validateSplit(
        FULL_PCT_SPLIT,
        PADEL_ABS_AMOUNT,
        FULL_PADEL_SHARE,
      );

      expect(errors).toHaveLength(0);
    });

    /** A share equal to the total is inside the cap — a `>=` ceiling would reject an exact-total share, which is a legal full claim. */
    it("accepts a dollar share equal to the total", () => {
      const errors = TransactionValidator.validateSplit(
        FULL_DOLLAR_SPLIT,
        RESTAURANT_ABS_AMOUNT,
        FULL_RESTAURANT_SHARE,
      );

      expect(errors).toHaveLength(0);
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
  });

  describe("validateReCategorize", () => {
    /** A non-empty selection must pass so the re-run proceeds over the chosen rows. */
    it("accepts a non-empty selection", () => {
      const errors =
        TransactionValidator.validateReCategorize(RECATEGORIZE_SELECTION);

      expect(errors).toHaveLength(0);
    });

    /** An empty selection must fail — there is nothing to re-categorize. */
    it("rejects an empty selection", () => {
      const errors =
        TransactionValidator.validateReCategorize(EMPTY_RECATEGORIZE);

      expect(errors[0].messageKey).toBe("transaction.recategorize.noSelection");
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
