import type { ListAttributeValue, ObjectItem } from "mendix";
import type { ReactNode } from "react";

export type Density = "compact" | "default" | "comfortable";
export type SortDirection = "asc" | "desc";

export const ROW_HEIGHT: Record<Density, number> = { compact: 32, default: 40, comfortable: 48 };

export interface ColumnModel {
    /** Stable id within one widget configuration: the column's position in Studio Pro. */
    id: string;
    header: string;
    align: "left" | "center" | "right";
    sortAttribute?: ListAttributeValue["id"];
    resizable: boolean;
    hidable: boolean;
    hiddenByDefault: boolean;
    widthMode: "fill" | "fixed";
    fillWeight: number;
    fixedWidth: number;
    minWidth: number;
    /** Width the column grows to while hovered, or 0. */
    expandedWidth: number;
    renderCell(item: ObjectItem): ReactNode;
    renderExpanded?(item: ObjectItem): ReactNode;
    cellClass(item: ObjectItem): string | undefined;
}

export interface SortState {
    columnId: string;
    direction: SortDirection;
}

/** What gets saved per user: see useGridSettings. */
export interface GridSettings {
    hidden: string[];
    widths: Record<string, number>;
    sort?: SortState;
    density?: Density;
}
