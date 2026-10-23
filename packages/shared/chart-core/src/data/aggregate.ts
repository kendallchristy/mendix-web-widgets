import type { XValue } from "./values";

export type Aggregation = "none" | "count" | "sum" | "avg" | "min" | "max";

export interface Point<T> {
    x: XValue;
    y: number | undefined;
    size?: number;
    source: T;
}

export interface AggregatedPoint<T> {
    x: XValue;
    y: number | undefined;
    size?: number;
    /** The source objects behind the point; one unless points were aggregated. */
    sources: T[];
}

/** A key that is equal for equal axis values, including two Date objects for the same moment. */
export function xKey(x: XValue): string | number {
    return x instanceof Date ? x.getTime() : x;
}

/** Combines values with an aggregation; count is the number of objects, values or not. */
export function combineValues(
    values: number[],
    aggregation: Exclude<Aggregation, "none">,
    count: number
): number | undefined {
    if (aggregation === "count") {
        return count;
    }
    if (values.length === 0) {
        return undefined;
    }
    switch (aggregation) {
        case "sum":
            return values.reduce((a, b) => a + b, 0);
        case "avg":
            return values.reduce((a, b) => a + b, 0) / values.length;
        case "min":
            return Math.min(...values);
        case "max":
            return Math.max(...values);
    }
}

/**
 * Combines points that share an axis value. Groups keep the order their first point appeared in; sort afterwards
 * for number and date axes.
 */
export function aggregate<T>(
    points: Array<Point<T>>,
    aggregation: Aggregation,
    keyOf: (x: XValue) => string | number = xKey
): Array<AggregatedPoint<T>> {
    if (aggregation === "none") {
        return points.map(({ source, ...rest }) => ({ ...rest, sources: [source] }));
    }
    const groups = new Map<string | number, Array<Point<T>>>();
    for (const point of points) {
        const key = keyOf(point.x);
        const group = groups.get(key);
        if (group) {
            group.push(point);
        } else {
            groups.set(key, [point]);
        }
    }
    return Array.from(groups.values(), group => {
        const ys = group.map(p => p.y).filter((y): y is number => y !== undefined);
        const sizes = group.map(p => p.size).filter((s): s is number => s !== undefined);
        return {
            x: group[0].x,
            y: combineValues(ys, aggregation, group.length),
            size:
                sizes.length > 0
                    ? combineValues(sizes, aggregation === "count" ? "sum" : aggregation, sizes.length)
                    : undefined,
            sources: group.map(p => p.source)
        };
    });
}

/** Sorts points by their axis value. Text values keep their order. */
export function sortByX<P extends { x: XValue }>(points: P[]): P[] {
    if (points.every(p => typeof p.x !== "string")) {
        return [...points].sort((a, b) => Number(xKey(a.x)) - Number(xKey(b.x)));
    }
    return points;
}
