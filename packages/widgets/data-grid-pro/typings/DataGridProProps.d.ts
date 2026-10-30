/**
 * This file was generated from DataGridPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import {
    DynamicValue,
    EditableValue,
    ListActionValue,
    ListAttributeListValue,
    ListAttributeValue,
    ListExpressionValue,
    ListReferenceSetValue,
    ListReferenceValue,
    ListValue,
    ListWidgetValue,
    SelectionMultiValue,
    SelectionSingleValue
} from "mendix";
import { ComponentType, CSSProperties, ReactNode } from "react";
import { Big } from "big.js";

export type ShowContentAsEnum = "attribute" | "dynamicText" | "customContent" | "related";

export type CellStyleEnum = "text" | "badge" | "progress";

export type AlignmentEnum = "left" | "center" | "right";

export type HidableEnum = "yes" | "hidden" | "no";

export type WidthModeEnum = "fill" | "fixed";

export interface ColumnsType {
    header?: DynamicValue<string>;
    showContentAs: ShowContentAsEnum;
    attribute?:
        | ListAttributeValue<string | Big | boolean | Date>
        | ListAttributeListValue<string | Big | boolean | Date>;
    dynamicText?: ListExpressionValue<string>;
    content?: ListWidgetValue;
    visible: DynamicValue<boolean>;
    cellStyle: CellStyleEnum;
    badgeColor?: ListExpressionValue<string>;
    progressMax: number;
    expandedText?: ListExpressionValue<string>;
    expandedWidth: number;
    alignment: AlignmentEnum;
    columnClass?: ListExpressionValue<string>;
    relatedSource?: ListValue;
    relatedParent?: ListReferenceValue | ListReferenceSetValue;
    relatedCaption?: ListExpressionValue<string>;
    relatedColor?: ListExpressionValue<string>;
    sortable: boolean;
    resizable: boolean;
    hidable: HidableEnum;
    widthMode: WidthModeEnum;
    fillWeight: number;
    fixedWidth: number;
    minWidth: number;
}

export type DensityEnum = "compact" | "default" | "comfortable";

export type OnClickTriggerEnum = "single" | "double";

export type ExpandTriggerEnum = "chevron" | "row";

export type PaginationEnum = "virtualScrolling" | "pages";

export type HeightModeEnum = "fixed" | "fill";

export type ConfigurationStorageEnum = "none" | "browser" | "attribute";

export interface ColumnsPreviewType {
    header: string;
    showContentAs: ShowContentAsEnum;
    attribute: string;
    dynamicText: string;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    visible: string;
    cellStyle: CellStyleEnum;
    badgeColor: string;
    progressMax: number | null;
    expandedText: string;
    expandedWidth: number | null;
    alignment: AlignmentEnum;
    columnClass: string;
    relatedSource: {} | { caption: string } | { type: string } | null;
    relatedParent: string;
    relatedCaption: string;
    relatedColor: string;
    sortable: boolean;
    resizable: boolean;
    hidable: HidableEnum;
    widthMode: WidthModeEnum;
    fillWeight: number | null;
    fixedWidth: number | null;
    minWidth: number | null;
}

export interface DataGridProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    datasource: ListValue;
    refreshInterval: number;
    columns: ColumnsType[];
    pinFirstColumn: boolean;
    density: DensityEnum;
    stripes: boolean;
    rowClass?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    onClickTrigger: OnClickTriggerEnum;
    detailContent?: ListWidgetValue;
    expandTrigger: ExpandTriggerEnum;
    singleExpand: boolean;
    itemSelection?: SelectionSingleValue | SelectionMultiValue;
    keepSelection: boolean;
    clearAfterBulkAction: boolean;
    title?: DynamicValue<string>;
    showCount: boolean;
    toolbarContent?: ReactNode;
    bulkActions?: ReactNode;
    showColumnMenu: boolean;
    showDensityToggle: boolean;
    pagination: PaginationEnum;
    pageSize: number;
    heightMode: HeightModeEnum;
    height: number;
    emptyPlaceholder?: ReactNode;
    configurationStorage: ConfigurationStorageEnum;
    configurationAttribute?: EditableValue<string>;
}

export interface DataGridProPreviewProps {
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
    refreshInterval: number | null;
    columns: ColumnsPreviewType[];
    pinFirstColumn: boolean;
    density: DensityEnum;
    stripes: boolean;
    rowClass: string;
    onClick: {} | null;
    onClickTrigger: OnClickTriggerEnum;
    detailContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    expandTrigger: ExpandTriggerEnum;
    singleExpand: boolean;
    itemSelection: "None" | "Single" | "Multi";
    onSelectionChange: {} | null;
    keepSelection: boolean;
    clearAfterBulkAction: boolean;
    title: string;
    showCount: boolean;
    toolbarContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    bulkActions: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    showColumnMenu: boolean;
    showDensityToggle: boolean;
    pagination: PaginationEnum;
    pageSize: number | null;
    heightMode: HeightModeEnum;
    height: number | null;
    emptyPlaceholder: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    configurationStorage: ConfigurationStorageEnum;
    configurationAttribute: string;
}
