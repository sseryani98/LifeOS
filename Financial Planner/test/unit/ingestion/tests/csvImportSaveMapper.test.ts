import { CsvImportSaveMapper } from "../../../../srv/modules/ingestion/csvImportSaveMapper.js";

import {
  EARNING_CATEGORY_ID,
  PURCHASE_TYPE_ID,
  SAVE_ROW_CATEGORIZED,
  SAVE_ROW_UNCATEGORIZED,
  SAVE_TX_ID as ROW_ID,
  VENDOR_CINEPLEX_ID,
} from "../../../shared/data/ingestion/csv.js";

describe("CsvImportSaveMapper", () => {
  describe("toTransactionInsert", () => {
    /** A categorized row is a deliberate human classification, so it must persist as source=csv, not excluded, and user_corrected. */
    it("maps a categorized row to a user_corrected csv transaction", () => {
      const insert = CsvImportSaveMapper.toTransactionInsert(
        ROW_ID,
        SAVE_ROW_CATEGORIZED,
      );

      expect(insert).toEqual({
        ID: ROW_ID,
        cardInstance_ID: SAVE_ROW_CATEGORIZED.cardInstance_ID,
        source: "csv",
        amount: -27.67,
        postedAt: "2026-02-12",
        rawDescription: "cineplex #7115 qp",
        vendor_ID: VENDOR_CINEPLEX_ID,
        purchaseType_ID: PURCHASE_TYPE_ID,
        earningCategory_ID: EARNING_CATEGORY_ID,
        categorizationStatus: "user_corrected",
        isExcluded: false,
      });
    });

    /** A row cleared with no vendor or categories must persist as uncategorized so later categorization treats it as untouched. */
    it("maps a cleared row with no categories to uncategorized", () => {
      const insert = CsvImportSaveMapper.toTransactionInsert(
        ROW_ID,
        SAVE_ROW_UNCATEGORIZED,
      );

      expect(insert.categorizationStatus).toBe("uncategorized");
      expect(insert.vendor_ID).toBeNull();
      expect(insert.purchaseType_ID).toBeNull();
      expect(insert.earningCategory_ID).toBeNull();
    });

    /** Assigning any one of vendor/type/category is still a human decision, so a partially categorized row must be user_corrected. */
    it("treats a row with only a vendor as user_corrected", () => {
      const insert = CsvImportSaveMapper.toTransactionInsert(ROW_ID, {
        ...SAVE_ROW_UNCATEGORIZED,
        vendor_ID: VENDOR_CINEPLEX_ID,
      });

      expect(insert.categorizationStatus).toBe("user_corrected");
    });
  });
});
