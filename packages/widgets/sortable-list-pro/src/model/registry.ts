import type { Big } from "big.js";
import type { ObjectItem } from "mendix";

/** What a moved object's old list needs to save the move: its new list's details and place. */
export interface MoveOut {
    toList: string;
    toValue: string;
    oldPosition: number;
    newPosition: number;
    newSortValue: Big;
}

/** What a list offers other lists in its group, so an item can move between them. */
export interface ListHandle {
    getItem(id: string): ObjectItem | undefined;
    /**
     * Saves an object that moved to another list. Mendix only runs an action for objects of its own data source,
     * so the list the object came from runs it.
     */
    moveOut(item: ObjectItem, move: MoveOut): void;
    label(id: string): string;
    name(): string;
}

/** Sortable List Pro instances on the page, by list id. */
export const lists = new Map<string, ListHandle>();
