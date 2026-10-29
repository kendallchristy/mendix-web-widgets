// Markup (highlights, areas, notes and drawings) on pages. Positions are fractions of the page, measured on the page
// as it shows without the user's rotation, so markup stays put at any zoom and rotation, and on any screen.

/** x, y, width and height as fractions of the page. */
export type Rect = [number, number, number, number];

export type MarkupTool = "select" | "highlight" | "area" | "note" | "ink";

interface MarkupBase {
    id: string;
    /** 1-based. */
    page: number;
    color: string;
    comment?: string;
    author?: string;
    /** ISO date and time. */
    date?: string;
}

export interface HighlightMarkup extends MarkupBase {
    type: "highlight";
    rects: Rect[];
    /** The highlighted text, so apps can read it from the JSON. */
    text?: string;
}

export interface AreaMarkup extends MarkupBase {
    type: "area";
    rect: Rect;
}

export interface NoteMarkup extends MarkupBase {
    type: "note";
    x: number;
    y: number;
}

export interface InkMarkup extends MarkupBase {
    type: "ink";
    /** Each stroke is a flat list of points: x1, y1, x2, y2, … */
    strokes: number[][];
    /** Line width as a fraction of the page width. */
    width: number;
}

export type Markup = HighlightMarkup | AreaMarkup | NoteMarkup | InkMarkup;

/** Markup before it has an id, author and date. */
export type NewMarkup =
    Omit<HighlightMarkup, "id"> | Omit<AreaMarkup, "id"> | Omit<NoteMarkup, "id"> | Omit<InkMarkup, "id">;

export const MARKUP_COLORS = ["#fab005", "#40c057", "#228be6", "#e64980", "#fa5252"];
export const INK_WIDTH = 0.003;

const round = (value: number): number => Math.round(value * 10000) / 10000;
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isRect = (value: unknown): value is Rect => Array.isArray(value) && value.length === 4 && value.every(isNumber);

