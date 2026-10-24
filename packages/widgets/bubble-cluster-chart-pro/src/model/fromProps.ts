import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle, numberFormatFromProps } from "@kendallchristy/chart-core";

import type {
    BubbleClusterChartProContainerProps,
    BubbleClusterChartProPreviewProps
} from "../../typings/BubbleClusterChartProProps";
import type { BubbleSettings } from "./types";

type SharedProps = Pick<
    BubbleClusterChartProPreviewProps,
    | "aggregation"
    | "drilldown"
    | "titleAlign"
    | "bubbleStyle"
    | "groupOutlines"
    | "labelContent"
    | "valueStyle"
    | "prefix"
    | "suffix"
    | "thousandsSeparator"
    | "compactNumbers"
    | "glow"
    | "legend"
    | "tooltip"
    | "figuresFont"
    | "animation"
    | "background"
>;

interface Values extends SharedProps {
    maxBubbles: number | null;
    bubbleGap: number | null;
    groupGap: number | null;
    decimals: number | null;
    percentDecimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    otherLabel?: string;
    topLabel?: string;
}

/** Bubble cluster settings from property values; shared by the widget and its design-mode preview. */
export function bubbleSettings(values: Values): BubbleSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
        glow: values.glow,
        legend: values.legend,
        tooltip: values.tooltip,
        figuresFont: values.figuresFont,
        animation: values.animation,
        animationDuration: values.animationDuration ?? 600,
        background: values.background
    };
    return {
        title: values.title || undefined,
        subtitle: values.subtitle || undefined,
        titleAlign: values.titleAlign,
        categories: {
            aggregation: values.aggregation,
            // Largest first: the legend and the screen-reader table read best that way, and it packs tightest.
            sort: "valueDesc",
            limit: Math.max(0, values.maxBubbles ?? 30),
            otherLabel: values.otherLabel || "Other",
            drilldown: values.drilldown,
            topLabel: values.topLabel || "All"
        },
        bubbleStyle: values.bubbleStyle,
        bubbleGap: values.bubbleGap ?? 3,
        groupGap: values.groupGap ?? 12,
        groupOutlines: values.groupOutlines,
        labelContent: values.labelContent,
        valueStyle: values.valueStyle,
        numberFormat: numberFormatFromProps(values),
        percentDecimals: values.percentDecimals ?? 0,
        style
    };
}

export function settingsFromProps(props: BubbleClusterChartProContainerProps): BubbleSettings {
    return bubbleSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        otherLabel: props.otherLabel?.value,
        topLabel: props.drillTopLabel?.value
    });
}
