// Runs CSV import against the real in-memory DB: seeded configs parse, natural-key
// dedup keys on exactly its four fields, supp attribution resolves, the action
// binds. Each dedup spec parses its own card, so none reads another's rows.

import cds from "@sap/cds";

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";

import {
  AMEX_COBALT_INSTANCE,
  TO_CANCEL_CARD_INSTANCE,
} from "../../../shared/data/cards.js";
import {
  CIBC_CSV,
  P1_SUPP_ID,
  P2_SUPP_ID,
} from "../../../shared/data/ingestion/csv.js";
import { MISSING_ID } from "../../../shared/data/ingestion/simplefin.js";
import {
  AMEX_PARSE_REQUEST,
  CIBC_AMOUNT_VARIANT_CARD_INSTANCE,
  CIBC_AMOUNT_VARIANT_TRANSACTION,
  CIBC_CARD_VARIANT_TARGET_INSTANCE,
  CIBC_CARD_VARIANT_TRANSACTION,
  CIBC_DATE_VARIANT_CARD_INSTANCE,
  CIBC_DATE_VARIANT_TRANSACTION,
  CIBC_DUP_CARD_INSTANCE,
  CIBC_DUP_TRANSACTION,
  PARSE_CSV_ODATA_NO_CONTENT,
  PARSE_CSV_ODATA_PAYLOAD,
  RECLASSIFY_CSV_ODATA_PAYLOAD,
  RBC_CARD_INSTANCE,
} from "../data/csvImport.js";
import {
  buildCsvImportActions,
  buildCsvImportService,
  registerCsvImportHandlers,
  seedCsvImport,
  seedPersistedTransaction,
} from "../support/csvImport.js";

const { POST, expect } = cds.test("serve", "--with-mocks", "--in-memory");
const { postParseCsvImport, postReclassifyCsvRow } = buildCsvImportActions(POST);

beforeAll(registerCsvImportHandlers);
beforeAll(seedCsvImport);

