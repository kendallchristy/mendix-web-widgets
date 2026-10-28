/**
 * This file was generated from DocumentViewerPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue, FileValue, ListExpressionValue, ListValue } from "mendix";
import { ComponentType, CSSProperties, ReactNode } from "react";
import { Big } from "big.js";

export type SourceEnum = "FILE" | "URL" | "LIST";

export type PreviewModeEnum = "FALLBACK" | "ALWAYS";

export type LayoutEnum = "CONTINUOUS" | "SINGLE";

export type InitialZoomEnum = "FIT_WIDTH" | "FIT_PAGE" | "ACTUAL" | "CUSTOM";

export type SidebarEnum = "AUTO" | "OPEN" | "CLOSED" | "HIDDEN";

export type HeightUnitEnum = "PIXELS" | "VIEWPORT" | "PARENT";

export type ToolbarPositionEnum = "TOP" | "BOTTOM" | "HIDDEN";

export interface DocumentViewerProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    source: SourceEnum;
    file?: DynamicValue<FileValue>;
    url?: DynamicValue<string>;
    fileName?: DynamicValue<string>;
    files?: ListValue;
    listFileName?: ListExpressionValue<string>;
    listCaption?: ListExpressionValue<string>;
    previewFile?: DynamicValue<FileValue>;
    previewMode: PreviewModeEnum;
    layout: LayoutEnum;
    initialZoom: InitialZoomEnum;
    zoomPercent: number;
    sidebar: SidebarEnum;
    heightUnit: HeightUnitEnum;
    height: number;
    toolbarPosition: ToolbarPositionEnum;
    showFileName: boolean;
    showPageControls: boolean;
    showZoom: boolean;
    showRotate: boolean;
    showSearch: boolean;
    showPrint: boolean;
    showDownload: boolean;
    showFullscreen: boolean;
    toolbarContent?: ReactNode;
    allowDownload: DynamicValue<boolean>;
    allowPrint: DynamicValue<boolean>;
    allowCopy: DynamicValue<boolean>;
    watermark?: DynamicValue<string>;
    blockRemoteImages: boolean;
    onLoad?: ActionValue;
    onError?: ActionValue;
    onPageChange?: ActionValue;
    onDownload?: ActionValue;
    currentPage?: EditableValue<Big>;
    pageCount?: EditableValue<Big>;
    errorMessage?: EditableValue<string>;
    labelLoading?: DynamicValue<string>;
    labelError?: DynamicValue<string>;
    labelUnsupported?: DynamicValue<string>;
    labelNoFile?: DynamicValue<string>;
    labelFallback?: DynamicValue<string>;
    labelPassword?: DynamicValue<string>;
    labelWrongPassword?: DynamicValue<string>;
    labelOpen?: DynamicValue<string>;
    labelPreviousPage?: DynamicValue<string>;
    labelNextPage?: DynamicValue<string>;
    labelPageNumber?: DynamicValue<string>;
    labelPageCount?: DynamicValue<string>;
    labelZoomIn?: DynamicValue<string>;
    labelZoomOut?: DynamicValue<string>;
    labelZoom?: DynamicValue<string>;
    labelFitWidth?: DynamicValue<string>;
    labelFitPage?: DynamicValue<string>;
    labelActualSize?: DynamicValue<string>;
    labelRotate?: DynamicValue<string>;
    labelSearch?: DynamicValue<string>;
    labelSearchPlaceholder?: DynamicValue<string>;
    labelSearchResults?: DynamicValue<string>;
    labelNoResults?: DynamicValue<string>;
    labelPreviousMatch?: DynamicValue<string>;
    labelNextMatch?: DynamicValue<string>;
    labelCloseSearch?: DynamicValue<string>;
    labelPrint?: DynamicValue<string>;
    labelPreparingPrint?: DynamicValue<string>;
    labelDownload?: DynamicValue<string>;
    labelFullscreen?: DynamicValue<string>;
    labelExitFullscreen?: DynamicValue<string>;
    labelSidebar?: DynamicValue<string>;
    labelThumbnails?: DynamicValue<string>;
    labelOutline?: DynamicValue<string>;
    labelPreviousFile?: DynamicValue<string>;
    labelNextFile?: DynamicValue<string>;
    labelAttachments?: DynamicValue<string>;
    labelBack?: DynamicValue<string>;
    labelFrom?: DynamicValue<string>;
    labelTo?: DynamicValue<string>;
    labelCc?: DynamicValue<string>;
    labelDate?: DynamicValue<string>;
    labelRemoteBlocked?: DynamicValue<string>;
    labelShowRemote?: DynamicValue<string>;
    labelWrapLines?: DynamicValue<string>;
    labelShowSource?: DynamicValue<string>;
    labelSlidesBeta?: DynamicValue<string>;
}

export interface DocumentViewerProPreviewProps {
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
    source: SourceEnum;
    file: string;
    url: string;
    fileName: string;
    files: {} | { caption: string } | { type: string } | null;
    listFileName: string;
    listCaption: string;
    previewFile: string;
    previewMode: PreviewModeEnum;
    layout: LayoutEnum;
    initialZoom: InitialZoomEnum;
    zoomPercent: number | null;
    sidebar: SidebarEnum;
    heightUnit: HeightUnitEnum;
    height: number | null;
    toolbarPosition: ToolbarPositionEnum;
    showFileName: boolean;
    showPageControls: boolean;
    showZoom: boolean;
    showRotate: boolean;
    showSearch: boolean;
    showPrint: boolean;
    showDownload: boolean;
    showFullscreen: boolean;
    toolbarContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    allowDownload: string;
    allowPrint: string;
    allowCopy: string;
    watermark: string;
    blockRemoteImages: boolean;
    onLoad: {} | null;
    onError: {} | null;
    onPageChange: {} | null;
    onDownload: {} | null;
    currentPage: string;
    pageCount: string;
    errorMessage: string;
    labelLoading: string;
    labelError: string;
    labelUnsupported: string;
    labelNoFile: string;
    labelFallback: string;
    labelPassword: string;
    labelWrongPassword: string;
    labelOpen: string;
    labelPreviousPage: string;
    labelNextPage: string;
    labelPageNumber: string;
    labelPageCount: string;
    labelZoomIn: string;
    labelZoomOut: string;
    labelZoom: string;
    labelFitWidth: string;
    labelFitPage: string;
    labelActualSize: string;
    labelRotate: string;
    labelSearch: string;
    labelSearchPlaceholder: string;
    labelSearchResults: string;
    labelNoResults: string;
    labelPreviousMatch: string;
    labelNextMatch: string;
    labelCloseSearch: string;
    labelPrint: string;
    labelPreparingPrint: string;
    labelDownload: string;
    labelFullscreen: string;
    labelExitFullscreen: string;
    labelSidebar: string;
    labelThumbnails: string;
    labelOutline: string;
    labelPreviousFile: string;
    labelNextFile: string;
    labelAttachments: string;
    labelBack: string;
    labelFrom: string;
    labelTo: string;
    labelCc: string;
    labelDate: string;
    labelRemoteBlocked: string;
    labelShowRemote: string;
    labelWrapLines: string;
    labelShowSource: string;
    labelSlidesBeta: string;
}
