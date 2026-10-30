import { observeElementRect, useVirtualizer } from "@tanstack/react-virtual";
import classNames from "classnames";
import type { ObjectItem } from "mendix";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type ReactNode
} from "react";

import { gridTemplate, minGridWidth } from "../model/layout";
import type { ColumnModel, SortState } from "../model/types";
import type { GridData } from "../model/useGridData";
import type { Selection } from "../model/useSelection";
import { HeaderRow } from "./HeaderRow";
import { Row } from "./Row";
import { Tooltip, useTooltip } from "./Tooltip";

export interface GridProps {
    columns: ColumnModel[];
    data: GridData;
    rowHeight: number;
    widths: Record<string, number>;
    onResize(columnId: string, width: number): void;
    sort: SortState | undefined;
    onSort(columnId: string): void;
    selection: Selection;
    renderDetail: ((item: ObjectItem) => ReactNode) | undefined;
    /** Open and close details with a click anywhere on the row, not only the chevron. */
    expandOnRowClick: boolean;
    /** Opening a row closes the one that was open, like an accordion. */
    singleExpand: boolean;
    rowClass(item: ObjectItem): string | undefined;
    onRowAction: ((item: ObjectItem) => void) | undefined;
    clickTrigger: "single" | "double";
    stripes: boolean;
    pinFirstColumn: boolean;
    empty: ReactNode;
    /** Changing this scrolls back to the top, for example after sorting. */
    scrollResetKey: string;
    ariaLabel: string | undefined;
}

const LEADING_ITEM_WIDTH = 32;
/** Rough height of an expanded row's details before they're measured. */
const DETAIL_ESTIMATE = 220;
let gridCount = 0;

