import type {
    Aggregation,
    ChartStyle,
    ClickAction,
    DateLevel,
    NumberFormatOptions,
    XValue
} from "@kendallchristy/chart-core";

export type { ClickAction };

export type SeriesKind = "line" | "area" | "bar" | "scatter" | "bubble";

/** One source object, read from Mendix. */
export interface InputPoint {
    x: XValue;
    y?: number;
    size?: number;
    /** Values of the series' Drilldown level 2 and 3 attributes. */
    drill: Array<string | undefined>;
    tooltip?: string;
    action?: ClickAction;
}

export interface SeriesInput {
    /** Stable across renders, for animation and React keys. */
    key: string;
    name: string;
    kind: SeriesKind;
    color?: string;
    stack?: string;
    yAxisSide: "left" | "right";
    aggregation: Aggregation;
    points: InputPoint[];
}

export interface DateDrill {
    kind: "date";
    from: DateLevel;
    to: DateLevel;
}

export interface CategoryDrill {
    kind: "category";
}

export type DrillSettings = DateDrill | CategoryDrill | { kind: "none" };

/** A step down a drilldown: a date range, or a category value at a level. */
export type DrillValue = { kind: "date"; start: number; end: number } | { kind: "category"; value: string };

export interface ChartSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    orientation: "vertical" | "horizontal";
    showXAxis: boolean;
    showYAxis: boolean;
    xAxisTitle?: string;
    yAxisTitle?: string;
    yAxisMin?: number;
    yAxisMax?: number;
    yAxisScale: "linear" | "log";
    numberFormat: NumberFormatOptions;
    xDateFormat?: string;
    drill: DrillSettings;
    topLabel: string;
    zoom: "none" | "slider" | "inside" | "both";
    highlightFrom?: string;
    highlightTo?: string;
    style: ChartStyle;
}
