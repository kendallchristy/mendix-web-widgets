import type { ChartTokens, ElementSize, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildHeatmap } from "../model/buildHeatmap";
import type { HeatPoint, HeatmapSettings } from "../model/types";
import "../registerCharts";

export interface HeatmapViewProps {
    points: HeatPoint[];
    settings: HeatmapSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function HeatmapView(props: HeatmapViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, _path: unknown, size: ElementSize) => buildHeatmap(points, settings, tokens, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-heatmap-chart-pro"
            build={build}
            // Cell sizes, and whether values fit in them, depend on the chart's size.
            measure
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Heatmap data"}
            renderer={props.renderer}
            heightUnit={props.heightUnit}
            height={props.height}
            loading={props.loading}
            emptyMessage={props.emptyMessage}
            className={props.className}
            style={props.style}
        />
    );
}
