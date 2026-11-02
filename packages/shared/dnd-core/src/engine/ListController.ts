import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

import { autoScroller, scrollContainers } from "./autoScroll";
import { coordinator } from "./coordinator";
import { prepareLists, settleLists, type Glide } from "./batch";
import { layoutDrag } from "./geometry";
import type { Axis, Box, DragItemData, DropResult, Point } from "./types";

export type HandleMode = "item" | "grip" | "custom";
export type IndicatorStyle = "makeRoom" | "line";
export type PreviewStyle = "snapshot" | "compact";

export interface ListOptions {
    scope: string;
    axis: Axis;
    handle: HandleMode;
    indicator: IndicatorStyle;
    preview: PreviewStyle;
    /** Animation length in milliseconds. 0 turns animations off. */
    duration: number;
    /** Ids of every item in the list, in display order, including ones that aren't rendered. */
    getIds(): string[];
    canDragItem(id: string): boolean;
    /** Whether an item from another list may be dropped here. */
    canReceive(source: DragItemData): boolean;
    /** Called on the list the item was dropped on. Update the order synchronously (flushSync). */
    onDrop(result: DropResult): void;
    /** Called on the list the item came from when it went to another list. Update synchronously (flushSync). */
    onRemove?(result: DropResult): void;
    onDragStart?(id: string): void;
    /** Text for screen readers. */
    describe(event: "lifted" | "moved" | "dropped" | "cancelled", id: string, position: number, count: number): string;
    /** Keys that pick an item up. Defaults to Space and Enter. */
    liftKeys?: string[];
    /** The list next to this one in a direction, for keyboard moves between lists (Kanban columns). */
    neighbour?(direction: "previous" | "next"): string | undefined;
}

interface Registered {
    id: string;
    index: number;
    slot: HTMLElement;
    inner: HTMLElement;
    cleanup: () => void;
}

const INTERACTIVE = "input, textarea, select, [contenteditable=''], [contenteditable='true']";
const COMPACT_WIDTH = 280;

