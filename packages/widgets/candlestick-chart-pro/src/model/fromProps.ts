import type { ChartStyle } from "@kendallchristy/chart-core";
import { defaultChartStyle, isAnyLoading, numberFormatFromProps, readNumber } from "@kendallchristy/chart-core";
import type { ObjectItem } from "mendix";

import type {
    CandlestickChartProContainerProps,
    CandlestickChartProPreviewProps
} from "../../typings/CandlestickChartProProps";
import type { Candle, CandlestickSettings } from "./types";

type SharedProps = Pick<
    CandlestickChartProPreviewProps,
    | "titleAlign"
    | "candleStyle"
    | "risingColor"
    | "fallingColor"
    | "movingAverages"
    | "showXAxis"
    | "showYAxis"
    | "dateFormat"
    | "zoom"
    | "prefix"
    | "suffix"
    | "thousandsSeparator"
    | "compactNumbers"
    | "gridlines"
    | "legend"
    | "tooltip"
    | "figuresFont"
    | "animation"
    | "background"
>;

interface Values extends SharedProps {
    volumeHeight: number | null;
    decimals: number | null;
    animationDuration: number | null;
    title?: string;
    subtitle?: string;
    yAxisTitle?: string;
}

/** The moving average periods from text such as "5, 20". Anything that isn't a whole number over 1 is skipped. */
export function parsePeriods(text: string | undefined): number[] {
    return Array.from(
        new Set(
            (text ?? "")
                .split(/[,;\s]+/)
                .map(part => Number(part))
                .filter(n => Number.isInteger(n) && n > 1)
        )
    );
}

/** Candlestick settings from property values; shared by the widget and its design-mode preview. */
export function candlestickSettings(values: Values): CandlestickSettings {
    const style: ChartStyle = {
        ...defaultChartStyle,
        gridlines: values.gridlines,
        legend: values.legend,
        tooltip: values.tooltip,
        figuresFont: values.figuresFont,
        animation: values.animation,
        animationDuration: values.animationDuration ?? 600,
        background: values.background
    };
    return {
        title: values.title || undefined,
        subtitle: values.subtitle || undefined,
        titleAlign: values.titleAlign,
        candleStyle: values.candleStyle,
        risingColor: values.risingColor?.trim() || undefined,
        fallingColor: values.fallingColor?.trim() || undefined,
        movingAverages: parsePeriods(values.movingAverages),
        volumeHeight: Math.max(5, Math.min(60, values.volumeHeight ?? 20)),
        showXAxis: values.showXAxis,
        showYAxis: values.showYAxis,
        yAxisTitle: values.yAxisTitle || undefined,
        dateFormat: values.dateFormat?.trim() || undefined,
        zoom: values.zoom,
        numberFormat: numberFormatFromProps(values),
        style
    };
}

export function settingsFromProps(props: CandlestickChartProContainerProps): CandlestickSettings {
    return candlestickSettings({
        ...props,
        title: props.title?.value,
        subtitle: props.subtitle?.value,
        yAxisTitle: props.yAxisTitle?.value
    });
}

/** Reads the periods. Objects without a date or any of the four prices are left out. Dates are sorted. */
export function readCandles(props: CandlestickChartProContainerProps): Candle[] {
    const items: ObjectItem[] = props.dataSource.items ?? [];
    const candles: Candle[] = [];
    const { tooltipText, onClick } = props;
    for (const item of items) {
        const raw = props.dateAttribute.get(item);
        const date = raw.value instanceof Date ? raw.value : raw.displayValue || raw.value || undefined;
        const open = readNumber(props.openAttribute, item);
        const high = readNumber(props.highAttribute, item);
        const low = readNumber(props.lowAttribute, item);
        const close = readNumber(props.closeAttribute, item);
        if (
            date === undefined ||
            open === undefined ||
            high === undefined ||
            low === undefined ||
            close === undefined
        ) {
            continue;
        }
        candles.push({
            date,
            open,
            high,
            low,
            close,
            volume: readNumber(props.volumeAttribute, item),
            get tooltip() {
                return tooltipText?.get(item).value || undefined;
            },
            get action() {
                return onClick?.get(item);
            }
        });
    }
    return sortCandles(candles);
}

/** Dated periods in time order; named periods keep the data source order. */
export function sortCandles(candles: Candle[]): Candle[] {
    return candles.every(c => c.date instanceof Date)
        ? [...candles].sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime())
        : candles;
}

export function isCandleDataLoading(props: Pick<CandlestickChartProContainerProps, "dataSource">): boolean {
    return isAnyLoading([props.dataSource]);
}
