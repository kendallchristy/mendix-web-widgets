import type { CategoryOptions, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

export interface PieSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    categories: CategoryOptions;
    shape: "donut" | "pie" | "halfDonut";
    /** Percent of the radius. */
    innerRadius: number;
    holeUnit: "percent" | "pixels";
    rose: "off" | "radius" | "area";
    cornerRadius: number;
    sliceGap: number;
    startAngle: number;
    labelPosition: "outside" | "inside" | "hidden";
    labelContent: "namePercent" | "nameValue" | "percent" | "value" | "name";
    centerContent: "total" | "none";
    centerCaption?: string;
    numberFormat: NumberFormatOptions;
    percentDecimals: number;
    style: ChartStyle;
}
