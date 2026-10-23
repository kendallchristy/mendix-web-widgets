import type { ObjectItem } from "mendix";

import type { CartesianChartProContainerProps, SeriesType } from "../../typings/CartesianChartProProps";
import { isLoading, seriesFromProps, settingsFromProps } from "../model/fromProps";

type Row = Record<string, unknown>;

const big = (n: number) => ({ toNumber: () => n, toString: () => String(n) });

function attribute(key: string) {
    return {
        id: key,
        get: (item: ObjectItem) => ({
            value: (item as unknown as Row)[key],
            displayValue: String((item as unknown as Row)[key] ?? "")
        })
    };
}

function seriesConfig(rows: Row[], overrides: Partial<SeriesType> = {}): SeriesType {
    return {
        dataSource: { status: "available", items: rows.map((row, i) => ({ id: `obj-${i}`, ...row })) },
        seriesType: "line",
        seriesName: { status: "available", value: "Revenue" },
        xAttribute: attribute("month"),
        yAttribute: attribute("amount"),
        aggregation: "none",
        color: "",
        stack: "",
        yAxisSide: "left",
        ...overrides
    } as unknown as SeriesType;
}

function props(
    series: SeriesType[],
    overrides: Partial<CartesianChartProContainerProps> = {}
): CartesianChartProContainerProps {
    return {
        series,
        drilldown: "none",
        drillDateFrom: "year",
        drillDateTo: "day",
        lineWidth: big(2.5),
        decimals: -1,
        prefix: "",
        suffix: "",
        thousandsSeparator: true,
        compactNumbers: false,
        xDateFormat: "",
        ...overrides
    } as unknown as CartesianChartProContainerProps;
}

describe("seriesFromProps", () => {
    it("reads one point per object", () => {
        const rows = [
            { month: "Jan", amount: big(10) },
            { month: "Feb", amount: big(20) },
            { month: undefined, amount: big(30) }
        ];
        const [s] = seriesFromProps(props([seriesConfig(rows, { color: " #123456 " })]));
        expect(s).toMatchObject({ name: "Revenue", kind: "line", color: "#123456" });
        expect(s.points.map(p => [p.x, p.y])).toEqual([
            ["Jan", 10],
            ["Feb", 20]
        ]);
    });

    it("splits a data source into one series per group", () => {
        const rows = [
            { month: "Jan", amount: big(1), region: "North" },
            { month: "Jan", amount: big(2), region: "South" },
            { month: "Feb", amount: big(3), region: "North" }
        ];
        const list = seriesFromProps(
            props([seriesConfig(rows, { groupByAttribute: attribute("region") as never, color: "#123456" })])
        );
        expect(list.map(s => [s.name, s.points.length, s.color])).toEqual([
            ["North", 2, undefined],
            ["South", 1, undefined]
        ]);
    });

    it("keeps the click action and tooltip text of each object", () => {
        const action = { canExecute: true, isExecuting: false, execute: jest.fn() };
        const config = seriesConfig([{ month: "Jan", amount: big(1) }], {
            onClick: { get: () => action } as never,
            tooltipText: { get: () => ({ value: "Order 1" }) } as never
        });
        const [s] = seriesFromProps(props([config]));
        expect(s.points[0].action).toBe(action);
        expect(s.points[0].tooltip).toBe("Order 1");
    });
});

describe("settingsFromProps", () => {
    it("maps drilldown settings", () => {
        expect(
            settingsFromProps(props([], { drilldown: "date", drillDateFrom: "month", drillDateTo: "day" })).drill
        ).toEqual({
            kind: "date",
            from: "month",
            to: "day"
        });
        expect(settingsFromProps(props([])).drill).toEqual({ kind: "none" });
    });

    it("reads the line width and axis range", () => {
        const settings = settingsFromProps(props([], { yAxisMin: { status: "available", value: big(5) } as never }));
        expect(settings.style.lineWidth).toBe(2.5);
        expect(settings.yAxisMin).toBe(5);
        expect(settings.yAxisMax).toBeUndefined();
    });
});

describe("isLoading", () => {
    it("is true only while a data source loads with nothing to show yet", () => {
        const loading = seriesConfig([]);
        (loading.dataSource as { status: string }).status = "loading";
        expect(isLoading(props([loading]))).toBe(true);
        expect(isLoading(props([seriesConfig([{ month: "Jan", amount: big(1) }])]))).toBe(false);
    });
});
