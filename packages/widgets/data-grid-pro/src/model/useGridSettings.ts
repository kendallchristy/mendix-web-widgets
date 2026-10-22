import type { EditableValue } from "mendix";
import { useCallback, useEffect, useRef, useState } from "react";

import type { GridSettings } from "./types";

const EMPTY: GridSettings = { hidden: [], widths: {} };

interface Stored extends GridSettings {
    /** Number of columns when saved. Settings from a different column setup are ignored. */
    columns: number;
}

function parse(json: string | undefined, columnCount: number): GridSettings | undefined {
    if (!json) {
        return undefined;
    }
    try {
        const stored = JSON.parse(json) as Partial<Stored>;
        if (stored.columns !== columnCount) {
            return undefined;
        }
        return { hidden: stored.hidden ?? [], widths: stored.widths ?? {}, sort: stored.sort, density: stored.density };
    } catch {
        return undefined;
    }
}

function readBrowser(key: string): string | undefined {
    try {
        return window.localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

function writeBrowser(key: string, value: string): void {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be full or blocked; settings then last for this page view only.
    }
}

/**
 * Column widths, hidden columns, sort and density for the current user, kept in the browser or in an attribute.
 * `ready` turns true once stored settings have been read, so the grid can apply the saved sort before loading.
 */
export function useGridSettings(
    storage: "none" | "browser" | "attribute",
    attribute: EditableValue<string> | undefined,
    storageKey: string,
    columnCount: number,
    initial: GridSettings
): { settings: GridSettings; ready: boolean; update(change: Partial<GridSettings>): void } {
    const [settings, setSettings] = useState<GridSettings>(() => {
        if (storage === "browser") {
            return parse(readBrowser(storageKey), columnCount) ?? initial;
        }
        return storage === "attribute" ? EMPTY : initial;
    });
    const [ready, setReady] = useState(storage !== "attribute");

    // An attribute's value arrives asynchronously, so take it over once it's available.
    if (storage === "attribute" && !ready) {
        if (!attribute || attribute.status === "unavailable") {
            setSettings(initial);
            setReady(true);
        } else if (attribute.status === "available") {
            setSettings(parse(attribute.value, columnCount) ?? initial);
            setReady(true);
        }
    }

    // Save after changes settle, so dragging a column edge doesn't write on every frame.
    const dirty = useRef(false);
    useEffect(() => {
        if (!dirty.current) {
            return;
        }
        const timer = setTimeout(() => {
            dirty.current = false;
            const json = JSON.stringify({ ...settings, columns: columnCount } satisfies Stored);
            if (storage === "browser") {
                writeBrowser(storageKey, json);
            } else if (storage === "attribute" && attribute && !attribute.readOnly) {
                attribute.setValue(json);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [attribute, columnCount, settings, storage, storageKey]);

    const update = useCallback((change: Partial<GridSettings>) => {
        dirty.current = true;
        setSettings(previous => ({ ...previous, ...change }));
    }, []);

    return { settings, ready, update };
}
