import { useLayoutEffect, useRef, useState } from "react";

import { markupId, parseMarkup, serializeMarkup, type Markup, type NewMarkup } from "../core/markup";

/** Where a file's markup comes from and goes to. */
export interface MarkupSource {
    json: string | undefined;
    editable: boolean;
    author?: string;
    save(json: string): void;
}

interface MarkupState {
    key: string;
    items: Markup[];
    /** The JSON last seen from the app, and the JSON last written to it. */
    seen: string | undefined;
    written: string | undefined;
    past: Markup[][];
    future: Markup[][];
}

const HISTORY = 50;

function fresh(key: string, json: string | undefined): MarkupState {
    return { key, items: parseMarkup(json), seen: json, written: undefined, past: [], future: [] };
}

export interface MarkupApi {
    items: Markup[];
    editable: boolean;
    add(item: NewMarkup): Markup | undefined;
    update(id: string, patch: Partial<Markup>): void;
    remove(id: string): void;
    undo(): void;
    redo(): void;
    canUndo: boolean;
    canRedo: boolean;
}

/**
 * Holds the markup of the file on screen with undo and redo. Each change is written back to the app at once;
 * changes made by the app itself (another user's save, a reset) replace what's shown.
 */
export function useMarkup(key: string, source: MarkupSource | undefined): MarkupApi {
    const json = source?.json;
    const [state, setState] = useState(() => fresh(key, json));
    let current = state;
    if (state.key !== key || (json !== state.seen && json !== state.written)) {
        current = fresh(key, json);
        setState(current);
    } else if (json !== state.seen) {
        current = { ...state, seen: json };
        setState(current);
    }

    // Changes build on the latest state, even when two happen before React renders again (a note's text is saved
    // on blur, right before the click that follows it).
    const latest = useRef(current);
    useLayoutEffect(() => {
        latest.current = current;
    });

    const editable = Boolean(source?.editable);
    const commit = (change: (state: MarkupState) => Pick<MarkupState, "items" | "past" | "future"> | null): void => {
        if (!source || !editable) {
            return;
        }
        const next = change(latest.current);
        if (!next) {
            return;
        }
        const written = serializeMarkup(next.items);
        latest.current = { ...latest.current, ...next, written };
        setState(latest.current);
        source.save(written);
    };
    const edit =
        (change: (items: Markup[]) => Markup[] | null) =>
        (state: MarkupState): Pick<MarkupState, "items" | "past" | "future"> | null => {
            const items = change(state.items);
            return items ? { items, past: [...state.past, state.items].slice(-HISTORY), future: [] } : null;
        };

    const add = (item: NewMarkup): Markup | undefined => {
        if (!editable) {
            return undefined;
        }
        const created = {
            ...item,
            id: markupId(),
            date: new Date().toISOString(),
            ...(source?.author ? { author: source.author } : {})
        } as Markup;
        commit(edit(items => [...items, created]));
        return created;
    };
    const update = (id: string, patch: Partial<Markup>): void => {
        commit(
            edit(items =>
                items.some(item => item.id === id)
                    ? items.map(item => (item.id === id ? ({ ...item, ...patch } as Markup) : item))
                    : null
            )
        );
    };
    const remove = (id: string): void => {
        commit(edit(items => (items.some(item => item.id === id) ? items.filter(item => item.id !== id) : null)));
    };
    const undo = (): void => {
        commit(({ items, past, future }) =>
            past.length > 0
                ? { items: past[past.length - 1], past: past.slice(0, -1), future: [items, ...future] }
                : null
        );
    };
    const redo = (): void => {
        commit(({ items, past, future }) =>
            future.length > 0 ? { items: future[0], past: [...past, items], future: future.slice(1) } : null
        );
    };

    const { items, past, future } = current;
    return {
        items,
        editable,
        add,
        update,
        remove,
        undo,
        redo,
        canUndo: editable && past.length > 0,
        canRedo: editable && future.length > 0
    };
}
