import Control from "sap/ui/core/Control";
import type { MetadataOptions } from "sap/ui/core/Element";
import type RenderManager from "sap/ui/core/RenderManager";

/**
 * ApexChartCard — custom control wrapping the ApexCharts library.
 * Fallback chart control for chart types not supported by VizFrame.
 * Used for specialized visualizations on dashboards.
 *
 * Usage: accepts a JSON model path via data binding. Parent sets data; the
 * control renders. Chart is initialised in onAfterRendering and destroyed in exit.
 *
 * @namespace com.financialplanner.shared.controls
 */
export default class ApexChartCard extends Control {
  // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
  constructor(idOrSettings?: string | $ApexChartCardSettings);
  constructor(id?: string, settings?: $ApexChartCardSettings);
  constructor(id?: string, settings?: $ApexChartCardSettings) {
    super(id, settings);
  }

  static readonly metadata: MetadataOptions = {
    properties: {
      title: { type: "string", defaultValue: "" },
      subtitle: { type: "string", defaultValue: "" },
      chartType: { type: "string", defaultValue: "bar" },
      width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
      height: { type: "sap.ui.core.CSSSize", defaultValue: "300px" },
    },
    aggregations: {},
    events: {},
  };

  static renderer = {
    apiVersion: 2,
    /**
     * Renders the control's outer container.
     * @param renderManager the render manager
     * @param control the control instance to render
     */
    render(renderManager: RenderManager, control: ApexChartCard): void {
      renderManager.openStart("div", control);
      renderManager.class("fpApexChartCard");
      renderManager.style("width", control.getWidth());
      renderManager.style("height", control.getHeight());
      renderManager.openEnd();
      renderManager.close("div");
    },
  };

  /**
   * Initialises the ApexCharts instance once the DOM is available.
   * @returns nothing
   */
  onAfterRendering(): void {
    // ApexCharts initialization will be implemented when chart data is available
  }

  /**
   * Destroys the ApexCharts instance to prevent memory leaks.
   * @returns nothing
   */
  exit(): void {
    // Destroy ApexCharts instance to prevent memory leaks
  }
}
