import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildStream, streamNames } from "../model/buildStream";
import { streamSettings } from "../model/fromProps";
import type { StreamPoint } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

const values = {
    titleAlign: "left",
    aggregation: "sum",
    period: "none",
    showLabels: true,
    showAxis: true,
    dateFormat: "",
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
    maxGroups: 8,
    decimals: -1,
    animationDuration: 0
} as const;

const jan = (day: number): Date => new Date(2026, 0, day);
const points: StreamPoint[] = [
    { date: jan(1), group: "Web", value: 5 },
    { date: jan(1), group: "Web", value: 2 },
    { date: jan(2), group: "Mobile", value: 3 },
    { date: jan(20), group: "Web", value: 4 }
];

const build = (overrides: Record<string, unknown> = {}, data = points) =>
    buildStream(data, streamSettings({ ...values, ...overrides } as any), HYPER_LIGHT);

describe("buildStream", () => {
    it("fills every stream at every moment", () => {
        const option = build().option as any;
        expect(option.series[0].data).toEqual([
            [jan(1).getTime(), 7, "Web"],
            [jan(1).getTime(), 0, "Mobile"],
            [jan(2).getTime(), 0, "Web"],
            [jan(2).getTime(), 3, "Mobile"],
            [jan(20).getTime(), 4, "Web"],
            [jan(20).getTime(), 0, "Mobile"]
        ]);
        expect(option.singleAxis.type).toBe("time");
    });

    it("groups dates into periods", () => {
        const weekly = build({ period: "month" });
        expect((weekly.option as any).series[0].data).toEqual([
            [jan(1).getTime(), 11, "Web"],
            [jan(1).getTime(), 3, "Mobile"]
        ]);
        expect(weekly.table).toEqual({ columns: ["Date", "Web", "Mobile"], rows: [["Jan 2026", "11", "3"]] });
    });

    it("folds the smallest groups into Other, drawn in the muted colour", () => {
        const many: StreamPoint[] = ["A", "B", "C", "D"].map((group, i) => ({ date: 1, group, value: 10 - i }));
        expect(Array.from(streamNames(many, 3, "Other").values())).toEqual(["A", "B", "Other", "Other"]);
        const option = build({ maxGroups: 3 }, many).option as any;
        expect(option.legend.data).toEqual(["A", "B", "Other"]);
        expect(option.color[2]).toBe(HYPER_LIGHT.muted);
        expect(option.series[0].data[2]).toEqual([1, 15, "Other"]);
        expect(option.singleAxis.type).toBe("value");
        expect(Array.from(streamNames(many, 0, "Other").values())).toEqual(["A", "B", "C", "D"]);
    });

    it("shows a legend when the streams aren't named", () => {
        expect((build().option as any).legend.show).toBe(false);
        expect((build({ showLabels: false }).option as any).legend.show).toBe(true);
    });

    it("lists the streams at a moment in the tooltip, largest first, without empty ones", () => {
        const option = build().option as any;
        const html: string = option.tooltip.formatter([
            { value: [jan(2).getTime(), 0, "Web"] },
            { value: [jan(2).getTime(), 3, "Mobile"] }
        ]);
        expect(html).toContain("Jan 2");
        expect(html).toContain("Mobile");
        expect(html).not.toContain("Web");
    });
});
