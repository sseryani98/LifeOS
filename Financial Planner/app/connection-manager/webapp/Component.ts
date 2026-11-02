import AppComponent from "sap/fe/core/AppComponent";

/**
 * SimpleFIN Connection Manager — an FPM custom page, so the root must be an FE
 * AppComponent: it supplies the routing config (controlAggregation) and the
 * owner the sap.fe.macros building blocks resolve, and starts the router itself.
 *
 * @namespace com.financialplanner.connectionmanager
 */
export default class Component extends AppComponent {
  public static metadata = {
    manifest: "json",
  };
}
