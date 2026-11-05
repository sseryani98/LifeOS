import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import { VIRTUAL_STATE } from "com/financialplanner/transactions/constants";
import type {
  LocalAnnotationModelOwner,
  VirtualStateNode,
} from "com/financialplanner/transactions/model/types";

/**
 * Carries FE's computed header states (criticality) from the record the object
 * page leaves to the one it opens. FE 1.136 re-computes one only when its raw
 * value changes, so two records with one criticality left the second with none.
 */
export default class VirtualStateCarrier {
  private static readonly _lastBound = new WeakMap<object, string>();

  /**
   * Fills each computed state the next record lacks with the last bound record's;
   * one FE does compute is never overwritten, and FE corrects a copy that differs.
   * @param next the context the object page is about to bind
   */
  public copyLastRecordStates(next: Context | null | undefined): void {
    if (!next) {
      return;
    }
    const previousPath = VirtualStateCarrier._lastBound.get(next.getModel());
    VirtualStateCarrier._lastBound.set(next.getModel(), next.getPath());
    if (!previousPath || previousPath === next.getPath()) {
      return;
    }
    const states = (
      next.getModel() as unknown as LocalAnnotationModelOwner
    ).getLocalAnnotationModel();
    const source = states.getProperty(previousPath) as
      VirtualStateNode | undefined;
    if (source) {
      this._copyMissingStates(states, source, next.getPath());
    }
  }

  /**
   * Copies every computed-state leaf of one record's node into another's, where absent.
   * @param states FE's local annotation model
   * @param source the previous record's node
   * @param targetPath the next record's node path
   */
  private _copyMissingStates(
    states: JSONModel,
    source: VirtualStateNode,
    targetPath: string,
  ): void {
    if (states.getProperty(targetPath) === undefined) {
      states.setProperty(targetPath, {});
    }
    for (const [key, value] of Object.entries(source)) {
      const path = `${targetPath}/${key}`;
      if (key.includes(VIRTUAL_STATE.MARKER)) {
        if (states.getProperty(path) === undefined) {
          states.setProperty(path, value);
        }
      } else if (value !== null && typeof value === "object") {
        this._copyMissingStates(states, value as VirtualStateNode, path);
      }
    }
  }
}
