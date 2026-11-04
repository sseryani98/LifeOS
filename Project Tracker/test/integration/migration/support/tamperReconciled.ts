import { randomUUID } from "node:crypto";

import { STORE_TABLES } from "../data/storeTables.js";

/** The entities a tamper may reach by name. */
export type TamperedEntity = keyof typeof STORE_TABLES.ENTITY;

/** Undoes one tamper, so the next spec in the file starts from the clean load. */
export interface StoreTamper {
  restore: () => Promise<void>;
}

/** A tamper that also names the row it broke. */
export interface NamedTamper extends StoreTamper {
  rowId: string;
}

/** A tamper that broke a story, and the stories a failure must name. */
export interface StoryTamper extends StoreTamper {
  storyIds: string[];
}

/**
 * Reads every column of every row of every entity the load writes, each list
 * sorted by key, so an update is caught as surely as an insert or a delete.
 * @returns The rows of each entity, keyed by entity name.
 */
export const readStoreSnapshot = async (): Promise<
  Record<string, Record<string, unknown>[]>
> => {
  const snapshot: Record<string, Record<string, unknown>[]> = {};
  for (const [entity, table] of Object.entries(STORE_TABLES.ENTITY)) {
    const rows = (await SELECT.from(table)) as Record<string, unknown>[];
    snapshot[entity] = rows.sort((left, right) =>
      String(left.ID).localeCompare(String(right.ID)),
    );
  }
  return snapshot;
};

/**
 * Gives a second story a chain by copying one chain Task onto a story that has
 * none. Task counts are not tied out, so only the chain assertion can see it.
 * @returns The chained story and the newly chained one, and the undo.
 */
export const addSecondChain = async (): Promise<StoryTamper> => {
  const chainTask = await _readChainTask();
  const milestones = (await SELECT.from(STORE_TABLES.ENTITY.Milestone).columns(
    "ID",
    "storyId",
  )) as { ID: string; storyId: string }[];
  const chained = milestones.find(row => row.ID === chainTask.milestone_ID);
  const unchained = milestones.find(row => row.ID !== chainTask.milestone_ID);
  const copiedTaskId = randomUUID();
  await INSERT.into(STORE_TABLES.ENTITY.Task).entries({
    ...chainTask,
    ID: copiedTaskId,
    milestone_ID: unchained?.ID,
  });
  return {
    storyIds: [String(chained?.storyId), String(unchained?.storyId)],
    restore: async () => {
      await DELETE.from(STORE_TABLES.ENTITY.Task).where({ ID: copiedTaskId });
    },
  };
};

/**
 * Moves one chain Task off Not Started.
 * @param statusCode The status to give it.
 * @returns The undo.
 */
export const setChainTaskStatus = async (
  statusCode: string,
): Promise<StoreTamper> => {
  const chainTask = await _readChainTask();
  await UPDATE(STORE_TABLES.ENTITY.Task)
    .set({ status_code: statusCode })
    .where({ ID: chainTask.ID });
  return {
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY.Task)
        .set({ status_code: chainTask.status_code })
        .where({ ID: chainTask.ID });
    },
  };
};

/**
 * Re-points one chain row at another step, keeping the chain's row counts.
 * @param entity Which chain level to change: Task or Subtask.
 * @param stepCode The step to give it.
 * @returns The undo.
 */
export const setChainStep = async (
  entity: "Task" | "Subtask",
  stepCode: string,
): Promise<StoreTamper> => {
  const row = (await SELECT.one
    .from(STORE_TABLES.ENTITY[entity])
    .columns("ID", "step_code")) as { ID: string; step_code: string };
  await UPDATE(STORE_TABLES.ENTITY[entity])
    .set({ step_code: stepCode })
    .where({ ID: row.ID });
  return {
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY[entity])
        .set({ step_code: row.step_code })
        .where({ ID: row.ID });
    },
  };
};

/**
 * Re-types one story to a code the type list was mis-seeded with. The foreign
 * key admits no other way to store a retired type, and a seed defect is the
 * very way one would reach the load.
 * @param fricewTypeCode The type code to seed and give it.
 * @returns The story re-typed, and the undo.
 */
export const setStoryType = async (
  fricewTypeCode: string,
): Promise<StoryTamper> => {
  const story = (await SELECT.one
    .from(STORE_TABLES.ENTITY.Milestone)
    .columns("ID", "storyId", "fricewType_code")) as {
    ID: string;
    storyId: string;
    fricewType_code: string;
  };
  await INSERT.into(STORE_TABLES.FRICEW_TYPE).entries({
    code: fricewTypeCode,
    name: fricewTypeCode,
  });
  await UPDATE(STORE_TABLES.ENTITY.Milestone)
    .set({ fricewType_code: fricewTypeCode })
    .where({ ID: story.ID });
  return {
    storyIds: [story.storyId],
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY.Milestone)
        .set({ fricewType_code: story.fricewType_code })
        .where({ ID: story.ID });
      await DELETE.from(STORE_TABLES.FRICEW_TYPE).where({
        code: fricewTypeCode,
      });
    },
  };
};

