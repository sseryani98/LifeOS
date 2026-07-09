import { getText as resolveText } from "com/financialplanner/shared/util/i18n";
import { SYNC_STATUS } from "com/financialplanner/connectionmanager/model/constants";
import type ManagedObject from "sap/ui/base/ManagedObject";

/**
 * Connection-health display formatters. Referenced from the view via
 * core:require; each is invoked with `this` bound to the formatted control,
 * so i18n resolution flows through the shared getText helper.
 */
const formatter = {
  /**
   * Maps a sync status to a status icon.
   * @param status sync status code (success | error | never_synced)
   * @returns icon URI for the status
   */
  formatStatusIcon(status: string): string {
    return SYNC_STATUS.ICON[status] || SYNC_STATUS.ICON.never_synced;
  },

  /**
   * Maps a sync status to a semantic ObjectStatus state (colour).
   * @param status sync status code (success | error | never_synced)
   * @returns ObjectStatus state (Success | Error | None)
   */
  formatStatusState(status: string): string {
    return SYNC_STATUS.STATE[status] || SYNC_STATUS.STATE.never_synced;
  },

  /**
   * Maps a sync status to a localized ObjectStatus text.
   * @param status sync status code (success | error | never_synced)
   * @returns localized status label
   */
  formatStatusText(this: ManagedObject, status: string): string {
    return resolveText(this, SYNC_STATUS.TEXT_KEY[status] || "statusNeverSynced");
  },
};

export default formatter;
