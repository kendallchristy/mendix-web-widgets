/**
 * This file was generated from CandlestickChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListExpressionValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type TitleAlignEnum = "left" | "center";

export type CandleStyleEnum = "candles" | "ohlc";

export type ZoomEnum = "none" | "inside" | "slider" | "both";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type GridlinesEnum = "none" | "vertical" | "horizontal" | "both";

export type LegendEnum = "auto" | "top" | "bottom" | "right" | "hidden";

export type TooltipEnum = "card" | "pill" | "off";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface CandlestickChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSource: ListValue;
    dateAttribute: ListAttributeValue<Date | string>;
    openAttribute: ListAttributeValue<Big>;
    highAttribute: ListAttributeValue<Big>;
    lowAttribute: ListAttributeValue<Big>;
    closeAttribute: ListAttributeValue<Big>;
    volumeAttribute?: ListAttributeValue<Big>;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    candleStyle: CandleStyleEnum;
    risingColor: string;
    fallingColor: string;
    movingAverages: string;
    volumeHeight: number;
    showXAxis: boolean;
    showYAxis: boolean;
    yAxisTitle?: DynamicValue<string>;
    dateFormat: string;
    zoom: ZoomEnum;
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

export interface CandlestickChartProPreviewProps {
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
    dateAttribute: string;
    openAttribute: string;
    highAttribute: string;
    lowAttribute: string;
    closeAttribute: string;
    volumeAttribute: string;
    tooltipText: string;
    onClick: {} | null;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    candleStyle: CandleStyleEnum;
    risingColor: string;
    fallingColor: string;
    movingAverages: string;
    volumeHeight: number | null;
    showXAxis: boolean;
    showYAxis: boolean;
    yAxisTitle: string;
    dateFormat: string;
    zoom: ZoomEnum;
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
