import type { CategoryOptions, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

export interface RadialBarSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    categories: CategoryOptions;
    /** The value of a full ring; the largest value when undefined. */
    maxValue?: number;
    startAngle: number;
    /** Degrees a full ring covers. */
    sweep: number;
    /** Percent of the space each ring gets. */
    ringWidth: number;
    /** Percent of the radius left empty in the middle. */
    innerRadius: number;
    track: boolean;
    roundCaps: boolean;
    showNames: boolean;
    valueLabel: "value" | "percent" | "off";
    labelStyle: "plain" | "darkPill" | "lightPill";
    numberFormat: NumberFormatOptions;
    percentDecimals: number;
    style: ChartStyle;
}
