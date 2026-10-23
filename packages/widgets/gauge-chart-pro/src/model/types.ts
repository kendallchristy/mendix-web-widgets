import type { ChartStyle, ClickAction, NumberFormatOptions } from "@kendallchristy/chart-core";

export interface GaugeBand {
    to: number;
    color: string;
    label?: string;
}

export interface GaugeSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    value?: number;
    min: number;
    max: number;
    target?: number;
    caption?: string;
    tooltip?: string;
    action?: ClickAction;
    shape: "arc" | "half" | "ring";
    indicator: "progress" | "needle" | "both";
    arcWidth: number;
    roundCaps: boolean;
    showTicks: boolean;
    showRange: boolean;
    showValue: boolean;
    valueSize: number;
    colorMode: "palette" | "band";
    bands: GaugeBand[];
    numberFormat: NumberFormatOptions;
    showAsPercent: boolean;
    percentDecimals: number;
    style: ChartStyle;
}