export function markupId(): string {
    return `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function cleanItem(raw: unknown): Markup | null {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const item = raw as Record<string, unknown>;
    if (typeof item.id !== "string" || !isNumber(item.page) || item.page < 1) {
        return null;
    }
    const base = {
        id: item.id,
        page: Math.floor(item.page),
        color: typeof item.color === "string" ? item.color : MARKUP_COLORS[0],
        ...(typeof item.comment === "string" && item.comment ? { comment: item.comment } : {}),
        ...(typeof item.author === "string" && item.author ? { author: item.author } : {}),
        ...(typeof item.date === "string" && item.date ? { date: item.date } : {})
    };
    switch (item.type) {
        case "highlight":
            return Array.isArray(item.rects) && item.rects.every(isRect) && item.rects.length > 0
                ? {
                      ...base,
                      type: "highlight",
                      rects: item.rects,
                      ...(typeof item.text === "string" ? { text: item.text } : {})
                  }
                : null;
        case "area":
            return isRect(item.rect) ? { ...base, type: "area", rect: item.rect } : null;
        case "note":
            return isNumber(item.x) && isNumber(item.y) ? { ...base, type: "note", x: item.x, y: item.y } : null;
        case "ink":
            return Array.isArray(item.strokes) &&
                item.strokes.length > 0 &&
                item.strokes.every(stroke => Array.isArray(stroke) && stroke.every(isNumber))
                ? {
                      ...base,
                      type: "ink",
                      strokes: item.strokes as number[][],
                      width: isNumber(item.width) && item.width > 0 ? item.width : INK_WIDTH
                  }
                : null;
        default:
            return null;
    }
}

/** Reads markup JSON from the app. Anything it doesn't recognize is left out rather than failing. */
export function parseMarkup(json: string | undefined): Markup[] {
    if (!json?.trim()) {
        return [];
    }
    try {
        const data = JSON.parse(json) as unknown;
        const items = Array.isArray(data) ? data : (data as { items?: unknown })?.items;
        return Array.isArray(items) ? items.map(cleanItem).filter((item): item is Markup => item !== null) : [];
    } catch {
        return [];
    }
}

export function serializeMarkup(items: Markup[]): string {
    const rounded = items.map(item => {
        switch (item.type) {
            case "highlight":
                return { ...item, rects: item.rects.map(rect => rect.map(round) as Rect) };
            case "area":
                return { ...item, rect: item.rect.map(round) as Rect };
            case "note":
                return { ...item, x: round(item.x), y: round(item.y) };
            case "ink":
                return { ...item, width: round(item.width), strokes: item.strokes.map(s => s.map(round)) };
        }
    });
    return JSON.stringify({ version: 1, items: rounded });
}

// Rotation: the user turns pages clockwise in quarter turns. "Page" coordinates ignore the turn; "view" coordinates
// are what the user sees. Both are fractions of their own box.

function quarter(rotation: number): number {
    return (((Math.round(rotation / 90) * 90) % 360) + 360) % 360;
}

export function toView(x: number, y: number, rotation: number): [number, number] {
    switch (quarter(rotation)) {
        case 90:
            return [1 - y, x];
        case 180:
            return [1 - x, 1 - y];
        case 270:
            return [y, 1 - x];
        default:
            return [x, y];
    }
}

export function fromView(x: number, y: number, rotation: number): [number, number] {
    switch (quarter(rotation)) {
        case 90:
            return [y, 1 - x];
        case 180:
            return [1 - x, 1 - y];
        case 270:
            return [1 - y, x];
        default:
            return [x, y];
    }
}

function mapRect(rect: Rect, map: (x: number, y: number) => [number, number]): Rect {
    const [ax, ay] = map(rect[0], rect[1]);
    const [bx, by] = map(rect[0] + rect[2], rect[1] + rect[3]);
    return [Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)];
}

export function rectToView(rect: Rect, rotation: number): Rect {
    return mapRect(rect, (x, y) => toView(x, y, rotation));
}

export function rectFromView(rect: Rect, rotation: number): Rect {
    return mapRect(rect, (x, y) => fromView(x, y, rotation));
}

/**
 * Joins the rectangles of selected text into one per line. Browsers report a rectangle per word or text run, which
 * would draw as a ragged, overlapping highlight.
 */
export function mergeLineRects(rects: Rect[]): Rect[] {
    const sorted = rects.filter(r => r[2] > 0.0005 && r[3] > 0.0005).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const lines: Rect[] = [];
    for (const rect of sorted) {
        const line = lines.find(other => {
            const overlap = Math.min(other[1] + other[3], rect[1] + rect[3]) - Math.max(other[1], rect[1]);
            const gap = Math.max(other[0], rect[0]) - Math.min(other[0] + other[2], rect[0] + rect[2]);
            return overlap > 0.5 * Math.min(other[3], rect[3]) && gap < Math.max(other[3], rect[3]);
        });
        if (line) {
            const left = Math.min(line[0], rect[0]);
            const top = Math.min(line[1], rect[1]);
            line[2] = Math.max(line[0] + line[2], rect[0] + rect[2]) - left;
            line[3] = Math.max(line[1] + line[3], rect[1] + rect[3]) - top;
            line[0] = left;
            line[1] = top;
        } else {
            lines.push([...rect]);
        }
    }
    return lines;
}

/** Drops points closer than `minimum` to the previous one, which keeps drawings small in the JSON. */
export function thinStroke(points: number[], minimum = 0.0015): number[] {
    if (points.length <= 4) {
        return points;
    }
    const kept = [points[0], points[1]];
    for (let i = 2; i < points.length - 2; i += 2) {
        const dx = points[i] - kept[kept.length - 2];
        const dy = points[i + 1] - kept[kept.length - 1];
        if (Math.hypot(dx, dy) >= minimum) {
            kept.push(points[i], points[i + 1]);
        }
    }
    kept.push(points[points.length - 2], points[points.length - 1]);
    return kept;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function inRect(x: number, y: number, rect: Rect, pad: number): boolean {
    return x >= rect[0] - pad && x <= rect[0] + rect[2] + pad && y >= rect[1] - pad && y <= rect[1] + rect[3] + pad;
}

/**
 * The topmost markup at a point on a page, in page coordinates. `aspect` is the page's height divided by its
 * width, so distances count the same across and down.
 */
export function hitTest(items: Markup[], page: number, x: number, y: number, aspect: number): Markup | undefined {
    const tolerance = 0.008;
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        if (item.page !== page) {
            continue;
        }
        if (item.type === "highlight" && item.rects.some(rect => inRect(x, y, rect, tolerance / 2))) {
            return item;
        }
        if (item.type === "area" && inRect(x, y, item.rect, tolerance)) {
            return item;
        }
        if (item.type === "note" && Math.hypot(x - item.x, (y - item.y) * aspect) < tolerance * 2) {
            return item;
        }
        if (item.type === "ink") {
            const reach = Math.max(item.width, tolerance);
            for (const stroke of item.strokes) {
                for (let p = 0; p + 1 < stroke.length; p += 2) {
                    const bx = stroke[p + 2] ?? stroke[p];
                    const by = stroke[p + 3] ?? stroke[p + 1];
                    const d = distanceToSegment(x, y * aspect, stroke[p], stroke[p + 1] * aspect, bx, by * aspect);
                    if (d < reach) {
                        return item;
                    }
                }
            }
        }
    }
    return undefined;
}

/** The box around a piece of markup, in page coordinates. */
export function boundsOf(item: Markup): Rect {
    switch (item.type) {
        case "highlight": {
            const left = Math.min(...item.rects.map(r => r[0]));
            const top = Math.min(...item.rects.map(r => r[1]));
            const right = Math.max(...item.rects.map(r => r[0] + r[2]));
            const bottom = Math.max(...item.rects.map(r => r[1] + r[3]));
            return [left, top, right - left, bottom - top];
        }
        case "area":
            return item.rect;
        case "note":
            return [item.x, item.y, 0, 0];
        case "ink": {
            const xs = item.strokes.flatMap(s => s.filter((_, i) => i % 2 === 0));
            const ys = item.strokes.flatMap(s => s.filter((_, i) => i % 2 === 1));
            const left = Math.min(...xs);
            const top = Math.min(...ys);
            return [left, top, Math.max(...xs) - left, Math.max(...ys) - top];
        }
    }
}

/** Puts markup in page order, top to bottom, for the sidebar list. */
export function sortMarkup(items: Markup[]): Markup[] {
    return [...items].sort(
        (a, b) => a.page - b.page || boundsOf(a)[1] - boundsOf(b)[1] || boundsOf(a)[0] - boundsOf(b)[0]
    );
}

export const HIGHLIGHT_OPACITY = 0.35;
export const AREA_OPACITY = 0.16;

/**
 * Draws a page's markup onto a canvas that already holds the page, for printing. `rotation` is the turn the page
 * was drawn with.
 */
export function drawMarkup(
    context: CanvasRenderingContext2D,
    items: Markup[],
    width: number,
    height: number,
    rotation: number
): void {
    const pageWidth = quarter(rotation) % 180 === 0 ? width : height;
    const point = (x: number, y: number): [number, number] => {
        const [vx, vy] = toView(x, y, rotation);
        return [vx * width, vy * height];
    };
    const box = (rect: Rect): Rect => {
        const [x, y, w, h] = rectToView(rect, rotation);
        return [x * width, y * height, w * width, h * height];
    };
    context.save();
    for (const item of items) {
        context.globalAlpha = 1;
        context.globalCompositeOperation = "source-over";
        if (item.type === "highlight") {
            context.globalCompositeOperation = "multiply";
            context.globalAlpha = HIGHLIGHT_OPACITY + 0.15;
            context.fillStyle = item.color;
            item.rects.forEach(rect => context.fillRect(...box(rect)));
        } else if (item.type === "area") {
            const rect = box(item.rect);
            context.globalAlpha = AREA_OPACITY;
            context.fillStyle = item.color;
            context.fillRect(...rect);
            context.globalAlpha = 1;
            context.strokeStyle = item.color;
            context.lineWidth = Math.max(1, pageWidth * 0.002);
            context.strokeRect(...rect);
        } else if (item.type === "ink") {
            context.strokeStyle = item.color;
            context.lineWidth = Math.max(1, item.width * pageWidth);
            context.lineCap = "round";
            context.lineJoin = "round";
            for (const stroke of item.strokes) {
                context.beginPath();
                for (let p = 0; p + 1 < stroke.length; p += 2) {
                    const [x, y] = point(stroke[p], stroke[p + 1]);
                    if (p === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                }
                if (stroke.length === 2) {
                    const [x, y] = point(stroke[0], stroke[1]);
                    context.lineTo(x + 0.01, y);
                }
                context.stroke();
            }
        } else {
            const [x, y] = point(item.x, item.y);
            const radius = Math.max(6, pageWidth * 0.012);
            context.fillStyle = item.color;
            context.strokeStyle = "#ffffff";
            context.lineWidth = Math.max(1, radius / 4);
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
    }
    context.restore();
}
