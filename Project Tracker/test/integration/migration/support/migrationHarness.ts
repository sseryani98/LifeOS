import { MigrationService } from "../../../../srv/modules/migration/migrationService.js";
import type {
  ReconciledCount,
  ReconciliationReport,
} from "../../../../srv/modules/migration/types.js";
import { connectTrackerService } from "../../../shared/support/trackerHarness.js";

/** What a refused or failed conversion hands back to an assertion. */
export interface MigrationRefusal {
  status: number;
  key: string;
  keys: string[];
  args: unknown[];
  counts: ReconciledCount[];
}

/** The raw fields a rejection may carry, across the shapes the runtime builds. */
interface RawRejection {
  status?: unknown;
  code?: unknown;
  message?: unknown;
  args?: unknown;
  counts?: unknown;
  details?: { code?: unknown; message?: unknown; status?: unknown }[];
}

/**
 * Builds the migration over the connected service, the way the script does.
 * @returns The migration.
 */
export const buildMigration = async (): Promise<MigrationService> => {
  return new MigrationService(await connectTrackerService());
};

/**
 * Runs the hierarchy and story load.
 * @returns Whatever the load resolves with.
 */
export const runLoadHierarchy = async (): Promise<unknown> => {
  return (await buildMigration()).loadHierarchy();
};

/**
 * Runs the register seed.
 * @returns Whatever the seed resolves with.
 */
export const runSeedRegisters = async (): Promise<unknown> => {
  return (await buildMigration()).seedRegisters();
};

/**
 * Runs the reconciliation.
 * @returns The report a passing tie-out produces.
 */
export const runReconcile = async (): Promise<ReconciliationReport> => {
  return (await buildMigration()).reconcile();
};

/**
 * Arranges the legal intermediate state: the hierarchy loaded, the registers
 * not. A failure here is the arrangement's, never the assertion's, so it says so.
 * @returns Resolves once the hierarchy is loaded.
 */
export const arrangeHierarchyLoaded = async (): Promise<void> => {
  await _arrangeStep("loadHierarchy", runLoadHierarchy);
};

/**
 * Arranges the whole load: the hierarchy, then the registers.
 * @returns Resolves once both conversions have committed.
 */
export const arrangeFullLoad = async (): Promise<void> => {
  await _arrangeStep("loadHierarchy", runLoadHierarchy);
  await _arrangeStep("seedRegisters", runSeedRegisters);
};

/**
 * Awaits a conversion expecting it to refuse or fail, and unwraps the error so
 * the spec asserts on a status and a key. The key is the error's string code,
 * or its message when the code is the numeric status.
 * @param run The conversion to run.
 * @returns What the refusal carried.
 */
export const captureMigrationRefusal = async (
  run: () => Promise<unknown>,
): Promise<MigrationRefusal> => {
  try {
    await run();
  } catch (error: unknown) {
    if (_isDefectNotRefusal(error)) throw error;
    return _readRefusal(error as RawRejection);
  }
  throw new Error("Expected the conversion to refuse, but it resolved");
};

/**
 * Tells a crash from a refusal. A call on undefined must fail the spec as
 * itself, or "it rejected" would pass on a defect in the code.
 * @param error What the conversion threw.
 * @returns True when the error is a defect in the code, not a refusal by it.
 */
const _isDefectNotRefusal = (error: unknown): boolean => {
  return (
    error instanceof TypeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError
  );
};

/**
 * Runs one arrangement step, rethrowing its failure under the step's name.
 * @param name The conversion being arranged.
 * @param run The conversion to run.
 * @returns Resolves once the step committed.
 */
const _arrangeStep = async (
  name: string,
  run: () => Promise<unknown>,
): Promise<void> => {
  try {
    await run();
  } catch (error: unknown) {
    throw new Error(`Arranging ${name} failed: ${(error as Error).message}`);
  }
};

/**
 * Reads one error's own key, ignoring a numeric code that is really the status.
 * @param error The error, or one detail of a multiple-error rejection.
 * @returns The key.
 */
const _readKey = (error: { code?: unknown; message?: unknown }): string => {
  return typeof error.code === "string"
    ? error.code
    : String(error.message ?? "");
};

/**
 * Normalises a rejection into the fields an assertion reads. Every detail of a
 * multiple-error rejection contributes its key, so accumulation is assertable.
 * @param error The raw rejection.
 * @returns The refusal.
 */
const _readRefusal = (error: RawRejection): MigrationRefusal => {
  const keys =
    Array.isArray(error.details) && error.details.length > 0
      ? error.details.map(detail => _readKey(detail))
      : [_readKey(error)];
  const first = error.details?.[0] as RawRejection | undefined;
  let status = 0;
  if (typeof error.status === "number") status = error.status;
  else if (typeof error.code === "number") status = error.code;
  else if (typeof first?.status === "number") status = first.status;
  return {
    status,
    key: keys[0],
    keys,
    args: Array.isArray(error.args) ? error.args : [],
    counts: Array.isArray(error.counts)
      ? (error.counts as ReconciledCount[])
      : [],
  };
};
