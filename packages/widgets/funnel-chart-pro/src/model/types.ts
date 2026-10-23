import type { CategoryOptions, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

export interface FunnelSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    categories: CategoryOptions;
    orientation: "vertical" | "horizontal";
    align: "center" | "start";
    /** Percent of the widest stage that the smallest stage still gets. */
    neckWidth: number;
    stageGap: number;
    cornerRadius: number;
    colorMode: "shades" | "palette";
    labelPosition: "inside" | "outside" | "hidden";
    showName: boolean;
    showValue: boolean;
    conversion: "first" | "previous" | "off";
    numberFormat: NumberFormatOptions;
    percentDecimals: number;
    style: ChartStyle;
}
