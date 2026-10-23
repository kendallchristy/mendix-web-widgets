import { themeSettingsFromProps } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { CandlestickChartProContainerProps } from "../typings/CandlestickChartProProps";
import { CandlestickView } from "./components/CandlestickView";
import { isCandleDataLoading, readCandles, settingsFromProps } from "./model/fromProps";
import "./ui/CandlestickChartPro.scss";

export function CandlestickChartPro(props: CandlestickChartProContainerProps): ReactElement {
    // Mendix hands over new props objects whenever data or expressions change, so these recompute only then.
    // Nothing is read until the data source has loaded.
    const loading = isCandleDataLoading(props);
    const candles = useMemo(() => (loading ? [] : readCandles(props)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <CandlestickView
            candles={candles}
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
