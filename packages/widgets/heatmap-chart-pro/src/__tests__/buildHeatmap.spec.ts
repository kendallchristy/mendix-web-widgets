import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { HYPER_SCALE, axisValues, buildHeatmap, colorAt, scaleColors } from "../model/buildHeatmap";
import { heatmapSettings } from "../model/fromProps";
import type { HeatPoint } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    layout: "grid",
    aggregation: "sum",
    cellLabels: true,
    dateFormat: "",
    colorScale: "hyper",
    customScale: "",
    reverseScale: false,
    showScale: true,
    prefix: "",
    suffix: "",
    thousandsSeparator: true,
    compactNumbers: false,
    tooltip: "card",
    figuresFont: "mono",
    animation: false,
    background: "transparent",
    cellGap: 2,
    cornerRadius: 3,
    decimals: -1,
    animationDuration: 0
} as const;

const points: HeatPoint[] = [
    { x: "Tue", y: "Morning", value: 4 },
    { x: "Mon", y: "Morning", value: 2 },
    { x: "Mon", y: "Morning", value: 3 },
    { x: "Mon", y: "Evening", value: 10 }
];

const size = { width: 600, height: 300 };
const build = (overrides: Record<string, unknown> = {}, data = points, at = size) =>
    buildHeatmap(data, heatmapSettings({ ...values, ...overrides } as any), HYPER_LIGHT, at);

describe("buildHeatmap", () => {
    it("orders text in first-seen order, and numbers and dates by value", () => {
        expect(axisValues(["b", "a", "b"], undefined).labels).toEqual(["b", "a"]);
        expect(axisValues([3, 1, 2], undefined).labels).toEqual(["1", "2", "3"]);
        const dates = axisValues([new Date(2026, 1, 2), new Date(2026, 0, 5)], "{d}/{M}");
        expect(dates.labels).toEqual(["5/1", "2/2"]);
    });

    it("combines objects in the same cell", () => {
        const option = build().option as any;
        expect(option.xAxis.data).toEqual(["Tue", "Mon"]);
        expect(option.yAxis.data).toEqual(["Morning", "Evening"]);
        expect(option.series[0].data.map((d: any) => d.value)).toEqual([
            [0, 0, 4],
            [1, 0, 5],
            [1, 1, 10]
        ]);
        expect(build({ aggregation: "count" }).option.series).toMatchObject([
            { data: [{ value: [0, 0, 1] }, { value: [1, 0, 2] }, { value: [1, 1, 1] }] }
        ]);
    });

    it("scales colours over the data, or the set minimum and maximum", () => {
        expect((build().option as any).visualMap).toMatchObject({ min: 4, max: 10, inRange: { color: HYPER_SCALE } });
        expect((build({ scaleMin: 0, scaleMax: 20 }).option as any).visualMap).toMatchObject({ min: 0, max: 20 });
        expect((build({}, [points[0]]).option as any).visualMap).toMatchObject({ min: 4, max: 5 });
    });

    it("builds custom, palette and reversed scales", () => {
        const settings = (overrides: Record<string, unknown>) => heatmapSettings({ ...values, ...overrides } as any);
        expect(scaleColors(settings({ colorScale: "custom", customScale: "#000000, #FFFFFF" }), HYPER_LIGHT)).toEqual([
            "#000000",
            "#FFFFFF"
        ]);
        expect(scaleColors(settings({ colorScale: "custom", customScale: "#000000" }), HYPER_LIGHT)).toEqual(
            HYPER_SCALE
        );
        expect(scaleColors(settings({ colorScale: "palette" }), HYPER_LIGHT)[1]).toBe(HYPER_LIGHT.palette[0]);
        expect(scaleColors(settings({ reverseScale: true }), HYPER_LIGHT)).toEqual([...HYPER_SCALE].reverse());
        expect(colorAt(["#000000", "#FFFFFF"], 0.5)).toBe("#808080");
    });

    it("shows values only in cells big enough for them", () => {
        const shown = (at: { width: number; height: number }) =>
            (build({}, points, at).option as any).series[0].data[0].label.show;
        expect(shown(size)).toBe(true);
        expect(shown({ width: 120, height: 300 })).toBe(false);
        expect((build({ cellLabels: false }).option as any).series[0].data[0].label.show).toBe(false);
    });

    it("lays out a calendar of days, one per year", () => {
        const days: HeatPoint[] = [
            { x: new Date(2025, 11, 30, 9), value: 1 },
            { x: new Date(2025, 11, 30, 17), value: 2 },
            { x: new Date(2026, 0, 2), value: 5 }
        ];
        const built = build({ layout: "calendar" }, days);
        const option = built.option as any;
        expect(option.calendar.map((c: any) => c.range)).toEqual([
            ["2025-12-30", "2025-12-30"],
            ["2026-01-02", "2026-01-02"]
        ]);
        expect(option.series.map((s: any) => s.data.map((d: any) => d.value))).toEqual([
            [["2025-12-30", 3]],
            [["2026-01-02", 5]]
        ]);
        expect(option.visualMap.dimension).toBe(1);
        expect(built.table.columns).toEqual(["Date", "Value"]);
        expect(built.clickTargets.map(t => t.length)).toEqual([1, 1]);
    });

    it("runs the first object's action and lists cells for screen readers", () => {
        const execute = jest.fn();
        const built = build({}, [{ x: "Mon", value: 1, action: { canExecute: true, execute } }]);
        built.clickTargets[0][0].action?.execute();
        expect(execute).toHaveBeenCalled();
        expect(built.table).toEqual({ columns: ["Column", "Value"], rows: [["Mon", "1"]] });
    });
});
