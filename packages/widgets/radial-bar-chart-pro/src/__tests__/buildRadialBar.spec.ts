import type { CategoryPoint } from "@kendallchristy/chart-core";
import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildRadialBar } from "../model/buildRadialBar";
import { radialBarSettings } from "../model/fromProps";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    aggregation: "sum",
    sortOrder: "valueDesc",
    drilldown: false,
    titleAlign: "left",
    track: true,
    roundCaps: true,
    showNames: true,
    valueLabel: "value",
    labelStyle: "plain",
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
    maxRings: 3,
    startAngle: 90,
    sweep: 270,
    ringWidth: 60,
    innerRadius: 20,
    decimals: -1,
    percentDecimals: 0,
    animationDuration: 0
} as const;

const points: CategoryPoint[] = [
    { category: "Sales", value: 80, drill: [] },
    { category: "Support", value: 60, drill: [] },
    { category: "Product", value: 120, drill: [] },
    { category: "Ops", value: 10, drill: [] }
];

const build = (overrides: Record<string, unknown> = {}, size = { width: 0, height: 0 }) =>
    buildRadialBar(points, radialBarSettings({ ...values, ...overrides } as any), HYPER_LIGHT, [], size);

describe("buildRadialBar", () => {
    it("draws a track and one ring per category, largest first and capped at a full ring", () => {
        const { option, clickTargets } = build({ maxValue: 100 });
        const series = option.series as any[];
        expect(series[0].name).toBe("track");
        expect(series[0].data).toEqual([100, 100, 100]);
        expect(series.slice(1).map(s => s.name)).toEqual(["Product", "Sales", "Support"]);
        expect(series[1].data[0].value).toBe(100);
        expect(series[1].data[1]).toBe("-");
        expect((option.angleAxis as any).max).toBe((100 * 360) / 270);
        expect(clickTargets).toHaveLength(4);
    });

    it("uses the largest value as a full ring when no maximum is set", () => {
        expect((build().option.angleAxis as any).max).toBe((120 * 360) / 270);
    });

    it("names each ring beside its value, or in the legend for a closed circle", () => {
        const axis = build().option.radiusAxis as any;
        expect(axis.axisLabel.show).toBe(true);
        expect(axis.axisLabel.formatter("", 1)).toBe("{name|Sales} {value|80}");
        expect(build({ valueLabel: "percent", maxValue: 160 }).table.rows[0]).toEqual(["Product", "120", "75%"]);

        const closed = build({ sweep: 360 }).option;
        expect((closed.radiusAxis as any).axisLabel.show).toBe(false);
        expect((closed.legend as any).show).toBe(true);
    });

    it("fits the rings into the measured chart", () => {
        const polar = build({}, { width: 300, height: 240 }).option.polar as any;
        expect(polar.radius[1]).toBeGreaterThan(80);
        expect(polar.radius[1]).toBeLessThanOrEqual(120);
        expect(polar.radius[0]).toBe(Math.round(polar.radius[1] * 0.2));
    });
});
