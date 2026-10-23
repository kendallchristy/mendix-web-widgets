import type { ColumnModel } from "./types";

/** The CSS grid-template-columns value shared by the header and every row. */
export function gridTemplate(
    columns: ColumnModel[],
    widths: Record<string, number>,
    leadingWidth: number,
    hoveredId: string | undefined
): string {
    const tracks = columns.map(column => {
        const userWidth = widths[column.id];
        const expanded = column.id === hoveredId && column.expandedWidth > 0 ? column.expandedWidth : 0;
        if (userWidth !== undefined) {
            return `${Math.max(userWidth, expanded)}px`;
        }
        if (column.widthMode === "fixed") {
            return `${Math.max(column.fixedWidth, expanded)}px`;
        }
        return `minmax(${Math.max(column.minWidth, expanded)}px, ${Math.max(column.fillWeight, 1)}fr)`;
    });
    if (leadingWidth > 0) {
        tracks.unshift(`${leadingWidth}px`);
    }
    return tracks.join(" ");
}

/** The narrowest the grid can get before it scrolls sideways. */
export function minGridWidth(columns: ColumnModel[], widths: Record<string, number>, leadingWidth: number): number {
    return columns.reduce((sum, column) => {
        const width = widths[column.id] ?? (column.widthMode === "fixed" ? column.fixedWidth : column.minWidth);
        return sum + width;
    }, leadingWidth);
}
