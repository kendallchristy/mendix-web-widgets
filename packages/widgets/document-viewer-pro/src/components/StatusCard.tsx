import type { ReactElement, ReactNode } from "react";

import { Icon } from "./Icons";

export function LoadingState(props: { label: string; progress?: number }): ReactElement {
    const { progress } = props;
    return (
        <div className="dvp-status" role="status" aria-live="polite">
            <div className="dvp-skeleton" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
            </div>
            <div className="dvp-status-label">{props.label}</div>
            <div className="dvp-progress" aria-hidden="true">
                <div
                    className={
                        progress === undefined ? "dvp-progress-bar dvp-progress-bar--indeterminate" : "dvp-progress-bar"
                    }
                    style={progress === undefined ? undefined : { width: `${Math.round(progress * 100)}%` }}
                />
            </div>
        </div>
    );
}

export function MessageState(props: { icon: "alert" | "file"; message: string; children?: ReactNode }): ReactElement {
    return (
        <div className="dvp-status" role="alert">
            <div className="dvp-status-icon">
                <Icon name={props.icon} />
            </div>
            <div className="dvp-status-message">{props.message}</div>
            {props.children}
        </div>
    );
}
