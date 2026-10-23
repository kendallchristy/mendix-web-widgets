import type { ChartStyle, ClickAction, NumberFormatOptions } from "@kendallchristy/chart-core";

/** One period, such as a trading day. */
export interface Candle {
    /** A date, or text for an evenly spaced axis of named periods. */
    date: Date | string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    tooltip?: string;
    action?: ClickAction;
}

export interface CandlestickSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    candleStyle: "candles" | "ohlc";
    risingColor?: string;
    fallingColor?: string;
    /** Periods to average the close over, one line each. */
    movingAverages: number[];
    /** Percent of the chart the volume bars take. */
    volumeHeight: number;
    showXAxis: boolean;
    showYAxis: boolean;
    yAxisTitle?: string;
    dateFormat?: string;
    zoom: "none" | "inside" | "slider" | "both";
    numberFormat: NumberFormatOptions;
    style: ChartStyle;
}
