import I18n from "com/lifeos/shared/I18n";
import {
  STEP_KIND,
  TASK_STATUS,
  TIER,
} from "com/lifeos/projecttracker/projectview/model/constants";
import type ManagedObject from "sap/ui/base/ManagedObject";

/**
 * Code-to-display formatters the next-action card and the queue share, so a
 * code renders the same in both. Referenced from the view via core:require;
 * the text formatters need the control for the i18n lookup, so the view must
 * reference them as `formatter.formatXxxText.bind($control)`.
 */
export default {
  /**
   * Maps a step kind to its icon; only Recommended carries one.
   * @param kind The step kind code.
   * @returns The icon URI, or "" for none.
   */
  formatKindIcon(kind: string): string {
    return STEP_KIND.ICON[kind] ?? "";
  },

  /**
   * Maps a step kind to its value state; only Recommended is highlighted.
   * @param kind The step kind code.
   * @returns The value state.
   */
  formatKindState(kind: string): string {
    return STEP_KIND.STATE[kind] ?? "None";
  },

  /**
   * Maps a step kind to its label, reading an unknown kind as Required.
   * @param kind The step kind code.
   * @returns The label.
   */
  formatKindText(this: ManagedObject, kind: string): string {
    return I18n.getText(this, STEP_KIND.TEXT_KEY[kind] ?? "kindRequired");
  },

  /**
   * Names a stage as the queue's Stage column does, keeping its code beside the
   * name so the card still carries it.
   * @param name The stage's name.
   * @param code The stage's code.
   * @returns The label.
   */
  formatStageText(this: ManagedObject, name: string, code: string): string {
    return I18n.getText(this, "nextActionStageText", [name, code]);
  },

  /**
   * Maps an open stage's status to its icon, reading anything else as Not Started.
   * @param status The stage status code.
   * @returns The icon URI.
   */
  formatStatusIcon(status: string): string {
    return TASK_STATUS.ICON[status] ?? TASK_STATUS.ICON.notStarted;
  },

  /**
   * Maps an open stage's status to its value state; only In Progress is highlighted.
   * @param status The stage status code.
   * @returns The value state.
   */
  formatStatusState(status: string): string {
    return TASK_STATUS.STATE[status] ?? "None";
  },

  /**
   * Maps an open stage's status to its label, reading anything else as Not Started.
   * @param status The stage status code.
   * @returns The label.
   */
  formatStatusText(this: ManagedObject, status: string): string {
    return I18n.getText(
      this,
      TASK_STATUS.TEXT_KEY[status] ?? TASK_STATUS.TEXT_KEY.notStarted,
    );
  },

  /**
   * Maps a tier to the reason it names, reading an unknown tier as optional work.
   * @param tier The story's tier.
   * @returns The label.
   */
  formatTierText(this: ManagedObject, tier: number | null): string {
    return I18n.getText(
      this,
      TIER.TEXT_KEY[String(tier)] ?? "tierOptionalOnly",
    );
  },
};
