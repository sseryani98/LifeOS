// Named fixtures for the CSV import storyline: one issuer export uploaded,
// saved, then uploaded again, as overlapping monthly exports routinely are.

import { TO_CANCEL_CARD_INSTANCE } from "../../../shared/data/cards.js";
import { CIBC_CSV } from "../../../shared/data/ingestion/csv.js";

/** The parseCsvImport body for a CIBC export, posted on both the first and the repeat upload. */
export const CIBC_REIMPORT_UPLOAD = {
  cardInstance_ID: TO_CANCEL_CARD_INSTANCE.ID,
  fileName: "cibc-monthly.csv",
  fileContent: CIBC_CSV,
} as const;