function reducedMotion(): boolean {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * The drag and drop engine for one list. It registers items with Pragmatic drag and drop and moves them out of
 * the way during a drag by writing CSS transforms straight to the elements, so React never renders while the
 * pointer moves. Lists talk to each other through the coordinator.
 */
export class ListController {
    readonly id: string;
    options: ListOptions;

    private items = new Map<string, Registered>();
    private byIndex = new Map<number, Registered>();
    private container: HTMLElement | null = null;
    private scrollElement: HTMLElement | undefined;
    private containerCleanup: (() => void) | undefined;
    private placeholder: HTMLElement | undefined;
    /** Where a keyboard move will land, in content coordinates; revealed after each step. */
    private landing: Box | undefined;
    private boxes = new Map<number, Box>();
    private gap = 0;
    private active = false;
    private lastPointerDown: Element | null = null;
    private focusAfterRender: string | undefined;
    private settleTimer: ReturnType<typeof setTimeout> | undefined;
    private mounted: Registered[] = [];
    /** The last layout applied, so items that mount mid-drag (windowing) can catch up. */
    private layout: { source?: DragItemData; incoming?: DragItemData; target?: number; keyboard: boolean } | undefined;

    constructor(id: string, options: ListOptions) {
        this.id = id;
        this.options = options;
    }

    /** Options are read when a drag happens, so new callbacks can be passed on every render. */
    setOptions(options: ListOptions): void {
        this.options = options;
    }

    /** Joins the page's drags. Called on mount; `destroy` undoes it. */
    attach(): void {
        coordinator.register(this);
    }

    destroy(): void {
        coordinator.unregister(this);
        this.containerCleanup?.();
        this.items.forEach(item => item.cleanup());
        this.items.clear();
        this.byIndex.clear();
        clearTimeout(this.settleTimer);
    }

    get duration(): number {
        return reducedMotion() ? 0 : this.options.duration;
    }

    // ---- registration -------------------------------------------------------------------------------------------

    /** The element that holds the slots. It must be `position: relative`; the placeholder is drawn inside it. */
    setContainer(element: HTMLElement | null, scrollElement?: HTMLElement | null): void {
        if (element === this.container) {
            return;
        }
        this.containerCleanup?.();
        this.containerCleanup = undefined;
        this.container = element;
        if (!element) {
            return;
        }
        this.scrollElement = scrollElement ?? undefined;
        const cleanups = [
            dropTargetForElements({
                element,
                canDrop: ({ source }) => source.data.kdnd === "item" && source.data.scope === this.options.scope,
                getData: () => ({ kdnd: "list", scope: this.options.scope, listId: this.id })
            })
        ];
        this.containerCleanup = combine(...cleanups);
    }

    registerItem(
        id: string,
        index: number,
        slot: HTMLElement,
        inner: HTMLElement,
        handle: HTMLElement | null
    ): () => void {
        const existing = this.items.get(id);
        if (existing && existing.slot === slot && existing.inner === inner) {
            existing.index = index;
            this.byIndex.set(index, existing);
            return () => this.unregister(id, existing);
        }
        existing?.cleanup();

        const record: Registered = { id, index, slot, inner, cleanup: () => undefined };
        const onPointerDown = (event: PointerEvent): void => {
            this.lastPointerDown = event.target as Element;
            // Firefox can't place the caret or select text in an input inside a draggable element.
            if ((event.target as Element).closest?.(INTERACTIVE)) {
                inner.draggable = false;
                const restore = (): void => {
                    inner.draggable = true;
                    window.removeEventListener("pointerup", restore, true);
                };
                window.addEventListener("pointerup", restore, true);
            }
        };
        inner.addEventListener("pointerdown", onPointerDown, true);

        record.cleanup = combine(
            () => inner.removeEventListener("pointerdown", onPointerDown, true),
            draggable({
                element: inner,
                dragHandle: this.options.handle === "grip" && handle ? handle : undefined,
                canDrag: () => this.canStartDrag(record),
                getInitialData: ({ element }): DragItemData => {
                    const rect = element.getBoundingClientRect();
                    return {
                        kdnd: "item",
                        scope: this.options.scope,
                        listId: this.id,
                        itemId: record.id,
                        index: record.index,
                        width: rect.width,
                        height: rect.height
                    };
                },
                onGenerateDragPreview: ({ nativeSetDragImage, location, source }) => {
                    if (this.options.preview !== "compact" || !nativeSetDragImage) {
                        return;
                    }
                    const rect = source.element.getBoundingClientRect();
                    const grab = {
                        x: Math.min(location.current.input.clientX - rect.left, COMPACT_WIDTH - 12),
                        y: location.current.input.clientY - rect.top
                    };
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: () => grab,
                        render: ({ container }) => {
                            const clone = source.element.cloneNode(true) as HTMLElement;
                            clone.classList.add("kdnd-preview");
                            clone.style.width = `${Math.min(rect.width, COMPACT_WIDTH)}px`;
                            clone.style.height = `${rect.height}px`;
                            clone.style.transform = "none";
                            const host = document.createElement("div");
                            host.className = source.element.closest(".dark-mode")
                                ? "dark-mode kdnd-preview-host"
                                : "kdnd-preview-host";
                            host.appendChild(clone);
                            container.appendChild(host);
                        }
                    });
                }
            }),
            dropTargetForElements({
                element: slot,
                canDrop: ({ source }) => source.data.kdnd === "item" && source.data.scope === this.options.scope,
                getData: ({ input, element }) =>
                    attachClosestEdge(
                        { kdnd: "slot", scope: this.options.scope, listId: this.id, index: record.index },
                        {
                            element,
                            input,
                            allowedEdges: this.options.axis === "vertical" ? ["top", "bottom"] : ["left", "right"]
                        }
                    )
            })
        );

        this.items.set(id, record);
        this.byIndex.set(index, record);
        if (this.active) {
            this.queueMount(record);
        }
        if (this.focusAfterRender === id) {
            this.focusAfterRender = undefined;
            inner.focus({ preventScroll: false });
        }
        return () => this.unregister(id, record);
    }

    /**
     * Items that mount mid-drag (windowed lists scrolling) are measured and placed together after the render, so
     * the browser lays the page out once instead of once per item.
     */
    private queueMount(record: Registered): void {
        this.mounted.push(record);
        if (this.mounted.length === 1) {
            queueMicrotask(() => {
                const batch = this.mounted.filter(item => this.items.get(item.id) === item);
                this.mounted = [];
                if (!this.active) {
                    return;
                }
                if (batch.length === 0 || !this.container) {
                    return;
                }
                const base = this.container.getBoundingClientRect();
                batch.forEach(item => this.measureOne(item, base));
                batch.forEach(item => this.applyLayout(item));
                // Keyboard moves can land on items that just scrolled into view; place the rest again too.
                this.applyLayout();
            });
        }
    }

    private unregister(id: string, record: Registered): void {
        if (this.items.get(id) !== record) {
            return;
        }
        record.cleanup();
        this.items.delete(id);
        if (this.byIndex.get(record.index) === record) {
            this.byIndex.delete(record.index);
        }
    }

    /** Call after each render so moved indexes are known. */
    syncIndexes(): void {
        this.byIndex.clear();
        this.items.forEach(item => this.byIndex.set(item.index, item));
    }

    private canStartDrag(record: Registered): boolean {
        if (!this.options.canDragItem(record.id) || coordinator.keyboardActive) {
            return false;
        }
        const target = this.lastPointerDown;
        if (target?.closest?.(INTERACTIVE)) {
            return false;
        }
        if (this.options.handle === "custom") {
            const handle = target?.closest?.(".dnd-handle");
            return handle !== null && handle !== undefined && record.inner.contains(handle);
        }
        return true;
    }

    // ---- lookups used by the coordinator -----------------------------------------------------------------------

    count(): number {
        return this.options.getIds().length;
    }

    indexOf(id: string): number {
        return this.options.getIds().indexOf(id);
    }

    innerRect(id: string): DOMRect | undefined {
        return this.items.get(id)?.inner.getBoundingClientRect();
    }

    /** Where an index sits on screen, for the keyboard drop animation. */
    placeholderRect(): DOMRect | undefined {
        return this.placeholder && this.placeholder.style.display !== "none"
            ? this.placeholder.getBoundingClientRect()
            : undefined;
    }

    /**
     * The index of the item being dragged out of this list, if any. Windowed lists keep it rendered, so the item
     * doesn't unmount (and lose focus) when it scrolls out of view.
     */
    pinnedIndex(): number | undefined {
        const source = this.layout?.source;
        return source && source.listId === this.id ? source.index : undefined;
    }

    /** Scrolls the keyboard landing spot into view, through every scrolling ancestor, innermost first. */
    reveal(): void {
        const box = this.landing;
        const container = this.container;
        if (!box || !container) {
            return;
        }
        const base = container.getBoundingClientRect();
        const left = box.x + base.left - container.scrollLeft + container.clientLeft;
        const top = box.y + base.top - container.scrollTop + container.clientTop;
        let rect = { left, top, right: left + box.width, bottom: top + box.height };
        const margin = 16;
        scrollContainers(this.scrollElement ?? container).forEach(({ element, vertical, horizontal }) => {
            const page = element === (document.scrollingElement ?? document.documentElement);
            const view = page
                ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
                : element.getBoundingClientRect();
            const delta = (start: number, end: number, viewStart: number, viewEnd: number): number => {
                if (end - start > viewEnd - viewStart - 2 * margin) {
                    return start - viewStart - margin;
                }
                if (start < viewStart + margin) {
                    return start - viewStart - margin;
                }
                return end > viewEnd - margin ? end - viewEnd + margin : 0;
            };
            const dy = vertical ? delta(rect.top, rect.bottom, view.top, view.bottom) : 0;
            const dx = horizontal ? delta(rect.left, rect.right, view.left, view.right) : 0;
            if (dx === 0 && dy === 0) {
                return;
            }
            const beforeX = element.scrollLeft;
            const beforeY = element.scrollTop;
            element.scrollBy(dx, dy);
            const movedX = element.scrollLeft - beforeX;
            const movedY = element.scrollTop - beforeY;
            rect = {
                left: rect.left - movedX,
                right: rect.right - movedX,
                top: rect.top - movedY,
                bottom: rect.bottom - movedY
            };
        });
    }

    focusItem(id: string): void {
        const item = this.items.get(id);
        if (item) {
            item.inner.focus();
        } else {
            this.focusAfterRender = id;
        }
    }

    /** Columns in a grid, counted from the first row of rendered slots. */
    gridColumns(): number {
        if (this.options.axis !== "grid") {
            return 1;
        }
        const first = this.boxes.get(0) ?? this.measureIndex(0);
        if (!first) {
            return 1;
        }
        let columns = 1;
        while ((this.boxes.get(columns) ?? this.measureIndex(columns))?.y === first.y) {
            columns++;
        }
        return columns;
    }

    // ---- drag visuals --------------------------------------------------------------------------------------------

    private toContent(rect: DOMRect, base = this.container!.getBoundingClientRect()): Box {
        const container = this.container!;
        return {
            x: rect.left - base.left + container.scrollLeft - container.clientLeft,
            y: rect.top - base.top + container.scrollTop - container.clientTop,
            width: rect.width,
            height: rect.height
        };
    }

    private measureOne(record: Registered, base?: DOMRect): void {
        if (this.container) {
            this.boxes.set(record.index, this.toContent(record.slot.getBoundingClientRect(), base));
        }
    }

    private measureIndex(index: number): Box | undefined {
        const record = this.byIndex.get(index);
        if (!record || !this.container) {
            return undefined;
        }
        this.measureOne(record);
        return this.boxes.get(index);
    }

    /** Called when a drag that can end in this list starts. Measures once, so moving the pointer costs nothing. */
    prepare(): void {
        prepareLists([this]);
    }

    /** The writing half of prepare. Lists do all their writes before any list reads, so the page is laid out once. */
    beginDrag(): void {
        this.active = true;
        this.boxes.clear();
        clearTimeout(this.settleTimer);
        if (this.container) {
            this.container.classList.add("kdnd-active");
            this.container.style.setProperty("--kdnd-duration", `${this.duration}ms`);
        }
        this.syncIndexes();
        this.items.forEach(item => {
            if (item.inner.style.transition !== "") {
                item.inner.style.transition = "";
            }
        });
    }

    /** The reading half of prepare. */
    measureDrag(): void {
        if (!this.container) {
            return;
        }
        const style = getComputedStyle(this.container);
        const gapValue = this.options.axis === "horizontal" ? style.columnGap : style.rowGap;
        this.gap = Number.parseFloat(gapValue) || 0;
        const base = this.container.getBoundingClientRect();
        this.items.forEach(item => this.measureOne(item, base));
        autoScroller.add(scrollContainers(this.scrollElement ?? this.container));
    }

    /** Shows the drag state. `target` is the landing index, undefined when the item isn't over this list. */
    show(state: { source?: DragItemData; incoming?: DragItemData; target?: number; keyboard: boolean }): void {
        this.layout = state;
        this.applyLayout();
    }

    /** Applies the current drag state. With `mounted`, only that item, which just mounted, is placed (no animation). */
    private applyLayout(mounted?: Registered): void {
        const state = this.layout;
        if (!state || !this.container) {
            return;
        }
        const { source, incoming, target, keyboard } = state;
        const makeRoom = this.options.indicator === "makeRoom" || keyboard;
        const result = layoutDrag({
            axis: this.options.axis,
            slots: this.boxes,
            count: this.count(),
            gap: this.gap,
            source: source && { index: source.index, width: source.width, height: source.height },
            incoming: incoming && { width: incoming.width, height: incoming.height },
            target
        });

        const targets = mounted ? [mounted] : Array.from(this.items.values());
        targets.forEach(item => {
            const isSource = source !== undefined && item.id === source.itemId;
            // With the keyboard, the item itself moves to its landing spot while it is over its own list.
            const lifted = isSource && keyboard && target !== undefined;
            item.inner.classList.toggle("kdnd-source", isSource && !lifted);
            item.inner.classList.toggle("kdnd-lifted", lifted);
            if (mounted) {
                item.inner.style.transition = "none";
            }
            let shift: Point | undefined = makeRoom ? result.shifts.get(item.index) : undefined;
            if (lifted && result.placeholder) {
                const from = this.boxes.get(item.index);
                if (from) {
                    shift = { x: result.placeholder.x - from.x, y: result.placeholder.y - from.y };
                }
            }
            item.inner.style.transform = shift ? `translate3d(${shift.x}px, ${shift.y}px, 0)` : "";
            if (mounted) {
                // Next frame, transitions apply again.
                requestAnimationFrame(() => {
                    if (item.inner.style.transition === "none") {
                        item.inner.style.transition = "";
                    }
                });
            }
        });

        if (mounted) {
            return;
        }
        const box = result.placeholder;
        this.landing = keyboard ? box : undefined;
        const showPlaceholder = box !== undefined && !(keyboard && source !== undefined);
        if (!showPlaceholder) {
            if (this.placeholder) {
                this.placeholder.style.display = "none";
            }
            return;
        }
        const placeholder = this.ensurePlaceholder();
        placeholder.classList.toggle("kdnd-placeholder--line", !makeRoom);
        placeholder.style.display = "";
        if (makeRoom) {
            placeholder.style.transform = `translate3d(${box.x}px, ${box.y}px, 0)`;
            placeholder.style.width = `${box.width}px`;
            placeholder.style.height = `${box.height}px`;
        } else {
            // A line in the gap before the landing spot.
            const vertical = this.options.axis === "vertical";
            const half = this.gap / 2;
            const line = vertical
                ? { x: box.x, y: box.y - half - 1, width: box.width, height: 2 }
                : { x: box.x - half - 1, y: box.y, width: 2, height: box.height };
            placeholder.style.transform = `translate3d(${line.x}px, ${line.y}px, 0)`;
            placeholder.style.width = `${line.width}px`;
            placeholder.style.height = `${line.height}px`;
        }
    }

    private ensurePlaceholder(): HTMLElement {
        if (!this.placeholder || this.placeholder.parentElement !== this.container) {
            this.placeholder?.remove();
            this.placeholder = document.createElement("div");
            this.placeholder.className = "kdnd-placeholder";
            this.placeholder.setAttribute("aria-hidden", "true");
            this.container!.appendChild(this.placeholder);
        }
        return this.placeholder;
    }

    /** Screen positions of every rendered item, taken just before the order changes. */
    captureRects(): Map<string, DOMRect> {
        const rects = new Map<string, DOMRect>();
        this.items.forEach(item => rects.set(item.id, item.inner.getBoundingClientRect()));
        return rects;
    }

    /**
     * Ends the drag. With `first` (positions before the order changed), every item glides from where it was to
     * its new place (FLIP); without, items animate back to where they were.
     */
    settle(first?: Map<string, DOMRect>, override?: { id: string; rect: Box }): void {
        settleLists([{ list: this, first, override }]);
    }

    /** First step of settling: clears the drag state. Without `flip`, items animate back to where they were. */
    endDrag(flip: boolean): void {
        this.landing = undefined;
        this.active = false;
        this.layout = undefined;
        this.container?.classList.remove("kdnd-active");
        if (this.placeholder) {
            this.placeholder.style.display = "none";
        }
        this.syncIndexes();
        const duration = this.duration;
        this.items.forEach(item => {
            item.inner.classList.remove("kdnd-source", "kdnd-lifted");
            item.inner.style.transition =
                flip || !duration ? "none" : `transform ${duration}ms cubic-bezier(0.2, 0, 0, 1)`;
            item.inner.style.transform = "";
        });
        this.clearTransitionsLater(duration);
    }

    /** Second step: how far each item moved, read once the new order is on screen. */
    measureMoves(first: Map<string, DOMRect>, override?: { id: string; rect: Box }): Glide[] {
        const moves: Glide[] = [];
        if (this.duration <= 0) {
            return moves;
        }
        this.items.forEach(item => {
            const from = override && override.id === item.id ? override.rect : first.get(item.id);
            if (!from) {
                return;
            }
            const to = item.inner.getBoundingClientRect();
            const dx = from.x - to.left;
            const dy = from.y - to.top;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                moves.push({ inner: item.inner, dx, dy, duration: this.duration });
            }
        });
        return moves;
    }

    private clearTransitionsLater(duration: number): void {
        clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => {
            this.items.forEach(item => {
                item.inner.style.transition = "";
            });
        }, duration + 50);
    }

    // ---- keyboard ----------------------------------------------------------------------------------------------

    /** Keyboard handler for an item's focusable element. Returns true when the key was used for a move. */
    handleKeyDown(id: string, event: KeyboardEvent): boolean {
        if (event.target !== this.items.get(id)?.inner && !coordinator.keyboardActive) {
            // Keys typed into the item's own inputs and buttons are theirs.
            return false;
        }
        return coordinator.handleKey(this, id, event.key);
    }
}
