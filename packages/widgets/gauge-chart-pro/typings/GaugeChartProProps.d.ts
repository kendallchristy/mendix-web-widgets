/**
 * This file was generated from GaugeChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export type TitleAlignEnum = "left" | "center";

export type ShapeEnum = "arc" | "half" | "ring";

export type IndicatorEnum = "progress" | "needle" | "both";

export type ColorModeEnum = "palette" | "band";

export interface BandsType {
    bandTo: DynamicValue<Big>;
    bandColor: string;
    bandLabel?: DynamicValue<string>;
}

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type GlowEnum = "soft" | "off";

export type TooltipEnum = "card" | "pill" | "off";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface BandsPreviewType {
    bandTo: string;
    bandColor: string;
    bandLabel: string;
}

export interface GaugeChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    value: DynamicValue<Big>;
    minValue?: DynamicValue<Big>;
    maxValue?: DynamicValue<Big>;
    targetValue?: DynamicValue<Big>;
    valueCaption?: DynamicValue<string>;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    onClick?: ActionValue;
    tooltipText?: DynamicValue<string>;
    shape: ShapeEnum;
    indicator: IndicatorEnum;
    arcWidth: number;
    roundCaps: boolean;
    showTicks: boolean;
    showRange: boolean;
    showValue: boolean;
    valueSize: number;
    colorMode: ColorModeEnum;
    bands: BandsType[];
    decimals: number;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    showAsPercent: boolean;
    percentDecimals: number;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
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

export interface GaugeChartProPreviewProps {
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
    value: string;
    minValue: string;
    maxValue: string;
    targetValue: string;
    valueCaption: string;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    onClick: {} | null;
    tooltipText: string;
    shape: ShapeEnum;
    indicator: IndicatorEnum;
    arcWidth: number | null;
    roundCaps: boolean;
    showTicks: boolean;
    showRange: boolean;
    showValue: boolean;
    valueSize: number | null;
    colorMode: ColorModeEnum;
    bands: BandsPreviewType[];
    decimals: number | null;
    prefix: string;
    suffix: string;
    thousandsSeparator: boolean;
    compactNumbers: boolean;
    showAsPercent: boolean;
    percentDecimals: number | null;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    glow: GlowEnum;
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
