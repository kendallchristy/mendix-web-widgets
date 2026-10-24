import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildCandlestick, movingAverage } from "../model/buildCandlestick";
import { candlestickSettings, parsePeriods, sortCandles } from "../model/fromProps";
import type { Candle } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    candleStyle: "candles",
    risingColor: "",
    fallingColor: "",
    movingAverages: "",
    showXAxis: true,
    showYAxis: true,
    dateFormat: "",
    zoom: "inside",
    prefix: "",
    suffix: "",
    thousandsSeparator: true,
    compactNumbers: false,
    gridlines: "horizontal",
    legend: "auto",
    tooltip: "card",
    figuresFont: "mono",
    animation: false,
    background: "transparent",
    volumeHeight: 20,
    decimals: -1,
    animationDuration: 0
} as const;

const candles: Candle[] = [
    { date: new Date(2026, 0, 5), open: 10, close: 12, high: 13, low: 9, volume: 100 },
    { date: new Date(2026, 0, 6), open: 12, close: 11, high: 12.5, low: 10, volume: 80 },
    { date: new Date(2026, 0, 7), open: 11, close: 14, high: 15, low: 11, volume: 120 }
];

const build = (overrides: Record<string, unknown> = {}, data = candles) =>
    buildCandlestick(data, candlestickSettings({ ...values, ...overrides } as any), HYPER_LIGHT, "en-US");

describe("buildCandlestick", () => {
    it("reads moving average periods and averages the close", () => {
        expect(parsePeriods("5, 20; x 1 5")).toEqual([5, 20]);
        expect(movingAverage(candles, 2)).toEqual([null, 11.5, 12.5]);
    });

    it("sorts dated periods and keeps named ones in order", () => {
        const shuffled = [candles[2], candles[0], candles[1]];
        expect(sortCandles(shuffled).map(c => c.close)).toEqual([12, 11, 14]);
        const named = shuffled.map((c, i) => ({ ...c, date: `P${3 - i}` }));
        expect(sortCandles(named).map(c => c.date)).toEqual(["P3", "P2", "P1"]);
    });

    it("draws candles in the Hyper up and down colours, with volume underneath", () => {
        const { option, table } = build();
        const series = option.series as any[];
        expect(series[0]).toMatchObject({
            type: "candlestick",
            data: [
                [10, 12, 9, 13],
                [12, 11, 10, 12.5],
                [11, 14, 11, 15]
            ]
        });
        expect(series[0].itemStyle).toMatchObject({ color: HYPER_LIGHT.up, color0: HYPER_LIGHT.down });
        expect(series[1]).toMatchObject({ type: "bar", xAxisIndex: 1, yAxisIndex: 1 });
        expect((option.grid as any[]).length).toBe(2);
        expect((option.xAxis as any[])[0].data).toEqual(["Jan 5", "Jan 6", "Jan 7"]);
        expect(table.columns).toContain("Volume");
        expect((option.dataZoom as any[])[0]).toMatchObject({ type: "inside", xAxisIndex: [0, 1] });
    });

    it("adds moving averages with a legend, and uses custom colours", () => {
        const { option } = build({ movingAverages: "2", risingColor: "#00AA00" });
        const series = option.series as any[];
        expect(series.map(s => s.name)).toEqual(["Price", "MA 2", "Volume"]);
        expect(series[0].itemStyle.color).toBe("#00AA00");
        expect((option.legend as any).show).toBe(true);
    });

    it("draws OHLC bars as ticks on a line", () => {
        const series = (
            build(
                { candleStyle: "ohlc" },
                candles.map(c => ({ ...c, volume: undefined }))
            ).option.series as any[]
        )[0];
        expect(series.type).toBe("custom");
        const item = series.renderItem(null, {
            value: (i: number) => [0, 10, 12, 9, 13][i],
            coord: ([x, y]: number[]) => [x * 10 + 5, 100 - y],
            size: () => [10, 0]
        });
        expect(item.children).toHaveLength(3);
        expect(item.children[0].style.stroke).toBe(HYPER_LIGHT.up);
    });

    it("shows every price of the hovered period in the tooltip", () => {
        const html = (build({ movingAverages: "2" }).option.tooltip as any).formatter([{ dataIndex: 1 }]);
        expect(html).toContain("Jan 6");
        for (const text of ["Open", "High", "Low", "Close (-8.3%)", "MA 2", "Volume", "11.5"]) {
            expect(html).toContain(text);
        }
    });
});
