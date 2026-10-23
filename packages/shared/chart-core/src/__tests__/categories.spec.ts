import type { CategoryOptions, CategoryPoint } from "../data/categories";
import { categoryColors, categoryLevel, readCategoryPoints, sampleCategoryPoints } from "../data/categories";

const options = (overrides: Partial<CategoryOptions> = {}): CategoryOptions => ({
    aggregation: "sum",
    sort: "data",
    limit: 0,
    drilldown: false,
    topLabel: "All",
    ...overrides
});

const point = (category: string, value?: number, drill: Array<string | undefined> = []): CategoryPoint => ({
    category,
    value,
    drill
});

describe("categoryLevel", () => {
    const points = [point("A", 5), point("B", 2), point("A", 3), point("C", 9), point("B")];

    it("combines objects with the same category", () => {
        const level = categoryLevel(points, options(), []);
        expect(level.items.map(i => [i.name, i.value])).toEqual([
            ["A", 8],
            ["B", 2],
            ["C", 9]
        ]);
        expect(categoryLevel(points, options({ aggregation: "count" }), []).items.map(i => i.value)).toEqual([2, 2, 1]);
        expect(categoryLevel(points, options({ aggregation: "avg" }), []).items[0].value).toBe(4);
    });

    it("sorts", () => {
        const names = (sort: CategoryOptions["sort"]): string[] =>
            categoryLevel(points, options({ sort }), []).items.map(i => i.name);
        expect(names("valueDesc")).toEqual(["C", "A", "B"]);
        expect(names("valueAsc")).toEqual(["B", "A", "C"]);
        expect(names("name")).toEqual(["A", "B", "C"]);
    });

    it("keeps the largest items and folds the rest into Other", () => {
        const level = categoryLevel(points, options({ limit: 2, otherLabel: "Other" }), []);
        expect(level.items.map(i => [i.name, i.value, i.other])).toEqual([
            ["C", 9, false],
            ["Other", 10, true]
        ]);
        expect(level.items[1].target).toEqual({});

        const dropped = categoryLevel(points, options({ limit: 2 }), []);
        expect(dropped.items.map(i => i.name)).toEqual(["A", "C"]);
    });

    it("only takes tooltips from items with a single object", () => {
        const level = categoryLevel(
            [
                { ...point("A", 1), tooltip: "one" },
                { ...point("A", 1), tooltip: "two" },
                { ...point("B", 1), tooltip: "only" }
            ],
            options(),
            []
        );
        expect(level.items.map(i => i.tooltip)).toEqual([undefined, "only"]);
    });

    it("drills down through the levels and builds the breadcrumb", () => {
        const action = { canExecute: true, execute: jest.fn() };
        const drill = [
            { ...point("Europe", 1, ["France", "Paris"]), action },
            point("Europe", 2, ["Spain", undefined]),
            point("Asia", 4, ["Japan", undefined])
        ];
        const top = categoryLevel(drill, options({ drilldown: true }), []);
        expect(top.breadcrumb).toEqual(["All"]);
        expect(top.items[0].target).toEqual({ drill: { label: "Europe", value: "Europe" } });

        const europe = categoryLevel(drill, options({ drilldown: true }), [{ label: "Europe", value: "Europe" }]);
        expect(europe.items.map(i => i.name)).toEqual(["France", "Spain"]);
        expect(europe.breadcrumb).toEqual(["All", "Europe"]);
        expect(europe.items[0].target.drill?.value).toBe("France");
        // Spain has nothing below it, so a click runs its action.
        expect(europe.items[1].target.drill).toBeUndefined();

        const france = categoryLevel(drill, options({ drilldown: true }), [
            { label: "Europe", value: "Europe" },
            { label: "France", value: "France" }
        ]);
        expect(france.items.map(i => i.name)).toEqual(["Paris"]);
        expect(france.items[0].target.action).toBe(action);
        expect(france.pointCount).toBe(1);
    });

    it("has no breadcrumb without drilldown", () => {
        expect(categoryLevel([point("A", 1, ["x"])], options(), []).breadcrumb).toEqual([]);
    });
});

describe("readCategoryPoints", () => {
    it("reads attributes, colours, tooltips and actions", () => {
        const item = { id: "1" };
        const attr = (value: unknown) => ({ get: () => ({ value, displayValue: String(value) }) });
        const action = { canExecute: true, execute: jest.fn() };
        const points = readCategoryPoints({
            dataSource: { items: [item, { id: "2" }], status: "available" },
            categoryAttribute: {
                get: (i: { id: string }) => ({ value: i.id === "1" ? "A" : undefined, displayValue: "A" })
            },
            valueAttribute: attr(5),
            colorAttribute: attr(" #123456 "),
            tooltipText: { get: () => ({ value: "tip" }) },
            onClick: { get: () => action },
            drillAttribute1: attr("x")
        } as never);
        expect(points).toEqual([
            { category: "A", value: 5, color: "#123456", tooltip: "tip", action, drill: ["x", undefined] }
        ]);
    });
});

describe("category helpers", () => {
    it("colours items in palette order, with Other muted and own colours kept", () => {
        const items = categoryLevel(
            [point("A", 3), { ...point("B", 2), color: "#000000" }, point("C", 1), point("D", 1)],
            options({ limit: 3, otherLabel: "Other" }),
            []
        ).items;
        expect(categoryColors(items, ["#111111", "#222222", "#333333"], "#999999")).toEqual([
            "#111111",
            "#000000",
            "#999999"
        ]);
    });

    it("has sample data", () => {
        expect(sampleCategoryPoints(3).map(p => p.category)).toEqual(["Direct", "Search", "Social"]);
    });
});
