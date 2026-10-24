import type { ChartTokens, HeightUnit, ThemeSettings } from "@kendallchristy/chart-core";
import { ChartFrame } from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback } from "react";

import { buildCandlestick } from "../model/buildCandlestick";
import type { Candle, CandlestickSettings } from "../model/types";
import "../registerCharts";

export interface CandlestickViewProps {
    candles: Candle[];
    settings: CandlestickSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function CandlestickView(props: CandlestickViewProps): ReactElement {
    const { candles, settings } = props;
    const build = useCallback(
        (tokens: ChartTokens) => buildCandlestick(candles, settings, tokens),
        [candles, settings]
    );
    return (
        <ChartFrame
            widgetClass="widget-candlestick-chart-pro"
            build={build}
            theme={props.theme}
            chartStyle={settings.style}
            title={settings.title}
            subtitle={settings.subtitle}
            titleAlign={settings.titleAlign}
            caption={settings.title ?? "Price data"}
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
