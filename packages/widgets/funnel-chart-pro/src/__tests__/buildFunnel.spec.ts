import type { CategoryPoint } from "@kendallchristy/chart-core";
import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildFunnel, shades } from "../model/buildFunnel";
import { funnelSettings } from "../model/fromProps";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    aggregation: "sum",
    sortOrder: "data",
    drilldown: false,
    titleAlign: "left",
    orientation: "vertical",
    align: "center",
    colorMode: "shades",
    labelPosition: "outside",
    showName: true,
    showValue: true,
    conversion: "first",
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
    neckWidth: 20,
    stageGap: 4,
    cornerRadius: 4,
    decimals: -1,
    percentDecimals: 0,
    animationDuration: 0
} as const;

const points: CategoryPoint[] = [
    { category: "Visited", value: 1000, drill: [] },
    { category: "Signed up", value: 400, drill: [] },
    { category: "Paid", value: 100, drill: [] }
];

const build = (overrides: Record<string, unknown> = {}) =>
    buildFunnel(points, funnelSettings({ ...values, ...overrides } as any), HYPER_LIGHT, []);

describe("buildFunnel", () => {
    it("keeps the stage order and shows conversion from the first stage", () => {
        const { option, table } = build();
        const funnel = (option.series as any[])[0];
        expect(funnel).toMatchObject({ type: "funnel", sort: "none", orient: "vertical", minSize: "20%" });
        expect(funnel.data.map((d: any) => d.name)).toEqual(["Visited", "Signed up", "Paid"]);
        expect(funnel.label.formatter({ dataIndex: 1 })).toBe("{name|Signed up}\n{value|400} {rate|40%}");
        expect(table.rows[2]).toEqual(["Paid", "100", "10%"]);
    });

    it("shows conversion from the previous stage", () => {
        const { table } = build({ conversion: "previous" });
        expect(table.rows.map(r => r[2])).toEqual(["", "40%", "25%"]);
        expect(build({ conversion: "off" }).table.columns).toEqual(["Stage", "Value"]);
    });

    it("colours stages in shades of one colour, lightening down the funnel", () => {
        const colours = shades("#8038D0", "#FFFFFF", 3);
        expect(colours[0]).toBe("#8038d0");
        expect(colours[2]).toBe("#ccafec");
        const data = ((build().option.series as any[])[0].data as any[]).map(d => d.itemStyle.color);
        expect(data).toEqual(shades(HYPER_LIGHT.palette[0], HYPER_LIGHT.surface, 3));
        const palette = ((build({ colorMode: "palette" }).option.series as any[])[0].data as any[]).map(
            d => d.itemStyle.color
        );
        expect(palette).toEqual(HYPER_LIGHT.palette.slice(0, 3));
    });

    it("picks dark or light text inside each stage", () => {
        const data = (build({ labelPosition: "inside" }).option.series as any[])[0].data as any[];
        expect(data[0].label.rich.value.color).toBe("#FFFFFF");
        expect(data[2].label.rich.value.color).toBe("#111318");
    });
});