export function Grid(props: GridProps): ReactElement {
    const { columns, data, rowHeight, selection, renderDetail, singleExpand } = props;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [uid] = useState(() => `dgp-${++gridCount}`);
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const [focus, setFocus] = useState({ row: 0, col: 0, nonce: 0 });
    const [hovered, setHovered] = useState<string | undefined>();
    const lastSelected = useRef<number>(-1);
    const tooltip = useTooltip();

    const expandable = renderDetail !== undefined;
    const leadingWidth = (expandable ? LEADING_ITEM_WIDTH : 0) + (selection.mode === "multi" ? LEADING_ITEM_WIDTH : 0);
    const headerHeight = rowHeight + 4;

    // The virtualizer recalculates every row position when getItemKey changes, which costs time in
    // proportion to the row count. Keep it stable between scroll frames; it changes only when a new window loads.
    const { getItem } = data;
    const getItemKey = useCallback((index: number) => getItem(index)?.id ?? `pending-${index}`, [getItem]);
    const virtualizer = useVirtualizer({
        count: data.count,
        getScrollElement: () => scrollRef.current,
        estimateSize: index => {
            const item = getItem(index);
            return rowHeight + (item && expanded.has(item.id) ? DETAIL_ESTIMATE : 0);
        },
        getItemKey,
        // Never plan more rows than fit in the window, even if styling lets the grid grow taller than it.
        // Drawing every row of a large list would freeze the page.
        observeElementRect: (instance, callback) =>
            observeElementRect(instance, rect =>
                callback({ width: rect.width, height: Math.min(rect.height, window.innerHeight) })
            ),
        overscan: 8,
        scrollMargin: headerHeight
    });

    const virtualRows = virtualizer.getVirtualItems();
    const firstIndex = virtualRows[0]?.index ?? 0;
    const lastIndex = virtualRows[virtualRows.length - 1]?.index ?? 0;
    const { showRange } = data;
    useEffect(() => {
        showRange(firstIndex, lastIndex);
    }, [firstIndex, lastIndex, showRange]);

    // Row heights change with density, and indexes shift after a sort.
    useEffect(() => {
        virtualizer.measure();
    }, [rowHeight, virtualizer]);
    const [resetKey, setResetKey] = useState(props.scrollResetKey);
    if (resetKey !== props.scrollResetKey) {
        setResetKey(props.scrollResetKey);
        setFocus(f => ({ ...f, row: 0 }));
    }
    // Block bodies on purpose: newer browsers return a Promise from scrollTo, and React treats an effect's
    // return value as its cleanup function.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [resetKey]);

    const toggleExpanded = useCallback(
        (id: string) => {
            setExpanded(previous => {
                if (singleExpand) {
                    return previous.has(id) ? new Set() : new Set([id]);
                }
                const next = new Set(previous);
                if (!next.delete(id)) {
                    next.add(id);
                }
                return next;
            });
        },
        [singleExpand]
    );

    const selectWithRange = (index: number, item: ObjectItem, range: boolean): void => {
        if (range && lastSelected.current >= 0) {
            const from = Math.min(lastSelected.current, index);
            const to = Math.max(lastSelected.current, index);
            const items: ObjectItem[] = [];
            for (let i = from; i <= to; i++) {
                const rowItem = data.getItem(i);
                if (rowItem) {
                    items.push(rowItem);
                }
            }
            selection.setMany(items, true);
        } else {
            selection.toggle(item);
        }
        lastSelected.current = index;
    };

    const handleClick = (event: MouseEvent<HTMLDivElement>, trigger: "single" | "double"): void => {
        const target = event.target as HTMLElement;
        const rowElement = target.closest<HTMLElement>("[data-index]");
        if (!rowElement) {
            return;
        }
        const index = Number(rowElement.dataset.index);
        const item = data.getItem(index);
        if (!item) {
            return;
        }
        const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
        if (trigger === "single" && action === "expand") {
            toggleExpanded(item.id);
            return;
        }
        if (trigger === "single" && action === "select") {
            selectWithRange(index, item, event.shiftKey);
            return;
        }
        // Leave clicks inside details and inside widgets in custom content to those widgets.
        if (action || target.closest(".dgp-detail, button, a, input, select, textarea, [role='button']")) {
            return;
        }
        const colIndex = Number(target.closest<HTMLElement>("[data-col-index]")?.dataset.colIndex ?? focus.col);
        setFocus(f => ({ row: index, col: colIndex, nonce: f.nonce }));
        if (trigger === "single" && selection.mode === "single") {
            selection.select(item);
        }
        // The second click of a double click would close the row again, so only the first one toggles.
        if (trigger === "single" && expandable && props.expandOnRowClick && event.detail < 2) {
            toggleExpanded(item.id);
        }
        if (trigger === props.clickTrigger) {
            props.onRowAction?.(item);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        if (!target.matches(".dgp-cell[data-col]")) {
            return;
        }
        const pageRows = Math.max(1, Math.floor((scrollRef.current?.clientHeight ?? 0) / rowHeight) - 1);
        // Read the position from the focused cell, since focus can also arrive by Tab or from a widget.
        let row = Number(target.closest<HTMLElement>("[data-index]")?.dataset.index ?? focus.row);
        let col = Number(target.dataset.colIndex ?? focus.col);
        const item = data.getItem(row);
        switch (event.key) {
            case "ArrowDown":
                row++;
                break;
            case "ArrowUp":
                row--;
                break;
            case "ArrowRight":
                col++;
                break;
            case "ArrowLeft":
                col--;
                break;
            case "PageDown":
                row += pageRows;
                break;
            case "PageUp":
                row -= pageRows;
                break;
            case "Home":
                col = 0;
                row = event.ctrlKey || event.metaKey ? 0 : row;
                break;
            case "End":
                col = columns.length - 1;
                row = event.ctrlKey || event.metaKey ? data.count - 1 : row;
                break;
            case "Enter":
                if (item && expandable && (props.expandOnRowClick || !props.onRowAction)) {
                    toggleExpanded(item.id);
                }
                if (item && props.onRowAction) {
                    props.onRowAction(item);
                }
                event.preventDefault();
                return;
            case "Escape":
                if (selection.count > 0) {
                    selection.clear();
                    event.preventDefault();
                }
                return;
            case " ":
                if (item && selection.mode === "multi") {
                    selectWithRange(row, item, event.shiftKey);
                } else if (item && selection.mode === "single") {
                    selection.select(item);
                }
                event.preventDefault();
                return;
            default:
                return;
        }
        event.preventDefault();
        row = Math.min(Math.max(row, 0), data.count - 1);
        col = Math.min(Math.max(col, 0), columns.length - 1);
        virtualizer.scrollToIndex(row, { align: "auto" });
        setFocus(f => ({ row, col, nonce: f.nonce + 1 }));
    };

    const handleMouseOver = (event: MouseEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        const columnId = target.closest<HTMLElement>("[data-col]")?.dataset.col;
        const column = columns.find(c => c.id === columnId);
        const next = column && column.expandedWidth > 0 ? column.id : undefined;
        if (next !== hovered) {
            setHovered(next);
        }
        tooltip.onMouseOver(event);
    };

    const style = {
        "--dgp-columns": gridTemplate(columns, props.widths, leadingWidth, hovered),
        "--dgp-min-width": `${minGridWidth(columns, props.widths, leadingWidth)}px`,
        "--dgp-leading": `${leadingWidth}px`,
        "--dgp-row-height": `${rowHeight}px`,
        "--dgp-header-height": `${headerHeight}px`
    } as CSSProperties;

    const loadedItems = data.items;
    const allSelected = loadedItems.length > 0 && loadedItems.every(item => selection.isSelected(item));
    const someSelected = !allSelected && loadedItems.some(item => selection.isSelected(item));
    const isEmpty = !data.firstLoad && data.count === 0;

    return (
        <div
            ref={scrollRef}
            role="grid"
            aria-label={props.ariaLabel}
            aria-rowcount={data.total !== undefined ? data.total + 1 : -1}
            aria-colcount={columns.length}
            aria-multiselectable={selection.mode === "multi" || undefined}
            data-dgp={uid}
            className={classNames("dgp-scroll", {
                "dgp-scroll--stripes": props.stripes,
                "dgp-scroll--pinned": props.pinFirstColumn,
                "dgp-scroll--clickable":
                    props.onRowAction !== undefined ||
                    selection.mode === "single" ||
                    (expandable && props.expandOnRowClick)
            })}
            style={style}
            onClick={event => handleClick(event, "single")}
            onDoubleClick={event => handleClick(event, "double")}
            onKeyDown={handleKeyDown}
            onMouseOver={handleMouseOver}
            onMouseLeave={() => {
                setHovered(undefined);
                tooltip.hide();
            }}
        >
            {hovered && (
                <style>{`[data-dgp="${uid}"] .dgp-cell[data-col="${hovered}"] .dgp-cell-extra{display:inline}`}</style>
            )}
            <HeaderRow
                columns={columns}
                leadingWidth={leadingWidth}
                selectionMode={selection.mode}
                allSelected={allSelected}
                someSelected={someSelected}
                onSelectAll={() => selection.setMany(loadedItems, !allSelected)}
                sort={props.sort}
                onSort={props.onSort}
                onResize={props.onResize}
            />
            <div className="dgp-body" role="rowgroup" style={{ height: virtualizer.getTotalSize() }}>
                {virtualRows.map(virtualRow => {
                    const item = data.getItem(virtualRow.index);
                    const isExpanded = item !== undefined && expanded.has(item.id);
                    return (
                        <Row
                            key={virtualRow.key}
                            index={virtualRow.index}
                            item={item}
                            columns={columns}
                            start={virtualRow.start - virtualizer.options.scrollMargin}
                            selectionMode={selection.mode}
                            selected={item !== undefined && selection.isSelected(item)}
                            expandable={expandable}
                            expanded={isExpanded}
                            detail={isExpanded && item ? renderDetail?.(item) : undefined}
                            focusCol={focus.row === virtualRow.index ? focus.col : -1}
                            focusNonce={focus.row === virtualRow.index ? focus.nonce : 0}
                            className={item && props.rowClass(item)}
                            measure={virtualizer.measureElement}
                        />
                    );
                })}
                {isEmpty && <div className="dgp-empty">{props.empty}</div>}
            </div>
            <Tooltip state={tooltip.state} />
        </div>
    );
}
