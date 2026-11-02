// CSV import storyline over OData: upload an issuer export, save the reviewed
// rows, upload the same export again. Proves what save stores is what parse
// later matches, so a repeated or overlapping export never double-counts spend.

import cds from "@sap/cds";

import {
  registerCsvImportHandlers,
  seedCsvImport,
} from "../ingestion/support/csvImport.js";
import { CIBC_REIMPORT_UPLOAD } from "./data/csvImport.js";
import {
  buildCsvImportJourney,
  readTransactionIdsForCard,
} from "./support/csvImport.js";

const { POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");
const { uploadCsv, saveReviewed } = buildCsvImportJourney(POST);

beforeAll(registerCsvImportHandlers);
beforeAll(seedCsvImport);

describe("CSV import re-upload journey", () => {
  /** Each tier seeds its own duplicate; only a real save followed by a real parse catches drift between what save stores and what dedup matches, which would re-import every row. */
  it("flags every saved row as a potential duplicate when the same export is uploaded again", async () => {
    const firstReview = await uploadCsv({ ...CIBC_REIMPORT_UPLOAD });
    const summary = await saveReviewed(CIBC_REIMPORT_UPLOAD, firstReview.data);
    const savedIds = await readTransactionIdsForCard(
      CIBC_REIMPORT_UPLOAD.cardInstance_ID,
    );

    const secondReview = await uploadCsv({ ...CIBC_REIMPORT_UPLOAD });

    expect(firstReview.data.newRows).to.have.length(2);
    expect(firstReview.data.potentialDuplicates).to.have.length(0);
    expect(summary.data.transactionCount).to.equal(2);
    expect(secondReview.data.newRows).to.have.length(0);
    expect(secondReview.data.potentialDuplicates).to.have.length(
      firstReview.data.newRows.length,
    );
    expect(
      secondReview.data.potentialDuplicates.map(row => row.matchedTransactionId),
    ).to.have.members(savedIds);
  });
});
