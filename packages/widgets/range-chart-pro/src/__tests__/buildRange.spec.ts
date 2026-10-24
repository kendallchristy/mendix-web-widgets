import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildRange, dateStep, formatDuration, orderCategories } from "../model/buildRange";
import { rangeSettings } from "../model/fromProps";
import type { RangePoint } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    sortOrder: "data",
    rangeStyle: "bars",
    orientation: "horizontal",
    valueLabels: "off",
    labelStyle: "plain",
    showCategoryAxis: true,
    showValueAxis: true,
    dateFormat: "",
    prefix: "",
    suffix: "",
    thousandsSeparator: true,
    compactNumbers: false,
    glow: "soft",
    gridlines: "vertical",
    legend: "auto",
    tooltip: "card",
    figuresFont: "mono",
    animation: false,
    background: "transparent",
    barWidth: 60,
    cornerRadius: 4,
    dotSize: 12,
    decimals: -1,
    animationDuration: 0
} as const;

const points: RangePoint[] = [
    { category: "Beta", low: 20, high: 50 },
    { category: "Alpha", low: 10, high: 90 },
    { category: "Gamma", low: 5, high: 15 }
];

const build = (overrides: Record<string, unknown> = {}, data = points) =>
    buildRange(data, rangeSettings({ ...values, ...overrides } as any), HYPER_LIGHT);

/** A fake ECharts API: one pixel per unit along the value axis, and 40 pixels per category. */
const api = (row: number[]) => ({
    value: (i: number) => row[i],
    coord: ([a, b]: number[]) => [a, b * 40 + 20],
    size: () => [1, 40]
});

describe("buildRange", () => {
    it("orders categories by data, name, earliest start or longest span", () => {
        expect(orderCategories(points, "data")).toEqual(["Beta", "Alpha", "Gamma"]);
        expect(orderCategories(points, "name")).toEqual(["Alpha", "Beta", "Gamma"]);
        expect(orderCategories(points, "start")).toEqual(["Gamma", "Alpha", "Beta"]);
        expect(orderCategories(points, "span")).toEqual(["Alpha", "Beta", "Gamma"]);
    });

    it("draws one custom series on a category and a value axis", () => {
        const { option, table, pointCount } = build();
        const series = option.series as any[];
        expect(series).toHaveLength(1);
        expect(series[0].type).toBe("custom");
        expect(series[0].data[0]).toEqual([0, 20, 50, 0]);
        expect((option.yAxis as any).data).toEqual(["Beta", "Alpha", "Gamma"]);
        expect((option.xAxis as any).type).toBe("value");
        expect((option.legend as any).show).toBe(false);
        expect(table.rows[0]).toEqual(["Beta", "20", "50", "30"]);
        expect(pointCount).toBe(3);
    });

    it("draws a rounded bar across the range", () => {
        const item = (build().option.series as any[])[0].renderItem(null, api([0, 20, 50, 0]));
        expect(item.children[0]).toMatchObject({ type: "rect", shape: { x: 20, width: 30, height: 24, r: 4 } });
    });

    it("draws dumbbells with end labels", () => {
        const item = (build({ rangeStyle: "dumbbell", valueLabels: "ends" }).option.series as any[])[0].renderItem(
            null,
            api([0, 20, 50, 0])
        );
        expect(item.children.map((c: any) => c.type)).toEqual(["line", "circle", "circle", "text", "text"]);
        expect(item.children[3].style).toMatchObject({ text: "20", align: "right" });
        expect(item.children[4].style).toMatchObject({ text: "50", align: "left" });
    });

    it("splits groups into series side by side and shows a legend", () => {
        const grouped: RangePoint[] = [
            { category: "A", low: 1, high: 4, group: "Planned" },
            { category: "A", low: 2, high: 6, group: "Actual" }
        ];
        const { option } = build({}, grouped);
        const series = option.series as any[];
        expect(series.map(s => s.name)).toEqual(["Planned", "Actual"]);
        expect((option.legend as any).show).toBe(true);
        const first = series[0].renderItem(null, api([0, 1, 4, 0])).children[0].shape;
        const second = series[1].renderItem(null, api([0, 2, 6, 1])).children[0].shape;
        expect(first.y).toBeLessThan(second.y);
    });

    it("steps date axes by whole days or weeks and shows lengths of time", () => {
        const dated: RangePoint[] = [{ category: "Build", low: new Date(2026, 0, 1), high: new Date(2026, 0, 13) }];
        const { option, table } = build({ valueLabels: "span" }, dated);
        const axis = option.xAxis as any;
        expect(axis.interval).toBe(dateStep(axis.max - axis.min, 3));
        expect(axis.min).toBe(new Date(2026, 0, 1).getTime());
        expect(axis.max).toBeGreaterThan(new Date(2026, 0, 13).getTime());
        expect(axis.axisLabel.formatter(new Date(2026, 0, 8).getTime())).toBe("Jan 8");
        expect(table.rows[0][3]).toBe("12 days");
        expect(formatDuration(5 * 3600000, "en-US")).toBe("5 hours");
        expect(dateStep(12 * 86400000, 4)).toBe(7 * 86400000);
    });

    it("makes room at the ends of the value axis for labels", () => {
        const gaps = (overrides: Record<string, unknown>) => (build(overrides).option.xAxis as any).boundaryGap;
        expect(gaps({})).toEqual(["0.0%", "0.0%"]);
        const [before, after] = gaps({ valueLabels: "ends" }).map(parseFloat);
        expect(before).toBeGreaterThan(0);
        expect(after).toBeGreaterThan(0);
        expect(parseFloat(gaps({ valueLabels: "span" })[0])).toBe(0);
    });

    it("lays vertical ranges out on a vertical value axis", () => {
        const { option } = build({ orientation: "vertical" });
        expect((option.xAxis as any).type).toBe("category");
        expect((option.yAxis as any).type).toBe("value");
    });
});
