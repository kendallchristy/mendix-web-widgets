import type { CategoryPoint } from "@kendallchristy/chart-core";
import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { BubbleClusterChartProPreviewProps } from "../typings/BubbleClusterChartProProps";
import { BubbleView } from "./components/BubbleView";
import { bubbleSettings } from "./model/fromProps";

const SAMPLE: Array<[string, number, string]> = [
    ["Laptops", 420, "Hardware"],
    ["Phones", 360, "Hardware"],
    ["Monitors", 180, "Hardware"],
    ["Docks", 90, "Hardware"],
    ["Support", 310, "Services"],
    ["Training", 140, "Services"],
    ["Setup", 80, "Services"],
    ["Licences", 260, "Software"],
    ["Add-ons", 120, "Software"],
    ["Cloud", 200, "Software"]
];

/** Believable sample bubbles, grouped when the widget has a Group attribute. */
function samplePoints(grouped: boolean): CategoryPoint[] {
    return SAMPLE.map(([category, value, group]) => ({
        category,
        value,
        group: grouped ? group : undefined,
        drill: []
    }));
}

export function preview(props: BubbleClusterChartProPreviewProps): ReactElement {
    const height = props.height ?? 240;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-bubble-cluster-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const settings = bubbleSettings({ ...props, animation: false, animationDuration: 0, drilldown: false });
    return (
        <BubbleView
            points={samplePoints(Boolean(props.groupAttribute))}
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
    return require("./ui/BubbleClusterChartPro.scss");
}
