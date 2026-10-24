import type { ChartTokens, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildCustom } from "../model/buildCustom";
import type { CustomSettings, DataSet } from "../model/types";
import "../registerCharts";

export interface CustomViewProps {
    dataSets: DataSet[];
    settings: CustomSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    /** Why the map didn't load, when it didn't. */
    mapError?: string;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function CustomView(props: CustomViewProps): ReactElement {
    const { dataSets, settings, mapError } = props;
    const build = useCallback(
        (tokens: ChartTokens) => {
            const built = buildCustom(dataSets, settings, tokens);
            return mapError ? { ...built, errors: [...(built.errors ?? []), mapError] } : built;
        },
        [dataSets, settings, mapError]
    );
    return (
        <ChartFrame
            widgetClass="widget-custom-chart-pro"
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
