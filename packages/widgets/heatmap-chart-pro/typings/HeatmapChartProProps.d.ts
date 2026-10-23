/**
 * This file was generated from HeatmapChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type LayoutEnum = "grid" | "calendar";

export type AggregationEnum = "sum" | "count" | "avg" | "min" | "max";

export type TitleAlignEnum = "left" | "center";

export type ColorScaleEnum = "hyper" | "palette" | "custom";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type TooltipEnum = "card" | "pill" | "off";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface HeatmapChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSource: ListValue;
    layout: LayoutEnum;
    xAttribute: ListAttributeValue<string | boolean | Date | Big>;
    yAttribute?: ListAttributeValue<string | boolean | Date | Big>;
    valueAttribute?: ListAttributeValue<Big>;
    aggregation: AggregationEnum;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    cellLabels: boolean;
    cellGap: number;
    cornerRadius: number;
    dateFormat: string;
    colorScale: ColorScaleEnum;
    customScale: string;
    reverseScale: boolean;
    scaleMin?: DynamicValue<Big>;
    scaleMax?: DynamicValue<Big>;
    showScale: boolean;
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

export interface HeatmapChartProPreviewProps {
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
    layout: LayoutEnum;
    xAttribute: string;
    yAttribute: string;
    valueAttribute: string;
    aggregation: AggregationEnum;
    tooltipText: string;
    onClick: {} | null;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    cellLabels: boolean;
    cellGap: number | null;
    cornerRadius: number | null;
    dateFormat: string;
    colorScale: ColorScaleEnum;
    customScale: string;
    reverseScale: boolean;
    scaleMin: string;
    scaleMax: string;
    showScale: boolean;
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
