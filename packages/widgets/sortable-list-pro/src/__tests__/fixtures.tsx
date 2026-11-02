/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal stand-ins for the Mendix values the widget reads. Writes go to plain rows and are logged.
import type Big from "big.js";
import type { ReactNode } from "react";

export interface Row {
    id: string;
    title: string;
    sort?: Big;
    status?: string;
}

export interface Store {
    rows: Map<string, Row>;
    log: string[];
}

export function store(rows: Row[]): Store {
    return { rows: new Map(rows.map(row => [row.id, row])), log: [] };
}

export function listValue(ids: string[]): any {
    return {
        items: ids.map(id => ({ id })),
        status: "available",
        hasMoreItems: false,
        limit: 100,
        offset: 0,
        setLimit: jest.fn(),
        setOffset: jest.fn(),
        setSortOrder: jest.fn(),
        requestTotalCount: jest.fn(),
        setFilter: jest.fn(),
        reload: jest.fn()
    };
}

export function attribute<K extends keyof Row>(data: Store, key: K, type: string, universe?: string[]): any {
    return {
        id: `${key}-attr`,
        sortable: true,
        filterable: true,
        type,
        isList: false,
        universe,
        formatter: { format: (value: unknown) => String(value) },
        get: (item: { id: string }) => {
            const row = data.rows.get(item.id)!;
            return {
                status: "available",
                readOnly: false,
                value: row[key],
                setValue: (value: Row[K]) => {
                    row[key] = value;
                    data.log.push(`set ${item.id} ${String(key)} ${String(value)}`);
                }
            };
        }
    };
}

export const expression = <T,>(read: (item: { id: string }) => T): any => ({
    get: (item: { id: string }) => ({ status: "available", value: read(item) })
});

export const dynamic = <T,>(value: T): any => ({ status: "available", value });

export const widgets = (render: (item: { id: string }) => ReactNode): any => ({ get: render });

export function action(data: Store, name: string): any {
    return {
        get: (item: { id: string }) => ({
            canExecute: true,
            isExecuting: false,
            execute: (args?: Record<string, unknown>) => {
                const shown = Object.fromEntries(Object.entries(args ?? {}).map(([k, v]) => [k, String(v)]));
                data.log.push(`${name} ${item.id} ${JSON.stringify(shown)}`);
            }
        })
    };
}

/** jsdom lacks a few browser APIs the widgets use: scrollBy on elements, ResizeObserver, IntersectionObserver. */
export function polyfillDom(): void {
    if (!Element.prototype.scrollBy) {
        Element.prototype.scrollBy = function scrollBy(): void {
            // Nothing to scroll in jsdom.
        };
    }
    class Observer {
        observe(): void {
            // jsdom doesn't lay anything out, so there is nothing to report.
        }
        unobserve(): void {
            // See observe.
        }
        disconnect(): void {
            // See observe.
        }
    }
    const scope = globalThis as unknown as Record<string, unknown>;
    scope.ResizeObserver ??= Observer;
    scope.IntersectionObserver ??= Observer;
}
