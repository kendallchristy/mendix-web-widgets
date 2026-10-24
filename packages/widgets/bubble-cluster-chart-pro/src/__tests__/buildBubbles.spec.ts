import type { CategoryPoint } from "@kendallchristy/chart-core";
import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildBubbles } from "../model/buildBubbles";
import { bubbleSettings } from "../model/fromProps";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    aggregation: "sum",
    drilldown: false,
    titleAlign: "left",
    bubbleStyle: "gradient",
    groupOutlines: true,
    labelContent: "nameValue",
    valueStyle: "pill",
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
    maxBubbles: 30,
    bubbleGap: 3,
    groupGap: 12,
    decimals: -1,
    percentDecimals: 0,
    animationDuration: 0
} as const;

const PRODUCTS: Array<[string, number, string]> = [
    ["Laptops", 4200, "Hardware"],
    ["Phones", 3600, "Hardware"],
    ["Docks", 300, "Hardware"],
    ["Support", 3100, "Services"],
    ["Training", 1400, "Services"],
    ["Licences", 2600, "Software"]
];
const points = (grouped = false): CategoryPoint[] =>
    PRODUCTS.map(([category, value, group]) => ({
        category,
        value,
        group: grouped ? group : undefined,
        drill: [`${category} online`, undefined]
    }));

const size = { width: 400, height: 260 };
const build = (overrides: Record<string, unknown> = {}, p = points(), path: any[] = []) =>
    buildBubbles(p, bubbleSettings({ ...values, ...overrides } as any), HYPER_LIGHT, path, size);

// Draws a bubble the way ECharts would, through its series' renderItem.
const draw = (series: any, index = 0): any => series.renderItem({ dataIndex: index }, {});

describe("buildBubbles", () => {
    it("draws one bubble per category with its name and value inside, largest first", () => {
        const { option, table, pointCount } = build();
        const series = option.series as any[];
        expect(series).toHaveLength(6);
        expect(series.map(s => s.name)).toEqual(["Laptops", "Phones", "Support", "Licences", "Training", "Docks"]);
        const laptops = draw(series[0]);
        expect(laptops.children[0].shape.r).toBeGreaterThan(40);
        expect(laptops.children.map((c: any) => c.style.text).slice(1)).toEqual(["Laptops", "4,200"]);
        // The value sits in a pill.
        expect(laptops.children[2].style.backgroundColor).toBe(HYPER_LIGHT.lightPillBackground);
        expect(table.rows[0]).toEqual(["Laptops", "4,200", "28%"]);
        expect(pointCount).toBe(6);
        expect((option.legend as any).show).toBe(false);
    });

    it("sizes bubbles by area and leaves labels out of bubbles too small for them", () => {
        const series = build().option.series as any[];
        const r = (s: any) => draw(s).children[0].shape.r;
        expect((r(series[0]) / r(series[5])) ** 2).toBeCloseTo(4200 / 300, 0);
        expect(draw(series[5]).children).toHaveLength(1);
    });

    it("clusters by group, one series and colour per group, with outlines underneath", () => {
        const { option, table, clickTargets } = build({}, points(true));
        const series = option.series as any[];
        expect(series.map(s => s.name)).toEqual(["Hardware", "Services", "Software", ""]);
        expect(series[0].data.map((d: any) => d.name)).toEqual(["Laptops", "Phones", "Docks"]);
        expect(series[0].itemStyle.color).toBe(HYPER_LIGHT.palette[0]);
        const outlines = series[3];
        expect(outlines).toMatchObject({ silent: true, z: 1 });
        expect(outlines.renderItem({ dataIndex: 1 }, {}).children[1].style.text).toBe("Services");
        expect((option.legend as any).show).toBe(true);
        expect(table.columns).toEqual(["Category", "Group", "Value", "Share"]);
        expect(clickTargets.map(t => t.length)).toEqual([3, 2, 1]);
        expect(build({ groupOutlines: false }, points(true)).option.series as any[]).toHaveLength(3);
    });

    it("shows the legend for unnamed bubbles, and takes a bubble's own colour", () => {
        const p = points();
        p[1] = { ...p[1], color: "#123456" };
        const { option } = build({ labelContent: "value" }, p);
        expect((option.legend as any).show).toBe(true);
        expect((option.series as any[])[1].itemStyle.color).toBe("#123456");
    });

    it("folds small bubbles into Other", () => {
        const series = build({ maxBubbles: 4 }).option.series as any[];
        expect(series.map(s => s.name)).toEqual(["Laptops", "Phones", "Support", "Other"]);
        expect(series[3].itemStyle.color).toBe(HYPER_LIGHT.muted);
    });

    it("drills into a bubble", () => {
        const top = build({ drilldown: true });
        expect(top.clickTargets[0][0].drill).toEqual({ label: "Laptops", value: "Laptops" });
        const inner = build({ drilldown: true }, points(), [{ label: "Laptops", value: "Laptops" }]);
        expect(inner.breadcrumb).toEqual(["All", "Laptops"]);
        expect((inner.option.series as any[])[0].name).toBe("Laptops online");
    });

    it("styles bubbles as tinted outlines with dark pills", () => {
        const bubble = draw((build({ bubbleStyle: "tinted" }).option.series as any[])[0]);
        expect(bubble.children[0].style).toMatchObject({ stroke: HYPER_LIGHT.palette[0], lineWidth: 1.5 });
        expect(bubble.children[2].style.backgroundColor).toBe(HYPER_LIGHT.pillBackground);
        expect(typeof draw((build({ bubbleStyle: "solid" }).option.series as any[])[0]).children[0].style.fill).toBe(
            "string"
        );
    });

    it("formats the tooltip with the value, share and group", () => {
        const { option } = build({}, points(true));
        const formatter = (option.tooltip as any).formatter;
        const html = formatter({
            seriesIndex: 0,
            dataIndex: 0,
            seriesName: "Hardware",
            name: "Laptops",
            value: [0, 0, 10, 4200]
        });
        expect(html).toContain("Hardware");
        expect(html).toContain("4,200 · 28%");
    });
});
