import {
    fillText,
    insertItem,
    moveItem,
    planSortValues,
    readValue,
    run,
    sortByValue,
    useOverrides,
    type DropResult,
    type SortKind
} from "@kendallchristy/dnd-core";
import Big from "big.js";
import type { ObjectItem } from "mendix";
import { useLayoutEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";

import type { KanbanBoardProContainerProps } from "../../typings/KanbanBoardProProps";

export interface BoardColumn {
    /** The column's identity: the column object's id, or the enumeration key. */
    key: string;
    title: string;
    /** What actions get as From column and To column. */
    actionKey: string;
    item?: ObjectItem;
    limit?: number;
    cards: ObjectItem[];
}

export interface Board {
    columns: BoardColumn[];
    firstLoad: boolean;
    canReorderColumns: boolean;
    /** Lists ids, for the drag engine. */
    columnListId: string;
    cardListId(column: string): string;
    columnOfList(listId: string): string | undefined;
    moveCard(result: DropResult): void;
    moveColumn(result: DropResult): void;
    canDragCard(card: ObjectItem): boolean;
    canReceiveCard(column: BoardColumn, cardId: string): boolean;
    cardLabel(card: ObjectItem): string;
    describe(event: DescribeEvent, cardId: string, column: string, position: number, count: number): string;
    describeColumn(event: DescribeEvent, column: string, position: number, count: number): string;
}

type DescribeEvent = "lifted" | "moved" | "dropped" | "cancelled";

const sameBig = (a: Big | undefined, b: Big | undefined): boolean =>
    a === undefined || b === undefined ? a === b : a.eq(b);

const kindOf = (type: string | undefined): SortKind => (type === "Decimal" ? "decimal" : "integer");

/** Groups the cards into columns, keeps the order the user just made on screen, and saves moves. */
export function useBoard(props: KanbanBoardProContainerProps, boardId: string): Board {
    const { cards: cardSource, columns: columnSource, cardSortAttribute, columnSortAttribute } = props;
    const enumMode = props.columnSource === "enumeration";

    useLayoutEffect(() => {
        if (cardSortAttribute.sortable) {
            cardSource.setSortOrder([[cardSortAttribute.id, "asc"]]);
        }
        cardSource.setLimit(Math.max(1, props.maxCards || 2000));
        if (columnSource && !enumMode) {
            if (columnSortAttribute?.sortable) {
                columnSource.setSortOrder([[columnSortAttribute.id, "asc"]]);
            }
            columnSource.setLimit(500);
        }
        // Runs once.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cardItems = useMemo(() => cardSource.items ?? [], [cardSource.items]);
    const cardsById = useMemo(() => new Map(cardItems.map(card => [card.id as string, card])), [cardItems]);
    const columnItems = useMemo(() => (enumMode ? [] : (columnSource?.items ?? [])), [enumMode, columnSource?.items]);
    const columnsById = useMemo(() => new Map(columnItems.map(c => [c.id as string, c])), [columnItems]);

    const groupOfRaw = (card: ObjectItem): string | undefined => {
        if (enumMode) {
            return readValue(props.cardStatus, card) || undefined;
        }
        try {
            return props.cardColumn?.get(card).value?.id as string | undefined;
        } catch {
            return undefined;
        }
    };

    const cardSort = useOverrides<Big | undefined>(sameBig, id => {
        const card = cardsById.get(id);
        return card ? readValue(cardSortAttribute, card) : undefined;
    });
    const cardGroup = useOverrides<string | undefined>(
        (a, b) => a === b,
        id => {
            const card = cardsById.get(id);
            return card ? groupOfRaw(card) : undefined;
        }
    );
    const columnSort = useOverrides<Big | undefined>(sameBig, id => {
        const column = columnsById.get(id);
        return column ? readValue(columnSortAttribute, column) : undefined;
    });

    const groupOf = (card: ObjectItem): string | undefined => cardGroup.resolve(card.id, groupOfRaw(card));
    const cardValue = (card: ObjectItem): Big | undefined =>
        cardSort.resolve(card.id, readValue(cardSortAttribute, card));

    // Columns, in order.
    let columns: BoardColumn[];
    if (enumMode) {
        const universe = (props.cardStatus?.universe ?? []) as string[];
        columns = universe.map(key => ({
            key,
            title: props.cardStatus?.formatter.format(key) ?? key,
            actionKey: key,
            cards: []
        }));
    } else {
        const ordered = columnSortAttribute
            ? sortByValue(columnItems, column => columnSort.resolve(column.id, readValue(columnSortAttribute, column)))
            : columnItems;
        columns = ordered.map(item => {
            const title = safe(() => props.columnTitle?.get(item).value) ?? "";
            const limit = safe(() => props.columnLimit?.get(item).value);
            return {
                key: item.id as string,
                title,
                actionKey: safe(() => props.columnKey?.get(item).value) || title,
                item,
                limit: limit && limit.gt(0) ? limit.toNumber() : undefined,
                cards: []
            };
        });
    }
    const byKey = new Map(columns.map(column => [column.key, column]));
    sortByValue(cardItems, cardValue).forEach(card => {
        const key = groupOf(card);
        if (key !== undefined) {
            byKey.get(key)?.cards.push(card);
        }
    });

    const latest = useRef({ columns, byKey });
    // Drop handlers and screen reader texts read the latest columns.
    useLayoutEffect(() => {
        latest.current = { columns, byKey };
    });

    const cardListPrefix = `${boardId}:cards:`;
    const template = (event: DescribeEvent): string =>
        ({
            lifted: props.liftedText,
            moved: props.movedText,
            dropped: props.droppedText,
            cancelled: props.cancelledText
        })[event]?.value ?? "";
    const cardLabel = (card: ObjectItem): string => safe(() => props.cardLabel?.get(card).value) ?? "";

    const moveCard = (result: DropResult): void => {
        const { byKey: current } = latest.current;
        const fromKey = result.fromListId.slice(cardListPrefix.length);
        const toKey = result.toListId.slice(cardListPrefix.length);
        const from = current.get(fromKey);
        const to = current.get(toKey);
        const card = cardsById.get(result.itemId);
        if (!from || !to || !card) {
            return;
        }
        const sameColumn = fromKey === toKey;
        const next = sameColumn
            ? moveItem(to.cards, result.fromIndex, result.toIndex)
            : insertItem(to.cards, card, result.toIndex);
        const plan = planSortValues(
            next.map(c => ({ id: c.id as string, value: cardValue(c) })),
            result.itemId,
            kindOf(cardSortAttribute.type)
        );
        if (sameColumn && plan.length === 0) {
            return;
        }
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the new order must be on screen before the drop animation measures it.
        flushSync(() => {
            cardSort.set(plan.map(change => [change.id, change.value]));
            if (!sameColumn) {
                cardGroup.set([[result.itemId, toKey]]);
            }
        });
        const positions = new Map(next.map((c, i) => [c.id as string, i + 1]));
        const planned = new Map(plan.map(change => [change.id, change.value]));
        const changed = new Set(planned.keys());
        changed.add(result.itemId);
        changed.forEach(id => {
            const target = cardsById.get(id);
            if (!target) {
                return;
            }
            const moved = id === result.itemId;
            run(props.onCardMove?.get(target), {
                moved,
                newSortValue: planned.get(id) ?? cardValue(target) ?? new Big(0),
                fromColumn: moved ? from.actionKey : to.actionKey,
                toColumn: to.actionKey,
                newPosition: new Big(positions.get(id) ?? 0)
            });
        });
    };

    const moveColumn = (result: DropResult): void => {
        if (!columnSortAttribute) {
            return;
        }
        const current = latest.current.columns;
        const next = moveItem(current, result.fromIndex, result.toIndex);
        const plan = planSortValues(
            next.map(c => ({
                id: c.key,
                value: c.item ? columnSort.resolve(c.key, readValue(columnSortAttribute, c.item)) : undefined
            })),
            result.itemId,
            kindOf(columnSortAttribute.type)
        );
        if (plan.length === 0) {
            return;
        }
        // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- the new order must be on screen before the drop animation measures it.
        flushSync(() => columnSort.set(plan.map(change => [change.id, change.value])));
        const positions = new Map(next.map((c, i) => [c.key, i + 1]));
        plan.forEach(change => {
            const column = columnsById.get(change.id);
            if (!column) {
                return;
            }
            run(props.onColumnMove?.get(column), {
                moved: change.id === result.itemId,
                newSortValue: change.value,
                newPosition: new Big(positions.get(change.id) ?? 0)
            });
        });
    };

    return {
        columns,
        firstLoad: cardSource.items === undefined || (!enumMode && columnSource?.items === undefined),
        canReorderColumns: !enumMode && columnSortAttribute !== undefined,
        columnListId: `${boardId}:columns`,
        cardListId: column => `${cardListPrefix}${column}`,
        columnOfList: listId => (listId.startsWith(cardListPrefix) ? listId.slice(cardListPrefix.length) : undefined),
        moveCard,
        moveColumn,
        canDragCard: card => {
            try {
                return props.canDragCard.get(card).value !== false;
            } catch {
                return false;
            }
        },
        canReceiveCard: (column, cardId) =>
            column.limit === undefined ||
            column.cards.some(card => card.id === cardId) ||
            column.cards.length < column.limit,
        cardLabel,
        describe: (event, cardId, column, position, count) => {
            const card = cardsById.get(cardId);
            return fillText(template(event), {
                item: (card && cardLabel(card)) || "Card",
                column: latest.current.byKey.get(column)?.title ?? "",
                position,
                count
            });
        },
        describeColumn: (event, column, position, count) => {
            const title = latest.current.byKey.get(column)?.title ?? "";
            return fillText(template(event), { item: title, column: title, position, count });
        }
    };
}

function safe<T>(read: () => T): T | undefined {
    try {
        return read();
    } catch {
        return undefined;
    }
}
