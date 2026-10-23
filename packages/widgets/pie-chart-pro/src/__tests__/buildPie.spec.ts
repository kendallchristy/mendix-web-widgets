import type { CategoryPoint } from "@kendallchristy/chart-core";
import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { pieSettings } from "../model/fromProps";
import { buildPie } from "../model/buildPie";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    aggregation: "sum",
    sortOrder: "valueDesc",
    drilldown: false,
    titleAlign: "left",
    shape: "donut",
    rose: "off",
    labelPosition: "outside",
    labelContent: "namePercent",
    centerContent: "total",
    prefix: "",
    suffix: "",
    thousandsSeparator: true,
    compactNumbers: false,
    glow: "soft",
    legend: "auto",
    tooltip: "card",
    figuresFont: "mono",
    animation: false,
    background: "transparent",
    maxSlices: 3,
    innerRadius: 60,
    holeUnit: "percent",
    cornerRadius: 4,
    sliceGap: 2,
    startAngle: 90,
    decimals: -1,
    percentDecimals: 0,
    animationDuration: 0,
    centerCaption: "Visits"
} as const;

const points: CategoryPoint[] = [
    { category: "A", value: 50, drill: [] },
    { category: "B", value: 30, drill: [] },
    { category: "C", value: 15, drill: [] },
    { category: "D", value: 5, drill: [] }
];

const build = (overrides: Record<string, unknown> = {}) =>
    buildPie(points, pieSettings({ ...values, ...overrides } as any), HYPER_LIGHT, []);

describe("buildPie", () => {
    it("draws a donut with an Other slice and the total in the hole", () => {
        const { option, table, pointCount } = build();
        const [pie, centre] = option.series as any[];
        expect(pie.data.map((d: any) => [d.name, d.value])).toEqual([
            ["A", 50],
            ["B", 30],
            ["Other", 20]
        ]);
        expect(pie.data[2].itemStyle.color).toBe(HYPER_LIGHT.muted);
        expect(pie.radius).toEqual(["38%", "64%"]);
        expect(centre.silent).toBe(true);
        expect(centre.label.formatter).toBe("{total|100}\n{caption|Visits}");
        expect(table.rows[0]).toEqual(["A", "50", "50%"]);
        expect(pointCount).toBe(3);
    });

    it("labels with names, so the automatic legend stays hidden", () => {
        expect((build().option.legend as any).show).toBe(false);
        expect((build({ labelContent: "percent" }).option.legend as any).show).toBe(true);
        const label = (build().option.series as any[])[0].label;
        expect(label.formatter({ name: "A", value: 50 })).toBe("{name|A}\n{value|50%}");
    });

    it("draws a plain pie without the centre ring, and a rose", () => {
        const series = build({ shape: "pie", rose: "area" }).option.series as any[];
        expect(series).toHaveLength(1);
        expect(series[0].radius[0]).toBe("0%");
        expect(series[0].roseType).toBe("area");
    });

    it("sizes a half donut from the measured chart", () => {
        const half = buildPie(
            points,
            pieSettings({ ...values, shape: "halfDonut", labelPosition: "hidden" } as any),
            HYPER_LIGHT,
            [],
            { width: 400, height: 240 }
        );
        const pie = (half.option.series as any[])[0];
        expect(pie.startAngle).toBe(180);
        expect(pie.endAngle).toBe(360);
        // Centres in pixels count from the layout box, which starts 8 px in.
        expect(pie.center[0]).toBe(192);
        expect(pie.radius[1]).toBeLessThanOrEqual(196);
    });

    it("makes the hole a percent of the radius or a fixed number of pixels", () => {
        const measured = (overrides: Record<string, unknown>, size = { width: 400, height: 300 }) =>
            (
                buildPie(points, pieSettings({ ...values, ...overrides } as any), HYPER_LIGHT, [], size).option
                    .series as any[]
            )[0].radius;
        const [inner, outer] = measured({ innerRadius: 50 });
        expect(inner).toBe(Math.round(outer / 2));
        expect(measured({ innerRadius: 40, holeUnit: "pixels" })[0]).toBe(40);
        expect(measured({ innerRadius: 40, holeUnit: "pixels" }, { width: 800, height: 600 })[0]).toBe(40);
        // Never larger than the pie itself.
        const [small, around] = measured({ innerRadius: 400, holeUnit: "pixels" });
        expect(small).toBe(around - 4);
        // Without a measured size the radius is in percent, and a pixel hole stays in pixels.
        expect(build({ innerRadius: 40, holeUnit: "pixels" }).option.series as any[]).toEqual(
            expect.arrayContaining([expect.objectContaining({ radius: [40, "64%"] })])
        );
    });

    it("leaves outside labels room above, below and beside the pie", () => {
        const size = { width: 300, height: 220 };
        // Two halves put the labels straight above and below the pie.
        const halves: CategoryPoint[] = [
            { category: "Top", value: 50, drill: [] },
            { category: "Bottom", value: 50, drill: [] }
        ];
        const result = buildPie(halves, pieSettings({ ...values, startAngle: 0 } as any), HYPER_LIGHT, [], size);
        const pie = (result.option.series as any[])[0];
        const [, outer] = pie.radius;
        for (const slice of pie.data) {
            // The line clears the pie by half a two-line label, so the label sits clear of it, and fits the chart.
            expect(slice.labelLine.length).toBeGreaterThanOrEqual(31 / 2);
            expect(outer + slice.labelLine.length + 31 / 2).toBeLessThanOrEqual((size.height - 16) / 2);
        }
        // Labels beside the pie leave it its room, minus the label and its line.
        const beside = (buildPie(halves, pieSettings(values as any), HYPER_LIGHT, [], size).option.series as any[])[0];
        expect(beside.radius[1] + beside.data[0].labelLine.length + 23 + "Bottom".length * 6).toBeLessThanOrEqual(
            (size.width - 16) / 2
        );
        expect(pie.label.overflow).toBe("truncate");
    });

    it("moves names to the legend when the chart is too narrow for them", () => {
        const narrow = buildPie(points, pieSettings(values as any), HYPER_LIGHT, [], { width: 180, height: 220 });
        const pie = (narrow.option.series as any[])[0];
        expect((narrow.option.legend as any).show).toBe(true);
        expect(pie.label.formatter({ name: "A", value: 50 })).toBe("{value|50%}");
        const wide = buildPie(points, pieSettings(values as any), HYPER_LIGHT, [], { width: 400, height: 220 });
        expect((wide.option.legend as any).show).toBe(false);
    });

    it("fits the total to a small hole and drops the caption", () => {
        const small = buildPie(points, pieSettings(values as any), HYPER_LIGHT, [], { width: 200, height: 120 });
        const centre = (small.option.series as any[])[1];
        expect(centre.label.formatter).toBe("{total|100}");
        expect(centre.label.rich.total.fontSize).toBeLessThan(22);
    });

    it("leaves out slices with nothing in them", () => {
        const result = buildPie(
            [...points, { category: "E", value: 0, drill: [] }],
            pieSettings({ ...values, maxSlices: 0 } as any),
            HYPER_LIGHT,
            []
        );
        expect((result.option.series as any[])[0].data.map((d: any) => d.name)).toEqual(["A", "B", "C", "D"]);
    });

    it("escapes the tooltip and shows the share", () => {
        const tooltip = (build().option.tooltip as any).formatter({ seriesIndex: 0, name: "<A>", value: 50 });
        expect(tooltip).toContain("&#60;A&#62;");
        expect(tooltip).toContain("50 · 50%");
    });
});
