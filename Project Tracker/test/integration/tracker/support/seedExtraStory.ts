import { createMilestoneThroughService } from "../../../shared/support/seedWorld.js";

/** The story columns a seeded extra story carries. */
interface ExtraStory {
  storyId: string;
  fricewType_code: string;
  description: string;
  shipsUi: boolean;
  position: number;
  createdDone?: boolean;
}

/**
 * Seeds one more story into an already-seeded sprint, through the service, so
 * its chain is the one the create-handler materialises for its shipsUi flag.
 * The canonical world holds exactly one story, so a rule about which story an
 * answer belongs to has nothing to distinguish without a second one.
 * @param initiativeId The sprint the story is planned into.
 * @param story The story columns to write.
 * @returns The new story's identifier.
 */
export const seedExtraStory = async (
  initiativeId: string,
  story: ExtraStory,
): Promise<string> => {
  return createMilestoneThroughService({
    ...story,
    initiative_ID: initiativeId,
  });
};
