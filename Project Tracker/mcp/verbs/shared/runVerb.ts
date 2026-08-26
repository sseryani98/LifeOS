import { succeed, toFailure } from "./envelope.js";
import { assertCallerIdentity } from "./stageGuards.js";
import { TrackerGateway } from "./trackerGateway.js";
import type {
  NextAction,
  VerbContext,
  VerbResult,
  VerbWarning,
} from "./types.js";
import { nextTimestamp, runSerialized } from "./writeQueue.js";

/** What a verb body hands back for the envelope to carry. */
interface VerbOutcome {
  nextAction?: NextAction | null;
  warnings?: VerbWarning[];
  extra?: Record<string, unknown>;
}

/**
 * Runs a read verb. Reads are concurrent and open no transaction, and they
 * write no activity event.
 * @param ctx The connected service and the calling agent's identity.
 * @param work The verb body, given a gateway bound to the service.
 * @returns The success or failure envelope.
 */
export async function runReadVerb(
  ctx: VerbContext,
  work: (gateway: TrackerGateway) => Promise<VerbOutcome>,
): Promise<VerbResult> {
  // A plain stamp, not nextTimestamp(): the monotonic counter exists to order
  // written activity rows, and a read must not advance the write clock.
  const timestamp = new Date().toISOString();
  try {
    assertCallerIdentity(ctx.actor);
    const outcome = await work(new TrackerGateway(ctx.service));
    return succeed(
      timestamp,
      outcome.nextAction ?? null,
      outcome.warnings ?? [],
      outcome.extra ?? {},
    );
  } catch (error: unknown) {
    return toFailure(error, timestamp);
  }
}

/**
 * Runs a write verb: serialized against every other write, inside one
 * transaction opened under the caller's own identity, so the activity event and
 * the change it describes commit or roll back together.
 * @param ctx The connected service and the calling agent's identity.
 * @param work The verb body, given a gateway bound to the transaction and the
 *   server timestamp the call was stamped with.
 * @returns The success or failure envelope.
 */
export async function runWriteVerb(
  ctx: VerbContext,
  work: (gateway: TrackerGateway, timestamp: string) => Promise<VerbOutcome>,
): Promise<VerbResult> {
  return runSerialized(async () => {
    const timestamp = nextTimestamp();
    try {
      const actor = assertCallerIdentity(ctx.actor);
      const outcome = (await ctx.service.tx({ user: actor }, async tx =>
        work(new TrackerGateway(tx), timestamp),
      )) as VerbOutcome;
      return succeed(
        timestamp,
        outcome.nextAction ?? null,
        outcome.warnings ?? [],
        outcome.extra ?? {},
      );
    } catch (error: unknown) {
      return toFailure(error, timestamp);
    }
  });
}
