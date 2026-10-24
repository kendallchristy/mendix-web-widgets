import type { ChartStyle } from "@kendallchristy/chart-core";
import {
    defaultChartStyle,
    isAnyLoading,
    numberFormatFromProps,
    readText,
    readXValue
} from "@kendallchristy/chart-core";
import type { ObjectItem } from "mendix";

import type { RangeChartProContainerProps, RangeChartProPreviewProps } from "../../typings/RangeChartProProps";
import type { RangePoint, RangeSettings } from "./types";

type SharedProps = Pick<
    RangeChartProPreviewProps,
    | "titleAlign"
    | "sortOrder"
    | "rangeStyle"
    | "orientation"
    | "valueLabels"
    | "labelStyle"
    | "showCategoryAxis"
    | "showValueAxis"
    | "dateFormat"
    | "prefix"
    | "suffix"
    | "thousandsSeparator"
    | "compactNumbers"
    | "glow"
    | "gridlines"
    | "legend"
    | "tooltip"
    | "figuresFont"
    | "animation"
    | "background"
>;

interface Values extends SharedProps {
    barWidth: number | null;
    cornerRadius: number | null;
    dotSize: number | null;
    decimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    valueAxisTitle?: string;
}

/** Range settings from property values; shared by the widget and its design-mode preview. */
export function rangeSettings(values: Values): RangeSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
        glow: values.glow,
        gridlines: values.gridlines,
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
        sortOrder: values.sortOrder,
        rangeStyle: values.rangeStyle,
        orientation: values.orientation,
        barWidth: values.barWidth ?? 60,
        cornerRadius: values.cornerRadius ?? 4,
        dotSize: values.dotSize ?? 12,
        valueLabels: values.valueLabels,
        labelStyle: values.labelStyle,
        showCategoryAxis: values.showCategoryAxis,
        showValueAxis: values.showValueAxis,
        valueAxisTitle: values.valueAxisTitle || undefined,
        dateFormat: values.dateFormat?.trim() || undefined,
        numberFormat: numberFormatFromProps(values),
        style
    };
}

export function settingsFromProps(props: RangeChartProContainerProps): RangeSettings {
    return rangeSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        valueAxisTitle: props.valueAxisTitle?.value
    });
}

function rangeEnd(value: ReturnType<typeof readXValue>): number | Date | undefined {
    return value instanceof Date || typeof value === "number" ? value : undefined;
}

/** Reads the ranges. Objects without a category or either end are left out; reversed ends are swapped. */
export function readRangePoints(props: RangeChartProContainerProps): RangePoint[] {
    const items: ObjectItem[] = props.dataSource.items ?? [];
    const points: RangePoint[] = [];
    const { tooltipText, onClick } = props;
    for (const item of items) {
        const category = readText(props.categoryAttribute, item);
        const a = rangeEnd(readXValue(props.lowAttribute, item));
        const b = rangeEnd(readXValue(props.highAttribute, item));
        if (category === undefined || a === undefined || b === undefined) {
            continue;
        }
        const reversed = Number(a) > Number(b);
        points.push({
            category,
            low: reversed ? b : a,
            high: reversed ? a : b,
            group: readText(props.groupByAttribute, item),
            // Read only when a range is hovered or clicked.
            get tooltip() {
                return tooltipText?.get(item).value || undefined;
            },
            get action() {
                return onClick?.get(item);
            }
        });
    }
    return points;
}

export function isRangeDataLoading(props: Pick<RangeChartProContainerProps, "dataSource">): boolean {
    return isAnyLoading([props.dataSource]);
}
