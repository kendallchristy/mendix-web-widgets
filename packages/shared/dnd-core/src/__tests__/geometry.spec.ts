import { finalIndex, insertionIndex, layoutDrag } from "../engine/geometry";
import type { Box } from "../engine/types";

/** A vertical list of 40px rows with 8px gaps. */
function column(count: number): Map<number, Box> {
    return new Map(Array.from({ length: count }, (_, i) => [i, { x: 0, y: i * 48, width: 200, height: 40 }]));
}

describe("finalIndex", () => {
    it("shifts items between the source and the target", () => {
        const input = { source: { index: 1, width: 0, height: 0 }, target: 3 };
        expect([0, 1, 2, 3, 4].map(i => finalIndex(i, input))).toEqual([0, 3, 1, 2, 4]);
    });

    it("makes room for an item from another list", () => {
        const input = { incoming: { width: 0, height: 0 }, target: 2 };
        expect([0, 1, 2, 3].map(i => finalIndex(i, input))).toEqual([0, 1, 3, 4]);
    });
});

describe("insertionIndex", () => {
    it("lands before or after the item under the pointer", () => {
        expect(insertionIndex(2, false, undefined)).toBe(2);
        expect(insertionIndex(2, true, undefined)).toBe(3);
    });

    it("accounts for the gap the source leaves in its own list", () => {
        expect(insertionIndex(4, true, 1)).toBe(4);
        expect(insertionIndex(0, false, 3)).toBe(0);
    });
});

describe("layoutDrag", () => {
    it("moves the items between source and target up by the dragged size", () => {
        const result = layoutDrag({
            axis: "vertical",
            slots: column(5),
            count: 5,
            gap: 8,
            source: { index: 1, width: 200, height: 40 },
            target: 3
        });
        expect(result.shifts.get(2)).toEqual({ x: 0, y: -48 });
        expect(result.shifts.get(3)).toEqual({ x: 0, y: -48 });
        expect(result.shifts.has(0)).toBe(false);
        expect(result.shifts.has(4)).toBe(false);
        expect(result.placeholder).toEqual({ x: 0, y: 144, width: 200, height: 40 });
    });

    it("opens a gap for an incoming item and places the placeholder there", () => {
        const result = layoutDrag({
            axis: "vertical",
            slots: column(3),
            count: 3,
            gap: 8,
            incoming: { width: 200, height: 40 },
            target: 1
        });
        expect(result.shifts.has(0)).toBe(false);
        expect(result.shifts.get(1)).toEqual({ x: 0, y: 48 });
        expect(result.shifts.get(2)).toEqual({ x: 0, y: 48 });
        expect(result.placeholder?.y).toBe(48);
    });

    it("closes the source's gap when the item leaves the list", () => {
        const result = layoutDrag({
            axis: "vertical",
            slots: column(3),
            count: 3,
            gap: 8,
            source: { index: 0, width: 200, height: 40 }
        });
        expect(result.shifts.get(1)).toEqual({ x: 0, y: -48 });
        expect(result.placeholder).toBeUndefined();
    });

    it("puts the placeholder after the last item of an empty-ended list", () => {
        const result = layoutDrag({
            axis: "vertical",
            slots: column(2),
            count: 2,
            gap: 8,
            incoming: { width: 200, height: 40 },
            target: 2
        });
        expect(result.placeholder?.y).toBe(96);
    });

    it("moves grid items into the next slot's box", () => {
        // Two columns of 100x100 tiles with 10px gaps.
        const slots = new Map<number, Box>(
            Array.from({ length: 4 }, (_, i) => [
                i,
                { x: (i % 2) * 110, y: Math.floor(i / 2) * 110, width: 100, height: 100 }
            ])
        );
        const result = layoutDrag({
            axis: "grid",
            slots,
            count: 4,
            gap: 10,
            source: { index: 0, width: 100, height: 100 },
            target: 3
        });
        expect(result.shifts.get(1)).toEqual({ x: -110, y: 0 });
        expect(result.shifts.get(2)).toEqual({ x: 110, y: -110 });
        expect(result.placeholder).toMatchObject({ x: 110, y: 110 });
    });
});
