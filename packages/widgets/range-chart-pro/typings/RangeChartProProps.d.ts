/**
 * This file was generated from RangeChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type SortOrderEnum = "data" | "name" | "start" | "span";

export type TitleAlignEnum = "left" | "center";

export type RangeStyleEnum = "bars" | "dumbbell";

export type OrientationEnum = "horizontal" | "vertical";

export type ValueLabelsEnum = "off" | "ends" | "span";

export type LabelStyleEnum = "plain" | "darkPill" | "lightPill";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type GlowEnum = "soft" | "off";

export type GridlinesEnum = "none" | "vertical" | "horizontal" | "both";

export type LegendEnum = "auto" | "top" | "bottom" | "right" | "hidden";

export type TooltipEnum = "card" | "pill" | "off";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface RangeChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSource: ListValue;
    categoryAttribute: ListAttributeValue<string | boolean | Big>;
    lowAttribute: ListAttributeValue<Big | Date>;
    highAttribute: ListAttributeValue<Big | Date>;
    groupByAttribute?: ListAttributeValue<string | boolean | Big>;
    sortOrder: SortOrderEnum;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    rangeStyle: RangeStyleEnum;
    orientation: OrientationEnum;
    barWidth: number;
    cornerRadius: number;
    dotSize: number;
    valueLabels: ValueLabelsEnum;
    labelStyle: LabelStyleEnum;
    showCategoryAxis: boolean;
    showValueAxis: boolean;
    valueAxisTitle?: DynamicValue<string>;
    dateFormat: string;
    decimals: number;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
    gridlines: GridlinesEnum;
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

export interface RangeChartProPreviewProps {
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
    lowAttribute: string;
    highAttribute: string;
    groupByAttribute: string;
    sortOrder: SortOrderEnum;
    tooltipText: string;
    onClick: {} | null;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    rangeStyle: RangeStyleEnum;
    orientation: OrientationEnum;
    barWidth: number | null;
    cornerRadius: number | null;
    dotSize: number | null;
    valueLabels: ValueLabelsEnum;
    labelStyle: LabelStyleEnum;
    showCategoryAxis: boolean;
    showValueAxis: boolean;
    valueAxisTitle: string;
    dateFormat: string;
    decimals: number | null;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
    gridlines: GridlinesEnum;
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
