// A small in-memory imitation of the Mendix pluggable widget API: just enough of ListValue, attributes,
// expressions and actions for Data Grid Pro to run outside Mendix.
import type { ReactNode } from "react";

import type { Expr } from "./builders";

export interface MockItem {
    id: string;
}

type Sort = Array<[string, "asc" | "desc"]>;

interface ListOptions<R> {
    /** Simulated server round trip, in milliseconds. */
    latency: number;
    sortValue(row: R, attributeId: string): string | number;
    association(row: R, associationId: string): MockItem | MockItem[] | undefined;
}

/** One data source. `value()` returns a fresh ListValue-shaped object, as Mendix does on every update. */
export class MockList<R extends MockItem> {
    private offset = 0;
    private limit = Number.POSITIVE_INFINITY;
    private sort: Sort = [];
    private filter: Expr | undefined;
    private status: "loading" | "available" = "loading";
    private items: R[] | undefined;
    private total = 0;
    private hasMore = false;
    private timer: ReturnType<typeof setTimeout> | undefined;
    /** Requests served, for the demo's stats panel. */
    requests = 0;

    constructor(
        private rows: R[],
        private options: ListOptions<R>,
        private onChange: () => void
    ) {
        this.fetch();
    }

    value(): unknown {
        return {
            status: this.status,
            offset: this.offset,
            limit: this.limit,
            sortOrder: this.sort,
            filter: this.filter,
            items: this.items,
            hasMoreItems: this.hasMore,
            totalCount: this.items ? this.total : undefined,
            setOffset: (offset: number) => this.update(() => (this.offset = offset)),
            setLimit: (limit: number | undefined) =>
                this.update(() => (this.limit = limit ?? Number.POSITIVE_INFINITY)),
            setSortOrder: (sort: Sort | undefined) => this.update(() => (this.sort = sort ?? [])),
            setFilter: (filter: Expr | undefined) => this.update(() => (this.filter = filter)),
            requestTotalCount: () => undefined,
            reload: () => this.update(() => undefined)
        };
    }

    private update(change: () => void): void {
        change();
        this.fetch();
    }

    private fetch(): void {
        clearTimeout(this.timer);
        this.status = "loading";
        this.timer = setTimeout(() => {
            this.requests++;
            let rows = this.filter ? this.rows.filter(row => this.matches(row, this.filter!)) : this.rows;
            const [first] = this.sort;
            if (first) {
                const [attributeId, direction] = first;
                const factor = direction === "asc" ? 1 : -1;
                rows = [...rows].sort((a, b) => {
                    const x = this.options.sortValue(a, attributeId);
                    const y = this.options.sortValue(b, attributeId);
                    return x < y ? -factor : x > y ? factor : 0;
                });
            }
            this.total = rows.length;
            this.items = rows.slice(this.offset, this.offset + this.limit);
            this.hasMore = this.offset + this.items.length < rows.length;
            this.status = "available";
            this.onChange();
        }, this.options.latency);
        this.onChange();
    }

    private matches(row: R, expr: Expr): boolean {
        if (expr.type !== "function") {
            return true;
        }
        if (expr.name === "or") {
            return expr.args.some(arg => this.matches(row, arg));
        }
        if (expr.name === "and") {
            return expr.args.every(arg => this.matches(row, arg));
        }
        const [left, right] = expr.args;
        if (left.type !== "association" || right.type !== "literal") {
            return true;
        }
        const value = this.options.association(row, left.id);
        const wanted = right.value as MockItem;
        return Array.isArray(value) ? value.some(v => v.id === wanted.id) : value?.id === wanted.id;
    }
}

const available = <T>(value: T, displayValue = String(value ?? "")) => ({
    status: "available",
    value,
    displayValue,
    readOnly: true
});

export function attribute<R extends MockItem>(
    id: string,
    type: string,
    get: (row: R) => unknown,
    format: (value: unknown) => string = value => String(value ?? "")
): unknown {
    return {
        id,
        type,
        sortable: true,
        filterable: true,
        isList: false,
        universe: undefined,
        formatter: { format },
        get: (row: R) => ({ ...available(get(row), format(get(row))), isList: false })
    };
}

export function listAttribute<R extends MockItem>(id: string, get: (row: R) => string[]): unknown {
    return {
        id,
        type: "String",
        sortable: false,
        filterable: false,
        isList: true,
        formatter: { format: (value: unknown) => String(value) },
        get: (row: R) => ({ ...available(get(row), get(row).join(", ")), isList: true })
    };
}

export const expression = <R extends MockItem>(get: (row: R) => unknown): unknown => ({
    get: (row: R) => ({ status: "available", value: get(row) })
});

export const widgets = <R extends MockItem>(render: (row: R) => ReactNode): unknown => ({
    get: (row: R) => render(row)
});

export const action = <R extends MockItem>(run: (row: R) => void): unknown => ({
    get: (row: R) => ({ canExecute: true, isExecuting: false, execute: () => run(row) })
});

export const dynamic = <T>(value: T): unknown => ({ status: "available", value });

export function reference<R extends MockItem>(id: string, get: (row: R) => MockItem | undefined): unknown {
    return { id, type: "Reference", filterable: true, get: (row: R) => ({ status: "available", value: get(row) }) };
}
