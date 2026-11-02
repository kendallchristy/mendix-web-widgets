/**
 * This file was generated from KanbanBoardPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    DynamicValue,
    ListActionValue,
    ListAttributeValue,
    ListExpressionValue,
    ListReferenceValue,
    ListValue,
    ListWidgetValue,
    Option
} from "mendix";
import { ComponentType, CSSProperties, ReactNode } from "react";
import { Big } from "big.js";

export type ColumnSourceEnum = "datasource" | "enumeration";

export type HeightModeEnum = "auto" | "fixed" | "fill";

export type CardStyleEnum = "card" | "plain";

export type IndicatorEnum = "makeRoom" | "line";

export type AnimationEnum = "normal" | "fast" | "off";

export type PreviewEnum = "snapshot" | "compact";

export interface KanbanBoardProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    columnSource: ColumnSourceEnum;
    columns?: ListValue;
    columnTitle?: ListExpressionValue<string>;
    columnKey?: ListExpressionValue<string>;
    columnHeader?: ListWidgetValue;
    columnFooter?: ListWidgetValue;
    columnSortAttribute?: ListAttributeValue<Big>;
    columnLimit?: ListExpressionValue<Big>;
    collapsible: boolean;
    showCount: boolean;
    emptyColumnText?: DynamicValue<string>;
    cards: ListValue;
    cardContent: ListWidgetValue;
    cardColumn?: ListReferenceValue;
    cardStatus?: ListAttributeValue<string>;
    cardSortAttribute: ListAttributeValue<Big>;
    canDragCard: ListExpressionValue<boolean>;
    maxCards: number;
    onCardMove?: ListActionValue<{
        moved: Option<boolean>;
        newSortValue: Option<Big>;
        fromColumn: Option<string>;
        toColumn: Option<string>;
        newPosition: Option<Big>;
    }>;
    onColumnMove?: ListActionValue<{ moved: Option<boolean>; newSortValue: Option<Big>; newPosition: Option<Big> }>;
    onCardClick?: ListActionValue;
    columnWidth: number;
    heightMode: HeightModeEnum;
    height: number;
    cardStyle: CardStyleEnum;
    indicator: IndicatorEnum;
    animation: AnimationEnum;
    preview: PreviewEnum;
    cardLabel?: ListExpressionValue<string>;
    instructions?: DynamicValue<string>;
    liftedText?: DynamicValue<string>;
    movedText?: DynamicValue<string>;
    droppedText?: DynamicValue<string>;
    cancelledText?: DynamicValue<string>;
}

export interface KanbanBoardProPreviewProps {
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
    columnSource: ColumnSourceEnum;
    columns: {} | { caption: string } | { type: string } | null;
    columnTitle: string;
    columnKey: string;
    columnHeader: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    columnFooter: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    columnSortAttribute: string;
    columnLimit: string;
    collapsible: boolean;
    showCount: boolean;
    emptyColumnText: string;
    cards: {} | { caption: string } | { type: string } | null;
    cardContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    cardColumn: string;
    cardStatus: string;
    cardSortAttribute: string;
    canDragCard: string;
    maxCards: number | null;
    onCardMove: {} | null;
    onColumnMove: {} | null;
    onCardClick: {} | null;
    columnWidth: number | null;
    heightMode: HeightModeEnum;
    height: number | null;
    cardStyle: CardStyleEnum;
    indicator: IndicatorEnum;
    animation: AnimationEnum;
    preview: PreviewEnum;
    cardLabel: string;
    instructions: string;
    liftedText: string;
    movedText: string;
    droppedText: string;
    cancelledText: string;
}
