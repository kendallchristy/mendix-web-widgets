import classNames from "classnames";
import { useState, type FocusEvent, type PointerEvent, type ReactElement } from "react";

import type { Labels } from "../core/labels";
import {
    AREA_OPACITY,
    boundsOf,
    fromView,
    HIGHLIGHT_OPACITY,
    INK_WIDTH,
    MARKUP_COLORS,
    rectFromView,
    rectToView,
    thinStroke,
    toView,
    type Markup,
    type MarkupTool,
    type NewMarkup,
    type Rect
} from "../core/markup";
import { Icon } from "./Icons";

export interface MarkupLayerProps {
    page: number;
    width: number;
    height: number;
    rotation: number;
    items: Markup[];
    tool: MarkupTool;
    color: string;
    editable: boolean;
    selectedId: string | null;
    labels: Labels;
    onAdd(item: NewMarkup): void;
    onSelect(id: string | null): void;
    onUpdate(id: string, patch: Partial<Markup>): void;
    onRemove(id: string): void;
}

type Draft = { kind: "area"; start: [number, number]; end: [number, number] } | { kind: "ink"; points: number[] };

const POPOVER_WIDTH = 248;

function formatDate(iso: string | undefined): string {
    if (!iso) {
        return "";
    }
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function MarkupPopover(props: {
    item: Markup;
    left: number;
    top: number;
    above: boolean;
    editable: boolean;
    labels: Labels;
    onUpdate(id: string, patch: Partial<Markup>): void;
    onRemove(id: string): void;
    onClose(): void;
}): ReactElement | null {
    const { item, editable, labels } = props;
    const [text, setText] = useState(item.comment ?? "");
    const meta = [item.author, formatDate(item.date)].filter(Boolean).join(" · ");

    const save = (): void => {
        const comment = text.trim();
        if (item.type === "note" && !comment) {
            // An empty note is a note nobody wrote.
            props.onRemove(item.id);
        } else if (comment !== (item.comment ?? "")) {
            props.onUpdate(item.id, { comment: comment || undefined });
        }
    };
    const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
        if (editable && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            save();
        }
    };

    if (!editable && !item.comment && !meta) {
        return null;
    }
    return (
        <div
            className={classNames("dvp-markup-popover", { "dvp-markup-popover--above": props.above })}
            style={{ left: props.left, top: props.top, width: POPOVER_WIDTH }}
            role="dialog"
            aria-label={item.type === "note" ? labels.noteItem : labels.markup}
            onBlur={onBlur}
            onPointerDown={event => event.stopPropagation()}
            onPointerUp={event => event.stopPropagation()}
            onClick={event => event.stopPropagation()}
            onKeyDown={event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    if (editable) {
                        save();
                    }
                    props.onClose();
                } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && editable) {
                    event.preventDefault();
                    save();
                    props.onClose();
                }
            }}
        >
            {editable ? (
                <textarea
                    className="dvp-markup-comment"
                    value={text}
                    placeholder={labels.markupComment}
                    aria-label={labels.markupComment}
                    rows={3}
                    autoFocus={item.type === "note" && !item.comment}
                    onChange={event => setText(event.target.value)}
                />
            ) : (
                item.comment && <p className="dvp-markup-comment-text">{item.comment}</p>
            )}
            {meta && <div className="dvp-markup-meta">{meta}</div>}
            {editable && (
                <div className="dvp-markup-popover-actions">
                    <div className="dvp-markup-swatches" role="radiogroup" aria-label={labels.markupColor}>
                        {MARKUP_COLORS.map((color, i) => (
                            <button
                                key={color}
                                type="button"
                                role="radio"
                                aria-checked={item.color === color}
                                aria-label={`${labels.markupColor} ${i + 1}`}
                                className="dvp-markup-swatch"
                                style={{ background: color }}
                                // Keeps the focus in the comment, so picking a color doesn't count as leaving.
                                onPointerDown={event => event.preventDefault()}
                                onClick={() => props.onUpdate(item.id, { color })}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        className="dvp-tool"
                        aria-label={labels.markupDelete}
                        title={labels.markupDelete}
                        // Keeps the focus in the comment, so the blur handler doesn't save what's about to be deleted.
                        onPointerDown={event => event.preventDefault()}
                        onClick={() => props.onRemove(item.id)}
                    >
                        <Icon name="trash" />
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Draws one page's markup above the page and takes the pointer while a drawing tool is picked. Everything else
 * (text selection, links, clicking markup to select it) goes through to the page.
 */
export function MarkupLayer(props: MarkupLayerProps): ReactElement {
    const { page, width, height, rotation, tool, color, editable, labels } = props;
    const items = props.items.filter(item => item.page === page);
    const [draft, setDraft] = useState<Draft | null>(null);
    const drawing = editable && (tool === "area" || tool === "note" || tool === "ink");
    // Line widths follow the page's own width, which is the height when the page is turned a quarter.
    const pageWidth = rotation % 180 === 0 ? width : height;

    const toPage = (event: PointerEvent<HTMLDivElement>): [number, number] => {
        const box = event.currentTarget.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - box.left) / (box.width || 1)));
        const y = Math.min(1, Math.max(0, (event.clientY - box.top) / (box.height || 1)));
        return fromView(x, y, rotation);
    };
    const viewPoint = (x: number, y: number): [number, number] => {
        const [vx, vy] = toView(x, y, rotation);
        return [vx * width, vy * height];
    };
    const viewRect = (rect: Rect): Rect => {
        const [x, y, w, h] = rectToView(rect, rotation);
        return [x * width, y * height, w * width, h * height];
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
        if (!drawing || event.button !== 0) {
            return;
        }
        if (tool === "note") {
            // Keeps image panning from starting under a note being placed.
            event.stopPropagation();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const point = toPage(event);
        setDraft(tool === "area" ? { kind: "area", start: point, end: point } : { kind: "ink", points: point });
        props.onSelect(null);
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        if (!draft) {
            return;
        }
        const point = toPage(event);
        setDraft(
            draft.kind === "area" ? { ...draft, end: point } : { kind: "ink", points: [...draft.points, ...point] }
        );
    };
    const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
        if (!drawing) {
            return;
        }
        if (tool === "note" && event.button === 0) {
            const [x, y] = toPage(event);
            props.onAdd({ type: "note", page, color, x, y });
            return;
        }
        if (!draft) {
            return;
        }
        if (draft.kind === "area") {
            const [ax, ay] = draft.start;
            const [bx, by] = draft.end;
            const rect: Rect = [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)];
            if (rect[2] * width > 4 && rect[3] * height > 4) {
                props.onAdd({ type: "area", page, color, rect });
            }
        } else {
            props.onAdd({ type: "ink", page, color, strokes: [thinStroke(draft.points)], width: INK_WIDTH });
        }
        setDraft(null);
    };

    const shapes = (item: Markup | NewMarkup, key: string, selected: boolean): ReactElement | null => {
        switch (item.type) {
            case "highlight":
                return (
                    <g key={key} className="dvp-markup-highlight" fill={item.color} opacity={HIGHLIGHT_OPACITY}>
                        {item.rects.map(rect => {
                            const [x, y, w, h] = viewRect(rect);
                            return <rect key={rect.join(",")} x={x} y={y} width={w} height={h} rx={2} />;
                        })}
                    </g>
                );
            case "area": {
                const [x, y, w, h] = viewRect(item.rect);
                return (
                    <rect
                        key={key}
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={3}
                        fill={item.color}
                        fillOpacity={AREA_OPACITY}
                        stroke={item.color}
                        strokeWidth={selected ? 2.5 : 1.75}
                    />
                );
            }
            case "ink":
                return (
                    <g key={key} stroke={item.color} strokeWidth={Math.max(1, item.width * pageWidth)}>
                        {item.strokes.map(stroke => {
                            const points: Array<[number, number]> = [];
                            for (let p = 0; p + 1 < stroke.length; p += 2) {
                                points.push(viewPoint(stroke[p], stroke[p + 1]));
                            }
                            const strokeKey = stroke.slice(0, 6).join(",");
                            return points.length === 1 ? (
                                <circle
                                    key={strokeKey}
                                    cx={points[0][0]}
                                    cy={points[0][1]}
                                    r={Math.max(0.5, (item.width * pageWidth) / 2)}
                                    fill={item.color}
                                    stroke="none"
                                />
                            ) : (
                                <polyline
                                    key={strokeKey}
                                    points={points.map(point => point.join(",")).join(" ")}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            );
                        })}
                    </g>
                );
            default:
                return null;
        }
    };

    const selected = items.find(item => item.id === props.selectedId);
    let outline: Rect | null = null;
    let popover: { left: number; top: number; above: boolean } | null = null;
    if (selected) {
        const [x, y, w, h] = viewRect(boundsOf(selected));
        outline = selected.type === "note" ? null : [x - 4, y - 4, w + 8, h + 8];
        const pin = selected.type === "note" ? 14 : 8;
        const above = y + h + pin + 150 > height && y - pin - 150 > 0;
        popover = {
            left: Math.max(0, Math.min(x + (selected.type === "note" ? -POPOVER_WIDTH / 2 : 0), width - POPOVER_WIDTH)),
            top: above ? y - pin : y + h + pin,
            above
        };
    }

    let draftShape: ReactElement | null = null;
    if (draft?.kind === "area") {
        const [ax, ay] = draft.start;
        const [bx, by] = draft.end;
        draftShape = shapes(
            {
                type: "area",
                page,
                color,
                rect: [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)]
            },
            "draft",
            false
        );
    } else if (draft?.kind === "ink") {
        draftShape = shapes({ type: "ink", page, color, strokes: [draft.points], width: INK_WIDTH }, "draft", false);
    }

    return (
        <div
            className={classNames("dvp-markup-layer", {
                "dvp-markup-layer--drawing": drawing,
                [`dvp-markup-layer--${tool}`]: drawing
            })}
            data-markup-page={page}
            data-rotation={rotation}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDraft(null)}
        >
            <svg className="dvp-markup-svg" width={width} height={height} aria-hidden="true">
                {items.map(item => shapes(item, item.id, item.id === props.selectedId))}
                {draftShape}
                {outline && (
                    <rect
                        className="dvp-markup-outline"
                        x={outline[0]}
                        y={outline[1]}
                        width={outline[2]}
                        height={outline[3]}
                        rx={4}
                    />
                )}
            </svg>
            {items
                .filter(item => item.type === "note")
                .map(item => {
                    const [x, y] = viewPoint(item.x, item.y);
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={classNames("dvp-markup-pin", {
                                "dvp-markup-pin--selected": item.id === props.selectedId
                            })}
                            style={{ left: x, top: y, color: item.color }}
                            aria-label={item.comment ? `${labels.noteItem}: ${item.comment}` : labels.noteItem}
                            title={item.comment}
                            onPointerDown={event => event.stopPropagation()}
                            onPointerUp={event => event.stopPropagation()}
                            onClick={event => {
                                event.stopPropagation();
                                props.onSelect(item.id === props.selectedId ? null : item.id);
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M4 4h16v12h-7l-5 4v-4H4z"
                                    fill="currentColor"
                                    stroke="#ffffff"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </button>
                    );
                })}
            {selected && popover && (
                <MarkupPopover
                    key={selected.id}
                    item={selected}
                    {...popover}
                    editable={editable}
                    labels={labels}
                    onUpdate={props.onUpdate}
                    onRemove={props.onRemove}
                    onClose={() => props.onSelect(null)}
                />
            )}
        </div>
    );
}

/** Turns the rectangles of selected text, in screen pixels, into page rectangles for a highlight. */
export function screenRectsToPage(rects: DOMRect[], layer: HTMLElement): Rect[] {
    const box = layer.getBoundingClientRect();
    const rotation = Number(layer.dataset.rotation) || 0;
    return rects.map(rect =>
        rectFromView(
            [
                (rect.left - box.left) / (box.width || 1),
                (rect.top - box.top) / (box.height || 1),
                rect.width / (box.width || 1),
                rect.height / (box.height || 1)
            ],
            rotation
        )
    );
}
