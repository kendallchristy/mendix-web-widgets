import type { ChartTokens, DrillStep, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildChart } from "../model/buildChart";
import "../registerCharts";
import type { ChartSettings, DrillValue, SeriesInput } from "../model/types";

export interface ChartViewProps {
    series: SeriesInput[];
    settings: ChartSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function ChartView(props: ChartViewProps): ReactElement {
    const { series, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, path: Array<DrillStep<DrillValue>>) => buildChart(series, settings, tokens, path),
        [series, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-cartesian-chart-pro"
            build={build}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Chart data"}
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
