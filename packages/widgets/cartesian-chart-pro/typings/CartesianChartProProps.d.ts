/**
 * This file was generated from CartesianChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type SeriesTypeEnum = "line" | "area" | "bar" | "scatter" | "bubble";

export type AggregationEnum = "none" | "sum" | "avg" | "count" | "min" | "max";

export type YAxisSideEnum = "left" | "right";

export interface SeriesType {
    dataSource: ListValue;
    seriesType: SeriesTypeEnum;
    seriesName?: DynamicValue<string>;
    xAttribute: ListAttributeValue<string | boolean | Date | Big>;
    yAttribute?: ListAttributeValue<Big>;
    sizeAttribute?: ListAttributeValue<Big>;
    groupByAttribute?: ListAttributeValue<string | boolean | Big>;
    aggregation: AggregationEnum;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    drillAttribute1?: ListAttributeValue<string | boolean | Big>;
    drillAttribute2?: ListAttributeValue<string | boolean | Big>;
    color: string;
    stack: string;
    yAxisSide: YAxisSideEnum;
}

export type TitleAlignEnum = "left" | "center";

export type OrientationEnum = "vertical" | "horizontal";

export type YAxisScaleEnum = "linear" | "log";

export type DrilldownEnum = "none" | "date" | "category";

export type DrillDateFromEnum = "year" | "quarter" | "month" | "week";

export type DrillDateToEnum = "quarter" | "month" | "week" | "day";

export type ZoomEnum = "none" | "slider" | "inside" | "both";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type LineCurveEnum = "smooth" | "straight" | "step";

export type AreaFillEnum = "gradient" | "solid" | "none";

export type GlowEnum = "soft" | "off";

export type MarkersEnum = "highlighted" | "hover" | "always" | "never";

export type BarStyleEnum = "solid" | "striped" | "dots";

export type ValueLabelsEnum = "darkPill" | "lightPill" | "plain" | "off";

export type ValueLabelPointsEnum = "highlightEnds" | "last" | "all";

export type GridlinesEnum = "vertical" | "horizontal" | "both" | "none";

export type LegendEnum = "auto" | "top" | "bottom" | "right" | "hidden";

export type TooltipEnum = "card" | "pill" | "off";

export type HoverGuideEnum = "line" | "band" | "none";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface SeriesPreviewType {
    dataSource: {} | { caption: string } | { type: string } | null;
    seriesType: SeriesTypeEnum;
    seriesName: string;
    xAttribute: string;
    yAttribute: string;
    sizeAttribute: string;
    groupByAttribute: string;
    aggregation: AggregationEnum;
    tooltipText: string;
    onClick: {} | null;
    drillAttribute1: string;
    drillAttribute2: string;
    color: string;
    stack: string;
    yAxisSide: YAxisSideEnum;
}

export interface CartesianChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    series: SeriesType[];
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    orientation: OrientationEnum;
    showXAxis: boolean;
    showYAxis: boolean;
    xAxisTitle?: DynamicValue<string>;
    yAxisTitle?: DynamicValue<string>;
    yAxisMin?: DynamicValue<Big>;
    yAxisMax?: DynamicValue<Big>;
    yAxisScale: YAxisScaleEnum;
    decimals: number;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    xDateFormat: string;
    drilldown: DrilldownEnum;
    drillDateFrom: DrillDateFromEnum;
    drillDateTo: DrillDateToEnum;
    drillTopLabel?: DynamicValue<string>;
    zoom: ZoomEnum;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    lineCurve: LineCurveEnum;
    lineWidth: Big;
    areaFill: AreaFillEnum;
    glow: GlowEnum;
    markers: MarkersEnum;
    barStyle: BarStyleEnum;
    barRadius: number;
    barWidth: number;
    highlightFrom?: DynamicValue<string>;
    highlightTo?: DynamicValue<string>;
    valueLabels: ValueLabelsEnum;
    valueLabelPoints: ValueLabelPointsEnum;
    gridlines: GridlinesEnum;
    legend: LegendEnum;
    tooltip: TooltipEnum;
    hoverGuide: HoverGuideEnum;
    heightUnit: HeightUnitEnum;
    height: number;
    animation: boolean;
    animationDuration: number;
    renderer: RendererEnum;
    themeJson: string;
    themeJsonExpression?: DynamicValue<string>;
    optionOverride: string;
    optionOverrideExpression?: DynamicValue<string>;
}

export interface CartesianChartProPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    series: SeriesPreviewType[];
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    orientation: OrientationEnum;
    showXAxis: boolean;
    showYAxis: boolean;
    xAxisTitle: string;
    yAxisTitle: string;
    yAxisMin: string;
    yAxisMax: string;
    yAxisScale: YAxisScaleEnum;
    decimals: number | null;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    xDateFormat: string;
    drilldown: DrilldownEnum;
    drillDateFrom: DrillDateFromEnum;
    drillDateTo: DrillDateToEnum;
    drillTopLabel: string;
    zoom: ZoomEnum;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    lineCurve: LineCurveEnum;
    lineWidth: number | null;
    areaFill: AreaFillEnum;
    glow: GlowEnum;
    markers: MarkersEnum;
    barStyle: BarStyleEnum;
    barRadius: number | null;
    barWidth: number | null;
    highlightFrom: string;
    highlightTo: string;
    valueLabels: ValueLabelsEnum;
    valueLabelPoints: ValueLabelPointsEnum;
    gridlines: GridlinesEnum;
    legend: LegendEnum;
    tooltip: TooltipEnum;
    hoverGuide: HoverGuideEnum;
    heightUnit: HeightUnitEnum;
    height: number | null;
    animation: boolean;
    animationDuration: number | null;
    renderer: RendererEnum;
    themeJson: string;
    themeJsonExpression: string;
    optionOverride: string;
    optionOverrideExpression: string;
}
