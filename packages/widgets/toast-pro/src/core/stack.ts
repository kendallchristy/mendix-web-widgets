import type { Position } from "./types";

// One stack per screen position, shared by every Toast Pro on the page. The newest toast is first.
// Toasts report their measured height; the stack works out where each one sits.

export const GAP = 12;
export const PEEK = 14;

export interface StackEntry {
    id: string;
    position: Position;
    groupKey?: string;
    alwaysExpanded: boolean;
    maxVisible: number;
    width: number;
    onReplaced(): void;
}

interface Item extends StackEntry {
    height: number;
    /** Set while the toast animates out: it keeps this spot and the others close the gap. */
    frozen?: Layout;
}

export interface Layout {
    /** 0 for the newest toast in its position. */
    index: number;
    /** Distance from the stack's edge, in px. */
    offset: number;
    expanded: boolean;
    /** Past the most visible count: hidden, with its countdown paused. */
    queued: boolean;
    hovered: boolean;
    height: number;
    frontHeight: number;
}

export interface Bounds {
    count: number;
    width: number;
    height: number;
}

export class ToastStack {
    private items: Item[] = [];
    private readonly hovered = new Set<Position>();
    private readonly listeners = new Set<() => void>();
    private version = 0;

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    getVersion = (): number => this.version;

    add(entry: StackEntry, height = 0): void {
        const replaced = entry.groupKey
            ? this.items.filter(item => item.id !== entry.id && !item.frozen && item.groupKey === entry.groupKey)
            : [];
        this.items = [
            { ...entry, height },
            ...this.items.filter(item => item.id !== entry.id && !replaced.includes(item))
        ];
        this.emit();
        for (const item of replaced) {
            item.onReplaced();
        }
    }

    remove(id: string): void {
        const before = this.items.length;
        this.items = this.items.filter(item => item.id !== id);
        if (this.items.length !== before) {
            this.emit();
        }
    }

    /** Keeps the toast where it is while it animates out; the toasts behind it move up. */
    leave(id: string): void {
        const item = this.items.find(i => i.id === id);
        const layout = this.layout(id);
        if (item && layout && !item.frozen) {
            item.frozen = layout;
            this.emit();
        }
    }

    has(id: string): boolean {
        return this.items.some(item => item.id === id);
    }

    setHeight(id: string, height: number): void {
        const item = this.items.find(i => i.id === id);
        if (item && item.height !== height) {
            item.height = height;
            this.emit();
        }
    }

    setHovered(position: Position, hovered: boolean): void {
        if (hovered === this.hovered.has(position)) {
            return;
        }
        if (hovered) {
            this.hovered.add(position);
        } else {
            this.hovered.delete(position);
        }
        this.emit();
    }

    layout(id: string): Layout | undefined {
        const item = this.items.find(i => i.id === id);
        if (!item) {
            return undefined;
        }
        if (item.frozen) {
            return item.frozen;
        }
        const list = this.live(item.position);
        const index = list.indexOf(item);
        const front = list[0];
        const hovered = this.hovered.has(item.position);
        const expanded = front.alwaysExpanded || hovered;
        let offset = 0;
        if (expanded) {
            for (const before of list.slice(0, index)) {
                offset += before.height + GAP;
            }
        } else {
            offset = index * PEEK;
        }
        return {
            index,
            offset,
            expanded,
            queued: index >= Math.max(1, item.maxVisible),
            hovered,
            height: item.height,
            frontHeight: front.height
        };
    }

    /** The area the stack covers, so the viewport can catch hover over the gaps between toasts. */
    bounds(position: Position): Bounds {
        const list = this.live(position);
        if (list.length === 0) {
            return { count: 0, width: 0, height: 0 };
        }
        const front = list[0];
        const visible = list.slice(0, Math.max(1, front.maxVisible));
        const expanded = front.alwaysExpanded || this.hovered.has(position);
        const height = expanded
            ? visible.reduce((sum, item) => sum + item.height, 0) + GAP * (visible.length - 1)
            : front.height + PEEK * (visible.length - 1);
        return { count: list.length, width: front.width, height };
    }

    private live(position: Position): Item[] {
        return this.items.filter(i => i.position === position && !i.frozen);
    }

    private emit(): void {
        this.version++;
        for (const listener of [...this.listeners]) {
            listener();
        }
    }
}

export const toastStack = new ToastStack();
