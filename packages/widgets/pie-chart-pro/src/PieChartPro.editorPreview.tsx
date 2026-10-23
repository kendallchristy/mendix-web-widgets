import { ChartStatus, THEME_BUILDER_URL, sampleCategoryPoints } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { PieChartProPreviewProps } from "../typings/PieChartProProps";
import { PieView } from "./components/PieView";
import { pieSettings } from "./model/fromProps";

export function preview(props: PieChartProPreviewProps): ReactElement {
    const height = props.height ?? 240;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-pie-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const settings = pieSettings({ ...props, animation: false, animationDuration: 0, drilldown: false });
    return (
        <PieView
            points={sampleCategoryPoints()}
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
    return require("./ui/PieChartPro.scss");
}
