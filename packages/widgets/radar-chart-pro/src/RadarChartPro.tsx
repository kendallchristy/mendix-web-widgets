import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { RadarChartProContainerProps } from "../typings/RadarChartProProps";
import { RadarView } from "./components/RadarView";
import { isRadarDataLoading, readRadarSeries, settingsFromProps } from "./model/fromProps";
import "./ui/RadarChartPro.scss";

export function RadarChartPro(props: RadarChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isRadarDataLoading(props);
    const series = useMemo(() => (loading ? [] : readRadarSeries(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <RadarView
            series={series}
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
