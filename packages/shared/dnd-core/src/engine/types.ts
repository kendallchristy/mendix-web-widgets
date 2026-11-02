export type Axis = "vertical" | "horizontal" | "grid";

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

/** What a dragged item carries, as Pragmatic drag and drop's initial data. */
export interface DragItemData {
    [key: string | symbol]: unknown;
    kdnd: "item";
    /** Lists only exchange items with lists of the same scope. */
    scope: string;
    listId: string;
    itemId: string;
    index: number;
    width: number;
    height: number;
}

export interface DropResult {
    itemId: string;
    fromListId: string;
    toListId: string;
    /** Index in the source list before the move. */
    fromIndex: number;
    /** Index in the target list after the move. */
    toIndex: number;
    via: "pointer" | "keyboard";
}

export function isItemData(data: Record<string | symbol, unknown>): data is DragItemData {
    return data.kdnd === "item";
}
