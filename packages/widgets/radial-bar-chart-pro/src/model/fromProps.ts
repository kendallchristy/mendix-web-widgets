import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle, numberFormatFromProps, toNumber } from "@kendallchristy/chart-core";

import type {
    RadialBarChartProContainerProps,
    RadialBarChartProPreviewProps
} from "../../typings/RadialBarChartProProps";
import type { RadialBarSettings } from "./types";

type SharedProps = Pick<
    RadialBarChartProPreviewProps,
    | "aggregation"
    | "sortOrder"
    | "drilldown"
    | "titleAlign"
    | "track"
    | "roundCaps"
    | "showNames"
    | "valueLabel"
    | "labelStyle"
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
    maxRings: number | null;
    startAngle: number | null;
    sweep: number | null;
    ringWidth: number | null;
    innerRadius: number | null;
    decimals: number | null;
    percentDecimals: number | null;
    animationDuration: number | null;
    maxValue?: number;
    title?: string;
    subtitle?: string;
    topLabel?: string;
}

/** Radial bar settings from property values; shared by the widget and its design-mode preview. */
export function radialBarSettings(values: Values): RadialBarSettings {
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
            limit: Math.max(0, values.maxRings ?? 5),
            drilldown: values.drilldown,
            topLabel: values.topLabel || "All"
        },
        maxValue: values.maxValue,
        startAngle: values.startAngle ?? 90,
        sweep: values.sweep ?? 270,
        ringWidth: values.ringWidth ?? 62,
        innerRadius: values.innerRadius ?? 24,
        track: values.track,
        roundCaps: values.roundCaps,
        showNames: values.showNames,
        valueLabel: values.valueLabel,
        labelStyle: values.labelStyle,
        numberFormat: numberFormatFromProps(values),
        percentDecimals: values.percentDecimals ?? 0,
        style
    };
}

export function settingsFromProps(props: RadialBarChartProContainerProps): RadialBarSettings {
    return radialBarSettings({
        ...props,
        maxValue: toNumber(props.maxValue?.value),
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        topLabel: props.drillTopLabel?.value
    });
}
