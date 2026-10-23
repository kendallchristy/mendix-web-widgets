import { ChartStatus, THEME_BUILDER_URL, previewNumber } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { GaugeChartProPreviewProps } from "../typings/GaugeChartProProps";
import { GaugeView } from "./components/GaugeView";
import { gaugeSettings } from "./model/fromProps";

export function preview(props: GaugeChartProPreviewProps): ReactElement {
    const height = props.height ?? 200;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-gauge-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    const min = previewNumber(props.minValue) ?? 0;
    const max = previewNumber(props.maxValue) ?? 100;
    const settings = gaugeSettings({
        ...props,
        // An attribute's value isn't known in design mode, so the preview shows the gauge two-thirds full.
        value: previewNumber(props.value) ?? min + (max - min) * 0.66,
        min,
        max,
        target: previewNumber(props.targetValue),
        bands: props.bands.flatMap(band => {
            const to = previewNumber(band.bandTo);
            return to === undefined ? [] : [{ to, color: band.bandColor.trim(), label: band.bandLabel }];
        }),
        title: props.title,
        subtitle: props.subtitle,
        caption: props.valueCaption,
        animation: false,
        animationDuration: 0
    });
    return (
        <GaugeView
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
    return require("./ui/GaugeChartPro.scss");
}
