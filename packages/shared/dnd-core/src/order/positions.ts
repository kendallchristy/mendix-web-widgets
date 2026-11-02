import Big from "big.js";

/** Integer and Long attributes take whole numbers; Decimal attributes keep 8 decimal places in Mendix. */
export type SortKind = "integer" | "decimal";

export interface PositionedItem {
    id: string;
    /** The item's current sort value. Undefined when the attribute is empty. */
    value: Big | undefined;
}

export interface ValueChange {
    id: string;
    value: Big;
}

const DECIMAL_SCALE = 8;
const ROUND_DOWN = 0;
const ROUND_HALF_UP = 1;

function between(prev: Big | undefined, next: Big | undefined, kind: SortKind): Big | undefined {
    if (prev === undefined && next === undefined) {
        return new Big(1);
    }
    if (next === undefined) {
        return kind === "integer" ? prev!.round(0, ROUND_DOWN).plus(1) : prev!.plus(1);
    }
    if (prev === undefined) {
        return kind === "integer" ? next.round(0, 3).minus(1) : next.minus(1);
    }
    if (kind === "integer") {
        if (next.minus(prev).lt(2)) {
            return undefined;
        }
        const mid = prev.plus(next).div(2).round(0, ROUND_DOWN);
        return mid.gt(prev) && mid.lt(next) ? mid : undefined;
    }
    const mid = prev.plus(next).div(2).round(DECIMAL_SCALE, ROUND_HALF_UP);
    return mid.gt(prev) && mid.lt(next) ? mid : undefined;
}

function fits(value: Big | undefined, prev: Big | undefined, next: Big | undefined, kind: SortKind): boolean {
    if (value === undefined) {
        return false;
    }
    if (kind === "integer" && !value.eq(value.round(0, ROUND_DOWN))) {
        return false;
    }
    return (prev === undefined || value.gt(prev)) && (next === undefined || value.lt(next));
}

/**
 * Works out the sort values to write after an item moved, so that sorting by the attribute gives `order`.
 *
 * Usually only the moved item changes: it gets a value between its new neighbours (the midpoint for Decimal
 * attributes). When there is no room between them, for example Integer neighbours 4 and 5, the items from the
 * moved one onwards are renumbered as far as needed to keep the values increasing. The moved item comes first in
 * the result; items whose value doesn't change are left out.
 */
export function planSortValues(order: PositionedItem[], movedId: string, kind: SortKind): ValueChange[] {
    const index = order.findIndex(item => item.id === movedId);
    if (index < 0) {
        return [];
    }
    const moved = order[index];
    const prevItem = order[index - 1];
    const nextItem = order[index + 1];
    const neighboursKnown =
        (prevItem === undefined || prevItem.value !== undefined) &&
        (nextItem === undefined || nextItem.value !== undefined);

    if (neighboursKnown) {
        if (fits(moved.value, prevItem?.value, nextItem?.value, kind)) {
            return [];
        }
        const value = between(prevItem?.value, nextItem?.value, kind);
        if (value !== undefined) {
            return [{ id: moved.id, value }];
        }
    }

    // Renumber: walk the list and bump every value that isn't above the previous one.
    const changes: ValueChange[] = [];
    let last: Big | undefined;
    order.forEach((item, i) => {
        let value = item.value;
        const isMoved = i === index;
        if (isMoved || value === undefined || (last !== undefined && value.lte(last))) {
            if (last === undefined) {
                const next = order[i + 1]?.value;
                value = isMoved && next !== undefined ? between(undefined, next, kind)! : (value ?? new Big(1));
                if (isMoved && next === undefined) {
                    value = new Big(1);
                }
            } else {
                value = kind === "integer" ? last.round(0, ROUND_DOWN).plus(1) : last.plus(1);
            }
            if (item.value === undefined || !value.eq(item.value)) {
                changes.push({ id: item.id, value });
            }
        }
        last = value;
    });
    changes.sort((a, b) => (a.id === movedId ? -1 : b.id === movedId ? 1 : 0));
    return changes;
}

/** Moves the item at `from` to `to` (both indexes in the list), returning a new array. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
    const copy = list.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(Math.max(0, Math.min(to, copy.length)), 0, item);
    return copy;
}

/** Inserts an item at `to`, returning a new array. */
export function insertItem<T>(list: readonly T[], item: T, to: number): T[] {
    const copy = list.slice();
    copy.splice(Math.max(0, Math.min(to, copy.length)), 0, item);
    return copy;
}

/**
 * Sorts by value, smallest first, keeping the original order for equal values. Items without a value go last, in
 * their original order.
 */
export function sortByValue<T>(items: readonly T[], value: (item: T) => Big | undefined): T[] {
    const keyed = items.map((item, index) => ({ item, index, value: value(item) }));
    keyed.sort((a, b) => {
        if (a.value === undefined || b.value === undefined) {
            return a.value === b.value ? a.index - b.index : a.value === undefined ? 1 : -1;
        }
        const cmp = a.value.cmp(b.value);
        return cmp !== 0 ? cmp : a.index - b.index;
    });
    return keyed.map(k => k.item);
}
