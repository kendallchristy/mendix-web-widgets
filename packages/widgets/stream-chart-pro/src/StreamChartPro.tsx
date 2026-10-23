import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { StreamChartProContainerProps } from "../typings/StreamChartProProps";
import { StreamView } from "./components/StreamView";
import { isStreamDataLoading, readStreamPoints, settingsFromProps } from "./model/fromProps";
import "./ui/StreamChartPro.scss";

export function StreamChartPro(props: StreamChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isStreamDataLoading(props);
    const points = useMemo(() => (loading ? [] : readStreamPoints(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <StreamView
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
