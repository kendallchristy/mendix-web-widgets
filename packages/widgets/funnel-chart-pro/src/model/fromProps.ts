import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle, numberFormatFromProps } from "@kendallchristy/chart-core";

import type { FunnelChartProContainerProps, FunnelChartProPreviewProps } from "../../typings/FunnelChartProProps";
import type { FunnelSettings } from "./types";

type SharedProps = Pick<
    FunnelChartProPreviewProps,
    | "aggregation"
    | "sortOrder"
    | "drilldown"
    | "titleAlign"
    | "orientation"
    | "align"
    | "colorMode"
    | "labelPosition"
    | "showName"
    | "showValue"
    | "conversion"
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
    neckWidth: number | null;
    stageGap: number | null;
    cornerRadius: number | null;
    decimals: number | null;
    percentDecimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    topLabel?: string;
}

/** Funnel settings from property values; shared by the widget and its design-mode preview. */
export function funnelSettings(values: Values): FunnelSettings {
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
            sort: values.sortOrder,
            limit: 0,
            drilldown: values.drilldown,
            topLabel: values.topLabel || "All"
        },
        orientation: values.orientation,
        align: values.align,
        neckWidth: values.neckWidth ?? 20,
        stageGap: values.stageGap ?? 4,
        cornerRadius: values.cornerRadius ?? 4,
        colorMode: values.colorMode,
        labelPosition: values.labelPosition,
        showName: values.showName,
        showValue: values.showValue,
        conversion: values.conversion,
        numberFormat: numberFormatFromProps(values),
        percentDecimals: values.percentDecimals ?? 0,
        style
    };
}

export function settingsFromProps(props: FunnelChartProContainerProps): FunnelSettings {
    return funnelSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        topLabel: props.drillTopLabel?.value
    });
}
