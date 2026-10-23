import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { LARGE_SERIES, buildChart } from "../model/buildChart";
import { series, settings } from "./helpers";

// ECharts options are loosely typed JSON; the tests read into them freely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

const months = ["Jan", "Feb", "Mar", "Apr", "May"];
const monthly = (ys: number[]) => ys.map((y, i) => ({ x: months[i], y }));

const axisOf = (option: AnyRecord): AnyRecord => option.xAxis;

function seriesOf(option: AnyRecord): AnyRecord[] {
    return option.series as AnyRecord[];
}

// Points without their own style are plain [x, y] arrays; the rest are objects with a value.
const valuesOf = (s: AnyRecord): unknown[][] =>
    s.data.map((d: unknown) => (Array.isArray(d) ? d : (d as AnyRecord).value));
const itemsOf = (s: AnyRecord): AnyRecord[] => s.data.map((d: unknown) => (Array.isArray(d) ? {} : d));

describe("buildChart", () => {
    it("draws text X values on a category axis in first-seen order", () => {
        const { option, pointCount } = buildChart([series("Sales", monthly([1, 2, 3]))], settings(), HYPER_LIGHT, []);
        expect(axisOf(option)).toMatchObject({ type: "category", data: ["Jan", "Feb", "Mar"], boundaryGap: false });
        expect(seriesOf(option)[0]).toMatchObject({ type: "line", name: "Sales", color: HYPER_LIGHT.palette[0] });
        expect(valuesOf(seriesOf(option)[0])).toEqual([
            ["Jan", 1],
            ["Feb", 2],
            ["Mar", 3]
        ]);
        expect(pointCount).toBe(3);
    });

    it("uses a time axis for dates and sorts them", () => {
        const points = [
            { x: new Date(2026, 2, 1), y: 3 },
            { x: new Date(2026, 0, 1), y: 1 }
        ];
        const { option } = buildChart([series("S", points)], settings(), HYPER_LIGHT, []);
        expect(axisOf(option).type).toBe("time");
        expect(valuesOf(seriesOf(option)[0]).map(v => v[1])).toEqual([1, 3]);
    });

    it("aggregates points with the same X value", () => {
        const points = [
            { x: "A", y: 1 },
            { x: "A", y: 2 },
            { x: "B", y: 5 }
        ];
        const { option } = buildChart([series("S", points, { aggregation: "sum" })], settings(), HYPER_LIGHT, []);
        expect(valuesOf(seriesOf(option)[0])).toEqual([
            ["A", 3],
            ["B", 5]
        ]);
    });

    it("greys out bars outside the highlight range and labels its ends", () => {
        const { option } = buildChart(
            [series("S", monthly([1, 2, 3, 4, 5]), { kind: "bar" })],
            settings({ highlightFrom: "Feb", highlightTo: "Apr" }),
            HYPER_LIGHT,
            []
        );
        const data = itemsOf(seriesOf(option)[0]);
        expect(data.map(d => d.itemStyle?.color)).toEqual([
            HYPER_LIGHT.muted,
            undefined,
            undefined,
            undefined,
            HYPER_LIGHT.muted
        ]);
        expect(data.map(d => Boolean(d.label))).toEqual([false, true, false, true, false]);
    });

    it("colours a line's highlight range with a visual map", () => {
        const { option } = buildChart(
            [series("S", monthly([1, 2, 3, 4, 5]))],
            settings({ highlightFrom: "Feb", highlightTo: "Apr" }),
            HYPER_LIGHT,
            []
        );
        expect(option.visualMap).toEqual([
            expect.objectContaining({
                dimension: 0,
                seriesIndex: 0,
                pieces: [{ gte: 1, lte: 3, color: HYPER_LIGHT.palette[0] }]
            })
        ]);
        const data = itemsOf(seriesOf(option)[0]);
        expect(seriesOf(option)[0].symbol).toBe("none");
        expect(data.map(d => d.symbol)).toEqual([undefined, "circle", undefined, "circle", undefined]);
    });

    it("ignores a highlight that names an unknown category", () => {
        const { option } = buildChart(
            [series("S", monthly([1, 2]))],
            settings({ highlightFrom: "Nope" }),
            HYPER_LIGHT,
            []
        );
        expect(option.visualMap).toEqual([]);
    });

    it("swaps axes for horizontal charts and adds a right axis when asked", () => {
        const { option } = buildChart(
            [
                series("A", monthly([1, 2]), { kind: "bar" }),
                series("B", monthly([3, 4]), { kind: "bar", yAxisSide: "right" })
            ],
            settings({ orientation: "horizontal" }),
            HYPER_LIGHT,
            []
        );
        expect(option.yAxis).toMatchObject({ type: "category", inverse: true });
        expect(axisOf(option)).toHaveLength(2);
        expect(valuesOf(seriesOf(option)[0])[0]).toEqual([1, "Jan"]);
        expect(seriesOf(option)[1].xAxisIndex).toBe(1);
    });

    it("rounds only the outermost bar of a stack", () => {
        const { option } = buildChart(
            [
                series("A", monthly([1]), { kind: "bar", stack: "s" }),
                series("B", monthly([2]), { kind: "bar", stack: "s" })
            ],
            settings(),
            HYPER_LIGHT,
            []
        );
        expect(seriesOf(option).map(s => s.itemStyle.borderRadius)).toEqual([
            [0, 0, 0, 0],
            [4, 4, 0, 0]
        ]);
    });

    it("draws dot bars as pictorial bars and bubbles sized by value", () => {
        const { option } = buildChart(
            [
                series("Dots", monthly([1, 2]), { kind: "bar" }),
                series(
                    "Bubbles",
                    [
                        { x: 1, y: 1, size: 10 },
                        { x: 2, y: 2, size: 40 }
                    ],
                    { kind: "bubble" }
                )
            ],
            settings({ style: { barStyle: "dots" } as never }),
            HYPER_LIGHT,
            []
        );
        expect(seriesOf(option)[0].type).toBe("pictorialBar");
        const bubbles = seriesOf(option)[1];
        expect(bubbles.type).toBe("scatter");
        expect(bubbles.symbolSize([1, 1, 10])).toBeLessThan(bubbles.symbolSize([2, 2, 40]));
    });

    it("hides the legend for one series and shows it for more", () => {
        expect(buildChart([series("A", monthly([1]))], settings(), HYPER_LIGHT, []).option.legend).toEqual({
            show: false
        });
        expect(
            buildChart([series("A", monthly([1])), series("B", monthly([2]))], settings(), HYPER_LIGHT, []).option
                .legend
        ).toMatchObject({
            show: true
        });
    });

    it("lists every point for screen readers", () => {
        const { table } = buildChart(
            [series("A", monthly([1200]))],
            settings({ yAxisTitle: "Revenue" }),
            HYPER_LIGHT,
            []
        );
        expect(table.columns).toEqual(["Series", "X", "Revenue"]);
        expect(table.rows).toEqual([["A", "Jan", "1,200"]]);
    });

    describe("date drilldown", () => {
        const points = [
            { x: new Date(2025, 5, 1), y: 1 },
            { x: new Date(2026, 1, 10), y: 2 },
            { x: new Date(2026, 1, 20), y: 3 },
            { x: new Date(2026, 7, 1), y: 4 }
        ];
        const drill = settings({ drill: { kind: "date", from: "year", to: "month" } });

        it("starts with yearly totals and offers the next level", () => {
            const built = buildChart([series("S", points)], drill, HYPER_LIGHT, []);
            expect(axisOf(built.option).data).toEqual(["2025", "2026"]);
            expect(valuesOf(seriesOf(built.option)[0]).map(v => v[1])).toEqual([1, 9]);
            expect(built.breadcrumb).toEqual(["All"]);
            expect(built.clickTargets[0][1].drill).toEqual({
                label: "2026",
                value: { kind: "date", start: new Date(2026, 0, 1).getTime(), end: new Date(2027, 0, 1).getTime() }
            });
        });

        it("filters to the clicked range at the next level", () => {
            const year = buildChart([series("S", points)], drill, HYPER_LIGHT, []).clickTargets[0][1].drill!;
            const quarters = buildChart([series("S", points)], drill, HYPER_LIGHT, [year]);
            expect(axisOf(quarters.option).data).toEqual(["Q1", "Q3"]);
            expect(quarters.breadcrumb).toEqual(["All", "2026"]);

            const q1 = quarters.clickTargets[0][0].drill!;
            const months = buildChart([series("S", points)], drill, HYPER_LIGHT, [year, q1]);
            expect(valuesOf(seriesOf(months.option)[0])).toEqual([["Feb", 5]]);
            expect(months.clickTargets[0][0].drill).toBeUndefined();
        });

        it("falls back to a normal chart when X values aren't dates", () => {
            const built = buildChart([series("S", monthly([1]))], drill, HYPER_LIGHT, []);
            expect(built.breadcrumb).toEqual([]);
            expect(built.clickTargets[0][0].drill).toBeUndefined();
        });
    });

    describe("category drilldown", () => {
        const points = [
            { x: "Europe", y: 1, drill: ["France", "Paris"] },
            { x: "Europe", y: 2, drill: ["France", "Lyon"] },
            { x: "Europe", y: 4, drill: ["Spain", "Madrid"] },
            { x: "Asia", y: 8, drill: ["Japan", "Tokyo"] }
        ];
        const drill = settings({ drill: { kind: "category" } });

        it("regroups the clicked category by the next attribute", () => {
            const top = buildChart([series("S", points)], drill, HYPER_LIGHT, []);
            expect(axisOf(top.option).data).toEqual(["Europe", "Asia"]);
            const europe = top.clickTargets[0][0].drill!;
            expect(europe.value).toEqual({ kind: "category", value: "Europe" });

            const countries = buildChart([series("S", points)], drill, HYPER_LIGHT, [europe]);
            expect(valuesOf(seriesOf(countries.option)[0])).toEqual([
                ["France", 3],
                ["Spain", 4]
            ]);

            const cities = buildChart([series("S", points)], drill, HYPER_LIGHT, [
                europe,
                countries.clickTargets[0][0].drill!
            ]);
            expect(axisOf(cities.option).data).toEqual(["Paris", "Lyon"]);
            expect(cities.clickTargets[0][0].drill).toBeUndefined();
        });

        it("runs the click action at the last level", () => {
            const execute = jest.fn();
            const built = buildChart(
                [series("S", [{ x: "A", y: 1, action: { canExecute: true, execute } }])],
                drill,
                HYPER_LIGHT,
                []
            );
            expect(built.clickTargets[0][0].drill).toBeUndefined();
            built.clickTargets[0][0].action!.execute();
            expect(execute).toHaveBeenCalled();
        });
    });

    describe("large series", () => {
        const many = (n: number) => Array.from({ length: n }, (_, i) => ({ x: i, y: i % 7 }));

        it("downsamples lines and keeps points as plain arrays", () => {
            const { option } = buildChart([series("S", many(LARGE_SERIES + 1))], settings(), HYPER_LIGHT, []);
            const line = seriesOf(option)[0];
            expect(line.sampling).toBe("lttb");
            expect(line.data.every((d: unknown) => Array.isArray(d))).toBe(true);
        });

        it("draws bars and scatter points in one batch without glow", () => {
            const { option } = buildChart(
                [
                    series("Bars", many(LARGE_SERIES + 1), { kind: "bar" }),
                    series("Dots", many(LARGE_SERIES + 1), { kind: "scatter" })
                ],
                settings(),
                HYPER_LIGHT,
                []
            );
            const [bars, dots] = seriesOf(option);
            expect(bars).toMatchObject({ type: "bar", large: true });
            expect(bars.itemStyle.shadowBlur).toBeUndefined();
            expect(dots).toMatchObject({ type: "scatter", large: true });
            expect(dots.itemStyle.shadowBlur).toBeUndefined();
        });

        it("keeps small series in the detailed style", () => {
            const { option } = buildChart([series("Bars", many(10), { kind: "bar" })], settings(), HYPER_LIGHT, []);
            expect(seriesOf(option)[0].large).toBe(false);
            expect(seriesOf(option)[0].itemStyle.shadowBlur).toBeGreaterThan(0);
        });
    });

    it("reads a point's tooltip text only when it's hovered", () => {
        const tooltip = jest.fn(() => "Order 42");
        const point = {
            x: "Jan",
            y: 1,
            drill: [],
            get tooltip() {
                return tooltip();
            }
        };
        const input = series("S", []);
        const { option } = buildChart([{ ...input, points: [point] }], settings(), HYPER_LIGHT, []);
        expect(tooltip).not.toHaveBeenCalled();
        const html = (option as AnyRecord).tooltip.formatter({
            seriesIndex: 0,
            dataIndex: 0,
            seriesName: "S",
            value: ["Jan", 1]
        });
        expect(html).toContain("Order 42");
    });
});
