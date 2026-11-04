/** Database-level entity names of the seeded reference data. */
const TABLE = {
  METHODOLOGY: "com.lifeos.projecttracker.Methodology",
  METHODOLOGY_STEP: "com.lifeos.projecttracker.MethodologyStep",
  ACTOR: "com.lifeos.projecttracker.Actor",
} as const;

/** The namespace every code list lives under. */
const NAMESPACE = "com.lifeos.projecttracker";

/** One library step as the seed assertions read it. */
export interface LibraryStep {
  code: string;
  name: string;
  description: string;
  kind_code: string;
  position: number;
  conditional: string | null;
  requiresHuman: boolean;
  driver: string;
  parent_code: string | null;
  methodology_code: string;
}

/** One code-list row; only Actor carries a kind. */
export interface CodeListRow {
  code: string;
  name: string;
  kind_code?: string;
}

/**
 * Builds the code a step's name kebab-cases to: lowercased, with every run of
 * spaces a single hyphen.
 * @param name The step's display name.
 * @returns The code that name implies.
 */
export const buildKebabCode = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
};

/**
 * Reads every methodology the store holds.
 * @returns The methodology rows.
 */
export const readMethodologies = async (): Promise<{ code: string; name: string }[]> => {
  return (await SELECT.from(TABLE.METHODOLOGY).columns("code", "name")) as {
    code: string;
    name: string;
  }[];
};

/**
 * Reads every library step, stages and workflow steps alike, in position order
 * within each parent.
 * @returns The step rows.
 */
export const readLibrarySteps = async (): Promise<LibraryStep[]> => {
  const rows = (await SELECT.from(TABLE.METHODOLOGY_STEP).columns(
    "code",
    "name",
    "description",
    "kind_code",
    "position",
    "conditional",
    "requiresHuman",
    "driver",
    "parent_code",
    "methodology_code",
  )) as LibraryStep[];
  return rows.sort((left, right) => left.position - right.position);
};

/**
 * Reads every row of one code list.
 * @param list The code-list entity name, such as ActorKind.
 * @returns The rows, sorted by code.
 */
export const readCodeList = async (list: string): Promise<CodeListRow[]> => {
  const rows = (await SELECT.from(`${NAMESPACE}.${list}`)) as CodeListRow[];
  return rows.sort((left, right) => left.code.localeCompare(right.code));
};

/**
 * Rewrites one seeded step's driver, the way an operator edits the seed.
 * @param code The step to edit.
 * @param driver The driver string it carries afterwards.
 * @returns Resolves once the row carries it.
 */
export const setStepDriver = async (code: string, driver: string): Promise<void> => {
  await UPDATE(TABLE.METHODOLOGY_STEP).set({ driver }).where({ code });
};

/**
 * Rewrites one seeded step's kind.
 * @param code The step to edit.
 * @param kind The kind code it carries afterwards.
 * @returns Resolves once the row carries it.
 */
export const setStepKind = async (code: string, kind: string): Promise<void> => {
  await UPDATE(TABLE.METHODOLOGY_STEP).set({ kind_code: kind }).where({ code });
};

/**
 * Moves one seeded step to another library position.
 * @param code The step to edit.
 * @param position The position it carries afterwards.
 * @returns Resolves once the row carries it.
 */
export const setStepPosition = async (code: string, position: number): Promise<void> => {
  await UPDATE(TABLE.METHODOLOGY_STEP).set({ position }).where({ code });
};

/**
 * Rewrites whether one seeded step may be closed only by a human.
 * @param code The step to edit.
 * @param requiresHuman The flag it carries afterwards.
 * @returns Resolves once the row carries it.
 */
export const setStepRequiresHuman = async (
  code: string,
  requiresHuman: boolean,
): Promise<void> => {
  await UPDATE(TABLE.METHODOLOGY_STEP).set({ requiresHuman }).where({ code });
};

/**
 * Adds one step to the library after chains already exist.
 * @param step The step columns to write.
 * @returns Resolves once the row exists.
 */
export const addLibraryStep = async (step: Record<string, unknown>): Promise<void> => {
  await INSERT.into(TABLE.METHODOLOGY_STEP).entries(step);
};

/**
 * Removes a step a suite added, so the next spec reads the seed as deployed.
 * @param code The added step's code.
 * @returns Resolves once the row is gone.
 */
export const removeLibraryStep = async (code: string): Promise<void> => {
  await DELETE.from(TABLE.METHODOLOGY_STEP).where({ code });
};

/**
 * Adds one identity to the actor code list.
 * @param actor The actor row to write.
 * @returns Resolves once the row exists.
 */
export const seedActor = async (actor: CodeListRow): Promise<void> => {
  await INSERT.into(TABLE.ACTOR).entries({ ...actor });
};

/**
 * Removes an identity a suite added. Its activity rows must already be gone.
 * @param code The added actor's code.
 * @returns Resolves once the row is gone.
 */
export const removeActor = async (code: string): Promise<void> => {
  await DELETE.from(TABLE.ACTOR).where({ code });
};
