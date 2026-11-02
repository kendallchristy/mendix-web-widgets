import { useEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";

import type { ColumnModel, Density } from "../model/types";
import type { BatchProgress } from "../model/useBatchLoader";
import { ArrowIcon, ColumnsIcon, DensityIcon, ExportIcon, SearchIcon } from "./icons";

export interface FilterChip {
    id: string;
    name: string;
    text: string;
    onRemove(): void;
}

interface ToolbarProps {
    title: string | undefined;
    total: number | undefined;
    content: ReactNode;
    selectedCount: number;
    bulkActions: ReactNode;
    onClearSelection(): void;
    /** The offer to select every row in the data source. */
    selectAll:
        | {
              total: number;
              /** The data source has more rows than select all takes. */
              capped: boolean;
              onStart(): void;
          }
        | undefined;
    /** Select all or an export fetching rows. */
    progress: { value: BatchProgress; onCancel(): void } | undefined;
    /** The export button. Undefined hides it. */
    onExport: (() => void) | undefined;
    /** Called when something in the bulk actions is clicked. */
    onBulkAction: (() => void) | undefined;
    /** Columns listed in the column menu, in their current order. Undefined hides the menu. */
    columns: ColumnModel[] | undefined;
    hidden: string[];
    onToggleColumn(columnId: string): void;
    /** Moves a column one place left (-1) or right (1). Undefined when users can't reorder columns. */
    onMoveColumn: ((columnId: string, delta: -1 | 1) => void) | undefined;
    onResetColumns(): void;
    search: { placeholder: string; onSearch(text: string): void } | undefined;
    /** Active header filters, shown as chips. */
    chips: FilterChip[];
    onClearFilters(): void;
    density: Density | undefined;
    onDensity(density: Density): void;
}

export function Toolbar(props: ToolbarProps): ReactElement | null {
    const { selectAll, progress } = props;
    const selecting = props.selectedCount > 0 && (props.bulkActions !== undefined || selectAll !== undefined);
    const hasTools =
        props.columns !== undefined ||
        props.density !== undefined ||
        props.search !== undefined ||
        props.onExport !== undefined;
    if (
        !props.title &&
        props.total === undefined &&
        !props.content &&
        !selecting &&
        !progress &&
        !hasTools &&
        props.chips.length === 0
    ) {
        return null;
    }
    return (
        <div className="dgp-toolbar">
            {(props.title || props.total !== undefined) && (
                <div className="dgp-title">
                    {props.title && <h2 className="dgp-title-text">{props.title}</h2>}
                    {props.total !== undefined && <span className="dgp-count">{props.total.toLocaleString()}</span>}
                </div>
            )}
            {progress ? (
                // Bulk actions are out of reach while rows are fetched, so none can start on half the rows.
                <div className="dgp-bulk">
                    <ProgressBar progress={progress.value} onCancel={progress.onCancel} />
                </div>
            ) : selecting ? (
                <div className="dgp-bulk" role="region" aria-label="Bulk actions">
                    <span className="dgp-bulk-count" aria-live="polite">
                        {props.selectedCount.toLocaleString()} selected
                    </span>
                    {selectAll && (
                        <button type="button" className="dgp-link-button" onClick={selectAll.onStart}>
                            {selectAll.capped ? "Select first" : "Select all"} {selectAll.total.toLocaleString()}
                        </button>
                    )}
                    <div
                        className="dgp-toolbar-content"
                        onClickCapture={event => {
                            if ((event.target as HTMLElement).closest("button, a, [role='button']")) {
                                props.onBulkAction?.();
                            }
                        }}
                    >
                        {props.bulkActions}
                    </div>
                    <button type="button" className="dgp-link-button" onClick={props.onClearSelection}>
                        Clear
                    </button>
                </div>
            ) : (
                props.content && <div className="dgp-toolbar-content">{props.content}</div>
            )}
            {hasTools && (
                <div className="dgp-tools">
                    {props.search && <SearchBox {...props.search} />}
                    {props.onExport && (
                        <button
                            type="button"
                            className="dgp-tool-button"
                            disabled={progress !== undefined}
                            onClick={props.onExport}
                        >
                            <ExportIcon />
                            <span>Export</span>
                        </button>
                    )}
                    {props.density && <DensityMenu value={props.density} onChange={props.onDensity} />}
                    {props.columns && (
                        <ColumnMenu
                            columns={props.columns}
                            hidden={props.hidden}
                            onToggle={props.onToggleColumn}
                            onMove={props.onMoveColumn}
                            onReset={props.onResetColumns}
                        />
                    )}
                </div>
            )}
            {props.chips.length > 0 && (
                <div className="dgp-chips" role="group" aria-label="Active filters">
                    {props.chips.map(chip => (
                        <span key={chip.id} className="dgp-chip">
                            <span className="dgp-chip-text">
                                <span className="dgp-chip-name">{chip.name}</span> {chip.text}
                            </span>
                            <button
                                type="button"
                                className="dgp-icon-button"
                                aria-label={`Remove filter ${chip.name} ${chip.text}`}
                                onClick={chip.onRemove}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {props.chips.length > 1 && (
                        <button type="button" className="dgp-link-button" onClick={props.onClearFilters}>
                            Clear filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function useMenu(): [open: boolean, setOpen: (open: boolean) => void, ref: RefObject<HTMLDivElement | null>] {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) {
            return;
        }
        const close = (event: Event): void => {
            if (
                event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("pointerdown", close);
        document.addEventListener("keydown", close);
        return () => {
            document.removeEventListener("pointerdown", close);
            document.removeEventListener("keydown", close);
        };
    }, [open]);
    return [open, setOpen, ref];
}

function ProgressBar(props: { progress: BatchProgress; onCancel(): void }): ReactElement {
    const { task, loaded, target } = props.progress;
    return (
        <span className="dgp-select-all" role="status">
            <span>
                {task === "export" ? "Exporting" : "Selecting"} {loaded.toLocaleString()} of {target.toLocaleString()}
            </span>
            <progress className="dgp-select-all-bar" value={loaded} max={Math.max(target, 1)} />
            <button type="button" className="dgp-link-button" onClick={props.onCancel}>
                Cancel
            </button>
        </span>
    );
}

/** Waits for typing to pause before searching, so each keystroke doesn't start a request. */
const SEARCH_DELAY = 300;

function SearchBox(props: { placeholder: string; onSearch(text: string): void }): ReactElement {
    const [text, setText] = useState("");
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onSearch = useRef(props.onSearch);
    useEffect(() => {
        onSearch.current = props.onSearch;
    });
    useEffect(() => () => clearTimeout(timer.current), []);

    const change = (value: string, delay: number): void => {
        setText(value);
        clearTimeout(timer.current);
        if (delay > 0) {
            timer.current = setTimeout(() => onSearch.current(value), delay);
        } else {
            onSearch.current(value);
        }
    };

    return (
        <div className="dgp-search" role="search">
            <SearchIcon />
            <input
                type="text"
                className="dgp-search-input"
                aria-label={props.placeholder}
                placeholder={props.placeholder}
                value={text}
                onChange={event => change(event.target.value, SEARCH_DELAY)}
                onKeyDown={event => {
                    if (event.key === "Escape" && text) {
                        event.stopPropagation();
                        change("", 0);
                    } else if (event.key === "Enter") {
                        change(text, 0);
                    }
                }}
            />
            {text && (
                <button
                    type="button"
                    className="dgp-icon-button dgp-search-clear"
                    aria-label="Clear search"
                    onClick={() => change("", 0)}
                >
                    ×
                </button>
            )}
        </div>
    );
}

function ColumnMenu(props: {
    columns: ColumnModel[];
    hidden: string[];
    onToggle(id: string): void;
    onMove: ((id: string, delta: -1 | 1) => void) | undefined;
    onReset(): void;
}): ReactElement {
    const [open, setOpen, ref] = useMenu();
    const { onMove } = props;
    return (
        <div className="dgp-menu" ref={ref}>
            <button
                type="button"
                className="dgp-tool-button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <ColumnsIcon />
                <span>Columns</span>
            </button>
            {open && (
                <div className="dgp-menu-panel" role="group" aria-label="Columns">
                    {props.columns.map((column, index) => {
                        const name = column.header || column.id;
                        return (
                            <div key={column.id} className="dgp-menu-row">
                                <label className="dgp-menu-item">
                                    <input
                                        type="checkbox"
                                        className="dgp-checkbox"
                                        disabled={!column.hidable}
                                        checked={!props.hidden.includes(column.id)}
                                        onChange={() => props.onToggle(column.id)}
                                    />
                                    {name}
                                </label>
                                {onMove && (
                                    <span className="dgp-menu-move">
                                        <button
                                            type="button"
                                            className="dgp-icon-button"
                                            aria-label={`Move ${name} left`}
                                            disabled={index === 0}
                                            onClick={() => onMove(column.id, -1)}
                                        >
                                            <ArrowIcon direction="up" />
                                        </button>
                                        <button
                                            type="button"
                                            className="dgp-icon-button"
                                            aria-label={`Move ${name} right`}
                                            disabled={index === props.columns.length - 1}
                                            onClick={() => onMove(column.id, 1)}
                                        >
                                            <ArrowIcon direction="down" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    <div className="dgp-menu-footer">
                        <button type="button" className="dgp-link-button" onClick={props.onReset}>
                            Reset columns
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const DENSITIES: Array<[Density, string]> = [
    ["compact", "Compact"],
    ["default", "Default"],
    ["comfortable", "Comfortable"]
];

function DensityMenu(props: { value: Density; onChange(density: Density): void }): ReactElement {
    const [open, setOpen, ref] = useMenu();
    return (
        <div className="dgp-menu" ref={ref}>
            <button
                type="button"
                className="dgp-tool-button"
                aria-haspopup="true"
                aria-expanded={open}
                aria-label="Row density"
                onClick={() => setOpen(!open)}
            >
                <DensityIcon />
            </button>
            {open && (
                <div className="dgp-menu-panel" role="radiogroup" aria-label="Row density">
                    {DENSITIES.map(([value, label]) => (
                        <label key={value} className="dgp-menu-item">
                            <input
                                type="radio"
                                name="dgp-density"
                                checked={props.value === value}
                                onChange={() => {
                                    props.onChange(value);
                                    setOpen(false);
                                }}
                            />
                            {label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
