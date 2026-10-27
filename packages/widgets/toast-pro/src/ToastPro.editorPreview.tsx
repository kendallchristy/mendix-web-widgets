import classNames from "classnames";
import type { ReactElement } from "react";

import type { ToastProPreviewProps } from "../typings/ToastProProps";
import { ToastContent, type ButtonStyle } from "./components/ToastContent";
import { fillSeconds } from "./core/text";
import type { Variant } from "./core/types";

export function preview(props: ToastProPreviewProps): ReactElement {
    const variant = props.variant.toLowerCase() as Variant;
    const ms = /^\d+$/.test(props.duration.trim()) ? Number(props.duration) : undefined;
    const text = (value: string): string => fillSeconds(value, ms);
    const Content = props.customContent.renderer;
    const icon = props.customIcon;

    return (
        <div className={classNames("widget-toast-pro-preview", props.class)} style={props.styleObject}>
            <div
                className={classNames("widget-toast-pro-toast", "tp-toast", `tp--${variant}`, {
                    "tp--colored": props.coloredBackground
                })}
                style={{ maxWidth: props.width ? `${props.width}px` : undefined }}
            >
                <ToastContent
                    variant={variant}
                    busy={false}
                    title={text(props.title) || (props.message ? undefined : "Toast Pro")}
                    message={text(props.message)}
                    icon={
                        !props.showIcon ? null : icon?.type === "image" ? (
                            <img className="tp-custom-icon" src={icon.imageUrl} alt="" />
                        ) : icon ? (
                            <span
                                className={classNames(
                                    "tp-custom-icon",
                                    { glyphicon: icon.type === "glyph" },
                                    icon.iconClass
                                )}
                            />
                        ) : undefined
                    }
                    customContent={
                        props.useCustomContent ? (
                            <Content caption="Custom content">
                                <div />
                            </Content>
                        ) : undefined
                    }
                    replaceText={props.customContentPlacement === "REPLACE"}
                    buttons={props.buttons.map((button, index) => ({
                        key: String(index),
                        caption: text(button.caption) || "Button",
                        style: button.buttonStyle.toLowerCase() as ButtonStyle
                    }))}
                    closeLabel={props.showCloseButton ? "Close" : undefined}
                />
                {props.showProgress && props.duration.trim() !== "" && props.duration.trim() !== "0" && (
                    <div className="tp-toast__progress">
                        <div className="tp-toast__progress-bar" style={{ transform: "scaleX(0.6)" }} />
                    </div>
                )}
            </div>
        </div>
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/ToastPro.scss");
}
