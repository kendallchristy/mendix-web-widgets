import { ChartStatus, THEME_BUILDER_URL, previewNumber, sampleCategoryPoints } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { RadialBarChartProPreviewProps } from "../typings/RadialBarChartProProps";
import { RadialBarView } from "./components/RadialBarView";
import { radialBarSettings } from "./model/fromProps";

export function preview(props: RadialBarChartProPreviewProps): ReactElement {
    const height = props.height ?? 240;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-radial-bar-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const settings = radialBarSettings({
        ...props,
        maxValue: previewNumber(props.maxValue),
        animation: false,
        animationDuration: 0,
        drilldown: false
    });
    return (
        <RadialBarView
            points={sampleCategoryPoints(4)}
            settings={settings}
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
    return require("./ui/RadialBarChartPro.scss");
}
