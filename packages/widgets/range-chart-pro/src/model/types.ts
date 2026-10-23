import type { ChartStyle, ClickAction, NumberFormatOptions } from "@kendallchristy/chart-core";

/** One source object: a range from low to high in a category. */
export interface RangePoint {
    category: string;
    low: number | Date;
    high: number | Date;
    /** The Group by value, which splits the ranges into series. */
    group?: string;
    tooltip?: string;
    action?: ClickAction;
}

export interface RangeSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    sortOrder: "data" | "name" | "start" | "span";
    rangeStyle: "bars" | "dumbbell";
    orientation: "horizontal" | "vertical";
    /** Percent of each category's band the ranges take. */
    barWidth: number;
    cornerRadius: number;
    dotSize: number;
    valueLabels: "off" | "ends" | "span";
    labelStyle: "plain" | "darkPill" | "lightPill";
    showCategoryAxis: boolean;
    showValueAxis: boolean;
    valueAxisTitle?: string;
    dateFormat?: string;
    numberFormat: NumberFormatOptions;
    style: ChartStyle;
}
