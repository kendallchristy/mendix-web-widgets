import type { ListController } from "./ListController";
import type { Box } from "./types";

export interface Glide {
    inner: HTMLElement;
    dx: number;
    dy: number;
    duration: number;
}

/** Prepares several lists for a drag: all writes, then all reads, so the page is laid out once. */
export function prepareLists(lists: ListController[]): void {
    lists.forEach(list => list.beginDrag());
    lists.forEach(list => list.measureDrag());
}

/**
 * Settles several lists after a drop or cancel (FLIP). Writes, reads and writes are grouped across all lists, so the
 * browser lays the page out twice in total, however many lists took part.
 */
export function settleLists(
    entries: Array<{ list: ListController; first?: Map<string, DOMRect>; override?: { id: string; rect: Box } }>
): void {
    entries.forEach(({ list, first }) => list.endDrag(first !== undefined));
    const moves = entries.flatMap(({ list, first, override }) => (first ? list.measureMoves(first, override) : []));
    if (moves.length === 0) {
        return;
    }
    moves.forEach(({ inner, dx, dy }) => {
        inner.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    });
    // Apply the start positions before animating to the end.
    void document.body.offsetHeight;
    moves.forEach(({ inner, duration }) => {
        inner.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0, 0, 1)`;
        inner.style.transform = "";
    });
}
