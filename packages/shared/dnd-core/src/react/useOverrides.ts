import { useCallback, useEffect, useState } from "react";

/** How long a value the widget wrote wins over what Mendix reports, at most. */
export const OVERRIDE_TIMEOUT = 10_000;

interface Entry<T> {
    value: T;
    at: number;
}

export interface Overrides<T> {
    /** The value to show for an id: the widget's own write while Mendix catches up, otherwise `current`. */
    resolve(id: string, current: T): T;
    set(entries: Iterable<[string, T]>): void;
    has(id: string): boolean;
    /** Every entry that is still in force. */
    entries(): Array<[string, T]>;
}

/**
 * Values the widget has just written, shown until Mendix reports the same value (or 10 seconds pass). This keeps
 * the new order on screen from the moment of the drop, so items never jump back while a microflow commits.
 */
export function useOverrides<T>(
    equals: (a: T, b: T) => boolean,
    /** What Mendix reports now for an id, or undefined when the id is gone. */
    current: (id: string) => T | undefined
): Overrides<T> {
    const [entries, setEntries] = useState<ReadonlyMap<string, Entry<T>>>(() => new Map());

    useEffect(() => {
        if (entries.size === 0) {
            return undefined;
        }
        const oldest = Math.min(...Array.from(entries.values(), e => e.at));
        const timer = setTimeout(
            () => {
                const now = Date.now();
                setEntries(current => {
                    const next = new Map(current);
                    next.forEach((entry, id) => {
                        if (now - entry.at >= OVERRIDE_TIMEOUT) {
                            next.delete(id);
                        }
                    });
                    return next;
                });
            },
            Math.max(0, oldest + OVERRIDE_TIMEOUT - Date.now())
        );
        return () => clearTimeout(timer);
    }, [entries]);

    const set = useCallback((values: Iterable<[string, T]>) => {
        const at = Date.now();
        setEntries(current => {
            const next = new Map(current);
            for (const [id, value] of values) {
                next.set(id, { value, at });
            }
            return next;
        });
    }, []);

    const resolve = (id: string, current: T): T => {
        const entry = entries.get(id);
        if (!entry || Date.now() - entry.at >= OVERRIDE_TIMEOUT) {
            return current;
        }
        return entry.value;
    };

    // Once Mendix agrees, drop the entry so later changes from elsewhere show. This adjusts state during render,
    // as React recommends for state derived from new props: React renders again at once, before anything shows.
    const settled = Array.from(entries).filter(([id, entry]) => {
        const now = current(id);
        return now !== undefined && equals(now, entry.value);
    });
    if (settled.length > 0) {
        const next = new Map(entries);
        settled.forEach(([id]) => next.delete(id));
        setEntries(next);
    }

    return {
        resolve,
        set,
        has: id => entries.has(id),
        entries: () =>
            Array.from(entries)
                .filter(([, entry]) => Date.now() - entry.at < OVERRIDE_TIMEOUT)
                .map(([id, entry]): [string, T] => [id, entry.value])
    };
}
