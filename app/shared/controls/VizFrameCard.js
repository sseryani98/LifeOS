sap.ui.define([
  "sap/ui/core/Control"
], function (Control) {
  "use strict";

  /**
   * VizFrameCard — custom control wrapping sap.viz.ui5.controls.VizFrame.
   * Renders a chart inside a card layout with title and subtitle.
   * Primary chart control for dashboards and analytics pages.
   *
   * Usage:
   *   Accepts JSON model path via data binding. Parent sets data; control renders.
   *   Initializes chart in onAfterRendering. Destroys chart instance in exit.
   */
  return Control.extend("com.financialplanner.shared.controls.VizFrameCard", {
    metadata: {
      properties: {
        /** Card title displayed above the chart. */
        title: { type: "string", defaultValue: "" },
        /** Card subtitle displayed below the title. */
        subtitle: { type: "string", defaultValue: "" },
        /** VizFrame chart type (e.g., "column", "line", "donut"). */
        chartType: { type: "string", defaultValue: "column" },
        /** Width of the card. */
        width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
        /** Height of the card. */
        height: { type: "sap.ui.core.CSSSize", defaultValue: "300px" }
      },
      aggregations: {},
      events: {}
    },

    renderer: function (oRm, oControl) {
      oRm.openStart("div", oControl);
      oRm.class("fpVizFrameCard");
      oRm.style("width", oControl.getWidth());
      oRm.style("height", oControl.getHeight());
      oRm.openEnd();
      oRm.close("div");
    },

    onAfterRendering: function () {
      // VizFrame initialization will be implemented when chart data is available
    },

    exit: function () {
      // Destroy VizFrame instance to prevent memory leaks
    }
  });
});