describe("CSV import against SQLite", () => {
  /** End-to-end proof the *seeded* CIBC config resolves via card→issuer and that split debit/credit columns normalize to the right signs — the mocked units can't exercise the real seed. */
  it("resolves the seeded config and normalizes split amounts", async () => {
    const service = buildCsvImportService();

    const result = await service.parseFile({
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      fileName: "cibc.csv",
      fileContent: CIBC_CSV,
    });

    expect(result.configResolved).to.equal(true);
    expect(result.configName).to.equal("CIBC CSV Export");
    const amounts = result.newRows.map((row: { amount: number }) => row.amount);
    expect(amounts).to.include(1);
    expect(amounts).to.include(-1.12);
  });

  describe("natural-key dedup", () => {
    /** A CSV row matching an already-persisted transaction on description+date+amount+card must be flagged for review, not silently imported. */
    it("flags a natural-key duplicate against a persisted transaction", async () => {
      await seedPersistedTransaction(CIBC_DUP_TRANSACTION);
      const service = buildCsvImportService();

      const result = await service.parseFile({
        cardInstance_ID: CIBC_DUP_CARD_INSTANCE.ID,
        fileName: "cibc.csv",
        fileContent: CIBC_CSV,
      });

      expect(result.potentialDuplicates).to.have.length(1);
      expect(result.potentialDuplicates[0].rawDescription).to.equal(
        "PURCHASE INTEREST",
      );
    });

    /** Two household members buying the same item the same day on different cards are two charges; a key without the card would flag one, and a "Skip" would lose it. */
    it("treats the same charge on a different card as new", async () => {
      await seedPersistedTransaction(CIBC_CARD_VARIANT_TRANSACTION);
      const service = buildCsvImportService();

      const result = await service.parseFile({
        cardInstance_ID: CIBC_CARD_VARIANT_TARGET_INSTANCE.ID,
        fileName: "cibc.csv",
        fileContent: CIBC_CSV,
      });

      expect(result.potentialDuplicates).to.have.length(0);
      expect(
        result.newRows.map(row => row.rawDescription),
      ).to.include("PURCHASE INTEREST");
    });

    /** A one-cent difference is a different charge; a key without the amount would flag it, and the side-by-side view would hide the gap. */
    it("treats a charge differing only by amount as new", async () => {
      await seedPersistedTransaction(CIBC_AMOUNT_VARIANT_TRANSACTION);
      const service = buildCsvImportService();

      const result = await service.parseFile({
        cardInstance_ID: CIBC_AMOUNT_VARIANT_CARD_INSTANCE.ID,
        fileName: "cibc.csv",
        fileContent: CIBC_CSV,
      });

      expect(result.potentialDuplicates).to.have.length(0);
      expect(
        result.newRows.map(row => row.rawDescription),
      ).to.include("PURCHASE INTEREST");
    });

    /** A recurring charge on consecutive days is two charges; a key without the posted date would flag the second. */
    it("treats a charge posted on a different day as new", async () => {
      await seedPersistedTransaction(CIBC_DATE_VARIANT_TRANSACTION);
      const service = buildCsvImportService();

      const result = await service.parseFile({
        cardInstance_ID: CIBC_DATE_VARIANT_CARD_INSTANCE.ID,
        fileName: "cibc.csv",
        fileContent: CIBC_CSV,
      });

      expect(result.potentialDuplicates).to.have.length(0);
      expect(
        result.newRows.map(row => row.rawDescription),
      ).to.include("PURCHASE INTEREST");
    });
  });

  /** The seeded Amex config's Cardmember column must route each supp holder's charge to their own card via the parent link; a broken lookup silently books everything on the primary. */
  it("attributes Amex rows to the matching supplementary card", async () => {
    const service = buildCsvImportService();

    const result = await service.parseFile({ ...AMEX_PARSE_REQUEST });

    expect(result.configResolved).to.equal(true);
    expect(
      result.newRows.map(row => `${row.rawDescription}|${row.cardInstance_ID}`),
    ).to.have.members([
      `PARK HYATT TORONTO|${AMEX_COBALT_INSTANCE.ID}`,
      `UBER EATS|${P1_SUPP_ID}`,
      `TESLA MOTORS|${P2_SUPP_ID}`,
    ]);
  });

  /** An unknown card resolves to no config so the engine blocks the import rather than throwing on a missing card. */
  it("returns null config for an unknown card", async () => {
    const data = new CsvImportDataService();
    expect(await data.getFormatConfigForCard(MISSING_ID)).to.equal(null);
  });

  /** A real card whose issuer has no format config must block the import — resolving the card→issuer chain but finding no config. */
  it("blocks the import when the issuer has no config", async () => {
    const service = buildCsvImportService();

    const result = await service.parseFile({
      cardInstance_ID: RBC_CARD_INSTANCE.ID,
      fileName: "rbc.csv",
      fileContent: CIBC_CSV,
    });

    expect(result.configResolved).to.equal(false);
  });

  /** Attribution for an unknown card must return an empty list, not throw, so a stale selection degrades gracefully. */
  it("returns no attribution cards for an unknown card", async () => {
    const data = new CsvImportDataService();
    expect(await data.getAttributionCards(MISSING_ID)).to.have.length(0);
  });

  describe("parseCsvImport over OData", () => {
    /** The wizard reaches the parser only through this action; a renamed CDS parameter or a broken req.data mapping fails every real upload while the engine tests stay green. */
    it("parses an upload through the action signature", async () => {
      const response = await postParseCsvImport({ ...PARSE_CSV_ODATA_PAYLOAD });

      expect(response.status).to.equal(200);
      expect(response.data.configResolved).to.equal(true);
    });

    /** A request missing its file content must be a 400 the wizard can show, not a 500 from parsing undefined. */
    it("rejects an upload without fileContent with a 400", async () => {
      const response = await postParseCsvImport({
        ...PARSE_CSV_ODATA_NO_CONTENT,
      }).catch((error: { status: number }) => error);

      expect(response.status).to.equal(400);
    });
  });

  describe("reclassifyCsvRow over OData", () => {
    /** A fixed Excluded row must come back with the file's amount and split-column sign; the old client rebuild sent it as a $0 charge. */
    it("re-decodes a corrected row through the action signature", async () => {
      const response = await postReclassifyCsvRow({ ...RECLASSIFY_CSV_ODATA_PAYLOAD });

      expect(response.status).to.equal(200);
      expect(response.data).to.include({ postedAt: "2025-07-24", amount: -1.12, dedupOutcome: "new" });
    });
  });
});
