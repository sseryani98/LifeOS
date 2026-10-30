import { NAV_CONFIG } from "com/financialplanner/shell/constants";
import type { NavEntry } from "com/financialplanner/shell/types";

/**
 * Lookups over the shell's nav map, in both directions: nav key → entry, and
 * URL hash fragment → nav key for deep-link restore.
 */
export default class NavConfig {
  /**
   * Resolves the nav entry registered under a side-nav key.
   * @param key the NavigationListItem key
   * @returns the entry, or undefined when the key is unregistered
   */
  public static getEntry(key: string): NavEntry | undefined {
    return NAV_CONFIG[key];
  }

  /**
   * Resolves the nav key whose entry deep-links to a hash fragment.
   * @param hash the hash fragment (e.g. "Issuers")
   * @returns the nav key (e.g. "MD_ISSUERS"), or undefined when none matches
   */
  public static getNavKeyForHash(hash: string): string | undefined {
    const hashToNavKey = Object.entries(NAV_CONFIG).reduce(
      (map: Record<string, string>, [key, conf]) => {
        map[conf.hash] = key;
        return map;
      },
      {},
    );
    return hashToNavKey[hash];
  }
}
