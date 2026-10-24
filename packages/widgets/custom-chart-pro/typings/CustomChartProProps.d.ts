/**
 * This file was generated from CustomChartPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue, ListActionValue, ListAttributeValue, ListValue } from "mendix";
import { Big } from "big.js";
import { CSSProperties } from "react";

export interface DataSetsType {
    name: string;
    dataSource: ListValue;
    field1?: ListAttributeValue<string | boolean | Big | Date>;
    field1Name: string;
    field2?: ListAttributeValue<string | boolean | Big | Date>;
    field2Name: string;
    field3?: ListAttributeValue<string | boolean | Big | Date>;
    field3Name: string;
    field4?: ListAttributeValue<string | boolean | Big | Date>;
    field4Name: string;
    field5?: ListAttributeValue<string | boolean | Big | Date>;
    field5Name: string;
    field6?: ListAttributeValue<string | boolean | Big | Date>;
    field6Name: string;
    onClick?: ListActionValue;
}

export type TitleAlignEnum = "left" | "center";

export type ThemeEnum = "hyper" | "hyperLight" | "hyperDark" | "custom";

export type PaletteEnum = "theme" | "hyper" | "hyperHighContrast" | "monochrome" | "custom";

export type BackgroundEnum = "transparent" | "surface";

export type FiguresFontEnum = "mono" | "text";

export type HeightUnitEnum = "pixels" | "percentageOfWidth" | "fill";

export type RendererEnum = "canvas" | "svg";

export interface DataSetsPreviewType {
    name: string;
    dataSource: {} | { caption: string } | { type: string } | null;
    field1: string;
    field1Name: string;
    field2: string;
    field2Name: string;
    field3: string;
    field3Name: string;
    field4: string;
    field4Name: string;
    field5: string;
    field5Name: string;
    field6: string;
    field6Name: string;
    onClick: {} | null;
}

export interface CustomChartProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    optionJson: string;
    optionJsonExpression?: DynamicValue<string>;
    dataSets: DataSetsType[];
    mapName: string;
    mapUrl: string;
    title?: DynamicValue<string>;
    subtitle?: DynamicValue<string>;
    titleAlign: TitleAlignEnum;
    emptyMessage?: DynamicValue<string>;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    heightUnit: HeightUnitEnum;
    height: number;
    animation: boolean;
    animationDuration: number;
    renderer: RendererEnum;
    themeJson: string;
    themeJsonExpression?: DynamicValue<string>;
}

export interface CustomChartProPreviewProps {
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
    optionJson: string;
    optionJsonExpression: string;
    dataSets: DataSetsPreviewType[];
    mapName: string;
    mapUrl: string;
    title: string;
    subtitle: string;
    titleAlign: TitleAlignEnum;
    emptyMessage: string;
    theme: ThemeEnum;
    palette: PaletteEnum;
    customPalette: string;
    background: BackgroundEnum;
    figuresFont: FiguresFontEnum;
    heightUnit: HeightUnitEnum;
    height: number | null;
    animation: boolean;
    animationDuration: number | null;
    renderer: RendererEnum;
    themeJson: string;
    themeJsonExpression: string;
}
