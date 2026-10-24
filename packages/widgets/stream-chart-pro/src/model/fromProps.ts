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

import type { StreamChartProContainerProps, StreamChartProPreviewProps } from "../../typings/StreamChartProProps";
import type { StreamPoint, StreamSettings } from "./types";

type SharedProps = Pick<
    StreamChartProPreviewProps,
    | "titleAlign"
    | "aggregation"
    | "period"
    | "showLabels"
    | "showAxis"
    | "dateFormat"
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
    maxGroups: number | null;
    decimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    otherLabel?: string;
}

/** Stream settings from property values; shared by the widget and its design-mode preview. */
export function streamSettings(values: Values): StreamSettings {
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
        aggregation: values.aggregation,
        period: values.period,
        maxGroups: Math.max(0, values.maxGroups ?? 8),
        otherLabel: values.otherLabel || "Other",
        showLabels: values.showLabels,
        showAxis: values.showAxis,
        dateFormat: values.dateFormat?.trim() || undefined,
        numberFormat: numberFormatFromProps(values),
        style
    };
}

export function settingsFromProps(props: StreamChartProContainerProps): StreamSettings {
    return streamSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        otherLabel: props.otherLabel?.value
    });
}

/** Reads the objects. Objects without a date are left out; objects without a group join an unnamed one. */
export function readStreamPoints(props: StreamChartProContainerProps): StreamPoint[] {
    const items: ObjectItem[] = props.dataSource.items ?? [];
    const points: StreamPoint[] = [];
    for (const item of items) {
        const raw: unknown = props.dateAttribute.get(item).value;
        const date = raw instanceof Date ? raw : toNumber(raw);
        if (date === undefined) {
            continue;
        }
        points.push({
            date,
            group: readText(props.groupAttribute, item) ?? "",
            value: readNumber(props.valueAttribute, item)
        });
    }
    return points;
}

export function isStreamDataLoading(props: Pick<StreamChartProContainerProps, "dataSource">): boolean {
    return isAnyLoading([props.dataSource]);
}
