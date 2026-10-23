import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { HeatmapChartProContainerProps } from "../typings/HeatmapChartProProps";
import { HeatmapView } from "./components/HeatmapView";
import { isHeatDataLoading, readHeatPoints, settingsFromProps } from "./model/fromProps";
import "./ui/HeatmapChartPro.scss";

export function HeatmapChartPro(props: HeatmapChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isHeatDataLoading(props);
    const points = useMemo(() => (loading ? [] : readHeatPoints(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <HeatmapView
            points={points}
            settings={settings}
            theme={themeSettingsFromProps(props)}
            renderer={props.renderer}
            heightUnit={props.heightUnit}
            height={props.height}
            loading={loading}
            emptyMessage={props.emptyMessage?.value ?? "No data"}
            className={props.class}
            style={props.style}
        />
    );
}
