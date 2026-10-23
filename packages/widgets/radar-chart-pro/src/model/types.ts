import type { CategoryAggregation, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

/** One source object: a measure and its value. */
export interface RadarPoint {
    indicator: string;
    value?: number;
}

/** One shape on the chart. */
export interface RadarSeries {
    name: string;
    color?: string;
    aggregation: CategoryAggregation;
    points: RadarPoint[];
}

export interface RadarSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    /** The value at the outer ring for every measure; empty rounds up each measure's largest value. */
    maxValue?: number;
    indicatorOrder: "data" | "name";
    shape: "polygon" | "circle";
    rings: number;
    areaFill: "solid" | "none";
    lineWidth: number;
    markers: "always" | "hover" | "never";
    valueLabels: boolean;
    labelStyle: "plain" | "darkPill" | "lightPill";
    numberFormat: NumberFormatOptions;
    style: ChartStyle;
}
