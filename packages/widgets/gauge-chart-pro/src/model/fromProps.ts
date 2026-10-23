import type { ChartStyle, ClickAction } from "@kendallchristy/chart-core";
import { defaultChartStyle, numberFormatFromProps, toNumber } from "@kendallchristy/chart-core";

import type { GaugeChartProContainerProps, GaugeChartProPreviewProps } from "../../typings/GaugeChartProProps";
import type { GaugeBand, GaugeSettings } from "./types";

type SharedProps = Pick<
    GaugeChartProPreviewProps,
    | "titleAlign"
    | "shape"
    | "indicator"
    | "roundCaps"
    | "showTicks"
    | "showRange"
    | "showValue"
    | "colorMode"
    | "prefix"
    | "suffix"
    | "thousandsSeparator"
    | "compactNumbers"
    | "showAsPercent"
    | "glow"
    | "tooltip"
    | "figuresFont"
    | "animation"
    | "background"
>;

interface Values extends SharedProps {
    arcWidth: number | null;
    valueSize: number | null;
    decimals: number | null;
    percentDecimals: number | null;
    animationDuration: number | null;
    value?: number;
    min?: number;
    max?: number;
    target?: number;
    bands: GaugeBand[];
    title?: string;
    subtitle?: string;
    caption?: string;
    tooltipText?: string;
    action?: ClickAction;
}

/** Gauge settings from property values; shared by the widget and its design-mode preview. */
export function gaugeSettings(values: Values): GaugeSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
        glow: values.glow,
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
        value: values.value,
        min: values.min ?? 0,
        max: values.max ?? 100,
        target: values.target,
        caption: values.caption || undefined,
        tooltip: values.tooltipText || undefined,
        action: values.action,
        shape: values.shape,
        indicator: values.indicator,
        arcWidth: values.arcWidth ?? 14,
        roundCaps: values.roundCaps,
        showTicks: values.showTicks,
        showRange: values.showRange,
        showValue: values.showValue,
        valueSize: values.valueSize ?? 32,
        colorMode: values.colorMode,
        bands: values.bands,
        numberFormat: numberFormatFromProps(values),
        showAsPercent: values.showAsPercent,
        percentDecimals: values.percentDecimals ?? 0,
        style
    };
}

export function settingsFromProps(props: GaugeChartProContainerProps): GaugeSettings {
    return gaugeSettings({
        ...props,
        value: toNumber(props.value.value),
        min: toNumber(props.minValue?.value),
        max: toNumber(props.maxValue?.value),
        target: toNumber(props.targetValue?.value),
        bands: props.bands.flatMap(band => {
            const to = toNumber(band.bandTo.value);
            return to === undefined
                ? []
                : [{ to, color: band.bandColor.trim(), label: band.bandLabel?.value || undefined }];
        }),
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        caption: props.valueCaption?.value,
        tooltipText: props.tooltipText?.value,
        action: props.onClick
    });
}

export function isLoading(props: GaugeChartProContainerProps): boolean {
    return props.value.status === "loading";
}
