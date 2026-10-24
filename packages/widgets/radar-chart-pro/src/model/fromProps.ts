import type { ChartStyle } from "@kendallchristy/chart-core";
import {
    defaultChartStyle,
    isAnyLoading,
    numberFormatFromProps,
    readNumber,
    readText,
    toNumber
} from "@kendallchristy/chart-core";
import type { ObjectItem } from "mendix";

import type { RadarChartProContainerProps, RadarChartProPreviewProps } from "../../typings/RadarChartProProps";
import type { RadarPoint, RadarSeries, RadarSettings } from "./types";

type SharedProps = Pick<
    RadarChartProPreviewProps,
    | "titleAlign"
    | "indicatorOrder"
    | "shape"
    | "areaFill"
    | "markers"
    | "valueLabels"
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
    rings: number | null;
    lineWidth: number | null;
    decimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    maxValue?: number;
}

/** Radar settings from property values; shared by the widget and its design-mode preview. */
export function radarSettings(values: Values): RadarSettings {
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
        maxValue: values.maxValue !== undefined && values.maxValue > 0 ? values.maxValue : undefined,
        indicatorOrder: values.indicatorOrder,
        shape: values.shape,
        rings: Math.max(1, Math.min(10, values.rings ?? 4)),
        areaFill: values.areaFill,
        lineWidth: Math.max(0, values.lineWidth ?? 2),
        markers: values.markers,
        valueLabels: values.valueLabels,
        labelStyle: values.labelStyle,
        numberFormat: numberFormatFromProps(values),
        style
    };
}

export function settingsFromProps(props: RadarChartProContainerProps): RadarSettings {
    return radarSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        maxValue: toNumber(props.maxValue?.value)
    });
}

/** Reads every series' objects. Objects without a measure are left out. */
export function readRadarSeries(props: RadarChartProContainerProps): RadarSeries[] {
    return props.series.map((config, index) => {
        const items: ObjectItem[] = config.dataSource.items ?? [];
        const points: RadarPoint[] = [];
        for (const item of items) {
            const indicator = readText(config.indicatorAttribute, item);
            if (indicator !== undefined) {
                points.push({ indicator, value: readNumber(config.valueAttribute, item) });
            }
        }
        return {
            name: config.seriesName?.value || `Series ${index + 1}`,
            color: config.color.trim() || undefined,
            aggregation: config.aggregation,
            points
        };
    });
}

export function isRadarDataLoading(props: Pick<RadarChartProContainerProps, "series">): boolean {
    return isAnyLoading(props.series.map(s => s.dataSource));
}
