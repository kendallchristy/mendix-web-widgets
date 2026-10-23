import type { ChartStyle } from "@kendallchristy/chart-core";
import { readNumber, readText, readXValue, toNumber } from "@kendallchristy/chart-core";
import type { ObjectItem } from "mendix";

import type { CartesianChartProContainerProps, SeriesType } from "../../typings/CartesianChartProProps";
import type { ChartSettings, InputPoint, SeriesInput } from "./types";

/** The shared Chart style properties, as plain values. Also used by the design-mode preview. */
export function styleFromProps(props: {
    lineCurve: ChartStyle["lineCurve"];
    lineWidth: number;
    areaFill: ChartStyle["areaFill"];
    glow: ChartStyle["glow"];
    markers: ChartStyle["markers"];
    valueLabels: ChartStyle["valueLabels"];
    valueLabelPoints: ChartStyle["valueLabelPoints"];
    barStyle: ChartStyle["barStyle"];
    barRadius: number;
    barWidth: number;
    gridlines: ChartStyle["gridlines"];
    legend: ChartStyle["legend"];
    tooltip: ChartStyle["tooltip"];
    hoverGuide: ChartStyle["hoverGuide"];
    figuresFont: ChartStyle["figuresFont"];
    animation: boolean;
    animationDuration: number;
    background: ChartStyle["background"];
}): ChartStyle {
    return {
        lineCurve: props.lineCurve,
        lineWidth: props.lineWidth,
        areaFill: props.areaFill,
        glow: props.glow,
        markers: props.markers,
        valueLabels: props.valueLabels,
        valueLabelPoints: props.valueLabelPoints,
        barStyle: props.barStyle,
        barRadius: props.barRadius,
        barWidth: props.barWidth,
        gridlines: props.gridlines,
        legend: props.legend,
        tooltip: props.tooltip,
        hoverGuide: props.hoverGuide,
        figuresFont: props.figuresFont,
        animation: props.animation,
        animationDuration: props.animationDuration,
        background: props.background
    };
}

function readSeries(config: SeriesType, index: number): SeriesInput[] {
    const items: ObjectItem[] = config.dataSource.items ?? [];
    const baseName = config.seriesName?.value || `Series ${index + 1}`;
    const groups = new Map<string, InputPoint[]>();

    for (const item of items) {
        const x = readXValue(config.xAttribute, item);
        if (x === undefined) {
            continue;
        }
        const point: InputPoint = {
            x,
            y: readNumber(config.yAttribute, item),
            size: readNumber(config.sizeAttribute, item),
            drill: [readText(config.drillAttribute1, item), readText(config.drillAttribute2, item)],
            tooltip: config.tooltipText?.get(item).value || undefined,
            action: config.onClick?.get(item)
        };
        const group = config.groupByAttribute ? (readText(config.groupByAttribute, item) ?? "") : baseName;
        const points = groups.get(group);
        if (points) {
            points.push(point);
        } else {
            groups.set(group, [point]);
        }
    }

    const shared = {
        kind: config.seriesType,
        color: config.groupByAttribute ? undefined : config.color.trim() || undefined,
        stack: config.stack.trim() || undefined,
        yAxisSide: config.yAxisSide,
        aggregation: config.aggregation
    };
    return Array.from(groups, ([name, points]) => ({ ...shared, key: `${index}:${name}`, name, points }));
}

export function seriesFromProps(props: CartesianChartProContainerProps): SeriesInput[] {
    return props.series.flatMap(readSeries);
}

export function isLoading(props: CartesianChartProContainerProps): boolean {
    return props.series.some(s => s.dataSource.status === "loading" && (s.dataSource.items ?? []).length === 0);
}

export function settingsFromProps(props: CartesianChartProContainerProps): ChartSettings {
    const drill: ChartSettings["drill"] =
        props.drilldown === "date"
            ? { kind: "date", from: props.drillDateFrom, to: props.drillDateTo }
            : props.drilldown === "category"
              ? { kind: "category" }
              : { kind: "none" };
    return {
        title: props.title?.value || undefined,
        subtitle: props.subtitle?.value || undefined,
        titleAlign: props.titleAlign,
        orientation: props.orientation,
        showXAxis: props.showXAxis,
        showYAxis: props.showYAxis,
        xAxisTitle: props.xAxisTitle?.value || undefined,
        yAxisTitle: props.yAxisTitle?.value || undefined,
        yAxisMin: toNumber(props.yAxisMin?.value),
        yAxisMax: toNumber(props.yAxisMax?.value),
        yAxisScale: props.yAxisScale,
        numberFormat: {
            decimals: props.decimals,
            prefix: props.prefix,
            suffix: props.suffix,
            thousandsSeparator: props.thousandsSeparator,
            compact: props.compactNumbers
        },
        xDateFormat: props.xDateFormat || undefined,
        drill,
        topLabel: props.drillTopLabel?.value || "All",
        zoom: props.zoom,
        highlightFrom: props.highlightFrom?.value || undefined,
        highlightTo: props.highlightTo?.value || undefined,
        style: styleFromProps({ ...props, lineWidth: Number(props.lineWidth) || 2.5 })
    };
}
