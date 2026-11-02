import {
    fillText,
    insertItem,
    moveItem,
    planSortValues,
    readValue,
    run,
    sortByValue,
    useListController,
    useOverrides,
    warnOnce,
    type DropResult,
    type ListController,
    type SortKind,
    writeValue
} from "@kendallchristy/dnd-core";
import Big from "big.js";
import type { ObjectItem } from "mendix";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";

import type { SortableListProContainerProps } from "../../typings/SortableListProProps";

import { lists } from "./registry";

export interface SortableListModel {
    controller: ListController;
    /** Objects in display order: this list's own, minus ones that left, plus ones that just arrived. */
    order: ObjectItem[];
    /** Ids of objects that arrived from another list and aren't in this list's data source yet. */
    arriving: ReadonlySet<string>;
    firstLoad: boolean;
    hasMore: boolean;
    loadMore(): void;
    label(item: ObjectItem): string;
}

const DURATIONS = { normal: 200, fast: 120, off: 0 } as const;

const sameBig = (a: Big | undefined, b: Big | undefined): boolean =>
    a === undefined || b === undefined ? a === b : a.eq(b);

/** The data, ordering and drop handling behind one Sortable List Pro. */
export function useSortableList(props: SortableListProContainerProps, listId: string): SortableListModel {
    const { datasource: ds, sortAttribute, receiveAttribute } = props;
    const pageSize = Math.max(1, props.pageSize || 100);

    useLayoutEffect(() => {
        if (sortAttribute.sortable) {
            ds.setSortOrder([[sortAttribute.id, "asc"]]);
        }
        ds.setLimit(pageSize);
        // Runs once; later loads go through loadMore.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const items = useMemo(() => ds.items ?? [], [ds.items]);
    const byId = useMemo(() => new Map(items.map(item => [item.id as string, item])), [items]);

    const sortOverrides = useOverrides<Big | undefined>(sameBig, id => {
        const item = byId.get(id);
        return item ? readValue(sortAttribute, item) : undefined;
    });
    // Items dragged to another list: hidden here until the data source drops them.
    const removed = useOverrides<"here" | "away">(
        (a, b) => a === b,
        id => (byId.has(id) ? "here" : "away")
    );
    // Items dragged in from another list: shown here until the data source includes them.
    const incoming = useOverrides<ObjectItem>(
        (a, b) => a.id === b.id,
        id => byId.get(id)
    );

    const receiveValue = props.receiveValue?.value;
    const kind: SortKind = sortAttribute.type === "Decimal" ? "decimal" : "integer";

    const belongsHere = (item: ObjectItem): boolean => {
        if (!receiveAttribute || receiveValue === undefined || receiveValue === "") {
            return true;
        }
        const value = readValue(receiveAttribute, item);
        return value === undefined || String(value) === receiveValue;
    };

    const arrivingItems = incoming
        .entries()
        .filter(([id]) => !byId.has(id))
        .map(([, item]) => item);
    const arriving = new Set(arrivingItems.map(item => item.id as string));
    const visible = items.filter(item => removed.resolve(item.id, "here") === "here" && belongsHere(item));
    const valueOf = (item: ObjectItem): Big | undefined =>
        sortOverrides.resolve(item.id, readValue(sortAttribute, item));
    const order = sortByValue([...visible, ...arrivingItems], valueOf);
    const orderRef = useRef(order);
    // Drop handlers read the latest order. This runs before the list controller's own layout effect reads it.
    useLayoutEffect(() => {
        orderRef.current = order;
    });

    const label = (item: ObjectItem): string => {
        try {
            return props.itemLabel?.get(item).value || "";
        } catch {
            return "";
        }
    };

    const findItem = (id: string): ObjectItem | undefined =>
        orderRef.current.find(item => item.id === id) ?? byId.get(id);

    const listName = (): string => props.listName?.value ?? "";

    const describe = (
        event: "lifted" | "moved" | "dropped" | "cancelled",
        id: string,
        position: number,
        count: number
    ): string => {
        const template = {
            lifted: props.liftedText,
            moved: props.movedText,
            dropped: props.droppedText,
            cancelled: props.cancelledText
        }[event]?.value;
        const item = findItem(id);
        const name = (item && label(item)) || lists.get(listId)?.label(id) || "Item";
        return fillText(template ?? "", { item: name, position, count });
    };

    const writeSorts = (
        changes: Array<{ id: string; value: Big }>,
        foreign?: { id: string; write: () => void }
    ): void => {
        changes.forEach(change => {
            const item = findItem(change.id);
            if (!item) {
                return;
            }
            if (!writeValue(sortAttribute, item, change.value)) {
                if (foreign && foreign.id === change.id) {
                    foreign.write();
                } else {
                    console.warn("Sortable List Pro: the sort attribute is read-only for an object.");
                }
            }
        });
    };

    const handleDrop = (result: DropResult): void => {
        const current = orderRef.current;
        const positions = (list: ObjectItem[]): Map<string, number> =>
            new Map(list.map((item, i) => [item.id as string, i + 1]));
        const before = positions(current);

        if (result.fromListId === listId) {
            const next = moveItem(current, result.fromIndex, result.toIndex);
            const plan = planSortValues(
                next.map(item => ({ id: item.id as string, value: valueOf(item) })),
                result.itemId,
                kind
            );
            if (plan.length === 0) {
                return;
            }
            // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the new order must be on screen before the drop animation measures it.
            flushSync(() => sortOverrides.set(plan.map(change => [change.id, change.value])));
            writeSorts(plan);
            const after = positions(next);
            plan.forEach(change => {
                const item = findItem(change.id);
                if (item) {
                    run(props.onMove?.get(item), {
                        moved: change.id === result.itemId,
                        oldPosition: new Big(before.get(change.id) ?? 0),
                        newPosition: new Big(after.get(change.id) ?? 0)
                    });
                }
            });
            return;
        }

        // From another list in the group.
        const source = lists.get(result.fromListId);
        const item = source?.getItem(result.itemId);
        if (!source || !item) {
            return;
        }
        const next = insertItem(current, item, result.toIndex);
        const plan = planSortValues(
            next.map(i => ({ id: i.id as string, value: i === item ? undefined : valueOf(i) })),
            result.itemId,
            kind
        );
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the new order must be on screen before the drop animation measures it.
        flushSync(() => {
            incoming.set([[item.id as string, item]]);
            sortOverrides.set(plan.map(change => [change.id, change.value]));
        });
        const own = plan.find(change => change.id === result.itemId);
        writeSorts(plan, own && { id: own.id, write: () => source.writeSort(item, own.value) });
        if (receiveAttribute && receiveValue !== undefined && receiveValue !== "") {
            const value = receiveAttribute.type === "Boolean" ? receiveValue === "true" : receiveValue;
            if (!writeValue(receiveAttribute, item, value)) {
                console.warn("Sortable List Pro: could not set the value on receive.");
            }
        }
        const after = positions(next);
        run(props.onReceive?.get(item), {
            fromList: source.name(),
            newPosition: new Big(after.get(item.id as string) ?? result.toIndex + 1)
        });
        plan.forEach(change => {
            const neighbour = change.id === result.itemId ? undefined : findItem(change.id);
            if (neighbour) {
                run(props.onMove?.get(neighbour), {
                    moved: false,
                    oldPosition: new Big(before.get(change.id) ?? 0),
                    newPosition: new Big(after.get(change.id) ?? 0)
                });
            }
        });
    };

    const handleRemove = (result: DropResult): void => {
        const item = findItem(result.itemId);
        if (!item) {
            return;
        }
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the new order must be on screen before the drop animation measures it.
        flushSync(() => removed.set([[result.itemId, "away"]]));
        run(props.onRemove?.get(item), {
            toList: lists.get(result.toListId)?.name() ?? "",
            oldPosition: new Big(result.fromIndex + 1)
        });
    };

    const scope = props.group ? `slp:group:${props.group}` : `slp:${listId}`;
    const controller = useListController(listId, {
        scope,
        axis: props.layout,
        handle: props.dragHandle,
        indicator: props.indicator,
        preview: props.preview,
        duration: DURATIONS[props.animation],
        getIds: () => orderRef.current.map(item => item.id as string),
        canDragItem: id => {
            const item = findItem(id);
            if (!item || arriving.has(id)) {
                return false;
            }
            try {
                if (props.canDrag.get(item).value === false) {
                    return false;
                }
                if (sortAttribute.get(item).readOnly) {
                    warnOnce(
                        "Sortable List Pro: items can't be dragged because the sort attribute is read-only. Give the user's role write access to it, and check that the widget isn't inside a data view whose Editable setting is No."
                    );
                    return false;
                }
                return true;
            } catch {
                return false;
            }
        },
        canReceive: () => props.group !== "" && props.canReceive.value !== false,
        onDrop: handleDrop,
        onRemove: handleRemove,
        onDragStart: id => {
            const item = findItem(id);
            if (item) {
                run(props.onDragStart?.get(item));
            }
        },
        describe
    });

    useEffect(() => {
        lists.set(listId, {
            getItem: findItem,
            writeSort: (item, value) => writeValue(sortAttribute, item, value),
            label: id => {
                const item = findItem(id);
                return item ? label(item) : "";
            },
            name: listName
        });
    });
    useEffect(() => () => void lists.delete(listId), [listId]);

    return {
        controller,
        order,
        arriving,
        firstLoad: ds.items === undefined,
        hasMore: ds.hasMoreItems === true,
        loadMore: () => {
            if (ds.hasMoreItems && ds.status !== "loading") {
                ds.setLimit((ds.limit ?? pageSize) + pageSize);
            }
        },
        label
    };
}
