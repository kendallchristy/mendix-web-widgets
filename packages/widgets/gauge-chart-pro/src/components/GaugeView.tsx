import type { ChartTokens, ElementSize, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildGauge } from "../model/buildGauge";
import type { GaugeSettings } from "../model/types";
import "../registerCharts";

export interface GaugeViewProps {
    settings: GaugeSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function GaugeView(props: GaugeViewProps): ReactElement {
    const { settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, _path: unknown[], size: ElementSize) => buildGauge(settings, tokens, [], size),
        [settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-gauge-chart-pro"
            build={build}
            measure
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? settings.caption ?? "Gauge"}
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
