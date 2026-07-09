// Integration test for CSV import (cds.test + SQLite): the engine + data layer
// run against the real in-memory DB. Proves the *seeded* format config resolves
// and parses correctly (guarding the corrected TD/CIBC column indices) and that
// natural-key dedup fires against real persisted transactions. Custom logic
// only — never CAP CRUD machinery. Fixtures in data/, harness in support/.

import cds from "@sap/cds";

import { CsvImportDataService } from "../../../../srv/modules/ingestion/csvImportDataService.js";

import { TO_CANCEL_CARD_INSTANCE } from "../../../shared/data/cards.js";
import { CIBC_CSV } from "../../../shared/data/ingestion/csv.js";
import { MISSING_ID } from "../../../shared/data/ingestion/simplefin.js";
import { RBC_CARD_INSTANCE } from "../data/csvImport.js";
import {
  buildCsvImportService,
  seedCsvImport,
  seedDuplicateTransaction,
} from "../support/csvImport.js";

const { expect } = cds.test("serve", "--with-mocks", "--in-memory");

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

  /** A CSV row matching an already-persisted transaction on description+date+amount+card must be flagged for review, not silently imported. */
  it("flags a natural-key duplicate against a persisted transaction", async () => {
    await seedDuplicateTransaction();
    const service = buildCsvImportService();

    const result = await service.parseFile({
      cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
      fileName: "cibc.csv",
      fileContent: CIBC_CSV,
    });

    expect(result.potentialDuplicates).to.have.length(1);
    expect(result.potentialDuplicates[0].rawDescription).to.equal(
      "PURCHASE INTEREST",
    );
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
});
