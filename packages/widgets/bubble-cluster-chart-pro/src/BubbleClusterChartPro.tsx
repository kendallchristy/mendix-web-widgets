import { isCategoryDataLoading, readCategoryPoints, themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { BubbleClusterChartProContainerProps } from "../typings/BubbleClusterChartProProps";
import { BubbleView } from "./components/BubbleView";
import { settingsFromProps } from "./model/fromProps";
import "./ui/BubbleClusterChartPro.scss";

export function BubbleClusterChartPro(props: BubbleClusterChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isCategoryDataLoading(props);
    const points = useMemo(() => (loading ? [] : readCategoryPoints(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <BubbleView
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
