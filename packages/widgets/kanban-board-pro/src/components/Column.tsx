import {
    SortableRow,
    sizeLearner,
    useListController,
    type ListController,
    type SortableRowProps
} from "@kendallchristy/dnd-core";
import { defaultRangeExtractor, measureElement, useVirtualizer } from "@tanstack/react-virtual";
import classNames from "classnames";
import type { ObjectItem } from "mendix";
import { useCallback, useLayoutEffect, useState, type ReactElement, type ReactNode } from "react";

import type { Board, BoardColumn } from "../model/useBoard";

export interface ColumnSettings {
    board: Board;
    scope: string;
    handle: "item";
    indicator: "makeRoom" | "line";
    preview: "snapshot" | "compact";
    duration: number;
    /** Columns scroll on their own and long ones draw only the cards on screen. */
    scrolls: boolean;
    collapsible: boolean;
    showCount: boolean;
    emptyText: string;
    describedBy: string;
    cardStyle: "card" | "plain";
    renderCard(card: ObjectItem): ReactNode;
    /** Changes when cards need to render their content again (the card content property). */
    version: unknown;
    renderHeader?(column: BoardColumn): ReactNode;
    renderFooter?(column: BoardColumn): ReactNode;
    onCardClick?(card: ObjectItem): void;
    clickable: boolean;
}

export interface ColumnProps {
    column: BoardColumn;
    /** Ids of the card lists left and right of this one, for keyboard moves. */
    previous?: string;
    next?: string;
    settings: ColumnSettings;
    collapsed: boolean;
    onToggle(): void;
}

/** Columns with more cards than this are windowed when they scroll on their own. */
const WINDOW_FROM = 60;

function ChevronIcon({ collapsed }: { collapsed: boolean }): ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <path
                d={collapsed ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** One Kanban column: the header (the handle for moving the column) and its list of cards. */
export function ColumnBody(props: ColumnProps): ReactElement {
    const { column, settings, collapsed } = props;
    const { board } = settings;
    const listId = board.cardListId(column.key);
    const cards = column.cards;

    const controller = useListController(listId, {
        scope: settings.scope,
        axis: "vertical",
        handle: settings.handle,
        indicator: settings.indicator,
        preview: settings.preview,
        duration: settings.duration,
        liftKeys: settings.clickable ? [" "] : undefined,
        getIds: () => cards.map(card => card.id as string),
        canDragItem: id => {
            const card = cards.find(c => c.id === id);
            return card !== undefined && board.canDragCard(card);
        },
        canReceive: source => board.canReceiveCard(column, source.itemId),
        onDrop: board.moveCard,
        describe: (event, id, position, count) => board.describe(event, id, column.key, position, count),
        neighbour: direction => (direction === "previous" ? props.previous : props.next)
    });

    const count = cards.length;
    const full = column.limit !== undefined && count >= column.limit;
    const over = column.limit !== undefined && count > column.limit;

    return (
        <>
            <div className={classNames("kbp-column-head", { "dnd-handle": board.canReorderColumns })}>
                {settings.collapsible && (
                    <button
                        type="button"
                        className="kbp-icon-button"
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? `Expand ${column.title}` : `Collapse ${column.title}`}
                        onClick={props.onToggle}
                    >
                        <ChevronIcon collapsed={collapsed} />
                    </button>
                )}
                <h3 className="kbp-column-title" title={column.title}>
                    {column.title}
                </h3>
                {settings.showCount && (
                    <span
                        className={classNames("kbp-count", { "kbp-count--full": full, "kbp-count--over": over })}
                        title={column.limit !== undefined ? `Limit ${column.limit}` : undefined}
                    >
                        {column.limit !== undefined ? `${count}/${column.limit}` : count}
                    </span>
                )}
                {!collapsed && settings.renderHeader && (
                    <div className="kbp-column-tools">{settings.renderHeader(column)}</div>
                )}
            </div>
            {collapsed ? (
                <CollapsedDrop controller={controller} />
            ) : (
                <CardList controller={controller} cards={cards} settings={settings} full={full} />
            )}
            {!collapsed && settings.renderFooter && (
                <div className="kbp-column-foot">{settings.renderFooter(column)}</div>
            )}
        </>
    );
}

