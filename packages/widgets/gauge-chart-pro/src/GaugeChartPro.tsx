import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { GaugeChartProContainerProps } from "../typings/GaugeChartProProps";
import { GaugeView } from "./components/GaugeView";
import { isLoading, settingsFromProps } from "./model/fromProps";
import "./ui/GaugeChartPro.scss";

export function GaugeChartPro(props: GaugeChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever an expression changes, so this recomputes only then.
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <GaugeView
            settings={settings}
            theme={themeSettingsFromProps(props)}
            renderer={props.renderer}
            heightUnit={props.heightUnit}
            height={props.height}
            loading={isLoading(props)}
            emptyMessage={props.emptyMessage?.value ?? "No data"}
            className={props.class}
            style={props.style}
        />
    );
}
