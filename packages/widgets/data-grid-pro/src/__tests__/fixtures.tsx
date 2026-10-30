import type { ObjectItem } from "mendix";

import type { ColumnModel } from "../model/types";
import type { GridData } from "../model/useGridData";
import type { Selection } from "../model/useSelection";

export function column(overrides: Partial<ColumnModel> = {}): ColumnModel {
    return {
        id: "c0",
        header: "Name",
        align: "left",
        resizable: true,
        hidable: true,
        hiddenByDefault: false,
        widthMode: "fill",
        fillWeight: 1,
        fixedWidth: 120,
        minWidth: 80,
        expandedWidth: 0,
        renderCell: item => `Row ${item.id}`,
        cellClass: () => undefined,
        ...overrides
    };
}

export function items(count: number): ObjectItem[] {
    return Array.from({ length: count }, (_, i) => ({ id: String(i) }) as ObjectItem);
}

export function gridData(rows: ObjectItem[]): GridData {
    return {
        count: rows.length,
        total: rows.length,
        firstLoad: false,
        getItem: index => rows[index],
        showRange: () => undefined,
        items: rows,
        page: 0,
        pageCount: 1,
        setPage: () => undefined,
        reset: () => undefined,
        refreshes: 0
    };
}

export const noSelection: Selection = {
    mode: "none",
    count: 0,
    isSelected: () => false,
    toggle: () => undefined,
    select: () => undefined,
    setMany: () => undefined,
    clear: () => undefined
};
