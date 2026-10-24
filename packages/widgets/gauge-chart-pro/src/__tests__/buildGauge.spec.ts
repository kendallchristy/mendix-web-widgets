import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { bandOf, buildGauge } from "../model/buildGauge";
import { gaugeSettings } from "../model/fromProps";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    shape: "arc",
    indicator: "progress",
    roundCaps: true,
    showTicks: false,
    showRange: true,
    showValue: true,
    colorMode: "palette",
    prefix: "",
    suffix: "%",
    thousandsSeparator: true,
    compactNumbers: false,
    showAsPercent: false,
    glow: "soft",
    tooltip: "card",
    figuresFont: "mono",
    animation: false,
    background: "transparent",
    arcWidth: 14,
    valueSize: 32,
    decimals: -1,
    percentDecimals: 0,
    animationDuration: 0,
    bands: [],
    value: 68,
    caption: "Done"
} as const;

const bands = [
    { to: 80, color: "#D99A00", label: "On track" },
    { to: 50, color: "#E5466F", label: "Behind" },
    { to: 100, color: "#48B840", label: "Ahead" }
];

const build = (overrides: Record<string, unknown> = {}) =>
    buildGauge(gaugeSettings({ ...values, ...overrides } as any), HYPER_LIGHT, [], { width: 300, height: 200 });

describe("buildGauge", () => {
    it("draws a progress arc with the value and caption", () => {
        const { option, pointCount, table } = build();
        const gauge = (option.series as any[])[0];
        expect(gauge).toMatchObject({ type: "gauge", startAngle: 210, endAngle: -30, min: 0, max: 100 });
        expect(gauge.progress.show).toBe(true);
        expect(gauge.pointer.show).toBe(false);
        expect(gauge.data).toEqual([{ value: 68, name: "Done" }]);
        expect(gauge.detail.formatter(68)).toBe("68%");
        expect(gauge.axisLabel.show).toBe(false);
        expect(pointCount).toBe(1);
        expect(table.rows).toEqual([
            ["Value", "68%"],
            ["Minimum", "0%"],
            ["Maximum", "100%"]
        ]);
    });

    it("colours the track by band and the value by its band", () => {
        expect(bandOf(68, bands)?.label).toBe("On track");
        expect(bandOf(120, bands)).toBeUndefined();
        const gauge = (build({ bands, colorMode: "band" }).option.series as any[])[0];
        expect(gauge.axisLine.lineStyle.color.map((c: [number, string]) => c[0])).toEqual([0.5, 0.8, 1, 1]);
        expect(gauge.progress.itemStyle.color).toBe("#D99A00");
        // Band edges would each get round caps.
        expect(gauge.axisLine.roundCap).toBe(false);
    });

    it("adds a target marker and a needle", () => {
        const series = build({ target: 90, indicator: "both" }).option.series as any[];
        expect(series).toHaveLength(3);
        expect(series[1].data).toEqual([{ value: 90 }]);
        expect(series[0].pointer.show).toBe(true);
        expect(series[0].progress.show).toBe(true);
    });

    it("makes room under a needle for the value and caption", () => {
        const bottomOfText = (indicator: string): number => {
            const gauge = (build({ indicator }).option.series as any[])[0];
            return gauge.center[1] + gauge.title.offsetCenter[1] + 8;
        };
        expect(bottomOfText("progress")).toBeLessThanOrEqual(192);
        expect(bottomOfText("needle")).toBeLessThanOrEqual(192);
    });

    it("puts the minimum and maximum clear of the arc and of each other", () => {
        const ends = (overrides: Record<string, unknown>) => {
            const series = build(overrides).option.series as any[];
            const range = series.find(item => item.name === "range");
            return {
                radius: series[0].radius,
                centre: series[0].center,
                labels: range.data.map((d: any) => [d.name, ...d.title.offsetCenter])
            };
        };
        // Under an arc's ends, below the round caps, however wide the arc.
        for (const arcWidth of [14, 40]) {
            const { radius, labels } = ends({ arcWidth });
            expect(labels.map((l: any[]) => l[0])).toEqual(["0%", "100%"]);
            expect(labels[0][1]).toBeLessThan(0);
            expect(labels[1][1]).toBeGreaterThan(0);
            for (const [, , y] of labels) {
                expect(y).toBeGreaterThan(radius * 0.5 + arcWidth / 4);
            }
        }
        // Under a half circle's flat edge, past the round caps.
        for (const [, , y] of ends({ shape: "half", arcWidth: 40 }).labels) {
            expect(y).toBeGreaterThan(20);
        }
        // Either side of a ring's seam, above the ring.
        const ring = ends({ shape: "ring" });
        expect(ring.labels[0][1]).toBeGreaterThan(0);
        expect(ring.labels[1][1]).toBeLessThan(0);
        expect(ring.labels[0][2]).toBeLessThan(-ring.radius);
        expect(ring.centre[1] + ring.labels[0][2]).toBeGreaterThan(0);
        // Off, there is no range series.
        expect((build({ showRange: false }).option.series as any[]).some(item => item.name === "range")).toBe(false);
    });

    it("keeps the end labels inside the chart under a needle", () => {
        const { centre, labels } = (() => {
            const series = build({ indicator: "needle", value: 4200, max: 6000, suffix: "" }).option.series as any[];
            const range = series.find(item => item.name === "range");
            return { centre: series[0].center, labels: range.data.map((d: any) => d.title.offsetCenter[1]) };
        })();
        for (const y of labels) {
            expect(centre[1] + y + 7).toBeLessThanOrEqual(192);
        }
    });

    it("shows a share of the range as a percentage", () => {
        const gauge = (build({ showAsPercent: true, min: 0, max: 200, value: 50 }).option.series as any[])[0];
        expect(gauge.detail.formatter(50)).toBe("25%");
    });

    it("has nothing to draw without a value", () => {
        expect(build({ value: undefined }).pointCount).toBe(0);
    });

    it("uses the tooltip text when set", () => {
        const tooltip = (build({ tooltipText: "<b>Nearly</b>" }).option.tooltip as any).formatter();
        expect(tooltip).toContain("&#60;b&#62;Nearly");
    });
});
