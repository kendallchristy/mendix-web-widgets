import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { RangeChartProContainerProps } from "../typings/RangeChartProProps";
import { RangeView } from "./components/RangeView";
import { isRangeDataLoading, readRangePoints, settingsFromProps } from "./model/fromProps";
import "./ui/RangeChartPro.scss";

export function RangeChartPro(props: RangeChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isRangeDataLoading(props);
    const points = useMemo(() => (loading ? [] : readRangePoints(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <RangeView
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
