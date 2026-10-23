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
        expect(pie.center[0]).toBe(200);
        expect(pie.radius[1]).toBeLessThanOrEqual(196);
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
