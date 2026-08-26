import { randomUUID } from "node:crypto";

import { seedStoryChain } from "../../../shared/support/seedWorld.js";

/** Database-level entity name, so seeding never passes through a write guard. */
const MILESTONE_TABLE = "com.lifeos.projecttracker.Milestone";

/** The story columns a seeded extra story carries. */
interface ExtraStory {
  storyId: string;
  fricewType_code: string;
  description: string;
  shipsUi: boolean;
  position: number;
}

/**
 * Seeds one more story into an already-seeded sprint, with the chain its
 * shipsUi flag materialises. The canonical world holds exactly one story, so a
 * rule about which story an answer belongs to has nothing to distinguish
 * without a second one.
 * @param initiativeId The sprint the story is planned into.
 * @param story The story columns to write.
 * @returns The new story's identifier.
 */
export async function seedExtraStory(
  initiativeId: string,
  story: ExtraStory,
): Promise<string> {
  const milestoneId = randomUUID();
  await INSERT.into(MILESTONE_TABLE).entries({
    ID: milestoneId,
    ...story,
    initiative_ID: initiativeId,
  });
  await seedStoryChain(milestoneId, story.shipsUi);
  return milestoneId;
}