function CollapsedDrop({ controller }: { controller: ListController }): ReactElement {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    useLayoutEffect(() => {
        controller.setContainer(element);
        return () => controller.setContainer(null);
    }, [controller, element]);
    return <div ref={setElement} className="kbp-collapsed-drop kdnd-list" />;
}

function CardList(props: {
    controller: ListController;
    cards: ObjectItem[];
    settings: ColumnSettings;
    full: boolean;
}): ReactElement {
    const { controller, cards, settings } = props;
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const [listElement, setListElement] = useState<HTMLDivElement | null>(null);
    const windowed = settings.scrolls && cards.length > WINDOW_FROM;

    const [sizes] = useState(() => sizeLearner(88, measureElement));
    const virtualizer = useVirtualizer({
        count: windowed ? cards.length : 0,
        getScrollElement: () => scrollElement,
        estimateSize: sizes.estimateSize,
        measureElement: sizes.measureElement,
        // Keeps the dragged card rendered while it is scrolled out of view.
        rangeExtractor: range => {
            const indexes = defaultRangeExtractor(range);
            const pinned = controller.pinnedIndex();
            return pinned === undefined || pinned >= range.count || indexes.includes(pinned)
                ? indexes
                : [...indexes, pinned].sort((a, b) => a - b);
        },
        overscan: 6,
        gap: 8,
        getItemKey: index => (cards[index]?.id as string | undefined) ?? `i-${index}`,
        // Positions cards and sizes the list itself, so scrolling re-renders only when cards come and go.
        directDomUpdates: windowed
    });
    const listRef = useCallback(
        (node: HTMLDivElement | null) => {
            setListElement(node);
            virtualizer.containerRef(node);
        },
        [virtualizer]
    );

    useLayoutEffect(() => {
        controller.setContainer(listElement, settings.scrolls ? scrollElement : undefined);
    }, [controller, listElement, scrollElement, settings.scrolls]);

    const slot = (card: ObjectItem, index: number, extra?: Partial<SortableRowProps>): ReactElement => (
        <SortableRow
            key={card.id as string}
            item={card}
            version={settings.version}
            controller={controller}
            id={card.id as string}
            index={index}
            label={settings.board.cardLabel(card)}
            describedBy={settings.describedBy}
            disabled={!settings.board.canDragCard(card)}
            className="kbp-card-slot"
            itemClassName={settings.cardStyle === "plain" ? "kbp-card kbp-card--plain" : "kbp-card"}
            onClick={settings.onCardClick ? () => settings.onCardClick!(card) : undefined}
            renderContent={() => settings.renderCard(card)}
            {...extra}
        />
    );

    return (
        <div ref={setScrollElement} className="kbp-column-scroll">
            <div
                // A new element when windowing turns on or off, so no height is left behind from the windowed list.
                key={windowed ? "windowed" : "full"}
                ref={listRef}
                className={classNames("kbp-cards kdnd-list", {
                    "kbp-cards--windowed": windowed,
                    "kbp-cards--full": props.full
                })}
                role="list"
            >
                {cards.length === 0 ? (
                    <div className="kbp-empty">{settings.emptyText}</div>
                ) : windowed ? (
                    virtualizer.getVirtualItems().map(virtual =>
                        slot(cards[virtual.index], virtual.index, {
                            measureIndex: virtual.index,
                            measureRef: virtualizer.measureElement,
                            style: {
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%"
                            }
                        })
                    )
                ) : (
                    cards.map((card, index) => slot(card, index))
                )}
            </div>
        </div>
    );
}
