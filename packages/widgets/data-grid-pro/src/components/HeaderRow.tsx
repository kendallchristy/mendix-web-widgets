import classNames from "classnames";
import { useRef, useState, type MouseEvent, type PointerEvent, type ReactElement } from "react";

import type { FilterValue } from "../model/filters";
import type { ColumnModel, SortState } from "../model/types";
import { HeaderFilter } from "./HeaderFilter";
import { SortIcon } from "./icons";

interface HeaderRowProps {
    columns: ColumnModel[];
    leadingWidth: number;
    selectionMode: "none" | "single" | "multi";
    allSelected: boolean;
    someSelected: boolean;
    onSelectAll(): void;
    sort: SortState | undefined;
    onSort(columnId: string): void;
    onResize(columnId: string, width: number): void;
    /** Moves a column in front of another, or to the end. Undefined turns dragging off. */
    onReorder: ((columnId: string, beforeId: string | undefined) => void) | undefined;
    /** Header filter values. Undefined leaves out the filter row. */
    filters: HeaderFilters | undefined;
}

export interface HeaderFilters {
    values: Record<string, FilterValue>;
    onChange(columnId: string, value: FilterValue | undefined): void;
}

/** Pixels the pointer must travel before a press on a header becomes a drag rather than a click. */
const DRAG_THRESHOLD = 5;

/** The column a header dropped at this x position would land in front of, or undefined for the end. */
function dropTarget(row: HTMLElement, clientX: number): string | undefined {
    for (const cell of row.querySelectorAll<HTMLElement>(".dgp-hcell[data-col]")) {
        const rect = cell.getBoundingClientRect();
        if (clientX < rect.left + rect.width / 2) {
            return cell.dataset.col;
        }
    }
    return undefined;
}

export function HeaderRow(props: HeaderRowProps): ReactElement {
    const { columns, sort, onReorder } = props;
    const press = useRef<{ id: string; x: number; dragging: boolean } | undefined>(undefined);
    const [drag, setDrag] = useState<{ id: string; before: string | undefined } | undefined>();
    const swallowClick = useRef(false);

    const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
        const target = event.target as HTMLElement;
        const id = target.closest<HTMLElement>(".dgp-hcell[data-col]")?.dataset.col;
        if (!onReorder || !id || event.button !== 0 || target.closest(".dgp-resizer")) {
            return;
        }
        press.current = { id, x: event.clientX, dragging: false };
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        const current = press.current;
        if (!current) {
            return;
        }
        if (!current.dragging) {
            if (Math.abs(event.clientX - current.x) < DRAG_THRESHOLD) {
                return;
            }
            current.dragging = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        const before = dropTarget(event.currentTarget, event.clientX);
        if (drag?.id !== current.id || drag.before !== before) {
            setDrag({ id: current.id, before });
        }
    };

    const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
        const current = press.current;
        press.current = undefined;
        if (!current?.dragging) {
            return;
        }
        // The release would otherwise count as a click on the header and sort the column.
        swallowClick.current = true;
        setTimeout(() => {
            swallowClick.current = false;
        });
        setDrag(undefined);
        onReorder?.(current.id, dropTarget(event.currentTarget, event.clientX));
    };

    const onPointerCancel = (): void => {
        press.current = undefined;
        setDrag(undefined);
    };

    const onClickCapture = (event: MouseEvent<HTMLDivElement>): void => {
        if (swallowClick.current) {
            swallowClick.current = false;
            event.stopPropagation();
            event.preventDefault();
        }
    };

    return (
        <div className={classNames("dgp-head", { "dgp-head--filters": props.filters !== undefined })} role="rowgroup">
            <div
                className={classNames("dgp-cells", { "dgp-cells--dragging": drag !== undefined })}
                role="row"
                aria-rowindex={1}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onClickCapture={onClickCapture}
            >
                {props.leadingWidth > 0 && (
                    <div role="columnheader" className="dgp-hcell dgp-leading dgp-pin">
                        {props.selectionMode === "multi" && (
                            <input
                                type="checkbox"
                                className="dgp-checkbox"
                                aria-label="Select all loaded rows"
                                checked={props.allSelected}
                                ref={input => {
                                    if (input) {
                                        input.indeterminate = props.someSelected;
                                    }
                                }}
                                onChange={props.onSelectAll}
                            />
                        )}
                    </div>
                )}
                {columns.map((column, index) => {
                    const direction = sort?.columnId === column.id ? sort.direction : undefined;
                    const sortable = column.sortAttribute !== undefined;
                    return (
                        <div
                            key={column.id}
                            role="columnheader"
                            data-col={column.id}
                            aria-sort={
                                direction === "asc" ? "ascending" : direction === "desc" ? "descending" : undefined
                            }
                            className={classNames("dgp-hcell", `dgp-cell--${column.align}`, {
                                "dgp-pin dgp-pin--first": index === 0,
                                "dgp-hcell--sorted": direction !== undefined,
                                "dgp-hcell--draggable": onReorder !== undefined,
                                "dgp-hcell--dragging": drag?.id === column.id,
                                "dgp-hcell--drop-before": drag !== undefined && drag.before === column.id,
                                "dgp-hcell--drop-after":
                                    drag !== undefined && drag.before === undefined && index === columns.length - 1
                            })}
                        >
                            {sortable ? (
                                <button type="button" className="dgp-hbutton" onClick={() => props.onSort(column.id)}>
                                    <span className="dgp-hlabel">{column.header}</span>
                                    <SortIcon direction={direction} />
                                </button>
                            ) : (
                                <span className="dgp-hlabel">{column.header}</span>
                            )}
                            {column.resizable && (
                                <Resizer
                                    label={column.header}
                                    minWidth={column.minWidth}
                                    onResize={width => props.onResize(column.id, width)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            {props.filters && <FilterRow columns={columns} leading={props.leadingWidth > 0} filters={props.filters} />}
        </div>
    );
}

function FilterRow(props: { columns: ColumnModel[]; leading: boolean; filters: HeaderFilters }): ReactElement {
    const { values, onChange } = props.filters;
    return (
        <div className="dgp-cells dgp-filter-row" role="row">
            {props.leading && <div role="columnheader" className="dgp-fcell dgp-leading dgp-pin" />}
            {props.columns.map((column, index) => (
                <div
                    key={column.id}
                    role="columnheader"
                    className={classNames("dgp-fcell", { "dgp-pin dgp-pin--first": index === 0 })}
                >
                    {column.filter && (
                        <HeaderFilter
                            filter={column.filter}
                            label={column.header || column.id}
                            value={values[column.id]}
                            onChange={value => onChange(column.id, value)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function Resizer(props: { label: string; minWidth: number; onResize(width: number): void }): ReactElement {
    const drag = useRef<{ startX: number; startWidth: number; frame: number } | undefined>(undefined);

    const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
        const cell = event.currentTarget.parentElement;
        if (!cell) {
            return;
        }
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startWidth: cell.getBoundingClientRect().width, frame: 0 };
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        const state = drag.current;
        if (!state) {
            return;
        }
        const width = Math.max(props.minWidth, Math.round(state.startWidth + event.clientX - state.startX));
        // One layout per frame, however fast the pointer moves.
        cancelAnimationFrame(state.frame);
        state.frame = requestAnimationFrame(() => props.onResize(width));
    };

    const onPointerUp = (): void => {
        drag.current = undefined;
    };

    return (
        <div
            className="dgp-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label={`Resize ${props.label}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={event => event.stopPropagation()}
        />
    );
}
