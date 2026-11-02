import type { Big } from "big.js";
import type { ObjectItem } from "mendix";

/** What a list offers other lists in its group, so an item can move between them. */
export interface ListHandle {
    getItem(id: string): ObjectItem | undefined;
    /** Writes a sort value with this list's own attribute. Returns false when it couldn't. */
    writeSort(item: ObjectItem, value: Big): boolean;
    label(id: string): string;
    name(): string;
}

/** Sortable List Pro instances on the page, by list id. */
export const lists = new Map<string, ListHandle>();
