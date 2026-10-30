import { applyOrder, moveColumn } from "../model/order";

const cols = (...ids: string[]): Array<{ id: string }> => ids.map(id => ({ id }));
const ids = (columns: Array<{ id: string }>): string[] => columns.map(c => c.id);

describe("column order", () => {
    it("keeps the Studio Pro order without saved settings", () => {
        expect(ids(applyOrder(cols("c0", "c1", "c2"), undefined))).toEqual(["c0", "c1", "c2"]);
    });

    it("applies the saved order", () => {
        expect(ids(applyOrder(cols("c0", "c1", "c2"), ["c2", "c0", "c1"]))).toEqual(["c2", "c0", "c1"]);
    });

    it("keeps columns the saved order doesn't know in place", () => {
        expect(ids(applyOrder(cols("c0", "c1", "c2", "c3"), ["c2", "c1", "c0"]))).toEqual(["c2", "c1", "c0", "c3"]);
    });

    it("moves a column in front of another", () => {
        expect(moveColumn(["c0", "c1", "c2", "c3"], "c3", "c1")).toEqual(["c0", "c3", "c1", "c2"]);
        expect(moveColumn(["c0", "c1", "c2", "c3"], "c0", "c2")).toEqual(["c1", "c0", "c2", "c3"]);
    });

    it("moves a column to the end", () => {
        expect(moveColumn(["c0", "c1", "c2"], "c0", undefined)).toEqual(["c1", "c2", "c0"]);
    });

    it("leaves the order alone when dropped on itself", () => {
        expect(moveColumn(["c0", "c1"], "c1", "c1")).toEqual(["c0", "c1"]);
    });
});
