/**
 * This file was generated from TemplateWidget.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { DynamicValue } from "mendix";
import { CSSProperties } from "react";

export interface TemplateWidgetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    caption?: DynamicValue<string>;
}

export interface TemplateWidgetPreviewProps {
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
    caption: string;
}
