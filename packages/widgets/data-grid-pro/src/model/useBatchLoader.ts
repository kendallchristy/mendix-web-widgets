import type { ListValue, ObjectItem } from "mendix";
import { useCallback, useEffect, useRef, useState } from "react";

export type BatchTask = "select" | "export";

export interface BatchProgress {
    task: BatchTask;
    loaded: number;
    /** How many rows the task is fetching: the data source total, capped at the task's maximum. */
    target: number;
}

export interface BatchLoader {
    /** Set while rows are being fetched. */
    progress: BatchProgress | undefined;
    /**
     * Pages through the whole data source, up to `max` rows, handing each batch to `onBatch` while its items are
     * the data source's current items. Resolves to false when cancelled or when another task is running.
     */
    run(task: BatchTask, max: number, onBatch: (items: ObjectItem[]) => void): Promise<boolean>;
    cancel(): void;
}

/** Rows fetched per request. Large enough to keep the request count low, small enough to show progress. */
const BATCH = 500;

type Waiter = { offset: number; limit: number; resolve(items: ObjectItem[]): void };

/**
 * Fetches every row of the data source, not only the loaded ones, for select all and export. Mendix only hands
 * out the rows it has loaded, so this moves the data source through the rows in batches and puts the grid's own
 * window back afterwards. The grid pauses while this runs so the batches don't flash past on screen.
 */
export function useBatchLoader(ds: ListValue, restore: () => void): BatchLoader {
    const [progress, setProgress] = useState<BatchProgress | undefined>();
    const waiter = useRef<Waiter | undefined>(undefined);
    const running = useRef(false);
    const cancelled = useRef(false);
    const latest = useRef({ ds, restore });
    useEffect(() => {
        latest.current = { ds, restore };
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

    const run = useCallback(
        async (task: BatchTask, max: number, onBatch: (items: ObjectItem[]) => void): Promise<boolean> => {
            if (running.current) {
                return false;
            }
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

            const total = latest.current.ds.totalCount;
            const target = Math.min(total ?? Number.POSITIVE_INFINITY, Math.max(max, 1));
            const shown = (loaded: number): number => (Number.isFinite(target) ? target : loaded);
            running.current = true;
            cancelled.current = false;
            setProgress({ task, loaded: 0, target: shown(0) });
            let loaded = 0;
            try {
                while (!cancelled.current && loaded < target) {
                    const limit = Math.min(BATCH, target - loaded);
                    const batch = await fetchBatch(loaded, limit);
                    if (cancelled.current) {
                        break;
                    }
                    onBatch(batch);
                    loaded += batch.length;
                    setProgress({ task, loaded, target: shown(loaded) });
                    if (batch.length < limit) {
                        break;
                    }
                }
                return !cancelled.current;
            } finally {
                running.current = false;
                setProgress(undefined);
                latest.current.restore();
            }
        },
        []
    );

    const cancel = useCallback(() => {
        cancelled.current = true;
        const wait = waiter.current;
        waiter.current = undefined;
        wait?.resolve([]);
    }, []);

    return { progress, run, cancel };
}
