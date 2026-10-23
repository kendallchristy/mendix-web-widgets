import { deepMerge, mergeJsonTexts, parseJsonObject } from "../options/merge";

describe("deepMerge", () => {
    it("merges objects key by key without changing the inputs", () => {
        const base = { a: 1, nested: { b: 2, c: 3 } };
        const result = deepMerge(base, { nested: { c: 4 }, d: 5 });
        expect(result).toEqual({ a: 1, nested: { b: 2, c: 4 }, d: 5 });
        expect(base).toEqual({ a: 1, nested: { b: 2, c: 3 } });
    });

    it("replaces plain arrays", () => {
        expect(deepMerge({ color: ["#1", "#2"] }, { color: ["#3"] })).toEqual({ color: ["#3"] });
    });

    it("merges arrays of objects item by item, so series keep their data", () => {
        const base = {
            series: [
                { type: "line", data: [1, 2] },
                { type: "bar", data: [3] }
            ]
        };
        expect(deepMerge(base, { series: [{ smooth: false }] })).toEqual({
            series: [
                { type: "line", data: [1, 2], smooth: false },
                { type: "bar", data: [3] }
            ]
        });
    });

    it("applies an object to every item of an array", () => {
        const base = { yAxis: [{ type: "value" }, { type: "value", position: "right" }] };
        expect(deepMerge(base, { yAxis: { min: 0 } })).toEqual({
            yAxis: [
                { type: "value", min: 0 },
                { type: "value", position: "right", min: 0 }
            ]
        });
    });
});

describe("parseJsonObject", () => {
    it("accepts empty text", () => {
        expect(parseJsonObject("  ")).toEqual({});
        expect(parseJsonObject(undefined)).toEqual({});
    });

    it("parses objects and rejects everything else", () => {
        expect(parseJsonObject('{"a": 1}')).toEqual({ value: { a: 1 } });
        expect(parseJsonObject("[1]").error).toMatch(/object/);
        expect(parseJsonObject("{oops").error).toBeDefined();
    });
});

describe("mergeJsonTexts", () => {
    it("merges texts in order and collects errors", () => {
        const result = mergeJsonTexts(['{"a": 1, "b": {"c": 1}}', undefined, "nope", '{"b": {"c": 2}}']);
        expect(result.value).toEqual({ a: 1, b: { c: 2 } });
        expect(result.errors).toHaveLength(1);
    });
});
