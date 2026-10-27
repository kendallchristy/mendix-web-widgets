import classNames from "classnames";
import type { ReactElement, ReactNode, Ref } from "react";

import type { Variant } from "../core/types";
import { CloseIcon, SpinnerIcon, VariantIcon } from "./Icons";

export type ButtonStyle = "primary" | "secondary" | "link";

export interface ToastButton {
    key: string;
    caption: string;
    style: ButtonStyle;
    onClick?(): void;
}

/** What a toast shows. Texts are final here: [seconds] has already been filled in. */
export interface ToastContentProps {
    variant: Variant;
    busy: boolean;
    title?: string;
    message?: string;
    /** undefined shows the variant's icon; null shows none. */
    icon?: ReactNode | null;
    customContent?: ReactNode;
    replaceText: boolean;
    buttons: ToastButton[];
    /** The close button's accessible label; undefined hides the button. */
    closeLabel?: string;
    onCloseClick?(): void;
    contentRef?: Ref<HTMLDivElement>;
}

export function ToastContent({
    variant,
    busy,
    title,
    message,
    icon,
    customContent,
    replaceText,
    buttons,
    closeLabel,
    onCloseClick,
    contentRef
}: ToastContentProps): ReactElement {
    const iconNode = busy ? <SpinnerIcon /> : icon === undefined ? <VariantIcon variant={variant} /> : icon;
    const showText = !replaceText || !customContent;

    return (
        <div className="tp-toast__inner" ref={contentRef}>
            <div className="tp-toast__main">
                {iconNode !== null && <div className="tp-toast__icon">{iconNode}</div>}
                <div className="tp-toast__text">
                    {showText && title && <div className="tp-toast__title">{title}</div>}
                    {showText && message && <div className="tp-toast__message">{message}</div>}
                    {customContent && <div className="tp-toast__custom">{customContent}</div>}
                </div>
                {closeLabel !== undefined && (
                    <button
                        type="button"
                        className="tp-toast__close"
                        aria-label={closeLabel}
                        title={closeLabel}
                        onClick={onCloseClick}
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>
            {buttons.length > 0 && (
                <div className={classNames("tp-toast__actions", { "tp-toast__actions--indent": iconNode !== null })}>
                    {buttons.map(button => (
                        <button
                            key={button.key}
                            type="button"
                            className={`tp-button tp-button--${button.style}`}
                            onClick={button.onClick}
                        >
                            {button.caption}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
