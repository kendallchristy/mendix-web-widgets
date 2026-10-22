import type { ListValue, ObjectItem } from "mendix";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface GridData {
    /** Rows the grid scrolls through. Rows that aren't loaded yet render as skeletons. */
    count: number;
    /** Total rows in the data source, when the data source can report it. */
    total: number | undefined;
    firstLoad: boolean;
    getItem(index: number): ObjectItem | undefined;
    /** Tells the loader which rows are on screen, so it can fetch around them. */
    showRange(start: number, end: number): void;
    /** Loaded items, for features that work on what's in memory (select all on page, related objects). */
    items: ObjectItem[];
    page: number;
    pageCount: number;
    setPage(page: number): void;
    /** Call after the sort order changes. */
    reset(): void;
}

/** Skeleton rows shown before the first response arrives. */
const FIRST_LOAD_ROWS = 12;

/**
 * Loads rows from a Mendix data source.
 *
 * Virtual scrolling keeps a window of three pages around the visible rows and moves it as the user scrolls,
 * so memory and request size stay constant however far they scroll. This needs the total row count; data
 * sources that can't report one fall back to growing the limit one page at a time.
 */
export function useGridData(ds: ListValue, mode: "virtualScrolling" | "pages", pageSize: number): GridData {
    const size = Math.max(pageSize, 1);
    const windowSize = size * 3;
    const requested = useRef({ offset: 0, limit: mode === "pages" ? size : windowSize });
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [page, setPageNumber] = useState(0);

    useLayoutEffect(() => {
        ds.requestTotalCount(true);
        ds.setOffset(requested.current.offset);
        ds.setLimit(requested.current.limit);
        // Runs once: later changes go through showRange, setPage and reset.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    // The items on screen and the offset they were fetched at. While a new window loads, Mendix keeps serving
    // the previous items, so the offset is only taken over once the new items are available.
    const [loaded, setLoaded] = useState<{ items: ObjectItem[] | undefined; offset: number }>({
        items: undefined,
        offset: 0
    });
    if (ds.status === "available" && ds.items !== loaded.items) {
        setLoaded({ items: ds.items, offset: ds.offset });
    }
    const items = useMemo(() => loaded.items ?? ds.items ?? [], [loaded.items, ds.items]);
    const itemsOffset = loaded.offset;
    const total = ds.totalCount;
    const windowed = mode === "virtualScrolling" && total !== undefined;
    const firstLoad = ds.items === undefined;

    let count: number;
    if (firstLoad) {
        count = FIRST_LOAD_ROWS;
    } else if (mode === "pages") {
        count = items.length;
    } else if (windowed) {
        count = total;
    } else {
        count = itemsOffset + items.length + (ds.hasMoreItems ? size : 0);
    }

    const request = useCallback(
        (offset: number, limit: number) => {
            if (requested.current.offset === offset && requested.current.limit === limit) {
                return;
            }
            requested.current = { offset, limit };
            ds.setOffset(offset);
            ds.setLimit(limit);
        },
        [ds]
    );

    const showRange = useCallback(
        (start: number, end: number) => {
            if (mode === "pages" || firstLoad) {
                return;
            }
            const { offset, limit } = requested.current;
            if (!windowed) {
                // Grow one page when the user gets within half a page of the end.
                if (ds.hasMoreItems && end >= offset + limit - size / 2) {
                    request(0, limit + size);
                }
                return;
            }
            const margin = Math.floor(size / 2);
            const covered = start >= offset + (offset > 0 ? margin : 0) && end < offset + limit - margin;
            if (covered || (end >= total - 1 && start >= offset)) {
                return;
            }
            const nextOffset = Math.max(0, Math.floor(start / size) * size - size);
            const nextLimit = Math.max(windowSize, Math.ceil((end - nextOffset + 1) / size) * size + size);
            // Wait for scrolling to settle so a fast fling doesn't fire a request per frame.
            clearTimeout(timer.current);
            timer.current = setTimeout(() => request(nextOffset, nextLimit), 80);
        },
        [ds, firstLoad, mode, request, size, total, windowSize, windowed]
    );

    const getItem = useCallback(
        (index: number) => (mode === "pages" ? items[index] : items[index - itemsOffset]),
        [items, itemsOffset, mode]
    );

    const setPage = useCallback(
        (next: number) => {
            setPageNumber(next);
            request(next * size, size);
        },
        [request, size]
    );

    const reset = useCallback(() => {
        clearTimeout(timer.current);
        setPageNumber(0);
        request(0, mode === "pages" ? size : windowSize);
    }, [mode, request, size, windowSize]);

    return {
        count,
        total,
        firstLoad,
        getItem,
        showRange,
        items,
        page,
        pageCount: total !== undefined ? Math.max(1, Math.ceil(total / size)) : page + (ds.hasMoreItems ? 2 : 1),
        setPage,
        reset
    };
}
