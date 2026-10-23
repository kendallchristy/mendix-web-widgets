import type { ChartTokens, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildRadar } from "../model/buildRadar";
import type { RadarSeries, RadarSettings } from "../model/types";
import "../registerCharts";

export interface RadarViewProps {
    series: RadarSeries[];
    settings: RadarSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function RadarView(props: RadarViewProps): ReactElement {
    const { series, settings } = props;
    const build = useCallback((tokens: ChartTokens) => buildRadar(series, settings, tokens), [series, settings]);
    return (
        <ChartFrame
            widgetClass="widget-radar-chart-pro"
            build={build}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Radar data"}
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
