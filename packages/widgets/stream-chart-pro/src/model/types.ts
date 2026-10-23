import type { CategoryAggregation, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

/** One source object: a moment, its group and a value. */
export interface StreamPoint {
    date: Date | number;
    group: string;
    value?: number;
}

export interface StreamSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    aggregation: CategoryAggregation;
    period: "none" | "day" | "week" | "month" | "quarter" | "year";
    /** The most streams to draw, Other included; 0 draws them all. */
    maxGroups: number;
    otherLabel: string;
    showLabels: boolean;
    showAxis: boolean;
    dateFormat?: string;
    numberFormat: NumberFormatOptions;
    style: ChartStyle;
}
