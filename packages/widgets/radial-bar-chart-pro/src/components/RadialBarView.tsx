import type {
    CategoryPoint,
    ChartTokens,
    DrillStep,
    ElementSize,
    HeightUnit,
    ThemeSettings
} from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildRadialBar } from "../model/buildRadialBar";
import type { RadialBarSettings } from "../model/types";
import "../registerCharts";

export interface RadialBarViewProps {
    points: CategoryPoint[];
    settings: RadialBarSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function RadialBarView(props: RadialBarViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, path: Array<DrillStep<string>>, size: ElementSize) =>
            buildRadialBar(points, settings, tokens, path, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-radial-bar-chart-pro"
            build={build}
            measure
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Radial bar data"}
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
