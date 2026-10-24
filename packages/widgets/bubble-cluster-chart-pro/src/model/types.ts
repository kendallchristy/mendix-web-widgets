import type { CategoryOptions, ChartStyle, NumberFormatOptions } from "@kendallchristy/chart-core";

export interface BubbleSettings {
    title?: string;
    subtitle?: string;
    titleAlign: "left" | "center";
    categories: CategoryOptions;
    bubbleStyle: "gradient" | "solid" | "tinted";
    /** Pixels between bubbles. */
    bubbleGap: number;
    /** Pixels between groups. */
    groupGap: number;
    groupOutlines: boolean;
    labelContent: "nameValue" | "namePercent" | "name" | "value" | "percent" | "hidden";
    valueStyle: "pill" | "plain";
    numberFormat: NumberFormatOptions;
    percentDecimals: number;
    style: ChartStyle;
}
