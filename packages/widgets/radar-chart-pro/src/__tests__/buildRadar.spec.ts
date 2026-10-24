import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildRadar, niceCeiling, radarValues } from "../model/buildRadar";
import { radarSettings } from "../model/fromProps";
import type { RadarSeries } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    indicatorOrder: "data",
    shape: "polygon",
    areaFill: "solid",
    markers: "always",
    valueLabels: false,
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
    rings: 4,
    lineWidth: 2,
    decimals: -1,
    animationDuration: 0
} as const;

const series: RadarSeries[] = [
    {
        name: "Ours",
        aggregation: "sum",
        points: [
            { indicator: "Speed", value: 40 },
            { indicator: "Speed", value: 30 },
            { indicator: "Price", value: 45 }
        ]
    },
    { name: "Theirs", color: "#123456", aggregation: "avg", points: [{ indicator: "Cost", value: 8 }] }
];

const build = (overrides: Record<string, unknown> = {}, data = series) =>
    buildRadar(data, radarSettings({ ...values, ...overrides } as any), HYPER_LIGHT);

describe("buildRadar", () => {
    it("rounds scale maximums up to round numbers", () => {
        expect([0, 7, 70, 45, 180, 2.4].map(niceCeiling)).toEqual([1, 10, 100, 50, 200, 2.5]);
    });

    it("aggregates each series per measure, in data or name order", () => {
        expect(radarValues(series, "data")).toEqual({
            indicators: ["Speed", "Price", "Cost"],
            values: [
                [70, 45, undefined],
                [undefined, undefined, 8]
            ]
        });
        expect(radarValues(series, "name").indicators).toEqual(["Cost", "Price", "Speed"]);
    });

    it("scales each measure to its own maximum, or to the set one", () => {
        const radar = (build().option as any).radar;
        expect(radar.indicator).toEqual([
            { name: "Speed", min: 0, max: 100 },
            { name: "Price", min: 0, max: 50 },
            { name: "Cost", min: 0, max: 10 }
        ]);
        expect(radar.splitNumber).toBe(4);
        expect((build({ maxValue: 200 }).option as any).radar.indicator[2].max).toBe(200);
    });

    it("draws one shape per series in its colour", () => {
        const data = (build().option as any).series[0].data;
        expect(data.map((d: any) => d.value)).toEqual([
            [70, 45, 0],
            [0, 0, 8]
        ]);
        expect(data[0].itemStyle.color).toBe(HYPER_LIGHT.palette[0]);
        expect(data[1].lineStyle.color).toBe("#123456");
        expect((build({ areaFill: "none" }).option as any).series[0].data[0].areaStyle).toEqual({ opacity: 0 });
        expect((build({ markers: "never" }).option as any).series[0].data[0].symbol).toBe("none");
        expect((build({ markers: "hover" }).option as any).series[0].data[0].itemStyle.opacity).toBe(0);
    });

    it("lists a shape's measures in the tooltip and table, leaving missing ones out", () => {
        const built = build();
        const html: string = (built.option as any).tooltip.formatter({ name: "Theirs" });
        expect(html).toContain("Cost");
        expect(html).not.toContain("Speed");
        expect(built.table).toEqual({
            columns: ["Measure", "Ours", "Theirs"],
            rows: [
                ["Speed", "70", ""],
                ["Price", "45", ""],
                ["Cost", "", "8"]
            ]
        });
        expect(built.pointCount).toBe(4);
    });
});
