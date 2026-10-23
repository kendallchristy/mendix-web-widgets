import type {
    CategoryAggregation,
    ChartStyle,
    ClickAction,
    NumberFormatOptions,
    XValue
} from "@kendallchristy/chart-core";

/** One source object: a cell position and a value. */
export interface HeatPoint {
    x: XValue;
    y?: XValue;
    value?: number;
    tooltip?: string;
    action?: ClickAction;
}

export interface HeatmapSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    layout: "grid" | "calendar";
    aggregation: CategoryAggregation;
    cellLabels: boolean;
    cellGap: number;
    cornerRadius: number;
    dateFormat?: string;
    colorScale: "hyper" | "palette" | "custom";
    customScale?: string;
    reverseScale: boolean;
    scaleMin?: number;
    scaleMax?: number;
    showScale: boolean;
    numberFormat: NumberFormatOptions;
    style: ChartStyle;
}
