import { HYPER_LIGHT } from "@kendallchristy/chart-core";

import { buildCustom, hyperSeriesDefaults } from "../model/buildCustom";
import { customSettings } from "../model/fromProps";
import type { Cell, DataSet } from "../model/types";

// ECharts options are loosely typed JSON; the tests read into them freely.
/* eslint-disable @typescript-eslint/no-explicit-any */

function settings(...optionJson: Array<string | object>): ReturnType<typeof customSettings> {
    return customSettings({
        titleAlign: "left",
        figuresFont: "mono",
        animation: false,
        animationDuration: 0,
        background: "transparent",
        optionJson: optionJson.map(o => (typeof o === "string" ? o : JSON.stringify(o)))
    });
}

function dataSet(name: string, rows: Array<Record<string, Cell>>, actions: Array<() => void> = []): DataSet {
    return {
        name,
        fields: [...new Set(rows.flatMap(row => Object.keys(row)))],
        rows,
        actionOf: row => (actions[row] ? { canExecute: true, execute: actions[row] } : undefined)
    };
}

const SALES = dataSet("Sales", [
    { month: "Jan", value: 3 },
    { month: "Feb", value: 5 }
]);

describe("buildCustom", () => {
    it("asks for an option, and reports JSON that doesn't parse", () => {
        expect(buildCustom([], settings(""), HYPER_LIGHT).errors).toEqual(["Add an ECharts option in Option JSON."]);
        expect(buildCustom([], settings("{ nope"), HYPER_LIGHT).errors![0]).toMatch(/^Option JSON: /);
    });

    it("merges the option JSON with the expression, over the Hyper defaults", () => {
        const built = buildCustom(
            [],
            settings({ xAxis: { type: "category" }, series: [{ type: "bar", data: [1, 2] }] }, { yAxis: {} }),
            HYPER_LIGHT
        );
        const option = built.option as any;
        expect(built.errors).toEqual([]);
        expect(option.xAxis.type).toBe("category");
        expect(option.yAxis).toBeDefined();
        expect(option.series[0]).toMatchObject({ type: "bar", data: [1, 2], itemStyle: { borderRadius: 4 } });
        // No data sets: the chart draws what its option holds.
        expect(built.pointCount).toBe(1);
    });

    it("lets the option win over the Hyper series defaults", () => {
        const option = buildCustom(
            [],
            settings({ series: { type: "bar", data: [1], itemStyle: { borderRadius: 0 } } }),
            HYPER_LIGHT
        ).option as any;
        expect(option.series[0].itemStyle.borderRadius).toBe(0);
        expect(hyperSeriesDefaults("heatmap", HYPER_LIGHT)).toEqual({});
    });

    it("fills $rows and $column placeholders", () => {
        const option = buildCustom(
            [SALES],
            settings({
                xAxis: { data: "$column:Sales.month" },
                series: [
                    { type: "line", data: "$column:Sales.value" },
                    { type: "scatter", data: "$rows:Sales" }
                ]
            }),
            HYPER_LIGHT
        ).option as any;
        expect(option.xAxis.data).toEqual(["Jan", "Feb"]);
        expect(option.series[0].data).toEqual([3, 5]);
        // Series on axes read values by position, so each row becomes a list, with the fields named for encode.
        expect(option.series[1].data).toEqual([
            ["Jan", 3],
            ["Feb", 5]
        ]);
        expect(option.series[1].dimensions).toEqual(["month", "value"]);
    });

    it("hands $rows to series that take objects as they are", () => {
        const option = buildCustom([SALES], settings({ series: [{ type: "pie", data: "$rows:Sales" }] }), HYPER_LIGHT)
            .option as any;
        expect(option.series[0].data).toEqual(SALES.rows);
        expect(option.series[0].dimensions).toBeUndefined();
    });

    it("plots a scatter of two fields by name", () => {
        const targets = dataSet("Sales", [
            { Revenue: 120, Target: 100 },
            { Revenue: 80, Target: 90 }
        ]);
        const option = buildCustom(
            [targets],
            settings({
                xAxis: { type: "value" },
                yAxis: { type: "value" },
                series: [{ type: "scatter", data: "$rows:Sales", encode: { x: "Revenue", y: "Target" } }]
            }),
            HYPER_LIGHT
        ).option as any;
        expect(option.series[0]).toMatchObject({
            dimensions: ["Revenue", "Target"],
            data: [
                [120, 100],
                [80, 90]
            ],
            encode: { x: "Revenue", y: "Target" }
        });
    });

    it("reports series that name an axis the option doesn't have", () => {
        const errors = (option: object): string[] | undefined => buildCustom([], settings(option), HYPER_LIGHT).errors;
        expect(errors({ series: [{ type: "bar", data: [1] }] })).toEqual([
            "Series 1 (bar) is drawn on x and y axes, but the option has no xAxis.",
            "Series 1 (bar) is drawn on x and y axes, but the option has no yAxis."
        ]);
        expect(
            errors({
                xAxis: {},
                yAxis: [{}],
                series: [
                    { type: "line", data: [1] },
                    { type: "line", yAxisIndex: 1, data: [1] }
                ]
            })
        ).toEqual(["Series 2 (line) uses yAxisIndex 1, but the option has only 1 yAxis."]);
        expect(errors({ xAxis: {}, yAxis: {}, series: [{ type: "line", xAxisId: "time", data: [1] }] })).toEqual([
            'Series 1 (line) uses xAxisId "time", but no xAxis has that id.'
        ]);
        expect(
            errors({ polar: {}, angleAxis: {}, radiusAxis: {}, series: [{ type: "bar", coordinateSystem: "polar" }] })
        ).toEqual([]);
        expect(errors({ series: [{ type: "pie", data: [1] }] })).toEqual([]);
    });

    it("appends the data sets as datasets after the option's own", () => {
        const option = buildCustom(
            [SALES],
            settings({ dataset: { source: [[1]] }, series: [{ type: "bar", datasetId: "Sales" }] }),
            HYPER_LIGHT
        ).option as any;
        expect(option.dataset).toEqual([
            { source: [[1]] },
            {
                id: "Sales",
                dimensions: ["month", "value"],
                source: [
                    ["Jan", 3],
                    ["Feb", 5]
                ]
            }
        ]);
    });

    it("reports data sets and fields that don't exist", () => {
        const built = buildCustom(
            [SALES],
            settings({
                xAxis: {},
                yAxis: {},
                series: [
                    { type: "bar", data: "$rows:Orders" },
                    { type: "bar", data: "$column:Sales.cost" }
                ]
            }),
            HYPER_LIGHT
        );
        expect(built.errors).toEqual([
            `"$rows:Orders" names a data set that doesn't exist.`,
            `"$column:Sales.cost" names a field Sales doesn't have. Its fields are month, value.`
        ]);
    });

    it("nests $tree rows under their parents, depth first", () => {
        const budget = dataSet("Budget", [
            { name: "Ops", parent: null, value: 10 },
            { name: "Rent", parent: "Ops", value: 6 },
            { name: "Sales", parent: null, value: 4 },
            { name: "Power", parent: "Ops", value: 4 }
        ]);
        const option = buildCustom(
            [budget],
            settings({ series: { type: "treemap", data: "$tree:Budget" } }),
            HYPER_LIGHT
        ).option as any;
        expect(option.series[0].data).toEqual([
            {
                name: "Ops",
                value: 10,
                children: [
                    { name: "Rent", value: 6 },
                    { name: "Power", value: 4 }
                ]
            },
            { name: "Sales", value: 4 }
        ]);
    });

    it("gives each $nodes name its own palette colour", () => {
        const flows = dataSet("Flows", [
            { source: "A", target: "B", value: 1 },
            { source: "B", target: "C", value: 1 }
        ]);
        const option = buildCustom(
            [flows],
            settings({ series: { type: "sankey", data: "$nodes:Flows", links: "$rows:Flows" } }),
            HYPER_LIGHT
        ).option as any;
        expect(option.series[0].data).toEqual(
            ["A", "B", "C"].map((name, i) => ({ name, itemStyle: { color: HYPER_LIGHT.palette[i] } }))
        );
        expect(option.series[0].links).toEqual(flows.rows);
        expect(option.series[0].emphasis.focus).toBe("adjacency");
    });

    it("runs the clicked row's action, for data, datasets and trees", () => {
        const actions = [jest.fn(), jest.fn(), jest.fn()];
        const tree = dataSet(
            "Tree",
            [
                { name: "Root", parent: null, value: 3 },
                { name: "Late", parent: null, value: 1 },
                { name: "Leaf", parent: "Root", value: 2 }
            ],
            actions
        );
        const built = buildCustom(
            [tree],
            settings({
                series: [
                    { type: "scatter", data: "$rows:Tree" },
                    { type: "bar", datasetId: "Tree" },
                    { type: "treemap", data: "$tree:Tree" },
                    { type: "line", data: [1, 2] }
                ]
            }),
            HYPER_LIGHT
        );
        built.clickTargets[0][1].action!.execute();
        expect(actions[1]).toHaveBeenCalledTimes(1);
        built.clickTargets[1][2].action!.execute();
        expect(actions[2]).toHaveBeenCalledTimes(1);
        // Treemaps number a hidden root first, then the nodes depth first: Root, Leaf, Late.
        expect(built.clickTargets[2][0].action).toBeUndefined();
        built.clickTargets[2][2].action!.execute();
        expect(actions[2]).toHaveBeenCalledTimes(2);
        built.clickTargets[2][3].action!.execute();
        expect(actions[1]).toHaveBeenCalledTimes(2);
        expect(built.clickTargets[3]).toEqual([]);
    });

    it("counts rows, and lists every data set for screen readers", () => {
        const empty = dataSet("Empty", []);
        expect(buildCustom([empty], settings({ series: [] }), HYPER_LIGHT).pointCount).toBe(0);
        const built = buildCustom([SALES, dataSet("Other", [{ value: 9 }])], settings({ series: [] }), HYPER_LIGHT);
        expect(built.pointCount).toBe(3);
        expect(built.table).toEqual({
            columns: ["Data set", "month", "value"],
            rows: [
                ["Sales", "Jan", "3"],
                ["Sales", "Feb", "5"],
                ["Other", "", "9"]
            ]
        });
    });
});
