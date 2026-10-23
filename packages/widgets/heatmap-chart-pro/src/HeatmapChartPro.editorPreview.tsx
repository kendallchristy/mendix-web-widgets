import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { HeatmapChartProPreviewProps } from "../typings/HeatmapChartProProps";
import { HeatmapView } from "./components/HeatmapView";
import { heatmapSettings } from "./model/fromProps";
import type { HeatPoint } from "./model/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["9:00", "11:00", "13:00", "15:00", "17:00"];

/** A fixed, made-up pattern: busier mid-week and around lunch. */
function samplePoints(calendar: boolean): HeatPoint[] {
    if (calendar) {
        return Array.from({ length: 120 }, (_, i) => ({
            x: new Date(2026, 0, 1 + i),
            value: Math.round(4 + 6 * Math.abs(Math.sin(i * 0.7)) + (i % 7 < 5 ? 3 : 0))
        }));
    }
    return DAYS.flatMap((day, d) =>
        HOURS.map((hour, h) => ({ x: day, y: hour, value: 10 + ((d * 7 + h * 11) % 23) + (h === 2 ? 12 : 0) }))
    );
}

export function preview(props: HeatmapChartProPreviewProps): ReactElement {
    const height = props.height ?? 260;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-heatmap-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    return (
        <HeatmapView
            points={samplePoints(props.layout === "calendar")}
            settings={heatmapSettings({
                ...props,
                aggregation: "sum",
                scaleMin: undefined,
                scaleMax: undefined,
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
    return require("./ui/HeatmapChartPro.scss");
}
