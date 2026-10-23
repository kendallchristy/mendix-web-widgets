import { isCategoryDataLoading, readCategoryPoints, themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { PieChartProContainerProps } from "../typings/PieChartProProps";
import { PieView } from "./components/PieView";
import { settingsFromProps } from "./model/fromProps";
import "./ui/PieChartPro.scss";

export function PieChartPro(props: PieChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isCategoryDataLoading(props);
    const points = useMemo(() => (loading ? [] : readCategoryPoints(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <PieView
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
