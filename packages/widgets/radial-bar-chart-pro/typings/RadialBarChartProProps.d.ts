/**
 * This file was generated from RadialBarChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type AggregationEnum = "sum" | "count" | "avg" | "min" | "max";

export type SortOrderEnum = "valueDesc" | "valueAsc" | "name" | "data";

export type TitleAlignEnum = "left" | "center";

export type ValueLabelEnum = "value" | "percent" | "off";

export type LabelStyleEnum = "plain" | "darkPill" | "lightPill";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type GlowEnum = "soft" | "off";

export type LegendEnum = "auto" | "top" | "bottom" | "right" | "hidden";

export type TooltipEnum = "card" | "pill" | "off";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface RadialBarChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSource: ListValue;
    categoryAttribute: ListAttributeValue<string | boolean | Big>;
    valueAttribute?: ListAttributeValue<Big>;
    aggregation: AggregationEnum;
    sortOrder: SortOrderEnum;
    maxRings: number;
    colorAttribute?: ListAttributeValue<string>;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    drilldown: boolean;
    drillAttribute1?: ListAttributeValue<string | boolean | Big>;
    drillAttribute2?: ListAttributeValue<string | boolean | Big>;
    drillTopLabel?: DynamicValue<string>;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    maxValue?: DynamicValue<Big>;
    startAngle: number;
    sweep: number;
    ringWidth: number;
    innerRadius: number;
    track: boolean;
    roundCaps: boolean;
    showNames: boolean;
    valueLabel: ValueLabelEnum;
    labelStyle: LabelStyleEnum;
    decimals: number;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    percentDecimals: number;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
    legend: LegendEnum;
    tooltip: TooltipEnum;
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

export interface RadialBarChartProPreviewProps {
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
    dataSource: {} | { caption: string } | { type: string } | null;
    categoryAttribute: string;
    valueAttribute: string;
    aggregation: AggregationEnum;
    sortOrder: SortOrderEnum;
    maxRings: number | null;
    colorAttribute: string;
    tooltipText: string;
    onClick: {} | null;
    drilldown: boolean;
    drillAttribute1: string;
    drillAttribute2: string;
    drillTopLabel: string;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    maxValue: string;
    startAngle: number | null;
    sweep: number | null;
    ringWidth: number | null;
    innerRadius: number | null;
    track: boolean;
    roundCaps: boolean;
    showNames: boolean;
    valueLabel: ValueLabelEnum;
    labelStyle: LabelStyleEnum;
    decimals: number | null;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    percentDecimals: number | null;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
    legend: LegendEnum;
    tooltip: TooltipEnum;
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
