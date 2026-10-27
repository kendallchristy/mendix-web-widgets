/**
 * This file was generated from ToastPro.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ActionValue, DynamicValue, EditableValue, WebIcon } from "mendix";
import { ComponentType, CSSProperties, ReactNode } from "react";
import { Big } from "big.js";

export type TriggerEnum = "LOAD" | "EXPRESSION" | "ATTRIBUTE";

export type VariantEnum = "SUCCESS" | "INFO" | "WARNING" | "ERROR" | "NEUTRAL";

export type CustomContentPlacementEnum = "BELOW" | "REPLACE";

export type ButtonStyleEnum = "PRIMARY" | "SECONDARY" | "LINK";

export interface ButtonsType {
    caption: DynamicValue<string>;
    buttonStyle: ButtonStyleEnum;
    action?: ActionValue;
    closeOnClick: boolean;
    visible: DynamicValue<boolean>;
}

export type PositionEnum = "TOP_LEFT" | "TOP_CENTER" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_CENTER" | "BOTTOM_RIGHT";

export type StackModeEnum = "STACKED" | "EXPANDED";

export type AnimationEnum = "SLIDE" | "FADE" | "SCALE";

export interface ButtonsPreviewType {
    caption: string;
    buttonStyle: ButtonStyleEnum;
    action: {} | null;
    closeOnClick: boolean;
    visible: string;
}

export interface ToastProContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    trigger: TriggerEnum;
    showWhen?: DynamicValue<boolean>;
    showAttribute?: EditableValue<boolean>;
    closeWhen?: DynamicValue<boolean>;
    groupKey?: DynamicValue<string>;
    variant: VariantEnum;
    variantExpression?: DynamicValue<string>;
    title?: DynamicValue<string>;
    message?: DynamicValue<string>;
    showIcon: boolean;
    customIcon?: DynamicValue<WebIcon>;
    useCustomContent: boolean;
    customContent?: ReactNode;
    customContentPlacement: CustomContentPlacementEnum;
    buttons: ButtonsType[];
    showCloseButton: boolean;
    closeButtonLabel?: DynamicValue<string>;
    duration?: DynamicValue<Big>;
    pauseOnHover: boolean;
    pauseWhenHidden: boolean;
    showProgress: boolean;
    busy?: DynamicValue<boolean>;
    onBeforeShow?: ActionValue;
    onShow?: ActionValue;
    onClick?: ActionValue;
    closeOnToastClick: boolean;
    onTimeout?: ActionValue;
    onDismiss?: ActionValue;
    onBeforeClose?: ActionValue;
    onClose?: ActionValue;
    closeReasonAttribute?: EditableValue<string>;
    position: PositionEnum;
    stackMode: StackModeEnum;
    maxVisible: number;
    width: number;
    coloredBackground: boolean;
    animation: AnimationEnum;
    swipeToDismiss: boolean;
}

export interface ToastProPreviewProps {
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
    trigger: TriggerEnum;
    showWhen: string;
    showAttribute: string;
    closeWhen: string;
    groupKey: string;
    variant: VariantEnum;
    variantExpression: string;
    title: string;
    message: string;
    showIcon: boolean;
    customIcon:
        | { type: "glyph"; iconClass: string }
        | { type: "image"; imageUrl: string; iconUrl: string }
        | { type: "icon"; iconClass: string }
        | undefined;
    useCustomContent: boolean;
    customContent: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
    customContentPlacement: CustomContentPlacementEnum;
    buttons: ButtonsPreviewType[];
    showCloseButton: boolean;
    closeButtonLabel: string;
    duration: string;
    pauseOnHover: boolean;
    pauseWhenHidden: boolean;
    showProgress: boolean;
    busy: string;
    onBeforeShow: {} | null;
    onShow: {} | null;
    onClick: {} | null;
    closeOnToastClick: boolean;
    onTimeout: {} | null;
    onDismiss: {} | null;
    onBeforeClose: {} | null;
    onClose: {} | null;
    closeReasonAttribute: string;
    position: PositionEnum;
    stackMode: StackModeEnum;
    maxVisible: number | null;
    width: number | null;
    coloredBackground: boolean;
    animation: AnimationEnum;
    swipeToDismiss: boolean;
}
