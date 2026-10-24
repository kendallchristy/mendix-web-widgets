import type { ChartTokens, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildStream } from "../model/buildStream";
import type { StreamPoint, StreamSettings } from "../model/types";
import "../registerCharts";

export interface StreamViewProps {
    points: StreamPoint[];
    settings: StreamSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function StreamView(props: StreamViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback((tokens: ChartTokens) => buildStream(points, settings, tokens), [points, settings]);
    return (
        <ChartFrame
            widgetClass="widget-stream-chart-pro"
            build={build}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Stream data"}
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
