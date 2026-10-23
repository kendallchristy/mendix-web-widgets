import type { BuiltChart, ChartTokens, ClickTarget, TooltipParam } from "@kendallchristy/chart-core";
import {
    baseOption,
    createNumberFormatter,
    createPercentFormatter,
    createTooltipFormatter,
    formatDateLabel,
    gridOption,
    legendOption,
    legendPlacement,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { Candle, CandlestickSettings } from "./types";

/** Above this many periods ECharts draws candles in its faster large mode. */
export const LARGE_SERIES = 2000;

// ECharts hands custom series an untyped API; these are the parts renderItem uses.
interface RenderApi {
    value: (dimension: number) => number;
    coord: (values: number[]) => number[];
    size: (values: number[]) => number[];
}

/** The average close over the last `period` candles, or null until there are enough. */
export function movingAverage(candles: Candle[], period: number): Array<number | null> {
    let sum = 0;
    return candles.map((candle, i) => {
        sum += candle.close;
        if (i >= period) {
            sum -= candles[i - period].close;
        }
        return i >= period - 1 ? sum / period : null;
    });
}

export function buildCandlestick(
    candles: Candle[],
    settings: CandlestickSettings,
    tokens: ChartTokens,
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const formatChange = createPercentFormatter(1, locale);
    const rising = settings.risingColor ?? tokens.up;
    const falling = settings.fallingColor ?? tokens.down;
    const large = candles.length > LARGE_SERIES;

    const dates = candles.map(c => c.date).filter((d): d is Date => d instanceof Date);
    const showYear = new Set(dates.map(d => d.getFullYear())).size > 1;
    const showTime = dates.some(d => d.getHours() !== 0 || d.getMinutes() !== 0);
    const labels = candles.map(c =>
        c.date instanceof Date
            ? formatDateLabel(c.date, { template: settings.dateFormat, showYear, showTime }, locale)
            : c.date
    );

    const priceName = settings.title ?? "Price";
    const averageColors = tokens.palette.filter(color => color !== rising && color !== falling);
    const averages = settings.movingAverages.map((period, i) => ({
        name: `MA ${period}`,
        color: averageColors[i % averageColors.length] ?? tokens.label,
        values: movingAverage(candles, period)
    }));
    const hasVolume = candles.some(c => c.volume !== undefined);

    const verticalLines = style.gridlines === "vertical" || style.gridlines === "both";
    const horizontalLines = style.gridlines === "horizontal" || style.gridlines === "both";

    const ohlcRenderItem = (_params: unknown, api: RenderApi): Record<string, unknown> => {
        const index = api.value(0);
        const open = api.value(1);
        const close = api.value(2);
        const [x, openY] = api.coord([index, open]);
        const closeY = api.coord([index, close])[1];
        const lowY = api.coord([index, api.value(3)])[1];
        const highY = api.coord([index, api.value(4)])[1];
        const tick = Math.max(2, Math.min(8, api.size([1, 0])[0] * 0.3));
        const stroke = { stroke: close >= open ? rising : falling, lineWidth: 1.5 };
        return {
            type: "group",
            children: [
                { type: "line", shape: { x1: x, y1: lowY, x2: x, y2: highY }, style: stroke },
                { type: "line", shape: { x1: x - tick, y1: openY, x2: x, y2: openY }, style: stroke },
                { type: "line", shape: { x1: x, y1: closeY, x2: x + tick, y2: closeY }, style: stroke }
            ]
        };
    };

    const priceSeries =
        settings.candleStyle === "candles"
            ? {
                  type: "candlestick",
                  name: priceName,
                  large,
                  largeThreshold: LARGE_SERIES,
                  barMaxWidth: 14,
                  itemStyle: {
                      color: rising,
                      color0: falling,
                      borderColor: rising,
                      borderColor0: falling,
                      borderWidth: 1.5
                  },
                  // ECharts orders candlestick values open, close, lowest, highest.
                  data: candles.map(c => [c.open, c.close, c.low, c.high])
              }
            : {
                  type: "custom",
                  name: priceName,
                  renderItem: ohlcRenderItem,
                  dimensions: ["index", "open", "close", "low", "high"],
                  encode: { x: 0, y: [1, 2, 3, 4] },
                  itemStyle: { color: rising },
                  data: candles.map((c, i) => [i, c.open, c.close, c.low, c.high])
              };

    const series: Array<Record<string, unknown>> = [
        priceSeries,
        ...averages.map(average => ({
            type: "line",
            name: average.name,
            data: average.values,
            symbol: "none",
            smooth: false,
            lineStyle: { width: 1.5, color: average.color },
            itemStyle: { color: average.color },
            emphasis: { disabled: true }
        }))
    ];
    if (hasVolume) {
        series.push({
            type: "bar",
            name: "Volume",
            xAxisIndex: 1,
            yAxisIndex: 1,
            barMaxWidth: 14,
            large,
            data: candles.map(c => ({
                value: c.volume ?? 0,
                itemStyle: { color: withAlpha(c.close >= c.open ? rising : falling, 0.45), borderRadius: 2 }
            }))
        });
    }

    const placement = legendPlacement(style, averages.length + 1);
    const grid = gridOption(placement);
    const slider = settings.zoom === "slider" || settings.zoom === "both";
    const bottom = Number(grid.bottom) + (slider ? 40 : 0);
    const grids = hasVolume
        ? [
              { ...grid, bottom: `${settings.volumeHeight + 10}%` },
              { ...grid, top: undefined, bottom, height: `${settings.volumeHeight}%` }
          ]
        : [{ ...grid, bottom }];

    const dateAxis = (gridIndex: number, labelled: boolean): Record<string, unknown> => ({
        type: "category",
        gridIndex,
        data: labels,
        boundaryGap: true,
        axisLabel: { show: labelled && settings.showXAxis, hideOverlap: true },
        splitLine: { show: gridIndex === 0 && verticalLines }
    });
    const xAxis = hasVolume ? [dateAxis(0, false), dateAxis(1, true)] : [dateAxis(0, true)];
    const yAxis: Array<Record<string, unknown>> = [
        {
            type: "value",
            scale: true,
            name: settings.yAxisTitle,
            nameLocation: "middle",
            nameGap: 10,
            nameMoveOverlap: true,
            axisLabel: { show: settings.showYAxis, formatter: formatNumber, hideOverlap: true },
            splitLine: { show: horizontalLines }
        }
    ];
    if (hasVolume) {
        yAxis.push({
            type: "value",
            gridIndex: 1,
            splitNumber: 2,
            axisLabel: { show: false },
            splitLine: { show: false }
        });
    }

    const zoomAxes = { xAxisIndex: hasVolume ? [0, 1] : [0] };
    const dataZoom = [
        ...(settings.zoom === "inside" || settings.zoom === "both" ? [{ type: "inside", ...zoomAxes }] : []),
        ...(slider ? [{ type: "slider", ...zoomAxes, height: 24, bottom: 8 }] : [])
    ];

    const rows = createTooltipFormatter({
        tokens,
        style,
        formatValue: formatNumber,
        headerOf: param => param.name ?? "",
        nameOf: param => param.seriesName ?? "",
        colorOf: param => (typeof param.color === "string" ? param.color : undefined),
        tooltipOf: param => (param.data as { custom?: string } | undefined)?.custom
    });
    // One row per price, then the moving averages and volume of the hovered period.
    const tooltipFormatter = (input: TooltipParam | TooltipParam[]): string => {
        const params = Array.isArray(input) ? input : [input];
        const index = params[0]?.dataIndex;
        const candle = index === undefined ? undefined : candles[index];
        if (index === undefined || !candle) {
            return "";
        }
        const name = labels[index];
        const color = candle.close >= candle.open ? rising : falling;
        const custom = candle.tooltip;
        if (custom) {
            return rows([{ name, seriesName: "", value: 0, color, data: { custom } }]);
        }
        const change = candle.open === 0 ? "" : ` (${formatChange((candle.close - candle.open) / candle.open)})`;
        const prices: TooltipParam[] =
            style.tooltip === "pill"
                ? [{ name, seriesName: "Close", value: candle.close, color }]
                : [
                      { name, seriesName: "Open", value: candle.open, color },
                      { name, seriesName: "High", value: candle.high, color },
                      { name, seriesName: "Low", value: candle.low, color },
                      { name, seriesName: `Close${change}`, value: candle.close, color }
                  ];
        const extras: TooltipParam[] =
            style.tooltip === "pill"
                ? []
                : [
                      ...averages
                          .filter(a => a.values[index] !== null)
                          .map(a => ({ name, seriesName: a.name, value: a.values[index], color: a.color })),
                      ...(candle.volume !== undefined
                          ? [{ name, seriesName: "Volume", value: candle.volume, color: withAlpha(color, 0.45) }]
                          : [])
                  ];
        return rows([...prices, ...extras]);
    };

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: { ...legendOption(placement), data: [priceName, ...averages.map(a => a.name)] },
        grid: grids,
        tooltip: tooltipOption(tokens, style, "axis", tooltipFormatter),
        axisPointer: { link: [{ xAxisIndex: "all" }] },
        xAxis,
        yAxis,
        dataZoom,
        series
    };

    const targets: Array<ClickTarget<string>> = candles.map(c => ({
        // Read on click only.
        get action() {
            return c.action;
        }
    }));
    const clickTargets = series.map(s => (s.name === priceName || s.name === "Volume" ? targets : []));

    return {
        option,
        clickTargets,
        breadcrumb: [],
        table: {
            columns: hasVolume
                ? ["Date", "Open", "High", "Low", "Close", "Volume"]
                : ["Date", "Open", "High", "Low", "Close"],
            rows: candles.map((c, i) => {
                const row = [labels[i], ...[c.open, c.high, c.low, c.close].map(formatNumber)];
                return hasVolume ? [...row, formatNumber(c.volume)] : row;
            })
        },
        pointCount: candles.length
    };
}
