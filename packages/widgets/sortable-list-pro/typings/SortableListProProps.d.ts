/**
 * This file was generated from SortableListPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    DynamicValue,
    ListActionValue,
    ListAttributeValue,
    ListExpressionValue,
    ListValue,
    ListWidgetValue,
    Option
} from "mendix";
import { ComponentType, CSSProperties, ReactNode } from "react";
import { Big } from "big.js";

export type LayoutEnum = "vertical" | "horizontal" | "grid";

export type HeightModeEnum = "auto" | "fixed" | "fill";

export type DragHandleEnum = "item" | "grip" | "custom";

export type IndicatorEnum = "makeRoom" | "line";

export type AnimationEnum = "normal" | "fast" | "off";

export type PreviewEnum = "snapshot" | "compact";

export interface SortableListProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    datasource: ListValue;
    content: ListWidgetValue;
    sortAttribute: ListAttributeValue<Big>;
    pageSize: number;
    layout: LayoutEnum;
    gap: number;
    tileWidth: number;
    heightMode: HeightModeEnum;
    height: number;
    dragHandle: DragHandleEnum;
    emptyContent?: ReactNode;
    canDrag: ListExpressionValue<boolean>;
    group: string;
    listName?: DynamicValue<string>;
    canReceive: DynamicValue<boolean>;
    receiveAttribute?: ListAttributeValue<string | boolean>;
    receiveValue?: DynamicValue<string>;
    onMove?: ListActionValue<{
        moved: Option<boolean>;
        newSortValue: Option<Big>;
        oldPosition: Option<Big>;
        newPosition: Option<Big>;
    }>;
    onRemove?: ListActionValue<{
        toList: Option<string>;
        toValue: Option<string>;
        newSortValue: Option<Big>;
        oldPosition: Option<Big>;
        newPosition: Option<Big>;
    }>;
    onDragStart?: ListActionValue;
    indicator: IndicatorEnum;
    animation: AnimationEnum;
    preview: PreviewEnum;
    itemLabel?: ListExpressionValue<string>;
    instructions?: DynamicValue<string>;
    liftedText?: DynamicValue<string>;
    movedText?: DynamicValue<string>;
    droppedText?: DynamicValue<string>;
    cancelledText?: DynamicValue<string>;
}

export interface SortableListProPreviewProps {
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
    datasource: {} | { caption: string } | { type: string } | null;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    sortAttribute: string;
    pageSize: number | null;
    layout: LayoutEnum;
    gap: number | null;
    tileWidth: number | null;
    heightMode: HeightModeEnum;
    height: number | null;
    dragHandle: DragHandleEnum;
    emptyContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    canDrag: string;
    group: string;
    listName: string;
    canReceive: string;
    receiveAttribute: string;
    receiveValue: string;
    onMove: {} | null;
    onRemove: {} | null;
    onDragStart: {} | null;
    indicator: IndicatorEnum;
    animation: AnimationEnum;
    preview: PreviewEnum;
    itemLabel: string;
    instructions: string;
    liftedText: string;
    movedText: string;
    droppedText: string;
    cancelledText: string;
}
