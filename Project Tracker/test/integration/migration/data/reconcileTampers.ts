import { EXPECTED_CHAIN, MIGRATION_KEYS } from "./financialPlannerSnapshot.js";

/** An agent's identity, so a row it created is plainly not the migration's. */
export const FOREIGN_CREATOR = "implementer";

/**
 * The namespace every reconciliation failure is keyed under. The spec names a
 * key for counts, chains and provenance only; the type check's key is unnamed.
 */
export const RECONCILE_KEY_PATTERN = /^cnv\.reconcile\./;

/** The keys the other assertions fail under, so the type check is seen failing as itself. */
export const KEYS_OF_OTHER_ASSERTIONS = [
  MIGRATION_KEYS.COUNT_MISMATCH,
  MIGRATION_KEYS.CHAIN_MISMATCH,
  MIGRATION_KEYS.PROVENANCE_MISMATCH,
];

/** A Task status no freshly migrated chain may hold. */
export const STARTED_TASK_STATUS = "inProgress";

/** Each UI-only step, at the chain level the library defines it on. */
export const UI_ONLY_STEP_TAMPERS = [
  { entity: "Task", stepCode: EXPECTED_CHAIN.ABSENT_STEP_CODES[0] },
  { entity: "Subtask", stepCode: EXPECTED_CHAIN.ABSENT_STEP_CODES[1] },
] as const;

/** One entity from each layer the load writes: hierarchy, chain and register. */
export const PROVENANCE_TAMPER_ENTITIES = [
  "Initiative",
  "Subtask",
  "Defect",
] as const;

/** A Subtask status no freshly migrated chain may hold; Subtasks have no in-progress state. */
export const COMPLETED_SUBTASK_STATUS = "complete";

/** A sprint name the register seed's sprint lookup cannot match to the ledgers. */
export const UNRESOLVABLE_SPRINT_NAME = "W1-S2 — Renamed After The Load";
