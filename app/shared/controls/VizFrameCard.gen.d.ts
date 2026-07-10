import { CSSSize } from "sap/ui/core/library";
import { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import { $ControlSettings } from "sap/ui/core/Control";

declare module "./VizFrameCard" {

    /**
     * Interface defining the settings object used in constructor calls
     */
    interface $VizFrameCardSettings extends $ControlSettings {
        title?: string | PropertyBindingInfo;
        subtitle?: string | PropertyBindingInfo;
        chartType?: string | PropertyBindingInfo;
        width?: CSSSize | PropertyBindingInfo | `{${string}}`;
        height?: CSSSize | PropertyBindingInfo | `{${string}}`;
    }

    export default interface VizFrameCard {

        /**
         * Gets current value of property "title".
         *
         * Default value is: ""
         * @returns Value of property "title"
         */
        getTitle(): string;

        /**
         * Sets a new value for property "title".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [title=""] New value for property "title"
         * @returns Reference to "this" in order to allow method chaining
         */
        setTitle(title: string): this;

        /**
         * Gets current value of property "subtitle".
         *
         * Default value is: ""
         * @returns Value of property "subtitle"
         */
        getSubtitle(): string;

        /**
         * Sets a new value for property "subtitle".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: ""
         * @param [subtitle=""] New value for property "subtitle"
         * @returns Reference to "this" in order to allow method chaining
         */
        setSubtitle(subtitle: string): this;

        /**
         * Gets current value of property "chartType".
         *
         * Default value is: "column"
         * @returns Value of property "chartType"
         */
        getChartType(): string;

        /**
         * Sets a new value for property "chartType".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: "column"
         * @param [chartType="column"] New value for property "chartType"
         * @returns Reference to "this" in order to allow method chaining
         */
        setChartType(chartType: string): this;

        /**
         * Gets current value of property "width".
         *
         * Default value is: "100%"
         * @returns Value of property "width"
         */
        getWidth(): CSSSize;

        /**
         * Sets a new value for property "width".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: "100%"
         * @param [width="100%"] New value for property "width"
         * @returns Reference to "this" in order to allow method chaining
         */
        setWidth(width: CSSSize): this;

        /**
         * Gets current value of property "height".
         *
         * Default value is: "300px"
         * @returns Value of property "height"
         */
        getHeight(): CSSSize;

        /**
         * Sets a new value for property "height".
         *
         * When called with a value of "null" or "undefined", the default value of the property will be restored.
         *
         * Default value is: "300px"
         * @param [height="300px"] New value for property "height"
         * @returns Reference to "this" in order to allow method chaining
         */
        setHeight(height: CSSSize): this;
    }
}
