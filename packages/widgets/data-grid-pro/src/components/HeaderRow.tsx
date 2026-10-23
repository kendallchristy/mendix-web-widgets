import classNames from "classnames";
import { useRef, type PointerEvent, type ReactElement } from "react";

import type { ColumnModel, SortState } from "../model/types";
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
}

export function HeaderRow(props: HeaderRowProps): ReactElement {
    const { columns, sort } = props;
    return (
        <div className="dgp-head" role="rowgroup">
            <div className="dgp-cells" role="row" aria-rowindex={1}>
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
                                "dgp-hcell--sorted": direction !== undefined
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
