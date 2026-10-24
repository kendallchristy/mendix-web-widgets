import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle, numberFormatFromProps } from "@kendallchristy/chart-core";

import type { PieChartProContainerProps, PieChartProPreviewProps } from "../../typings/PieChartProProps";
import type { PieSettings } from "./types";

type SharedProps = Pick<
    PieChartProPreviewProps,
    | "aggregation"
    | "sortOrder"
    | "drilldown"
    | "titleAlign"
    | "shape"
    | "holeUnit"
    | "rose"
    | "labelPosition"
    | "labelContent"
    | "centerContent"
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
    maxSlices: number | null;
    innerRadius: number | null;
    cornerRadius: number | null;
    sliceGap: number | null;
    startAngle: number | null;
    decimals: number | null;
    percentDecimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    otherLabel?: string;
    topLabel?: string;
    centerCaption?: string;
}

/** Pie settings from property values; shared by the widget and its design-mode preview. */
export function pieSettings(values: Values): PieSettings {
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
            limit: Math.max(0, values.maxSlices ?? 6),
            otherLabel: values.otherLabel || "Other",
            drilldown: values.drilldown,
            topLabel: values.topLabel || "All"
        },
        shape: values.shape,
        innerRadius: values.innerRadius ?? 62,
        holeUnit: values.holeUnit,
        rose: values.rose,
        cornerRadius: values.cornerRadius ?? 4,
        sliceGap: values.sliceGap ?? 2,
        startAngle: values.startAngle ?? 90,
        labelPosition: values.labelPosition,
        labelContent: values.labelContent,
        centerContent: values.centerContent,
        centerCaption: values.centerCaption || undefined,
        numberFormat: numberFormatFromProps(values),
        percentDecimals: values.percentDecimals ?? 0,
        style
    };
}

export function settingsFromProps(props: PieChartProContainerProps): PieSettings {
    return pieSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        otherLabel: props.otherLabel?.value,
        topLabel: props.drillTopLabel?.value,
        centerCaption: props.centerCaption?.value
    });
}
