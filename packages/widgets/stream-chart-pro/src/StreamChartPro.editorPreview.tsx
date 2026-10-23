import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { StreamChartProPreviewProps } from "../typings/StreamChartProProps";
import { StreamView } from "./components/StreamView";
import { streamSettings } from "./model/fromProps";
import type { StreamPoint } from "./model/types";

const GROUPS: Array<[string, number, number]> = [
    ["Web", 30, 0.2],
    ["Mobile", 20, 0.9],
    ["Partners", 12, 1.7]
];

/** Twelve made-up months of three channels that rise and fall at different times. */
const SAMPLE: StreamPoint[] = GROUPS.flatMap(([group, base, phase]) =>
    Array.from({ length: 12 }, (_, month) => ({
        date: new Date(2026, month, 1),
        group,
        value: Math.round(base * (1.2 + Math.sin(month / 2 + phase)))
    }))
);

export function preview(props: StreamChartProPreviewProps): ReactElement {
    const height = props.height ?? 260;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-stream-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    return (
        <StreamView
            points={SAMPLE}
            settings={streamSettings({
                ...props,
                aggregation: "sum",
                period: "none",
                animation: false,
                animationDuration: 0
            })}
            theme={{
                preset: props.theme,
                palette: props.palette,
                customPalette: props.customPalette,
                themeJson: [props.themeJson],
                optionOverride: [props.optionOverride]
            }}
            renderer="svg"
            heightUnit={props.heightUnit === "fill" ? "pixels" : props.heightUnit}
            height={height}
            loading={false}
            emptyMessage="No data"
            className={props.class}
            style={props.styleObject}
        />
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/StreamChartPro.scss");
}
