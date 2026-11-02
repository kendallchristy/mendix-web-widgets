import Big from "big.js";

import { insertItem, moveItem, planSortValues, sortByValue, type PositionedItem } from "../order/positions";

const items = (...values: Array<number | undefined>): PositionedItem[] =>
    values.map((value, i) => ({ id: `i${i}`, value: value === undefined ? undefined : new Big(value) }));

const plain = (changes: ReturnType<typeof planSortValues>): Array<[string, string]> =>
    changes.map(change => [change.id, change.value.toString()]);

describe("planSortValues", () => {
    it("leaves the order alone when the moved item already fits", () => {
        expect(planSortValues(items(1, 2, 3), "i1", "decimal")).toEqual([]);
    });

    it("gives a decimal item the midpoint of its new neighbours", () => {
        // The item with value 5 was moved between 1 and 2.
        const order = [items(1)[0], { id: "moved", value: new Big(5) }, ...items(undefined, 2).slice(1)];
        expect(plain(planSortValues(order, "moved", "decimal"))).toEqual([["moved", "1.5"]]);
    });

    it("moves to the start and end with a step of one", () => {
        const first = [{ id: "m", value: new Big(9) }, ...items(undefined, 3, 4).slice(1)];
        expect(plain(planSortValues(first, "m", "decimal"))).toEqual([["m", "2"]]);
        const last = [...items(1, 2), { id: "m", value: new Big(0) }];
        expect(plain(planSortValues(last, "m", "decimal"))).toEqual([["m", "3"]]);
    });

    it("uses whole numbers for integer attributes", () => {
        const order = [...items(10), { id: "m", value: new Big(1) }, { id: "n", value: new Big(20) }];
        expect(plain(planSortValues(order, "m", "integer"))).toEqual([["m", "15"]]);
    });

    it("renumbers onwards when integer neighbours leave no room", () => {
        const order = [
            { id: "a", value: new Big(4) },
            { id: "m", value: new Big(9) },
            { id: "b", value: new Big(5) },
            { id: "c", value: new Big(6) },
            { id: "d", value: new Big(20) }
        ];
        // The moved item comes first; d already fits after the cascade and is left alone.
        expect(plain(planSortValues(order, "m", "integer"))).toEqual([
            ["m", "5"],
            ["b", "6"],
            ["c", "7"]
        ]);
    });

    it("fills in empty values", () => {
        const plan = planSortValues(items(undefined, undefined, undefined), "i1", "integer");
        const values = new Map(plain(plan));
        expect(values.get("i1")).toBeDefined();
        const order = ["i0", "i1", "i2"].map(id => Number(values.get(id)));
        expect(order[0]).toBeLessThan(order[1]);
        expect(order[1]).toBeLessThan(order[2]);
        expect(plan[0].id).toBe("i1");
    });

    it("keeps eight decimal places", () => {
        const order = [
            { id: "a", value: new Big("1") },
            { id: "m", value: new Big(7) },
            { id: "b", value: new Big("1.00000003") }
        ];
        expect(plain(planSortValues(order, "m", "decimal"))).toEqual([["m", "1.00000002"]]);
    });

    it("returns nothing for an unknown item", () => {
        expect(planSortValues(items(1, 2), "missing", "decimal")).toEqual([]);
    });
});

describe("moveItem and insertItem", () => {
    it("moves without changing the input", () => {
        const list = ["a", "b", "c", "d"];
        expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
        expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
        expect(list).toEqual(["a", "b", "c", "d"]);
    });

    it("clamps the target index", () => {
        expect(moveItem(["a", "b"], 0, 9)).toEqual(["b", "a"]);
        expect(insertItem(["a", "b"], "x", -3)).toEqual(["x", "a", "b"]);
        expect(insertItem(["a", "b"], "x", 1)).toEqual(["a", "x", "b"]);
    });
});

describe("sortByValue", () => {
    it("sorts ascending, keeps ties stable and puts empty values last", () => {
        const rows = [
            { id: "a", v: 3 },
            { id: "b", v: undefined },
            { id: "c", v: 1 },
            { id: "d", v: 3 },
            { id: "e", v: undefined }
        ];
        const sorted = sortByValue(rows, row => (row.v === undefined ? undefined : new Big(row.v)));
        expect(sorted.map(row => row.id)).toEqual(["c", "a", "d", "b", "e"]);
    });
});
