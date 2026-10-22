import classNames from "classnames";
import type { CSSProperties, ReactElement } from "react";

export interface CaptionProps {
    className?: string;
    style?: CSSProperties;
    text: string;
}

export function Caption({ className, style, text }: CaptionProps): ReactElement {
    return (
        <div className={classNames("widget-template-widget", className)} style={style}>
            {text}
        </div>
    );
}