/**
 * Re-attributes one row of an entity to another creator.
 * @param entity The entity whose row to change.
 * @param creator The identity to give it.
 * @returns The row re-attributed, and the undo.
 */
export const setRowCreator = async (
  entity: TamperedEntity,
  creator: string,
): Promise<NamedTamper> => {
  const row = (await SELECT.one
    .from(STORE_TABLES.ENTITY[entity])
    .columns("ID", "createdBy")) as { ID: string; createdBy: string };
  await UPDATE(STORE_TABLES.ENTITY[entity])
    .set({ createdBy: creator })
    .where({ ID: row.ID });
  return {
    rowId: row.ID,
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY[entity])
        .set({ createdBy: row.createdBy })
        .where({ ID: row.ID });
    },
  };
};

/**
 * Moves one chain Subtask off Not Started.
 * @param statusCode The status to give it.
 * @returns The undo.
 */
export const setChainSubtaskStatus = async (
  statusCode: string,
): Promise<StoreTamper> => {
  const subtask = (await SELECT.one
    .from(STORE_TABLES.ENTITY.Subtask)
    .columns("ID", "status_code")) as { ID: string; status_code: string };
  await UPDATE(STORE_TABLES.ENTITY.Subtask)
    .set({ status_code: statusCode })
    .where({ ID: subtask.ID });
  return {
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY.Subtask)
        .set({ status_code: subtask.status_code })
        .where({ ID: subtask.ID });
    },
  };
};

/**
 * Deletes one Subtask of the chain, so the chain has lost a stage.
 * @returns The undo, which writes the row back as it was.
 */
export const deleteChainSubtask = async (): Promise<StoreTamper> => {
  const subtask = (await SELECT.one.from(
    STORE_TABLES.ENTITY.Subtask,
  )) as Record<string, unknown> & { ID: string };
  await DELETE.from(STORE_TABLES.ENTITY.Subtask).where({ ID: subtask.ID });
  return {
    restore: async () => {
      await INSERT.into(STORE_TABLES.ENTITY.Subtask).entries(subtask);
    },
  };
};

/**
 * Deletes every Task and Subtask of the open story, so it has no chain at all.
 * @returns The story that lost its chain, and the undo.
 */
export const deleteOpenStoryChain = async (): Promise<StoryTamper> => {
  const tasks = (await SELECT.from(STORE_TABLES.ENTITY.Task)) as (Record<
    string,
    unknown
  > & { milestone_ID: string })[];
  const subtasks = (await SELECT.from(STORE_TABLES.ENTITY.Subtask)) as Record<
    string,
    unknown
  >[];
  const story = (await SELECT.one
    .from(STORE_TABLES.ENTITY.Milestone)
    .columns("storyId")
    .where({ ID: tasks[0].milestone_ID })) as { storyId: string };
  await DELETE.from(STORE_TABLES.ENTITY.Subtask);
  await DELETE.from(STORE_TABLES.ENTITY.Task);
  return {
    storyIds: [story.storyId],
    restore: async () => {
      await INSERT.into(STORE_TABLES.ENTITY.Task).entries(tasks);
      await INSERT.into(STORE_TABLES.ENTITY.Subtask).entries(subtasks);
    },
  };
};

/**
 * Renames one sprint, so the register seed's lookup by name no longer finds it.
 * @param name The sprint's loaded name.
 * @param newName The name to give it.
 * @returns The undo.
 */
export const renameInitiative = async (
  name: string,
  newName: string,
): Promise<StoreTamper> => {
  await UPDATE(STORE_TABLES.ENTITY.Initiative)
    .set({ name: newName })
    .where({ name });
  return {
    restore: async () => {
      await UPDATE(STORE_TABLES.ENTITY.Initiative)
        .set({ name })
        .where({ name: newName });
    },
  };
};

/**
 * Reads one Task of the load's one chain, every column.
 * @returns The Task row.
 */
const _readChainTask = async (): Promise<
  Record<string, unknown> & {
    ID: string;
    milestone_ID: string;
    status_code: string;
  }
> => {
  return (await SELECT.one.from(STORE_TABLES.ENTITY.Task)) as Record<
    string,
    unknown
  > & {
    ID: string;
    milestone_ID: string;
    status_code: string;
  };
};
