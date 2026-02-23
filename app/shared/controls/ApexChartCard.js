sap.ui.define([
  "sap/ui/core/Control"
], (Control) => {
  "use strict";

  /**
   * ApexChartCard — custom control wrapping ApexCharts library.
   * Fallback chart control for chart types not supported by VizFrame.
   * Used for specialized visualizations on dashboards.
   *
   * Usage:
   *   Accepts JSON model path via data binding. Parent sets data; control renders.
   *   Initializes chart in onAfterRendering. Destroys chart instance in exit.
   */
  return Control.extend("com.financialplanner.shared.controls.ApexChartCard", {
    metadata: {
      properties: {
        /** Card title displayed above the chart. */
        title: { type: "string", defaultValue: "" },
        /** Card subtitle displayed below the title. */
        subtitle: { type: "string", defaultValue: "" },
        /** ApexCharts chart type (e.g., "bar", "line", "radialBar", "treemap"). */
        chartType: { type: "string", defaultValue: "bar" },
        /** Width of the card. */
        width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
        /** Height of the card. */
        height: { type: "sap.ui.core.CSSSize", defaultValue: "300px" }
      },
      aggregations: {},
      events: {}
    },

    renderer(oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.class("fpApexChartCard");
      oRm.style("width", oControl.getWidth());
      oRm.style("height", oControl.getHeight());
      oRm.openEnd();
      oRm.close("div");
    },

    onAfterRendering() {
      // ApexCharts initialization will be implemented when chart data is available
    },

    exit() {
      // Destroy ApexCharts instance to prevent memory leaks
    }
  });
});
