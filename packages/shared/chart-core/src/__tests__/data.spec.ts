import { aggregate, sortByX } from "../data/aggregate";
import { detectXKind, isAnyLoading, toNumber } from "../data/values";

const points = [
    { x: "A", y: 1, source: "a1" },
    { x: "B", y: 10, source: "b1" },
    { x: "A", y: 3, source: "a2" },
    { x: "A", y: undefined, source: "a3" }
];

describe("aggregate", () => {
    it("keeps every point for none", () => {
        expect(aggregate(points, "none")).toHaveLength(4);
    });

    it.each([
        ["sum", 4],
        ["avg", 2],
        ["min", 1],
        ["max", 3],
        ["count", 3]
    ] as const)("combines points with %s", (aggregation, expected) => {
        const result = aggregate(points, aggregation);
        expect(result.map(p => p.x)).toEqual(["A", "B"]);
        expect(result[0].y).toBe(expected);
        expect(result[0].sources).toEqual(["a1", "a2", "a3"]);
    });

    it("treats equal dates as one value", () => {
        const result = aggregate(
            [
                { x: new Date(2026, 0, 1), y: 1, source: 1 },
                { x: new Date(2026, 0, 1), y: 2, source: 2 }
            ],
            "sum"
        );
        expect(result).toHaveLength(1);
        expect(result[0].y).toBe(3);
    });
});

describe("sortByX", () => {
    it("sorts numbers and dates but keeps text order", () => {
        expect(sortByX([{ x: 3 }, { x: 1 }, { x: 2 }]).map(p => p.x)).toEqual([1, 2, 3]);
        expect(sortByX([{ x: "b" }, { x: "a" }]).map(p => p.x)).toEqual(["b", "a"]);
    });
});

describe("values", () => {
    it("converts Big-like values, numbers and numeric text", () => {
        expect(toNumber({ toNumber: () => 1.5, toString: () => "1.5" })).toBe(1.5);
        expect(toNumber({ toString: () => "2.5" })).toBe(2.5);
        expect(toNumber(3)).toBe(3);
        expect(toNumber("4")).toBe(4);
        expect(toNumber("")).toBeUndefined();
        expect(toNumber(undefined)).toBeUndefined();
    });

    it("detects the axis kind", () => {
        expect(detectXKind([new Date(), undefined, new Date()])).toBe("time");
        expect(detectXKind([1, 2])).toBe("value");
        expect(detectXKind(["a", 1])).toBe("category");
        expect(detectXKind([])).toBe("category");
    });
});

describe("isAnyLoading", () => {
    it("is true while any data source loads, including a reload of data already delivered", () => {
        expect(isAnyLoading([{ status: "available" }, { status: "loading" }])).toBe(true);
        expect(isAnyLoading([{ status: "available" }, { status: "unavailable" }, undefined])).toBe(false);
    });
});
