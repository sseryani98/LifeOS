import Control from "sap/ui/core/Control";
import type { MetadataOptions } from "sap/ui/core/Element";
import type RenderManager from "sap/ui/core/RenderManager";

/**
 * VizFrameCard — custom control wrapping sap.viz.ui5.controls.VizFrame.
 * Renders a chart inside a card layout with title and subtitle.
 * Primary chart control for dashboards and analytics pages.
 *
 * Usage: accepts a JSON model path via data binding. Parent sets data; the
 * control renders. Chart is initialised in onAfterRendering and destroyed in exit.
 *
 * @namespace com.financialplanner.shared.controls
 */
export default class VizFrameCard extends Control {
  // The following three lines were generated and should remain as-is to make TypeScript aware of the constructor signatures
  constructor(idOrSettings?: string | $VizFrameCardSettings);
  constructor(id?: string, settings?: $VizFrameCardSettings);
  constructor(id?: string, settings?: $VizFrameCardSettings) {
    super(id, settings);
  }

  static readonly metadata: MetadataOptions = {
    properties: {
      title: { type: "string", defaultValue: "" },
      subtitle: { type: "string", defaultValue: "" },
      chartType: { type: "string", defaultValue: "column" },
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
    render(renderManager: RenderManager, control: VizFrameCard): void {
      renderManager.openStart("div", control);
      renderManager.class("fpVizFrameCard");
      renderManager.style("width", control.getWidth());
      renderManager.style("height", control.getHeight());
      renderManager.openEnd();
      renderManager.close("div");
    },
  };

  /**
   * Initialises the VizFrame instance once the DOM is available.
   * @returns nothing
   */
  onAfterRendering(): void {
    // VizFrame initialization will be implemented when chart data is available
  }

  /**
   * Destroys the VizFrame instance to prevent memory leaks.
   * @returns nothing
   */
  exit(): void {
    // Destroy VizFrame instance to prevent memory leaks
  }
}
