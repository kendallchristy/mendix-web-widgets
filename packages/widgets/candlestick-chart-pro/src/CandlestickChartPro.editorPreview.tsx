import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { CandlestickChartProPreviewProps } from "../typings/CandlestickChartProProps";
import { CandlestickView } from "./components/CandlestickView";
import { candlestickSettings } from "./model/fromProps";
import type { Candle } from "./model/types";

/** Thirty believable trading days, the same every time. */
function sampleCandles(withVolume: boolean): Candle[] {
    let close = 100;
    return Array.from({ length: 30 }, (_, i) => {
        const open = close;
        close = Math.round((open + Math.sin(i * 1.7) * 4 + 0.6) * 100) / 100;
        return {
            date: new Date(2026, 0, 5 + i + Math.floor(i / 5) * 2),
            open,
            close,
            high: Math.max(open, close) + 1.5 + (i % 3),
            low: Math.min(open, close) - 1.2 - (i % 2),
            volume: withVolume ? 1000 + ((i * 397) % 900) : undefined
        };
    });
}

export function preview(props: CandlestickChartProPreviewProps): ReactElement {
    const height = props.height ?? 300;
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return (
            <div className="hc-chart widget-candlestick-chart-pro" style={{ height: `${height}px` }}>
                <ChartStatus
                    kind="empty"
                    message={`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`}
                />
            </div>
        );
    }
    return (
        <CandlestickView
            candles={sampleCandles(Boolean(props.volumeAttribute))}
            settings={candlestickSettings({ ...props, animation: false, animationDuration: 0 })}
            theme={{
                preset: props.theme,
                palette: props.palette,
                customPalette: props.customPalette,
                themeJson: [props.themeJson],
                optionOverride: [props.optionOverride]
            }}
            renderer="svg"
            heightUnit={props.heightUnit === "fill" ? "pixels" : props.heightUnit}
            height={height}
            loading={false}
            emptyMessage="No data"
            className={props.class}
            style={props.styleObject}
        />
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/CandlestickChartPro.scss");
}
