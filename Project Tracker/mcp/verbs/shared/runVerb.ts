import { Envelope } from "./envelope.js";
import { StageGuards } from "./stageGuards.js";
import { TrackerGateway } from "./trackerGateway.js";
import type { VerbContext, VerbOutcome, VerbResult } from "./types.js";
import { WriteQueue } from "./writeQueue.js";

/** The two ways a verb body runs: a concurrent read, or a serialized write. */
export class VerbRunner {
  /**
   * Runs a read verb. Reads are concurrent and open no transaction, and they
   * write no activity event.
   * @param ctx The connected service and the calling agent's identity.
   * @param work The verb body, given a gateway bound to the service.
   * @returns The success or failure envelope.
   */
  static async runReadVerb(
    ctx: VerbContext,
    work: (gateway: TrackerGateway) => Promise<VerbOutcome>,
  ): Promise<VerbResult> {
    // A plain stamp, not createTimestamp(): the monotonic counter exists to
    // order written activity rows, and a read must not advance the write clock.
    const timestamp = new Date().toISOString();
    try {
      StageGuards.assertCallerIdentity(ctx.actor);
      const outcome = await work(new TrackerGateway(ctx.service));
      return Envelope.buildSuccess(
        timestamp,
        outcome.nextAction ?? null,
        outcome.warnings ?? [],
        outcome.extra ?? {},
      );
    } catch (error: unknown) {
      return Envelope.toFailure(error, timestamp);
    }
  }

  /**
   * Runs a write verb: serialized against every other write, inside one
   * transaction opened under the caller's own identity, so the activity event and
   * the change it describes commit or roll back together. Every write records
   * its caller on an activity row, so an unseeded caller is refused up front.
   * @param ctx The connected service and the calling agent's identity.
   * @param work The verb body, given a gateway bound to the transaction and the
   *   server timestamp the call was stamped with.
   * @returns The success or failure envelope.
   */
  static async runWriteVerb(
    ctx: VerbContext,
    work: (gateway: TrackerGateway, timestamp: string) => Promise<VerbOutcome>,
  ): Promise<VerbResult> {
    return WriteQueue.runSerialized(async () => {
      const timestamp = WriteQueue.createTimestamp();
      try {
        const actor = StageGuards.assertCallerIdentity(ctx.actor);
        const outcome = (await ctx.service.tx({ user: actor }, async transaction => {
          const gateway = new TrackerGateway(transaction);
          await StageGuards.assertKnownActor(gateway, actor);
          return work(gateway, timestamp);
        })) as VerbOutcome;
        return Envelope.buildSuccess(
          timestamp,
          outcome.nextAction ?? null,
          outcome.warnings ?? [],
          outcome.extra ?? {},
        );
      } catch (error: unknown) {
        return Envelope.toFailure(error, timestamp);
      }
    });
  }
}
