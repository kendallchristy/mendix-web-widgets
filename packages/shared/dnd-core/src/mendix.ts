import type { Big } from "big.js";
import type { ListAttributeValue, ObjectItem } from "mendix";

/** Reads an attribute without throwing, for items that may come from another list's data source. */
export function readValue<T extends string | boolean | Big>(
    attribute: ListAttributeValue<T> | undefined,
    item: ObjectItem
): T | undefined {
    if (!attribute) {
        return undefined;
    }
    try {
        return attribute.get(item).value;
    } catch {
        return undefined;
    }
}

/** Writes an attribute. Returns false when Mendix doesn't allow it (read-only, or an item it doesn't know). */
export function writeValue<T extends string | boolean | Big>(
    attribute: ListAttributeValue<T> | undefined,
    item: ObjectItem,
    value: T
): boolean {
    if (!attribute) {
        return false;
    }
    try {
        const editable = attribute.get(item);
        if (editable.readOnly) {
            return false;
        }
        editable.setValue(value);
        return true;
    } catch {
        return false;
    }
}

interface Runnable {
    canExecute: boolean;
    execute: (...args: never[]) => void;
}

/** Runs an action when it can run, passing its variables. */
export function run(action: Runnable | undefined, args?: Record<string, unknown>): void {
    if (!action?.canExecute) {
        return;
    }
    try {
        (action.execute as (variables?: Record<string, unknown>) => void)(args);
    } catch (error) {
        console.error("The action could not run.", error);
    }
}

const warned = new Set<string>();

/** Logs a setup problem to the browser console once per page load, so a locked widget says why. */
export function warnOnce(message: string): void {
    if (!warned.has(message)) {
        warned.add(message);
        console.warn(message);
    }
}
