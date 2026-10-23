import type { ChartTokens, ElementSize, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildRange } from "../model/buildRange";
import type { RangePoint, RangeSettings } from "../model/types";
import "../registerCharts";

export interface RangeViewProps {
    points: RangePoint[];
    settings: RangeSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function RangeView(props: RangeViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, _path: unknown, size: ElementSize) => buildRange(points, settings, tokens, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-range-chart-pro"
            build={build}
            // Room for the value labels and the date steps depend on the chart's size.
            measure
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Range data"}
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
