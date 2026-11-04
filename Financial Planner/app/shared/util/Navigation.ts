import History from "sap/ui/core/routing/History";
import type Router from "sap/ui/core/routing/Router";

/**
 * The single back-navigation path, shared by BaseController and
 * BasePageController — they extend different UI5 bases, so neither can
 * inherit it from the other.
 */
export default class Navigation {
  /**
   * Navigates back in history, or to a fallback route when no history exists.
   * @param router the owning component's router
   * @param fallbackRoute route name to navigate to when there is no history
   */
  public static navigateBack(router: Router, fallbackRoute?: string): void {
    const previousHash = History.getInstance().getPreviousHash();

    if (previousHash !== undefined) {
      window.history.go(-1);
    } else if (fallbackRoute) {
      router.navTo(fallbackRoute, {}, true);
    }
  }
}
