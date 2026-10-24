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

import { buildBubbles } from "../model/buildBubbles";
import type { BubbleSettings } from "../model/types";
import "../registerCharts";

export interface BubbleViewProps {
    points: CategoryPoint[];
    settings: BubbleSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function BubbleView(props: BubbleViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, path: Array<DrillStep<string>>, size: ElementSize) =>
            buildBubbles(points, settings, tokens, path, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-bubble-cluster-chart-pro"
            build={build}
            // The bubbles are packed to fill the chart, so the layout depends on its size.
            measure
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Bubble chart data"}
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
