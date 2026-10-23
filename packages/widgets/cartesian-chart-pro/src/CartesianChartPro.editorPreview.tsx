import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { CartesianChartProPreviewProps } from "../typings/CartesianChartProProps";
import { ChartView } from "./components/ChartView";
import { styleFromProps } from "./model/fromProps";
import { sampleSeries } from "./model/sampleData";
import type { ChartSettings } from "./model/types";

// Expressions arrive as their source text in design mode, so only plain literals are shown.
function literal(text: string): string | undefined {
    const match = /^'(.*)'$/.exec(text.trim());
    return match ? match[1] : undefined;
}

export function preview(props: CartesianChartProPreviewProps): ReactElement {
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-cartesian-chart-pro" style={{ height: `${props.height ?? 240}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }

    const series = sampleSeries(
        props.series.map(s => ({
            name: s.seriesName,
            kind: s.seriesType,
            color: s.color,
            stack: s.stack,
            yAxisSide: s.yAxisSide
        }))
    );

    const settings: ChartSettings = {
        title: props.title || undefined,
        subtitle: props.subtitle || undefined,
        titleAlign: props.titleAlign,
        orientation: props.orientation,
        showXAxis: props.showXAxis,
        showYAxis: props.showYAxis,
        xAxisTitle: props.xAxisTitle || undefined,
        yAxisTitle: props.yAxisTitle || undefined,
        yAxisScale: props.yAxisScale,
        numberFormat: {
            decimals: props.decimals ?? -1,
            prefix: props.prefix,
            suffix: props.suffix,
            thousandsSeparator: props.thousandsSeparator,
            compact: props.compactNumbers
        },
        drill: { kind: "none" },
        topLabel: "All",
        zoom: "none",
        highlightFrom: literal(props.highlightFrom),
        highlightTo: literal(props.highlightTo),
        style: {
            ...styleFromProps({
                ...props,
                lineWidth: props.lineWidth ?? 2.5,
                barRadius: props.barRadius ?? 4,
                barWidth: props.barWidth ?? 60,
                animationDuration: 0
            }),
            animation: false
        }
    };

    return (
        <ChartView
            series={series}
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
            height={props.height ?? 240}
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
    return require("./ui/CartesianChartPro.scss");
}
