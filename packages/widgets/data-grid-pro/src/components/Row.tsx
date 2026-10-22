import classNames from "classnames";
import type { ObjectItem } from "mendix";
import { memo, useLayoutEffect, useRef, type ReactElement, type ReactNode } from "react";

import type { ColumnModel } from "../model/types";
import { SkeletonBar } from "./cells";
import { ChevronIcon } from "./icons";

export interface RowProps {
    index: number;
    item: ObjectItem | undefined;
    columns: ColumnModel[];
    /** Offset from the top of the body, in pixels. */
    start: number;
    selectionMode: "none" | "single" | "multi";
    selected: boolean;
    expandable: boolean;
    expanded: boolean;
    detail: ReactNode;
    /** Index of the focused column in this row, or -1. */
    focusCol: number;
    /** Changes when keyboard navigation moves focus, so the row knows to move DOM focus. */
    focusNonce: number;
    className: string | undefined;
    measure: (element: HTMLElement | null) => void;
}

/**
 * One grid row. Memoized so scrolling, hovering and selecting only re-render the rows whose props changed.
 * Clicks and keys are handled once at the grid level (see Grid), so cells carry no handlers of their own.
 */
export const Row = memo(function Row(props: RowProps): ReactElement {
    const { item, columns, focusCol, focusNonce } = props;
    const ref = useRef<HTMLDivElement>(null);
    const hasLeading = props.expandable || props.selectionMode === "multi";

    useLayoutEffect(() => {
        if (focusCol >= 0 && focusNonce > 0) {
            ref.current?.querySelector<HTMLElement>(`[data-col-index="${focusCol}"]`)?.focus({ preventScroll: true });
        }
    }, [focusCol, focusNonce]);

    return (
        <div
            ref={element => {
                ref.current = element;
                props.measure(element);
            }}
            role="row"
            aria-rowindex={props.index + 2}
            aria-selected={props.selectionMode === "none" ? undefined : props.selected}
            aria-expanded={props.expandable ? props.expanded : undefined}
            data-index={props.index}
            className={classNames("dgp-row", props.className, {
                "dgp-row--selected": props.selected,
                "dgp-row--odd": props.index % 2 === 1,
                "dgp-row--loading": !item
            })}
            style={{ transform: `translateY(${props.start}px)` }}
        >
            <div className="dgp-cells">
                {hasLeading && (
                    <div role="gridcell" className="dgp-cell dgp-leading dgp-pin">
                        {props.expandable && item && (
                            <button
                                type="button"
                                tabIndex={-1}
                                className="dgp-icon-button dgp-expand"
                                data-action="expand"
                                aria-label={props.expanded ? "Collapse row" : "Expand row"}
                            >
                                <ChevronIcon open={props.expanded} />
                            </button>
                        )}
                        {props.selectionMode === "multi" && item && (
                            <input
                                type="checkbox"
                                tabIndex={-1}
                                className="dgp-checkbox"
                                data-action="select"
                                checked={props.selected}
                                readOnly
                                aria-label="Select row"
                            />
                        )}
                    </div>
                )}
                {columns.map((column, colIndex) => (
                    <div
                        key={column.id}
                        role="gridcell"
                        data-col={column.id}
                        data-col-index={colIndex}
                        tabIndex={focusCol === colIndex ? 0 : -1}
                        className={classNames(
                            "dgp-cell",
                            `dgp-cell--${column.align}`,
                            { "dgp-pin dgp-pin--first": colIndex === 0 },
                            item && column.cellClass(item)
                        )}
                    >
                        {item ? (
                            <>
                                {column.renderExpanded && (
                                    <span className="dgp-cell-extra">{column.renderExpanded(item)}</span>
                                )}
                                {column.renderCell(item)}
                            </>
                        ) : (
                            <SkeletonBar />
                        )}
                    </div>
                ))}
            </div>
            {props.expanded && item && (
                <div role="gridcell" aria-colspan={columns.length + (hasLeading ? 1 : 0)} className="dgp-detail">
                    {props.detail}
                </div>
            )}
        </div>
    );
});
