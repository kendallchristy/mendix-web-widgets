export interface PageSize {
    width: number;
    height: number;
}

export const PAGE_GAP = 16;
export const PAGE_PADDING = 16;

export interface PageLayout {
    /** Top of each page in the scroll content, in pixels. */
    offsets: number[];
    heights: number[];
    widths: number[];
    totalHeight: number;
    maxWidth: number;
}

export function layoutPages(sizes: PageSize[], scale: number): PageLayout {
    const offsets: number[] = [];
    const heights: number[] = [];
    const widths: number[] = [];
    let y = PAGE_PADDING;
    let maxWidth = 0;
    for (const size of sizes) {
        const height = Math.round(size.height * scale);
        const width = Math.round(size.width * scale);
        offsets.push(y);
        heights.push(height);
        widths.push(width);
        maxWidth = Math.max(maxWidth, width);
        y += height + PAGE_GAP;
    }
    return { offsets, heights, widths, totalHeight: y - PAGE_GAP + PAGE_PADDING, maxWidth };
}

/** Index of the last page whose top is at or above the given position. */
export function pageAt(layout: PageLayout, position: number): number {
    const { offsets } = layout;
    let low = 0;
    let high = offsets.length - 1;
    let found = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (offsets[mid] <= position) {
            found = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return found;
}

/** Pages that intersect the viewport, plus a margin of pages on each side. */
export function visiblePages(layout: PageLayout, scrollTop: number, viewportHeight: number, overscan = 1): number[] {
    if (layout.offsets.length === 0) {
        return [];
    }
    const first = pageAt(layout, scrollTop);
    const last = pageAt(layout, scrollTop + viewportHeight);
    const from = Math.max(0, first - overscan);
    const to = Math.min(layout.offsets.length - 1, last + overscan);
    const pages: number[] = [];
    for (let i = from; i <= to; i++) {
        pages.push(i);
    }
    return pages;
}

/** The page the reader is on: the one covering the middle of the viewport's upper third. */
export function currentPageAt(layout: PageLayout, scrollTop: number, viewportHeight: number): number {
    return pageAt(layout, scrollTop + Math.min(viewportHeight / 3, 200));
}

export function rotateSize(size: PageSize, rotation: number): PageSize {
    return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}
