import classNames from "classnames";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

import { parseNumberFilter, type ColumnFilter, type FilterValue } from "../model/filters";
import { ChevronIcon } from "./icons";

interface HeaderFilterProps {
    filter: ColumnFilter;
    /** The column header, for labels. */
    label: string;
    value: FilterValue | undefined;
    onChange(value: FilterValue | undefined): void;
}

/** The filter input under one column header. Its kind follows the column's attribute type. */
export function HeaderFilter(props: HeaderFilterProps): ReactElement {
    const { filter, label, value, onChange } = props;
    switch (filter.kind) {
        case "text":
        case "number": {
            const kind = filter.kind;
            const text = value?.kind === kind ? value.text : "";
            return (
                <DebouncedInput
                    value={text}
                    label={`Filter ${label}`}
                    placeholder={kind === "number" ? "e.g. >100" : "Filter"}
                    invalid={kind === "number" && text.trim() !== "" && parseNumberFilter(text) === undefined}
                    onChange={next => onChange(next.trim() ? { kind, text: next } : undefined)}
                />
            );
        }
        case "boolean":
            return (
                <select
                    className="dgp-filter-input"
                    aria-label={`Filter ${label}`}
                    value={value?.kind === "boolean" ? String(value.value) : ""}
                    onChange={event =>
                        onChange(
                            event.target.value ? { kind: "boolean", value: event.target.value === "true" } : undefined
                        )
                    }
                >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            );
        case "enum": {
            const selected = value?.kind === "enum" ? value.values : [];
            const summary =
                selected.length === 0
                    ? "All"
                    : selected.length === 1
                      ? (filter.options.find(o => o.key === selected[0])?.caption ?? selected[0])
                      : `${selected.length} selected`;
            return (
                <Popover label={`Filter ${label}`} summary={summary} active={selected.length > 0}>
                    {filter.options.map(option => (
                        <label key={option.key} className="dgp-menu-item">
                            <input
                                type="checkbox"
                                className="dgp-checkbox"
                                checked={selected.includes(option.key)}
                                onChange={() => {
                                    const next = selected.includes(option.key)
                                        ? selected.filter(key => key !== option.key)
                                        : [...selected, option.key];
                                    onChange(next.length > 0 ? { kind: "enum", values: next } : undefined);
                                }}
                            />
                            {option.caption}
                        </label>
                    ))}
                </Popover>
            );
        }
        case "date": {
            const range = value?.kind === "date" ? value : { kind: "date" as const };
            const set = (change: { from?: string; to?: string }): void => {
                const next = { ...range, ...change };
                onChange(next.from || next.to ? { kind: "date", from: next.from, to: next.to } : undefined);
            };
            const summary =
                range.from && range.to
                    ? `${range.from} – ${range.to}`
                    : range.from
                      ? `From ${range.from}`
                      : range.to
                        ? `Until ${range.to}`
                        : "Any date";
            return (
                <Popover label={`Filter ${label}`} summary={summary} active={Boolean(range.from || range.to)}>
                    <label className="dgp-filter-field">
                        From
                        <input
                            type="date"
                            className="dgp-filter-input"
                            value={range.from ?? ""}
                            onChange={event => set({ from: event.target.value || undefined })}
                        />
                    </label>
                    <label className="dgp-filter-field">
                        To
                        <input
                            type="date"
                            className="dgp-filter-input"
                            value={range.to ?? ""}
                            onChange={event => set({ to: event.target.value || undefined })}
                        />
                    </label>
                </Popover>
            );
        }
    }
}

/** Waits for typing to pause before filtering, so each keystroke doesn't start a request. */
const FILTER_DELAY = 300;

function DebouncedInput(props: {
    value: string;
    label: string;
    placeholder: string;
    invalid: boolean;
    onChange(value: string): void;
}): ReactElement {
    const [text, setText] = useState(props.value);
    // The value this input last reported, to tell its own changes from changes made elsewhere.
    const [sent, setSent] = useState(props.value);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onChange = useRef(props.onChange);
    useEffect(() => {
        onChange.current = props.onChange;
    });
    useEffect(() => () => clearTimeout(timer.current), []);

    // Follow changes made elsewhere, such as removing the filter's chip.
    if (props.value !== sent) {
        setSent(props.value);
        setText(props.value);
    }

    const send = (value: string, delay: number): void => {
        clearTimeout(timer.current);
        const run = (): void => {
            setSent(value);
            onChange.current(value);
        };
        if (delay > 0) {
            timer.current = setTimeout(run, delay);
        } else {
            run();
        }
    };

    return (
        <input
            type="text"
            className={classNames("dgp-filter-input", { "dgp-filter-input--invalid": props.invalid })}
            aria-label={props.label}
            aria-invalid={props.invalid || undefined}
            placeholder={props.placeholder}
            value={text}
            onChange={event => {
                setText(event.target.value);
                send(event.target.value, FILTER_DELAY);
            }}
            onKeyDown={event => {
                if (event.key === "Enter") {
                    send(text, 0);
                } else if (event.key === "Escape" && text) {
                    event.stopPropagation();
                    setText("");
                    send("", 0);
                }
            }}
        />
    );
}

/**
 * A button that opens a small panel. The panel is fixed to the window, because the grid's scroll container
 * would clip anything that hangs below the header.
 */
function Popover(props: { label: string; summary: string; active: boolean; children: ReactNode }): ReactElement {
    const [position, setPosition] = useState<{ top: number; left: number } | undefined>();
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const open = position !== undefined;

    useEffect(() => {
        if (!open) {
            return;
        }
        const close = (event: Event): void => {
            if (event instanceof KeyboardEvent) {
                if (event.key === "Escape") {
                    setPosition(undefined);
                    button.current?.focus();
                }
                return;
            }
            const target = event.target as Node;
            if (!panel.current?.contains(target) && !button.current?.contains(target)) {
                setPosition(undefined);
            }
        };
        const onScroll = (event: Event): void => {
            if (!panel.current?.contains(event.target as Node)) {
                setPosition(undefined);
            }
        };
        document.addEventListener("pointerdown", close);
        document.addEventListener("keydown", close);
        window.addEventListener("scroll", onScroll, true);
        return () => {
            document.removeEventListener("pointerdown", close);
            document.removeEventListener("keydown", close);
            window.removeEventListener("scroll", onScroll, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={button}
                type="button"
                className={classNames("dgp-filter-input dgp-filter-button", {
                    "dgp-filter-button--active": props.active
                })}
                aria-label={`${props.label}: ${props.summary}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    if (open) {
                        setPosition(undefined);
                        return;
                    }
                    const rect = button.current!.getBoundingClientRect();
                    setPosition({ top: rect.bottom + 4, left: rect.left });
                }}
            >
                <span className="dgp-filter-summary">{props.summary}</span>
                <ChevronIcon open />
            </button>
            {open && (
                <div
                    ref={panel}
                    role="dialog"
                    aria-label={props.label}
                    className="dgp-menu-panel dgp-filter-panel"
                    style={{ position: "fixed", top: position.top, left: position.left, right: "auto" }}
                >
                    {props.children}
                </div>
            )}
        </>
    );
}
