import type { Axis, Box, Point } from "./types";

export interface LayoutInput {
    axis: Axis;
    /** Slot boxes by index, in the list's content coordinates. Indexes that aren't rendered are missing. */
    slots: ReadonlyMap<number, Box>;
    count: number;
    gap: number;
    /** The dragged item when it started in this list. */
    source?: { index: number; width: number; height: number };
    /** The dragged item when it comes from another list. */
    incoming?: { width: number; height: number };
    /** Where the item would land, as an index in the list after the move. Undefined when it isn't over this list. */
    target?: number;
}

export interface LayoutResult {
    /** How far to move each rendered item, by index. Items that stay put are left out. */
    shifts: Map<number, Point>;
    /** Where the gap opens, in content coordinates. */
    placeholder?: Box;
}

/** Index an item at `index` ends up at for this drag state, or undefined when it's the dragged item itself. */
export function finalIndex(index: number, input: Pick<LayoutInput, "source" | "target" | "incoming">): number {
    const { source, target } = input;
    if (source) {
        const s = source.index;
        if (index === s) {
            return target ?? s;
        }
        if (target === undefined) {
            return index > s ? index - 1 : index;
        }
        if (s < index && index <= target) {
            return index - 1;
        }
        if (target <= index && index < s) {
            return index + 1;
        }
        return index;
    }
    if (target !== undefined && index >= target) {
        return index + 1;
    }
    return index;
}

/** Boxes of grid slots, including one past the last rendered slot so items can move into it. */
function gridSlot(slots: ReadonlyMap<number, Box>, index: number, gap: number): Box | undefined {
    const box = slots.get(index);
    if (box) {
        return box;
    }
    const prev = slots.get(index - 1);
    if (!prev) {
        return undefined;
    }
    // Work out the column count from the first row.
    const first = slots.get(0);
    let columns = 0;
    if (first) {
        while (slots.get(columns)?.y === first.y) {
            columns++;
        }
    }
    const fitsInRow = first !== undefined && columns > 0 && index % columns !== 0;
    if (fitsInRow) {
        return { ...prev, x: prev.x + prev.width + gap };
    }
    const rowStart = first ? { x: first.x } : { x: prev.x };
    return { ...prev, x: rowStart.x, y: prev.y + prev.height + gap };
}

/**
 * Works out where every rendered item moves to while an item is dragged, and where the gap for it opens.
 * Lists move items by the dragged item's size; grids move each item into the slot of its new index.
 */
export function layoutDrag(input: LayoutInput): LayoutResult {
    const { axis, slots, gap, source, incoming, target } = input;
    const shifts = new Map<number, Point>();
    const draggedSize = source ?? incoming;
    if (!draggedSize) {
        return { shifts };
    }
    const vertical = axis === "vertical";

    if (axis === "grid") {
        slots.forEach((box, index) => {
            if (source && index === source.index) {
                return;
            }
            const to = gridSlot(slots, finalIndex(index, input), gap);
            if (to && (to.x !== box.x || to.y !== box.y)) {
                shifts.set(index, { x: to.x - box.x, y: to.y - box.y });
            }
        });
        if (target === undefined) {
            return { shifts };
        }
        const slot = gridSlot(slots, target, gap);
        return {
            shifts,
            placeholder: slot && { x: slot.x, y: slot.y, width: slot.width, height: draggedSize.height }
        };
    }

    const size = (vertical ? draggedSize.height : draggedSize.width) + gap;
    slots.forEach((_box, index) => {
        if (source && index === source.index) {
            return;
        }
        const delta = finalIndex(index, input) - (source && index > source.index ? index - 1 : index);
        // delta is 1 when the item moves past the gap, 0 otherwise. Items after the source close its gap first.
        const closesSource = source && index > source.index ? -size : 0;
        const opens = delta > 0 ? size : 0;
        const amount = closesSource + opens;
        if (amount !== 0) {
            shifts.set(index, vertical ? { x: 0, y: amount } : { x: amount, y: 0 });
        }
    });

    if (target === undefined) {
        return { shifts };
    }
    return { shifts, placeholder: listPlaceholder(input, draggedSize) };
}

function listPlaceholder(input: LayoutInput, dragged: { width: number; height: number }): Box | undefined {
    const { axis, slots, source, target, count, gap } = input;
    const vertical = axis === "vertical";
    const main = (b: Box): number => (vertical ? b.y : b.x);
    const mainSize = (b: Box): number => (vertical ? b.height : b.width);
    const draggedMain = vertical ? dragged.height : dragged.width;
    let start: number | undefined;
    let anchor: Box | undefined;
    if (source) {
        const s = source.index;
        const t = target!;
        if (t <= s) {
            anchor = slots.get(t);
            start = anchor && main(anchor);
        } else {
            anchor = slots.get(t);
            start = anchor && main(anchor) + mainSize(anchor) - draggedMain;
        }
    } else {
        const t = target!;
        anchor = slots.get(t);
        if (anchor) {
            start = main(anchor);
        } else {
            anchor = slots.get(count - 1);
            start = anchor ? main(anchor) + mainSize(anchor) + gap : 0;
        }
    }
    if (start === undefined) {
        return undefined;
    }
    if (vertical) {
        return { x: anchor?.x ?? 0, y: start, width: anchor?.width ?? dragged.width, height: dragged.height };
    }
    return { x: start, y: anchor?.y ?? 0, width: dragged.width, height: anchor?.height ?? dragged.height };
}

/**
 * Turns "over item `index`, nearer its `edge`" into the index the dragged item would get after the move.
 * `sourceIndex` is the dragged item's index when it comes from the same list.
 */
export function insertionIndex(overIndex: number, after: boolean, sourceIndex: number | undefined): number {
    const before = after ? overIndex + 1 : overIndex;
    return sourceIndex !== undefined && sourceIndex < before ? before - 1 : before;
}
