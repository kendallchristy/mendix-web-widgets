import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { RangeChartProPreviewProps } from "../typings/RangeChartProProps";
import { RangeView } from "./components/RangeView";
import { rangeSettings } from "./model/fromProps";
import type { RangePoint } from "./model/types";

const SAMPLE: Array<[string, number, number]> = [
    ["Mon", 12, 21],
    ["Tue", 14, 24],
    ["Wed", 11, 19],
    ["Thu", 9, 17],
    ["Fri", 13, 26]
];

export function preview(props: RangeChartProPreviewProps): ReactElement {
    const height = props.height ?? 240;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-range-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const points: RangePoint[] = SAMPLE.map(([category, low, high]) => ({ category, low, high }));
    return (
        <RangeView
            points={points}
            settings={rangeSettings({ ...props, animation: false, animationDuration: 0 })}
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
    return require("./ui/RangeChartPro.scss");
}
