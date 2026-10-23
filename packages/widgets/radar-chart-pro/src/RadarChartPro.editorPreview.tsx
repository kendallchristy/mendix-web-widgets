import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { RadarChartProPreviewProps } from "../typings/RadarChartProProps";
import { RadarView } from "./components/RadarView";
import { radarSettings } from "./model/fromProps";
import type { RadarSeries } from "./model/types";

const MEASURES = ["Speed", "Price", "Quality", "Support", "Range"];
const SAMPLE = [
    [80, 55, 90, 70, 60],
    [60, 85, 65, 80, 75],
    [70, 70, 75, 55, 90]
];

export function preview(props: RadarChartProPreviewProps): ReactElement {
    const height = props.height ?? 260;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-radar-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const configs = props.series.length > 0 ? props.series : [{ seriesName: "", color: "" }];
    const series: RadarSeries[] = configs.map((config, index) => ({
        name: config.seriesName || `Series ${index + 1}`,
        color: config.color.trim() || undefined,
        aggregation: "sum",
        points: MEASURES.map((indicator, i) => ({ indicator, value: SAMPLE[index % SAMPLE.length][i] }))
    }));
    return (
        <RadarView
            series={series}
            settings={radarSettings({ ...props, maxValue: undefined, animation: false, animationDuration: 0 })}
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
    return require("./ui/RadarChartPro.scss");
}
