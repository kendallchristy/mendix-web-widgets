import type { ListAttributeValue, ObjectItem } from "mendix";

export type XValue = string | number | Date;

export type XKind = "category" | "value" | "time";

interface BigLike {
    toNumber?: () => number;
    toString(): string;
}

/** Turns a Mendix value (Big, number or numeric string) into a number. */
export function toNumber(value: unknown): number | undefined {
    if (value == null) {
        return undefined;
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "object" && !(value instanceof Date)) {
        const big = value as BigLike;
        const n = typeof big.toNumber === "function" ? big.toNumber() : Number(big.toString());
        return Number.isFinite(n) ? n : undefined;
    }
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

/** Reads an attribute as a number. */
export function readNumber(attribute: ListAttributeValue | undefined, item: ObjectItem): number | undefined {
    return attribute ? toNumber(attribute.get(item).value) : undefined;
}

/**
 * Reads an attribute as an axis value: dates stay dates, numbers become numbers, and everything else (strings,
 * enumerations, booleans) becomes its display text.
 */
export function readXValue(attribute: ListAttributeValue | undefined, item: ObjectItem): XValue | undefined {
    if (!attribute) {
        return undefined;
    }
    const editable = attribute.get(item);
    const value: unknown = editable.value;
    if (value == null) {
        return undefined;
    }
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === "object" || typeof value === "number") {
        return toNumber(value);
    }
    return editable.displayValue || String(value);
}

/** Reads an attribute as text, for group names and drilldown categories. */
export function readText(attribute: ListAttributeValue | undefined, item: ObjectItem): string | undefined {
    if (!attribute) {
        return undefined;
    }
    const editable = attribute.get(item);
    if (editable.value == null) {
        return undefined;
    }
    return editable.displayValue || String(editable.value);
}

/** Which kind of axis fits a set of values: time for dates, value for numbers, category for anything else. */
export function detectXKind(values: Iterable<XValue | undefined>): XKind {
    let kind: XKind | undefined;
    for (const value of values) {
        if (value === undefined) {
            continue;
        }
        const next: XKind = value instanceof Date ? "time" : typeof value === "number" ? "value" : "category";
        if (kind && kind !== next) {
            return "category";
        }
        kind = next;
    }
    return kind ?? "category";
}

/**
 * Whether any data source is still loading. Mendix also reports loading while it reloads a list it already
 * delivered; the chart then keeps the previous data on screen until the new list is complete.
 */
export function isAnyLoading(sources: Array<{ status: string } | undefined>): boolean {
    return sources.some(source => source?.status === "loading");
}
