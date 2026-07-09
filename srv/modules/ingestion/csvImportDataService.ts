import { ENTITIES } from "./constants.js";
import type { AttributionCard, CsvFormatConfigRecord } from "./types.js";

/**
 * Data-access layer for the CSV import engine: resolves the issuer format
 * config for a card and the cards eligible for cardmember attribution.
 */
export class CsvImportDataService {
  /**
   * Resolves the CSV format config for a card via its market card's issuer.
   * Null at any hop means no config — the caller blocks the import.
   * @param cardInstanceId Selected card instance.
   * @returns The issuer's format config, or null when none is configured.
   */
  async getFormatConfigForCard(
    cardInstanceId: string,
  ): Promise<CsvFormatConfigRecord | null> {
    const card = (await SELECT.one
      .from(ENTITIES.CARD_INSTANCE)
      .columns("marketCard.issuer_ID as issuer_ID")
      .where({ ID: cardInstanceId })) as { issuer_ID: string } | undefined;
    if (!card?.issuer_ID) {
      return null;
    }
    const config = (await SELECT.one
      .from(ENTITIES.CSV_FORMAT_CONFIG)
      .where({ issuer_ID: card.issuer_ID })) as
      | CsvFormatConfigRecord
      | undefined;
    return config ?? null;
  }

  /**
   * Lists cards a CSV row can attribute to: the selected card plus any
   * supplementary cards beneath it.
   * @param cardInstanceId Selected (primary) card instance.
   * @returns The selected card and its supplementary children.
   */
  async getAttributionCards(
    cardInstanceId: string,
  ): Promise<AttributionCard[]> {
    const selected = (await SELECT.one
      .from(ENTITIES.CARD_INSTANCE)
      .columns("ID", "cardholderName")
      .where({ ID: cardInstanceId })) as AttributionCard | undefined;
    if (!selected) {
      return [];
    }
    const supplementary = (await SELECT.from(ENTITIES.CARD_INSTANCE)
      .columns("ID", "cardholderName")
      .where({ parentCardInstance_ID: cardInstanceId })) as AttributionCard[];
    return [selected, ...supplementary];
  }
}
