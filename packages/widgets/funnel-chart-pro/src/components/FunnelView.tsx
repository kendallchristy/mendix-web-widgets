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

import { buildFunnel } from "../model/buildFunnel";
import type { FunnelSettings } from "../model/types";
import "../registerCharts";

export interface FunnelViewProps {
    points: CategoryPoint[];
    settings: FunnelSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function FunnelView(props: FunnelViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, path: Array<DrillStep<string>>, size: ElementSize) =>
            buildFunnel(points, settings, tokens, path, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-funnel-chart-pro"
            build={build}
            measure={settings.orientation === "horizontal"}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Funnel data"}
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
