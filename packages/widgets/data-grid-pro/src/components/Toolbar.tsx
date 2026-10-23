import { useEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from "react";

import type { ColumnModel, Density } from "../model/types";
import { ColumnsIcon, DensityIcon } from "./icons";

interface ToolbarProps {
    title: string | undefined;
    total: number | undefined;
    content: ReactNode;
    selectedCount: number;
    bulkActions: ReactNode;
    onClearSelection(): void;
    columns: ColumnModel[] | undefined;
    hidden: string[];
    onToggleColumn(columnId: string): void;
    density: Density | undefined;
    onDensity(density: Density): void;
}

export function Toolbar(props: ToolbarProps): ReactElement | null {
    const selecting = props.selectedCount > 0 && props.bulkActions !== undefined;
    const hasTools = props.columns !== undefined || props.density !== undefined;
    if (!props.title && props.total === undefined && !props.content && !selecting && !hasTools) {
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
            {selecting ? (
                <div className="dgp-bulk" role="region" aria-label="Bulk actions">
                    <span className="dgp-bulk-count">{props.selectedCount.toLocaleString()} selected</span>
                    <div className="dgp-toolbar-content">{props.bulkActions}</div>
                    <button type="button" className="dgp-link-button" onClick={props.onClearSelection}>
                        Clear
                    </button>
                </div>
            ) : (
                props.content && <div className="dgp-toolbar-content">{props.content}</div>
            )}
            {hasTools && (
                <div className="dgp-tools">
                    {props.density && <DensityMenu value={props.density} onChange={props.onDensity} />}
                    {props.columns && (
                        <ColumnMenu columns={props.columns} hidden={props.hidden} onToggle={props.onToggleColumn} />
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

function ColumnMenu(props: { columns: ColumnModel[]; hidden: string[]; onToggle(id: string): void }): ReactElement {
    const [open, setOpen, ref] = useMenu();
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
                <div className="dgp-menu-panel" role="group" aria-label="Visible columns">
                    {props.columns.map(column => (
                        <label key={column.id} className="dgp-menu-item">
                            <input
                                type="checkbox"
                                className="dgp-checkbox"
                                disabled={!column.hidable}
                                checked={!props.hidden.includes(column.id)}
                                onChange={() => props.onToggle(column.id)}
                            />
                            {column.header || column.id}
                        </label>
                    ))}
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
