import type { ChartStyle } from "@kendallchristy/chart-core";
import {
    defaultChartStyle,
    isAnyLoading,
    numberFormatFromProps,
    readNumber,
    readXValue,
    toNumber
} from "@kendallchristy/chart-core";
import type { ObjectItem } from "mendix";

import type { HeatmapChartProContainerProps, HeatmapChartProPreviewProps } from "../../typings/HeatmapChartProProps";
import type { HeatPoint, HeatmapSettings } from "./types";

type SharedProps = Pick<
    HeatmapChartProPreviewProps,
    | "titleAlign"
    | "layout"
    | "aggregation"
    | "cellLabels"
    | "dateFormat"
    | "colorScale"
    | "customScale"
    | "reverseScale"
    | "showScale"
    | "prefix"
    | "suffix"
    | "thousandsSeparator"
    | "compactNumbers"
    | "tooltip"
    | "figuresFont"
    | "animation"
    | "background"
>;

interface Values extends SharedProps {
    cellGap: number | null;
    cornerRadius: number | null;
    decimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    scaleMin?: number;
    scaleMax?: number;
}

/** Heatmap settings from property values; shared by the widget and its design-mode preview. */
export function heatmapSettings(values: Values): HeatmapSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
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
        layout: values.layout,
        aggregation: values.aggregation,
        cellLabels: values.cellLabels,
        cellGap: Math.max(0, values.cellGap ?? 2),
        cornerRadius: Math.max(0, values.cornerRadius ?? 3),
        dateFormat: values.dateFormat?.trim() || undefined,
        colorScale: values.colorScale,
        customScale: values.customScale,
        reverseScale: values.reverseScale,
        scaleMin: values.scaleMin,
        scaleMax: values.scaleMax,
        showScale: values.showScale,
        numberFormat: numberFormatFromProps(values),
        style
    };
}

export function settingsFromProps(props: HeatmapChartProContainerProps): HeatmapSettings {
    return heatmapSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        scaleMin: toNumber(props.scaleMin?.value),
        scaleMax: toNumber(props.scaleMax?.value)
    });
}

/** Reads the cells' objects. Objects without a column are left out. */
export function readHeatPoints(props: HeatmapChartProContainerProps): HeatPoint[] {
    const items: ObjectItem[] = props.dataSource.items ?? [];
    const points: HeatPoint[] = [];
    const { tooltipText, onClick } = props;
    for (const item of items) {
        const x = readXValue(props.xAttribute, item);
        if (x === undefined) {
            continue;
        }
        points.push({
            x,
            y: readXValue(props.yAttribute, item),
            value: readNumber(props.valueAttribute, item),
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

export function isHeatDataLoading(props: Pick<HeatmapChartProContainerProps, "dataSource">): boolean {
    return isAnyLoading([props.dataSource]);
}
