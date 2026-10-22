import type { ReactElement } from "react";

export interface ChartStatusProps {
    kind: "loading" | "empty" | "error";
    message?: string;
}

/** Shown in place of the plot while data loads, when there's nothing to draw, or when the configuration is wrong. */
export function ChartStatus({ kind, message }: ChartStatusProps): ReactElement {
    if (kind === "loading") {
        return (
            <div className="hc-status hc-status--loading" role="status" aria-label="Loading chart">
                <div className="hc-status__shimmer" />
            </div>
        );
    }
    return (
        <div className={`hc-status hc-status--${kind}`} role={kind === "error" ? "alert" : "status"}>
            <span>{message}</span>
        </div>
    );
}
