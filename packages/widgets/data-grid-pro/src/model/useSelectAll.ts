import type { ListValue, ObjectItem } from "mendix";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SelectAllProgress {
    loaded: number;
    /** How many rows select all is fetching: the data source total, capped at the configured maximum. */
    target: number;
}

export interface SelectAll {
    /** Set while rows are being fetched. */
    progress: SelectAllProgress | undefined;
    start(): void;
    cancel(): void;
}

/** Rows fetched per request. Large enough to keep the request count low, small enough to show progress. */
const BATCH = 500;

type Waiter = { offset: number; limit: number; resolve(items: ObjectItem[]): void };

/**
 * Selects every row in the data source, not only the loaded ones. Mendix only hands out the rows it has
 * loaded, so this pages through the data source in batches, collects the rows, selects them in one go, and then
 * puts the grid's own window back. The grid pauses while this runs so the batches don't flash past on screen.
 */
export function useSelectAll(
    ds: ListValue,
    max: number,
    onDone: (items: ObjectItem[]) => void,
    restore: () => void
): SelectAll {
    const [progress, setProgress] = useState<SelectAllProgress | undefined>();
    const waiter = useRef<Waiter | undefined>(undefined);
    const cancelled = useRef(false);
    const latest = useRef({ ds, onDone, restore });
    useEffect(() => {
        latest.current = { ds, onDone, restore };
    });

    // Every update from Mendix comes in as new props: check whether it's the batch being waited for.
    useEffect(() => {
        const wait = waiter.current;
        if (wait && ds.status === "available" && ds.items && ds.offset === wait.offset && ds.limit === wait.limit) {
            waiter.current = undefined;
            wait.resolve(ds.items);
        }
    });

    useEffect(
        () => () => {
            cancelled.current = true;
            waiter.current = undefined;
        },
        []
    );

    const fetchBatch = (offset: number, limit: number): Promise<ObjectItem[]> =>
        new Promise(resolve => {
            const current = latest.current.ds;
            // Asking for the window that's already loaded doesn't trigger an update, so answer right away.
            if (
                current.status === "available" &&
                current.items &&
                current.offset === offset &&
                current.limit === limit
            ) {
                resolve(current.items);
                return;
            }
            waiter.current = { offset, limit, resolve };
            current.setOffset(offset);
            current.setLimit(limit);
        });

    const start = useCallback(() => {
        if (waiter.current) {
            return;
        }
        const target = Math.min(latest.current.ds.totalCount ?? Number.POSITIVE_INFINITY, Math.max(max, 1));
        cancelled.current = false;
        setProgress({ loaded: 0, target: Number.isFinite(target) ? target : 0 });
        void (async () => {
            const all: ObjectItem[] = [];
            try {
                while (!cancelled.current && all.length < target) {
                    const limit = Math.min(BATCH, target - all.length);
                    const batch = await fetchBatch(all.length, limit);
                    all.push(...batch);
                    setProgress({ loaded: all.length, target: Number.isFinite(target) ? target : all.length });
                    if (batch.length < limit) {
                        break;
                    }
                }
                if (!cancelled.current) {
                    latest.current.onDone(all);
                }
            } finally {
                setProgress(undefined);
                latest.current.restore();
            }
        })();
    }, [max]);

    const cancel = useCallback(() => {
        cancelled.current = true;
        const wait = waiter.current;
        waiter.current = undefined;
        wait?.resolve([]);
    }, []);

    return { progress, start, cancel };
}
