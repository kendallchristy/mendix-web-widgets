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

import { buildPie } from "../model/buildPie";
import type { PieSettings } from "../model/types";
import "../registerCharts";

export interface PieViewProps {
    points: CategoryPoint[];
    settings: PieSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function PieView(props: PieViewProps): ReactElement {
    const { points, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens, path: Array<DrillStep<string>>, size: ElementSize) =>
            buildPie(points, settings, tokens, path, size),
        [points, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-pie-chart-pro"
            build={build}
            measure={settings.shape !== "pie"}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Pie chart data"}
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
