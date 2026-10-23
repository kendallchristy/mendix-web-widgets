import type { ObjectItem, SelectionMultiValue, SelectionSingleValue } from "mendix";
import { useMemo } from "react";

export interface Selection {
    mode: "none" | "single" | "multi";
    count: number;
    isSelected(item: ObjectItem): boolean;
    toggle(item: ObjectItem): void;
    select(item: ObjectItem): void;
    /** Selects or deselects all given items, keeping the rest of the selection. */
    setMany(items: ObjectItem[], selected: boolean): void;
    clear(): void;
}

export function useSelection(value: SelectionSingleValue | SelectionMultiValue | undefined): Selection {
    return useMemo((): Selection => {
        if (!value) {
            const noop = (): void => undefined;
            return {
                mode: "none",
                count: 0,
                isSelected: () => false,
                toggle: noop,
                select: noop,
                setMany: noop,
                clear: noop
            };
        }
        if (value.type === "Single") {
            const current = value.selection;
            return {
                mode: "single",
                count: current ? 1 : 0,
                isSelected: item => current?.id === item.id,
                toggle: item => value.setSelection(current?.id === item.id ? undefined : item),
                select: item => value.setSelection(item),
                setMany: () => undefined,
                clear: () => value.setSelection(undefined)
            };
        }
        const current = value.selection;
        const ids = new Set(current.map(item => item.id));
        return {
            mode: "multi",
            count: current.length,
            isSelected: item => ids.has(item.id),
            toggle: item =>
                value.setSelection(ids.has(item.id) ? current.filter(i => i.id !== item.id) : [...current, item]),
            select: item => value.setSelection([item]),
            setMany: (items, selected) => {
                const changing = new Set(items.map(item => item.id));
                const rest = current.filter(item => !changing.has(item.id));
                value.setSelection(selected ? [...rest, ...items] : rest);
            },
            clear: () => value.setSelection([])
        };
    }, [value]);
}
