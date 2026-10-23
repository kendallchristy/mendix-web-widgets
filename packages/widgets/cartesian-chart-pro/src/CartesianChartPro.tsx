import type { ReactElement } from "react";
import { useMemo } from "react";

import type { CartesianChartProContainerProps } from "../typings/CartesianChartProProps";
import { ChartView } from "./components/ChartView";
import { isLoading, seriesFromProps, settingsFromProps } from "./model/fromProps";
import "./ui/CartesianChartPro.scss";

export function CartesianChartPro(props: CartesianChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    const series = useMemo(() => seriesFromProps(props), [props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <ChartView
            series={series}
            settings={settings}
            theme={{
                preset: props.theme,
                palette: props.palette,
                customPalette: props.customPalette,
                themeJson: [props.themeJson, props.themeJsonExpression?.value],
                optionOverride: [props.optionOverride, props.optionOverrideExpression?.value]
            }}
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
